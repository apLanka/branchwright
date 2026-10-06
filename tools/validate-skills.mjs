#!/usr/bin/env node
// Validate the skills under ../skills.
//
// Usage: node tools/validate-skills.mjs [--complete]
//   --complete  also fail when a skill from the 47-skill set is missing
//
// Checks per skill:
//   - SKILL.md exists, frontmatter parses, only name/description/license/compatibility/metadata
//   - name matches the directory and ^[a-z0-9]+(-[a-z0-9]+)*$ (max 64 chars)
//   - description is present, at most 1024 chars, and says when to use the skill
//   - directory is in the 47-skill set
//   - relative markdown links resolve
//   - backticked skill names refer to skills in the set (not to dropped source skills)
//   - every script under scripts/ passes `bash -n` (or `node --check` for .mjs/.js)
//   - hard dependencies (tools/skillset.json) exist
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const skillsDir = path.resolve(here, '../skills');
const set = JSON.parse(fs.readFileSync(path.join(here, 'skillset.json'), 'utf8'));
const inSet = new Set([...set.visible, ...set.hidden]);
const excluded = new Set(set.excluded);
const complete = process.argv.includes('--complete');

const ALLOWED = new Set(['name', 'description', 'license', 'compatibility', 'metadata']);
const errors = [];
const err = (skill, msg) => errors.push(`${skill}: ${msg}`);

function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return null;
  const fm = {};
  let last = null;
  for (const raw of m[1].split('\n')) {
    const line = raw.replace(/\r$/, '');
    const i = line.indexOf(':');
    if (i > 0 && !/^\s/.test(line)) {
      last = line.slice(0, i).trim();
      const v = line.slice(i + 1).trim();
      fm[last] = /^(>[+-]?|\|[+-]?)$/.test(v) ? '' : v;
    } else if (last && line.trim()) {
      fm[last] = `${fm[last]} ${line.trim()}`.trim();
    }
  }
  for (const k of Object.keys(fm)) fm[k] = fm[k].replace(/^(["'])([\s\S]*)\1$/, '$2');
  return { fm, body: m[2] };
}

function stripCode(body) {
  return body.replace(/```[\s\S]*?```/g, '');
}

const dirs = fs.existsSync(skillsDir)
  ? fs.readdirSync(skillsDir, { withFileTypes: true }).filter((e) => e.isDirectory() && !e.name.startsWith('.')).map((e) => e.name)
  : [];

for (const name of dirs) {
  const dir = path.join(skillsDir, name);
  const file = path.join(dir, 'SKILL.md');
  if (!fs.existsSync(file)) { err(name, 'missing SKILL.md'); continue; }
  const parsed = parseFrontmatter(fs.readFileSync(file, 'utf8'));
  if (!parsed) { err(name, 'no frontmatter'); continue; }
  const { fm, body } = parsed;

  for (const k of Object.keys(fm)) if (!ALLOWED.has(k)) err(name, `frontmatter field "${k}" has no effect in opencode`);
  if (fm.name !== name) err(name, `name "${fm.name}" does not match directory`);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name) || name.length > 64) err(name, 'invalid name format');
  if (!fm.description) err(name, 'missing description');
  else {
    if (fm.description.length > 1024) err(name, `description is ${fm.description.length} chars (max 1024)`);
    if (!/\b(use|when|before|after|at the start)\b/i.test(fm.description)) err(name, 'description does not say when to use the skill');
  }
  if (!inSet.has(name)) err(name, 'not in the 47-skill set');

  // Markdown files in the skill: links and skill references
  const mdFiles = [];
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.md')) mdFiles.push(p);
    }
  })(dir);

  for (const md of mdFiles) {
    const rel = path.relative(skillsDir, md);
    const text = stripCode(fs.readFileSync(md, 'utf8'));
    for (const m of text.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
      const target = m[1];
      if (/^(https?:|mailto:|#)/.test(target)) continue;
      const clean = target.split('#')[0];
      if (!clean) continue;
      if (!fs.existsSync(path.resolve(path.dirname(md), clean))) err(rel, `broken link: ${target}`);
    }
    for (const m of text.matchAll(/`([a-z0-9]+(?:-[a-z0-9]+)*)`/g)) {
      const ref = m[1];
      if (excluded.has(ref) && !inSet.has(ref)) err(rel, `references skill outside the set: \`${ref}\``);
    }
  }

  // Scripts
  const sdir = path.join(dir, 'scripts');
  if (fs.existsSync(sdir)) {
    for (const f of fs.readdirSync(sdir)) {
      const p = path.join(sdir, f);
      if (!fs.statSync(p).isFile()) continue;
      if (/\.(mjs|js)$/.test(f)) {
        const r = spawnSync('node', ['--check', p], { encoding: 'utf8' });
        if (r.status !== 0) err(`${name}/scripts/${f}`, `node --check failed: ${r.stderr.trim()}`);
        continue;
      }
      const head = fs.readFileSync(p, 'utf8').split('\n', 1)[0];
      if (/\b(ba)?sh\b/.test(head)) {
        const r = spawnSync('bash', ['-n', p], { encoding: 'utf8' });
        if (r.status !== 0) err(`${name}/scripts/${f}`, `bash -n failed: ${r.stderr.trim()}`);
      }
      if (!(fs.statSync(p).mode & 0o111)) err(`${name}/scripts/${f}`, 'not executable');
    }
  }
}

// Dependencies
for (const [skill, needs] of Object.entries(set.dependencies)) {
  if (!dirs.includes(skill)) continue;
  for (const n of needs) if (!dirs.includes(n) && complete) err(skill, `hard dependency missing: ${n}`);
}

if (complete) {
  for (const n of inSet) if (!dirs.includes(n)) err(n, 'skill from the set is missing');
}

const present = dirs.filter((d) => inSet.has(d)).length;
if (errors.length) {
  console.log(errors.join('\n'));
  console.log(`\nFAILED: ${errors.length} problem(s); ${dirs.length} skill dir(s), ${present}/${inSet.size} of the set present`);
  process.exit(1);
}
console.log(`OK: ${dirs.length} skill dir(s) valid; ${present}/${inSet.size} of the set present`);
