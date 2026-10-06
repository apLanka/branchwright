// Guardrail rules. Pure functions over a parsed command plus an environment
// object, so they run the same on opencode V1 and V2 and can be unit tested.
//
// env = {
//   cwd:          directory the tool call runs in
//   repoInfo(dir) -> { top, branch, defaultBranch, task } | null
//   lastUserText: the latest user message in this session ('' when unknown)
//   runVerify(dir) -> { status, output }      (commit gate)
//   skillsDir:    absolute path of the skills directory
// }
//
// evaluateShell(script, env) -> { block: false } | { block: true, reason }
// evaluateEdit(tool, args, env) -> { block: false, resetState?: top } | { block: true, reason }
import path from 'node:path';
import { parseScript, parseGit, clusterHas, commitOptions } from './shell.js';

export const CONFIRM_MARKER = '[workflow:done]';
const CONFIRM_RE = /\b(done|open the pr|open a pr|create the pr|ship it|ship this|lgtm|looks good|confirmed?|go ahead and (push|open))\b/i;

const block = (reason) => ({ block: true, reason });
const ok = { block: false };

export function userConfirmed(text) {
  if (!text) return false;
  return text.includes(CONFIRM_MARKER) || CONFIRM_RE.test(text);
}

function pushTargets(args) {
  const flags = [];
  const positionals = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--') { positionals.push(...args.slice(i + 1)); break; }
    if (a.startsWith('-')) {
      flags.push(a.split('=')[0]);
      if (['--repo', '--receive-pack', '--exec', '-o', '--push-option', '--signed'].includes(a) && !a.includes('=')) i++;
    } else {
      positionals.push(a);
    }
  }
  return { flags, positionals };
}

function guardPush(g, env) {
  const { flags, positionals } = pushTargets(g.args);
  const hasShortForce = g.args.some((a) => clusterHas(a, 'f', ''));
  const forced = flags.some((f) => ['--force', '--force-with-lease', '--force-if-includes', '--mirror', '--delete', '--prune'].includes(f)) || hasShortForce || g.args.some((a) => /^-d$/.test(a));
  if (forced) return block('Force, mirror and delete pushes are blocked. Fix the problem with a new commit, or ask the user to do this themselves.');
  if (flags.includes('--no-verify')) return block('`--no-verify` is blocked: fix what the hooks report instead of skipping them.');
  if (flags.some((f) => ['--tags', '--all', '--follow-tags'].includes(f))) return block('Only the task branch may be pushed (no --all or --tags).');
  const refspecs = positionals.slice(1);
  if (refspecs.some((r) => r.startsWith('+') || r.startsWith(':'))) return block('Force and delete refspecs are blocked.');

  const info = env.repoInfo(g.cwd);
  if (!info) return ok;
  const t = info.task;
  if (!t) return block('No task state in .workflow/task.json. Pushing belongs to the finish-task skill after the user confirms the task.');
  if (t.state !== 'confirmed') {
    return block(`Push blocked: task state is '${t.state}', not 'confirmed'. Report the work as ready and stop; when the user says done, run the finish-task skill.`);
  }
  if (info.branch !== t.branch) return block(`Push blocked: on '${info.branch}', but the task branch is '${t.branch}'.`);
  if (info.branch === info.defaultBranch) return block('Push blocked: never push the default branch.');
  const bad = refspecs.filter((r) => ![t.branch, 'HEAD', `HEAD:${t.branch}`, `HEAD:refs/heads/${t.branch}`, `${t.branch}:${t.branch}`, `refs/heads/${t.branch}`].includes(r));
  if (bad.length) return block(`Push blocked: only the task branch '${t.branch}' may be pushed (got ${bad.join(', ')}).`);
  return ok;
}

async function guardCommit(g, env) {
  const { flags } = commitOptions(g.args);
  const short = flags.filter((a) => /^-[A-Za-z]+$/.test(a));
  if (flags.includes('--no-verify') || short.some((a) => clusterHas(a, 'n'))) {
    return block('`--no-verify` is blocked: fix what the hooks report instead of skipping them.');
  }
  if (flags.includes('--amend')) return block('Rewriting history is blocked (`--amend`). Add a new commit instead.');
  if (flags.includes('--all') || short.some((a) => clusterHas(a, 'a'))) {
    return block('`git commit -a` stages everything. Stage by path (`git add <file>`), check `git diff --staged`, then commit.');
  }
  const info = env.repoInfo(g.cwd);
  if (!info) return ok;
  if (info.branch && info.branch === info.defaultBranch) {
    return block(`Commit blocked: '${info.branch}' is the default branch. Start the task's branch first (branch-per-task skill).`);
  }
  const res = await env.runVerify(g.cwd);
  if (res.status === 1) {
    return block(`Commit gate: the project's verify commands failed. Fix them, then commit.\n${res.output}`);
  }
  return ok;
}

function guardAdd(g) {
  const flags = g.args.filter((a) => a.startsWith('-'));
  const paths = g.args.filter((a) => !a.startsWith('-'));
  const all = flags.includes('--all') || g.args.some((a) => clusterHas(a, 'A', '')) || flags.includes('--update') || g.args.some((a) => clusterHas(a, 'u', ''));
  const sweep = paths.some((p) => p === '.' || p === './' || p === '*' || p === ':/' || p === ':/.' || p === '..');
  if (all || sweep) return block('Staging everything is blocked (`git add -A`, `.`, `-u`). Stage precisely: `git add <path>` for exactly this slice.');
  return ok;
}

