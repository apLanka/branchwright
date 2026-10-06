// Git and task-state helpers for the guardrails. No dependencies.
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export function git(cwd, args) {
  try {
    return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 15000 }).trim();
  } catch {
    return null;
  }
}

/** Nearest existing directory for a path (the file may not exist yet). */
export function existingDir(p) {
  let d = p;
  for (let i = 0; i < 64; i++) {
    try {
      if (fs.statSync(d).isDirectory()) return d;
    } catch { /* keep climbing */ }
    const up = path.dirname(d);
    if (up === d) return null;
    d = up;
  }
  return null;
}

export function defaultBranch(cwd) {
  const head = git(cwd, ['symbolic-ref', '--quiet', '--short', 'refs/remotes/origin/HEAD']);
  if (head) return head.replace(/^origin\//, '');
  for (const b of ['main', 'master']) {
    if (git(cwd, ['show-ref', '--verify', '--quiet', `refs/remotes/origin/${b}`]) !== null) return b;
  }
  for (const b of ['main', 'master']) {
    if (git(cwd, ['show-ref', '--verify', '--quiet', `refs/heads/${b}`]) !== null) return b;
  }
  const cfg = git(cwd, ['config', '--get', 'init.defaultBranch']);
  if (cfg) return cfg;
  return git(cwd, ['branch', '--show-current']) || 'main';
}

/** { top, branch, defaultBranch, task } for the repo containing cwd, or null outside a repo. */
export function repoInfo(cwd) {
  const dir = existingDir(cwd);
  if (!dir) return null;
  const top = git(dir, ['rev-parse', '--show-toplevel']);
  if (!top) return null;
  const branch = git(dir, ['branch', '--show-current']) || null;
  return { top, branch, defaultBranch: defaultBranch(dir), task: readTask(top) };
}

export function taskPath(top) {
  return path.join(top, '.workflow', 'task.json');
}

export function readTask(top) {
  try {
    return JSON.parse(fs.readFileSync(taskPath(top), 'utf8'));
  } catch {
    return null;
  }
}

/** Set task.state in place (used when an edit invalidates ready/confirmed). */
export function writeTaskState(top, state) {
  const t = readTask(top);
  if (!t) return false;
  t.state = state;
  fs.writeFileSync(taskPath(top), JSON.stringify(t, null, 2) + '\n');
  return true;
}

/** Run the project's verify commands unless this exact tree already passed. */
export function runVerify(cwd, workflowSkillsDir) {
  const scripts = path.join(workflowSkillsDir, 'workflow', 'scripts');
  const dir = existingDir(cwd);
  if (!dir) return { status: 3, output: '' };
  const top = git(dir, ['rev-parse', '--show-toplevel']);
  if (!top) return { status: 3, output: '' };
  const key = spawnSync('bash', [path.join(scripts, 'verify-key')], { cwd: top, encoding: 'utf8' }).stdout.trim();
  const marker = path.join(top, '.workflow', 'verified');
  try {
    if (key && fs.readFileSync(marker, 'utf8').trim() === key) return { status: 0, output: 'verified already for this exact tree', cached: true };
  } catch { /* no marker */ }
  const r = spawnSync('bash', [path.join(scripts, 'run-verify')], { cwd: top, encoding: 'utf8', timeout: 20 * 60 * 1000 });
  return { status: r.status === null ? 1 : r.status, output: `${r.stdout || ''}${r.stderr || ''}`.trim() };
}
