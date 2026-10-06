// Minimal shell-command parser for the guardrails.
//
// Not a full shell parser. It splits a script into simple commands at
// && || ; | & and newlines, keeps quoted words together, strips env
// assignments and common wrappers, tracks `cd`, and recurses into
// `bash -c '...'`. Command substitutions are left as literal text.
// The guardrails are a safety net for an agent, not a security boundary.

const OPERATORS = ['&&', '||', ';', '|', '&', '\n'];

/** Split a script into raw simple commands, each a list of words. */
export function tokenize(script) {
  const commands = [];
  let words = [];
  let word = '';
  let inWord = false;
  let i = 0;
  const pushWord = () => {
    if (inWord) words.push(word);
    word = '';
    inWord = false;
  };
  const pushCommand = () => {
    pushWord();
    if (words.length) commands.push(words);
    words = [];
  };
  while (i < script.length) {
    const c = script[i];
    if (c === "'") {
      inWord = true;
      const end = script.indexOf("'", i + 1);
      const stop = end === -1 ? script.length : end;
      word += script.slice(i + 1, stop);
      i = stop + 1;
      continue;
    }
    if (c === '"') {
      inWord = true;
      i++;
      while (i < script.length && script[i] !== '"') {
        if (script[i] === '\\' && i + 1 < script.length) {
          word += script[i + 1];
          i += 2;
        } else {
          word += script[i];
          i++;
        }
      }
      i++;
      continue;
    }
    if (c === '\\' && i + 1 < script.length) {
      inWord = true;
      if (script[i + 1] === '\n') {
        i += 2;
      } else {
        word += script[i + 1];
        i += 2;
      }
      continue;
    }
    if (c === '#' && !inWord) {
      while (i < script.length && script[i] !== '\n') i++;
      continue;
    }
    const op = OPERATORS.find((o) => script.startsWith(o, i));
    if (op) {
      pushCommand();
      i += op.length;
      continue;
    }
    if (c === '(' || c === ')' || c === '{' || c === '}') {
      if (!inWord) {
        pushCommand();
        i++;
        continue;
      }
    }
    if (c === ' ' || c === '\t' || c === '\r') {
      pushWord();
      i++;
      continue;
    }
    inWord = true;
    word += c;
    i++;
  }
  pushCommand();
  return commands;
}

const WRAPPERS = new Set(['sudo', 'command', 'time', 'nohup', 'exec', 'builtin', 'then', 'do', 'else', 'if', 'while', 'until', '!']);
const SHELLS = new Set(['bash', 'sh', 'zsh', 'dash', 'ksh']);

/**
 * Parse a script into simple commands: { words, raw, cwd } where words has
 * wrappers and env assignments removed and cwd follows `cd` segments.
 * `bash -c "..."` and `eval "..."` bodies are parsed recursively.
 */
export function parseScript(script, startCwd, depth = 0) {
  const out = [];
  let cwd = startCwd;
  for (const raw of tokenize(script)) {
    let words = raw.slice();
    // env assignments and wrappers
    while (words.length) {
      if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(words[0])) { words.shift(); continue; }
      if (words[0] === 'env') {
        words.shift();
        while (words.length && (/^[A-Za-z_][A-Za-z0-9_]*=/.test(words[0]) || words[0].startsWith('-'))) words.shift();
        continue;
      }
      if (WRAPPERS.has(words[0])) { words.shift(); continue; }
      break;
    }
    if (!words.length) continue;
    const name = words[0].split('/').pop();
    if (name === 'cd' && words.length >= 2) {
      cwd = resolveDir(cwd, words[1]);
      continue;
    }
    if (depth < 3 && SHELLS.has(name)) {
      const ci = words.findIndex((w) => /^-[a-z]*c[a-z]*$/.test(w));
      if (ci !== -1 && words[ci + 1] !== undefined) {
        out.push(...parseScript(words[ci + 1], cwd, depth + 1));
        continue;
      }
    }
    if (depth < 3 && name === 'eval' && words.length > 1) {
      out.push(...parseScript(words.slice(1).join(' '), cwd, depth + 1));
      continue;
    }
    out.push({ words, name, raw: raw.join(' '), cwd });
  }
  return out;
}

function resolveDir(cwd, target) {
  if (!target || target === '-') return cwd;
  if (target.startsWith('/')) return target;
  if (target === '~' || target.startsWith('~/')) return target; // unknown home; keep literal
  const parts = (cwd || '').split('/');
  for (const seg of target.split('/')) {
    if (seg === '' || seg === '.') continue;
    if (seg === '..') parts.pop();
    else parts.push(seg);
  }
  return parts.join('/') || '/';
}

const GIT_GLOBAL_WITH_VALUE = new Set(['-C', '-c', '--git-dir', '--work-tree', '--namespace', '--exec-path', '--super-prefix', '--config-env']);

/** Parse `git [global opts] <sub> args...`. Returns null when not a git command. */
export function parseGit(cmd) {
  if (cmd.name !== 'git') return null;
  const w = cmd.words;
  let cwd = cmd.cwd;
  let i = 1;
  while (i < w.length && w[i].startsWith('-')) {
    const opt = w[i];
    if (opt === '-C' && w[i + 1] !== undefined) {
      cwd = resolveDir(cwd, w[i + 1]);
      i += 2;
    } else if (GIT_GLOBAL_WITH_VALUE.has(opt)) {
      i += 2;
    } else {
      i += 1;
    }
  }
  if (i >= w.length) return null;
  return { sub: w[i], args: w.slice(i + 1), cwd };
}

/** Does a git short-flag cluster such as "-am" contain the letter? Stops at value-taking letters. */
export function clusterHas(word, letter, valueLetters = 'mFCctu') {
  if (!/^-[A-Za-z]+$/.test(word)) return false;
  for (const ch of word.slice(1)) {
    if (ch === letter) return true;
    if (valueLetters.includes(ch)) return false;
  }
  return false;
}

/** Options of a git commit that consume the following word. */
const COMMIT_VALUE_LONG = new Set(['--message', '--file', '--reuse-message', '--reedit-message', '--author', '--date', '--cleanup', '--template', '--trailer', '--fixup', '--squash', '--gpg-sign', '--pathspec-from-file']);

/** Return commit option words with option values removed: { flags, positionals }. */
export function commitOptions(args) {
  const flags = [];
  const positionals = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--') { positionals.push(...args.slice(i + 1)); break; }
    if (a.startsWith('--')) {
      flags.push(a.split('=')[0]);
      if (!a.includes('=') && COMMIT_VALUE_LONG.has(a)) i++;
    } else if (/^-[A-Za-z]+$/.test(a)) {
      flags.push(a);
      const last = a[a.length - 1];
      if ('mFCct'.includes(last)) i++;
    } else if (a.startsWith('-')) {
      flags.push(a);
    } else {
      positionals.push(a);
    }
  }
  return { flags, positionals };
}