function guardOtherGit(g) {
  const flags = g.args.filter((a) => a.startsWith('-'));
  switch (g.sub) {
    case 'rebase':
      return block('Rewriting history is blocked (`git rebase`). Add commits instead.');
    case 'reset':
      if (flags.includes('--hard') || flags.includes('--merge') || flags.includes('--keep')) return block('`git reset --hard` is blocked: it discards work. Stash with a label or add a revert commit.');
      return ok;
    case 'clean':
      if (flags.some((f) => f === '--force' || clusterHas(f, 'f', ''))) return block('`git clean -f` is blocked: it deletes untracked files for good.');
      return ok;
    case 'branch':
      if (flags.some((f) => f === '--delete' || f === '--force' || clusterHas(f, 'd', '') || clusterHas(f, 'D', ''))) return block('Deleting branches belongs to the user.');
      return ok;
    case 'filter-branch':
    case 'filter-repo':
      return block('Rewriting history is blocked.');
    case 'update-ref':
      if (flags.includes('-d')) return block('Deleting refs is blocked.');
      return ok;
    default:
      return ok;
  }
}

function guardGh(cmd, env) {
  const w = cmd.words.slice(1).filter((x) => !x.startsWith('-'));
  const [group, action] = w;
  const pair = `${group} ${action}`;
  if (pair === 'issue develop') return block('`gh issue develop` pushes a branch. Create the branch locally with branch-per-task.');
  if (['pr merge', 'pr close', 'issue close', 'issue delete', 'repo delete', 'repo archive', 'release create', 'release delete'].includes(pair)) {
    return block('Merging, closing, deleting and releasing belong to the user.');
  }
  if (group === 'api') {
    const text = cmd.words.join(' ');
    if (/(-X|--method)[ =]?(DELETE)\b/i.test(text) || /\/merge(\s|$)/.test(text)) return block('Destructive or merge API calls are blocked.');
  }
  if (pair === 'pr create') {
    const info = env.repoInfo(cmd.cwd);
    const t = info && info.task;
    if (!t || t.state !== 'confirmed') {
      return block(`PR creation is blocked: task state is '${t ? t.state : 'none'}'. After the user confirms, use the finish-task skill.`);
    }
  }
  return ok;
}

function guardTaskState(cmd, env) {
  // task-state transition confirmed / set state=confirmed needs the user's words.
  const text = cmd.raw;
  if (!/task-state/.test(text)) return ok;
  const confirming = /\btransition\s+confirmed\b/.test(text) || /\bset\b.*\bstate=confirmed\b/.test(text);
  if (confirming && !userConfirmed(env.lastUserText)) {
    return block('Only the user can confirm a task. Report it as ready and ask them to say "done" (or run /done); then set confirmed.');
  }
  return ok;
}

/** Heuristic: shell text that writes task.json directly instead of through task-state. */
function guardTaskFileWrite(raw) {
  if (!raw.includes('task.json')) return ok;
  const writes = /(>>?\s*\S*task\.json|\b(tee|mv|rm|dd|truncate)\b[^|;&]*task\.json|\bsed\s+-i[^|;&]*task\.json|\bperl\s+-p?i[^|;&]*task\.json)/;
  if (writes.test(raw)) {
    return block('Change task state only with the task-state script (workflow skill), never by writing task.json.');
  }
  return ok;
}

export async function evaluateShell(script, env) {
  const cmds = parseScript(script, env.cwd);
  for (const cmd of cmds) {
    const w = guardTaskFileWrite(cmd.raw);
    if (w.block) return w;
    const ts = guardTaskState(cmd, env);
    if (ts.block) return ts;

    if (cmd.name === 'gh') {
      const r = guardGh(cmd, env);
      if (r.block) return r;
      continue;
    }
    const g = parseGit(cmd);
    if (!g) continue;
    let r = ok;
    if (g.sub === 'push') r = guardPush(g, env);
    else if (g.sub === 'commit') r = await guardCommit(g, env);
    else if (g.sub === 'add') r = guardAdd(g);
    else r = guardOtherGit(g);
    if (r.block) return r;
  }
  return ok;
}

// ---- edits -----------------------------------------------------------------

const EDIT_TOOLS = new Set(['edit', 'write', 'patch', 'apply_patch', 'multiedit']);
export const isEditTool = (name) => EDIT_TOOLS.has(name);

/** Paths a patch envelope touches (`*** Add/Update/Delete File:` and `*** Move to:`). */
export function patchPaths(text) {
  const paths = [];
  for (const m of String(text || '').matchAll(/^\*\*\* (?:Add File|Update File|Delete File|Move to):\s*(.+?)\s*$/gm)) paths.push(m[1]);
  return paths;
}

export function editTargets(tool, args) {
  const a = args || {};
  if (tool === 'patch' || tool === 'apply_patch') {
    const found = patchPaths(a.patchText || a.patch || a.input);
    if (found.length) return found;
  }
  const single = a.filePath || a.file_path || a.path;
  return single ? [single] : [];
}

export function evaluateEdit(tool, args, env) {
  const targets = editTargets(tool, args);
  let resetTop = null;
  const abs = (p) => (path.isAbsolute(p) ? p : path.join(env.cwd, p));
  for (const t of targets) {
    const file = abs(t);
    const parts = file.split(path.sep);
    const wfIdx = parts.lastIndexOf('.workflow');
    if (wfIdx !== -1) {
      if (parts.slice(wfIdx + 1).join('/') === 'task.json') {
        return block('Change task state only with the task-state script (workflow skill), never by editing task.json.');
      }
      continue;
    }
    const info = env.repoInfo(path.dirname(file));
    if (!info) continue;
    if (info.branch && info.branch === info.defaultBranch) {
      return block(`Edit blocked: '${info.branch}' is the default branch. Decide the branch first and create the task branch (branch-per-task skill), then edit.`);
    }
    if (info.task && (info.task.state === 'ready' || info.task.state === 'confirmed')) resetTop = info.top;
  }
  return resetTop ? { block: false, resetState: resetTop } : ok;
}
