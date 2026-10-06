// Tests for the workflow plugin: shell parser, guard rules (real scratch repos),
// and both entry points (V1 named export, V2 default export) through mock hosts.
// Run: node --test tests/
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { tokenize, parseScript, parseGit } from '../.opencode/plugins/lib/shell.js';
import { evaluateShell, evaluateEdit, CONFIRM_MARKER, userConfirmed, patchPaths } from '../.opencode/plugins/lib/guard.js';
import { repoInfo, runVerify } from '../.opencode/plugins/lib/git.js';
import plugin, * as mod from '../index.js';
import * as wf from '../.opencode/plugins/workflow.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const skills = path.join(root, 'skills');
const TS = path.join(skills, 'workflow/scripts/task-state');

const gitEnv = { ...process.env, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t', GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_SYSTEM: '/dev/null' };
const sh = (cwd, cmd, args) => execFileSync(cmd, args, { cwd, env: gitEnv, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'plugin-test-'));
test.after(() => fs.rmSync(tmp, { recursive: true, force: true }));

function mkrepo(name) {
  const bare = path.join(tmp, `${name}.git`);
  const dir = path.join(tmp, name);
  sh(tmp, 'git', ['init', '-q', '--bare', '-b', 'main', bare]);
  sh(tmp, 'git', ['init', '-q', '-b', 'main', dir]);
  sh(dir, 'git', ['remote', 'add', 'origin', bare]);
  fs.writeFileSync(path.join(dir, 'a.txt'), 'base\n');
  sh(dir, 'git', ['add', 'a.txt']);
  sh(dir, 'git', ['commit', '-qm', 'init']);
  sh(dir, 'git', ['push', '-q', '-u', 'origin', 'main']);
  return dir;
}
function startTask(dir, branch, state = 'working') {
  sh(dir, 'git', ['switch', '-q', '-c', branch]);
  sh(dir, 'bash', [TS, 'init']);
  sh(dir, 'bash', [TS, 'start', '--branch', branch, '--base', 'origin/main', '--summary', 'test task', '--tier', '1']);
  if (state === 'ready' || state === 'confirmed') sh(dir, 'bash', [TS, 'transition', 'ready']);
  if (state === 'confirmed') sh(dir, 'bash', [TS, 'transition', 'confirmed']);
}
const mkenv = (cwd, extra = {}) => ({ cwd, repoInfo, lastUserText: '', runVerify: () => ({ status: 0, output: '' }), skillsDir: skills, ...extra });
const blocked = async (script, env) => (await evaluateShell(script, env)).block === true;

// ---- shell parser --------------------------------------------------------------

test('tokenize splits operators and keeps quotes together', () => {
  assert.deepEqual(tokenize('git add a && git commit -m "x y; z"'), [['git', 'add', 'a'], ['git', 'commit', '-m', 'x y; z']]);
  assert.deepEqual(tokenize("echo 'a && b' | cat"), [['echo', 'a && b'], ['cat']]);
  assert.deepEqual(tokenize('a;b\nc'), [['a'], ['b'], ['c']]);
});

test('parseScript strips env, wrappers, tracks cd and recurses into bash -c', () => {
  const cmds = parseScript('FOO=1 sudo git -C /x/y push -f && cd sub && git status', '/base');
  assert.equal(cmds[0].name, 'git');
  assert.equal(parseGit(cmds[0]).cwd, '/x/y');
  assert.equal(parseGit(cmds[0]).sub, 'push');
  assert.equal(cmds[1].cwd, '/base/sub');
  const nested = parseScript(`bash -c 'git push --force origin x'`, '/b');
  assert.equal(parseGit(nested[0]).sub, 'push');
});

// ---- guard: git ----------------------------------------------------------------------

test('force pushes and delete pushes are blocked in every spelling', async () => {
  const dir = mkrepo('g1');
  startTask(dir, 'feat/x', 'confirmed');
  const env = mkenv(dir);
  for (const c of ['git push --force', 'git push -f', 'git push --force-with-lease origin feat/x', 'git push -uf origin feat/x', 'git push origin +feat/x', 'git push origin :feat/x', 'git push --delete origin feat/x', 'git push --mirror', 'git -C . push -f', `bash -c "git push --force"`, 'cd . && git push -f']) {
    assert.ok(await blocked(c, env), c);
  }
});

test('plain push: only the task branch, only when confirmed', async () => {
  const dir = mkrepo('g2');
  startTask(dir, 'feat/p', 'working');
  assert.ok(await blocked('git push -u origin feat/p', mkenv(dir)), 'working');
  sh(dir, 'bash', [TS, 'transition', 'ready']);
  assert.ok(await blocked('git push -u origin feat/p', mkenv(dir)), 'ready');
  sh(dir, 'bash', [TS, 'transition', 'confirmed']);
  assert.equal(await blocked('git push -u origin feat/p', mkenv(dir)), false, 'confirmed push of task branch');
  assert.equal(await blocked('git push', mkenv(dir)), false);
  assert.equal(await blocked('git push origin HEAD', mkenv(dir)), false);
  assert.ok(await blocked('git push origin main', mkenv(dir)), 'other branch');
  assert.ok(await blocked('git push --tags', mkenv(dir)));
  assert.ok(await blocked('git push --all', mkenv(dir)));
});

test('push without a task is blocked; outside a repo nothing is blocked', async () => {
  const dir = mkrepo('g3');
  sh(dir, 'git', ['switch', '-q', '-c', 'other']);
  assert.ok(await blocked('git push -u origin other', mkenv(dir)));
  const plain = fs.mkdtempSync(path.join(tmp, 'norepo-'));
  assert.equal(await blocked('git push origin x', mkenv(plain)), false);
});

test('--no-verify, amend, commit -a, rebase, reset --hard, clean -f, branch -D', async () => {
  const dir = mkrepo('g4');
  startTask(dir, 'feat/c');
  const env = mkenv(dir);
  for (const c of ['git commit --no-verify -m x', 'git commit -n -m x', 'git commit -nm x', 'git commit -m x --no-verify', 'git push --no-verify', 'git commit --amend', 'git commit --amend --no-edit', 'git commit -a -m x', 'git commit -am x', 'git commit --all -m x', 'git rebase main', 'git reset --hard HEAD~1', 'git clean -fd', 'git branch -D old', 'git branch -d old', 'git filter-branch --all']) {
    assert.ok(await blocked(c, env), c);
  }
  for (const c of ['git commit -m "fix: not -a or --no-verify in text"', 'git commit -m x', 'git status', 'git reset HEAD file', 'git reset --soft HEAD~1', 'git clean -n', 'git branch --show-current', 'git stash push -u -m "x: y"', 'git worktree remove ../w']) {
    assert.equal(await blocked(c, env), false, c);
  }
});

test('git add -A, ., --all, -u, * are blocked; precise paths pass', async () => {
  const dir = mkrepo('g5');
  startTask(dir, 'feat/a');
  const env = mkenv(dir);
  for (const c of ['git add -A', 'git add --all', 'git add .', 'git add ./', 'git add -u', 'git add *', 'git add -A src', 'git -C . add .', 'git add a.txt && git add .']) assert.ok(await blocked(c, env), c);
  for (const c of ['git add a.txt', 'git add -p a.txt', 'git add src/x.ts tests/x.test.ts', 'git add -f -- .workflow-notes']) assert.equal(await blocked(c, env), false, c);
});

test('commit on the default branch is blocked', async () => {
  const dir = mkrepo('g6');
  assert.ok(await blocked('git commit -m x', mkenv(dir)));
});

// ---- guard: gh and task state ---------------------------------------------------------

test('gh: develop, merge, close are blocked; pr create needs confirmed', async () => {
  const dir = mkrepo('h1');
  startTask(dir, 'feat/gh', 'ready');
  const env = mkenv(dir);
  for (const c of ['gh issue develop 3', 'gh pr merge 4', 'gh pr close 4', 'gh issue close 3', 'gh repo delete x/y', 'gh api -X DELETE repos/x/y/git/refs/heads/z', 'gh api repos/x/y/pulls/3/merge -X PUT', 'gh pr create --fill']) assert.ok(await blocked(c, env), c);
  assert.equal(await blocked('gh issue view 3 --comments', env), false);
  assert.equal(await blocked('gh pr list --head feat/gh', env), false);
  assert.equal(await blocked('gh issue create --title t --body-file f', env), false);
  sh(dir, 'bash', [TS, 'transition', 'confirmed']);
  assert.equal(await blocked('gh pr create --fill', mkenv(dir)), false);
});

test('only the user can confirm a task', async () => {
  const dir = mkrepo('h2');
  startTask(dir, 'feat/conf', 'ready');
  const cmd = `${TS} transition confirmed`;
  assert.ok(await blocked(cmd, mkenv(dir, { lastUserText: 'please also add a test' })));
  assert.ok(await blocked(cmd, mkenv(dir, { lastUserText: '' })));
  assert.equal(await blocked(cmd, mkenv(dir, { lastUserText: 'done, open the PR' })), false);
  assert.equal(await blocked(cmd, mkenv(dir, { lastUserText: `${CONFIRM_MARKER} the user confirms` })), false);
  assert.ok(await blocked(`${TS} set state=confirmed`, mkenv(dir, { lastUserText: 'what is the status?' })));
  assert.equal(userConfirmed('LGTM'), true);
  assert.equal(userConfirmed('not sure yet'), false);
});

test('task.json cannot be written by hand', async () => {
  const dir = mkrepo('h3');
  startTask(dir, 'feat/tj');
  const env = mkenv(dir);
  assert.ok(await blocked(`sed -i 's/working/confirmed/' .workflow/task.json`, env));
  assert.ok(await blocked(`echo '{}' > .workflow/task.json`, env));
  assert.equal(await blocked('cat .workflow/task.json', env), false);
  assert.equal(await blocked('ls .workflow 2>&1; cat .workflow/task.json 2>&1; grep -rn task.json . 2>/dev/null', env), false, 'redirections like 2>&1 are not writes');
  assert.ok(await blocked('mv /tmp/x .workflow/task.json', env));
  assert.ok(evaluateEdit('write', { filePath: path.join(dir, '.workflow/task.json') }, mkenv(dir)).block);
});

// ---- guard: edits -----------------------------------------------------------------------

test('edits on the default branch are blocked, .workflow edits are not', () => {
  const dir = mkrepo('e1');
  assert.ok(evaluateEdit('edit', { filePath: path.join(dir, 'a.txt') }, mkenv(dir)).block);
  assert.ok(evaluateEdit('write', { filePath: 'new.txt' }, mkenv(dir)).block);
  assert.equal(evaluateEdit('write', { filePath: path.join(dir, '.workflow/plans/p.md') }, mkenv(dir)).block, false);
  const patch = '*** Begin Patch\n*** Add File: x.py\n+print(1)\n*** End Patch';
  assert.deepEqual(patchPaths(patch), ['x.py']);
  assert.ok(evaluateEdit('patch', { patchText: patch }, mkenv(dir)).block);
  assert.ok(evaluateEdit('apply_patch', { patchText: patch }, mkenv(dir)).block);
  const ws = '*** Begin Patch\n*** Update File: .workflow/notes.md\n*** End Patch';
  assert.equal(evaluateEdit('patch', { patchText: ws }, mkenv(dir)).block, false);
  startTask(dir, 'feat/ok');
  assert.equal(evaluateEdit('edit', { filePath: path.join(dir, 'a.txt') }, mkenv(dir)).block, false);
});

test('edits outside a repository are allowed; an edit after ready asks to reset state', () => {
  const plain = fs.mkdtempSync(path.join(tmp, 'plain-'));
  assert.equal(evaluateEdit('write', { filePath: path.join(plain, 'x') }, mkenv(plain)).block, false);
  const dir = mkrepo('e2');
  startTask(dir, 'feat/r', 'ready');
  const r = evaluateEdit('edit', { filePath: path.join(dir, 'a.txt') }, mkenv(dir));
  assert.equal(r.block, false);
  assert.equal(fs.realpathSync(r.resetState), fs.realpathSync(dir));
});

test('edits inside another worktree use that worktree\'s branch', () => {
  const dir = mkrepo('e3');
  const wt = path.join(tmp, 'e3-wt');
  sh(dir, 'git', ['worktree', 'add', '-q', '-b', 'feat/wt', wt, 'main']);
  assert.ok(evaluateEdit('edit', { filePath: path.join(dir, 'a.txt') }, mkenv(wt)).block, 'main checkout is on the default branch');
  assert.equal(evaluateEdit('edit', { filePath: path.join(wt, 'a.txt') }, mkenv(dir)).block, false, 'worktree is on a task branch');
});

// ---- commit gate ----------------------------------------------------------------------------

test('commit gate runs the project commands and blocks on failure', async () => {
  const dir = mkrepo('c1');
  startTask(dir, 'feat/gate');
  fs.writeFileSync(path.join(dir, 'AGENTS.md'), '## Commands\n\n| Purpose | Command |\n|---|---|\n| test | echo ran-tests |\n| lint | - |\n');
  const env = mkenv(dir, { runVerify: (d) => runVerify(d, skills) });
  assert.equal(await blocked('git commit -m "ok"', env), false);
  fs.writeFileSync(path.join(dir, 'AGENTS.md'), '## Commands\n\n| Purpose | Command |\n|---|---|\n| test | echo BOOM; exit 1 |\n');
  const r = await evaluateShell('git add a.txt && git commit -m "bad"', env);
  assert.equal(r.block, true);
  assert.match(r.reason, /FAIL test/);
  assert.match(r.reason, /BOOM/);
});

test('commit gate skips a re-run when run-verify already passed this exact tree', async () => {
  const dir = mkrepo('c2');
  startTask(dir, 'feat/cache');
  const counter = path.join(dir, '..', 'c2-count');
  fs.writeFileSync(counter, '');
  fs.writeFileSync(path.join(dir, 'AGENTS.md'), `## Commands\n\n| Purpose | Command |\n|---|---|\n| test | echo x >> ${counter} |\n`);
  sh(dir, 'bash', [path.join(skills, 'workflow/scripts/run-verify')]);
  assert.equal(fs.readFileSync(counter, 'utf8').length, 2);
  const res = runVerify(dir, skills);
  assert.equal(res.status, 0);
  assert.equal(res.cached, true);
  assert.equal(fs.readFileSync(counter, 'utf8').length, 2, 'no second run');
  fs.writeFileSync(path.join(dir, 'new.txt'), 'changed\n');
  assert.equal(runVerify(dir, skills).cached, undefined, 'a changed tree re-runs');
});

// ---- V1 entry point -----------------------------------------------------------------------------

function v1Messages(sessionID, text) {
  return { messages: [{ info: { role: 'user', sessionID }, parts: [{ type: 'text', text }] }] };
}

test('exports: V1 named export and V2 default shape', () => {
  assert.equal(typeof mod.BranchwrightPlugin, 'function');
  assert.equal(plugin.id, 'branchwright');
  assert.equal(typeof plugin.setup, 'function');
  assert.equal(typeof plugin.server, 'function');
});

test('V1: config registers the skills directory once; V2-shaped config is left alone', async () => {
  const p = await wf.BranchwrightPlugin({ client: null, directory: tmp });
  const cfg = {};
  await p.config(cfg);
  await p.config(cfg);
  assert.deepEqual(cfg.skills.paths, [wf.skillsDir]);
  const v2cfg = { skills: [] };
  await p.config(v2cfg);
  assert.deepEqual(v2cfg.skills, []);
});

test('V1: bootstrap goes into the first user message once, with the V1 tool mapping', async () => {
  const p = await wf.BranchwrightPlugin({ client: null, directory: tmp });
  const out = v1Messages('s-top', 'build me a thing');
  await p['experimental.chat.messages.transform']({}, out);
  await p['experimental.chat.messages.transform']({}, out);
  assert.equal(out.messages[0].parts.length, 2);
  const text = out.messages[0].parts[0].text;
  assert.match(text, /WORKFLOW_BOOTSTRAP/);
  assert.match(text, /## Intake/);
  assert.match(text, /`task` with `subagent_type`/);
  assert.match(text, /`todowrite`/);
  assert.match(text, /`bash`/);
  assert.match(text, /`apply_patch`/);
  assert.ok(!text.includes('`subagent` with `agent`'));
  assert.ok(text.includes(skills), 'script locations are absolute');
  assert.match(text, /always wrap the path in double quotes/);
  assert.ok(!/^---\nname: workflow/m.test(text), 'frontmatter stripped');
});

test('V1: child sessions (parentID) get no bootstrap', async () => {
  const client = { session: { get: async ({ path: { id } }) => ({ data: { id, parentID: 'parent-1' } }) } };
  const p = await wf.BranchwrightPlugin({ client, directory: tmp });
  const out = v1Messages('s-child', 'do task 3');
  await p['experimental.chat.messages.transform']({}, out);
  assert.equal(out.messages[0].parts.length, 1);
  const top = { session: { get: async ({ path: { id } }) => ({ data: { id } }) } };
  const p2 = await wf.BranchwrightPlugin({ client: top, directory: tmp });
  const out2 = v1Messages('s-top2', 'hello');
  await p2['experimental.chat.messages.transform']({}, out2);
  assert.equal(out2.messages[0].parts.length, 2);
});

test('V1: tool.execute.before throws the reason for blocked calls and passes safe ones', async () => {
  const dir = mkrepo('v1g');
  startTask(dir, 'feat/v1', 'ready');
  const p = await wf.BranchwrightPlugin({ client: null, directory: dir });
  const before = p['tool.execute.before'];
  await assert.rejects(before({ tool: 'bash', sessionID: 's1', callID: 'c' }, { args: { command: 'git push --force' } }), /Force/);
  await assert.rejects(before({ tool: 'bash', sessionID: 's1', callID: 'c' }, { args: { command: 'git add -A' } }), /Staging everything/);
  await assert.rejects(before({ tool: 'bash', sessionID: 's1', callID: 'c' }, { args: { command: `${TS} transition confirmed` } }), /Only the user can confirm/);
  await before({ tool: 'bash', sessionID: 's1', callID: 'c' }, { args: { command: 'git status' } });
  await before({ tool: 'read', sessionID: 's1', callID: 'c' }, { args: { filePath: '/etc/hosts' } });
  // the user's words, delivered through chat.message, allow confirmation
  await p['chat.message']({ sessionID: 's1' }, { parts: [{ type: 'text', text: 'done, open the PR' }] });
  await before({ tool: 'bash', sessionID: 's1', callID: 'c' }, { args: { command: `${TS} transition confirmed` } });
  // a different session (a subagent) still cannot
  await assert.rejects(before({ tool: 'bash', sessionID: 'child', callID: 'c' }, { args: { command: `${TS} transition confirmed` } }), /Only the user can confirm/);
});

test('V1: editing after ready resets the task to working', async () => {
  const dir = mkrepo('v1r');
  startTask(dir, 'feat/reset', 'ready');
  const p = await wf.BranchwrightPlugin({ client: null, directory: dir });
  await p['tool.execute.before']({ tool: 'edit', sessionID: 's', callID: 'c' }, { args: { filePath: path.join(dir, 'a.txt') } });
  assert.equal(sh(dir, 'bash', [TS, 'get', 'state']), 'working');
});

test('V1: bash workdir is honored for the guard', async () => {
  const dir = mkrepo('v1w');
  const wt = path.join(tmp, 'v1w-wt');
  sh(dir, 'git', ['worktree', 'add', '-q', '-b', 'feat/w', wt, 'main']);
  sh(wt, 'bash', [TS, 'init']);
  sh(wt, 'bash', [TS, 'start', '--branch', 'feat/w', '--base', 'origin/main', '--summary', 's', '--tier', '2']);
  const p = await wf.BranchwrightPlugin({ client: null, directory: dir });
  await assert.rejects(p['tool.execute.before']({ tool: 'bash', sessionID: 's', callID: 'c' }, { args: { command: 'git push -u origin feat/w', workdir: wt } }), /not 'confirmed'/);
  await assert.rejects(p['tool.execute.before']({ tool: 'bash', sessionID: 's', callID: 'c' }, { args: { command: 'git commit -m x' } }), /default branch/);
});

// ---- V2 entry point -------------------------------------------------------------------------------

function mockV2(dir, sessionGet) {
  const added = [];
  const hooks = {};
  const ctx = {
    location: { directory: dir },
    skill: { transform: async (fn) => fn({ add: (s) => added.push(s) }) },
    session: { hook: async (name, fn) => { hooks[`session.${name}`] = fn; }, get: sessionGet },
    tool: { hook: async (name, fn) => { hooks[`tool.${name}`] = fn; } },
  };
  return { ctx, added, hooks };
}

test('V2: setup registers all 47 skills with description, path and content', async () => {
  const { ctx, added } = mockV2(tmp);
  await plugin.setup(ctx);
  assert.equal(added.length, 47);
  const w = added.find((s) => s.id === 'workflow');
  assert.ok(w.description && w.description.length > 20);
  assert.ok(fs.existsSync(w.path));
  assert.ok(!w.content.startsWith('---'));
  assert.ok(added.every((s) => s.id && s.name && s.path && s.content));
});

test('V2: setup ignores a V1-shaped ctx', async () => {
  await plugin.setup({ client: {}, directory: tmp });
  await plugin.setup(undefined);
});

test('V2: context hook injects the bootstrap with the V2 mapping, once, and skips child sessions', async () => {
  const { ctx, hooks } = mockV2(tmp, async ({ sessionID }) => ({ id: sessionID }));
  await plugin.setup(ctx);
  const ev = { sessionID: 'v2-top', messages: [{ role: 'user', content: [{ type: 'text', text: 'add a feature' }] }] };
  await hooks['session.context'](ev);
  await hooks['session.context'](ev);
  assert.equal(ev.messages[0].content.length, 2);
  const text = ev.messages[0].content[0].text;
  assert.match(text, /`subagent` with `agent`/);
  assert.match(text, /no todo tool/);
  assert.match(text, /`shell`/);
  assert.match(text, /`patch`/);
  assert.ok(!text.includes('`todowrite`'));

  const child = mockV2(tmp, async ({ sessionID }) => ({ id: sessionID, parentID: 'p' }));
  await plugin.setup(child.ctx);
  const ev2 = { sessionID: 'v2-child', messages: [{ role: 'user', content: [{ type: 'text', text: 'task 2' }] }] };
  await child.hooks['session.context'](ev2);
  assert.equal(ev2.messages[0].content.length, 1);
});

test('V2: execute.before throws for blocked shell and edit calls, passes safe ones', async () => {
  const dir = mkrepo('v2g');
  startTask(dir, 'feat/v2', 'ready');
  const { ctx, hooks } = mockV2(dir, async ({ sessionID }) => ({ id: sessionID }));
  await plugin.setup(ctx);
  const hook = hooks['tool.execute.before'];
  await assert.rejects(hook({ tool: 'shell', sessionID: 's', input: { command: 'git push --force' } }), /Force/);
  await assert.rejects(hook({ tool: 'shell', sessionID: 's', input: { command: 'git push -u origin feat/v2' } }), /not 'confirmed'/);
  await hook({ tool: 'shell', sessionID: 's', input: { command: 'git status' } });
  await hook({ tool: 'read', sessionID: 's', input: { filePath: 'a.txt' } });
  sh(dir, 'git', ['switch', '-q', 'main']);
  await assert.rejects(hook({ tool: 'edit', sessionID: 's', input: { filePath: path.join(dir, 'a.txt') } }), /default branch/);
  await assert.rejects(hook({ tool: 'patch', sessionID: 's', input: { patchText: '*** Begin Patch\n*** Add File: z.txt\n+1\n*** End Patch' } }), /default branch/);
});

test('V2: the user\'s words arrive through the context hook and unlock confirmation', async () => {
  const dir = mkrepo('v2c');
  startTask(dir, 'feat/v2c', 'ready');
  const { ctx, hooks } = mockV2(dir, async ({ sessionID }) => ({ id: sessionID }));
  await plugin.setup(ctx);
  const hook = hooks['tool.execute.before'];
  const cmd = { tool: 'shell', sessionID: 'sess', input: { command: `${TS} transition confirmed` } };
  await assert.rejects(hook(cmd), /Only the user can confirm/);
  await hooks['session.context']({ sessionID: 'sess', messages: [{ role: 'user', content: [{ type: 'text', text: `${CONFIRM_MARKER} The user confirms.` }] }] });
  await hook(cmd);
});

test('V2: after opencode_session_move the guard judges commands in the worktree', async () => {
  const dir = mkrepo('v2m');
  const wt = path.join(tmp, 'v2m-wt');
  sh(dir, 'git', ['worktree', 'add', '-q', '-b', 'feat/moved', wt, 'main']);
  sh(wt, 'bash', [TS, 'init']);
  sh(wt, 'bash', [TS, 'start', '--branch', 'feat/moved', '--base', 'origin/main', '--summary', 's', '--tier', '2']);
  const { ctx, hooks } = mockV2(dir, async ({ sessionID }) => ({ id: sessionID }));
  await plugin.setup(ctx);
  const hook = hooks['tool.execute.before'];
  // before the move the session is in the main checkout, on the default branch: commit is refused for that reason
  await assert.rejects(hook({ tool: 'shell', sessionID: 'mv', input: { command: 'git commit -m x' } }), /default branch/);
  await hook({ tool: 'opencode_session_move', sessionID: 'mv', input: { directory: wt } });
  // in the worktree the task is 'working' on a task branch: commit passes (no AGENTS.md commands, gate finds nothing to run)
  await hook({ tool: 'shell', sessionID: 'mv', input: { command: 'git commit -m x' } });
  await assert.rejects(hook({ tool: 'shell', sessionID: 'mv', input: { command: 'git push -u origin feat/moved' } }), /not 'confirmed'/);
  // another session is unaffected
  await assert.rejects(hook({ tool: 'shell', sessionID: 'other', input: { command: 'git commit -m x' } }), /default branch/);
});

test('guard fails open when the guard itself throws (V2)', async () => {
  const { ctx, hooks } = mockV2('/definitely/not/a/dir', async ({ sessionID }) => ({ id: sessionID }));
  await plugin.setup(ctx);
  await hooks['tool.execute.before']({ tool: 'shell', sessionID: 's', input: { command: 'git status' } });
});
