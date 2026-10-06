/**
 * Branchwright: the workflow plugin for opencode. One file works on V1 (1.x) and V2 (2.0.4+).
 *
 * V1 loads the named export BranchwrightPlugin: `config` registers the skills
 * directory, `experimental.chat.messages.transform` injects the bootstrap into
 * the first user message of top-level sessions, `chat.message` records the
 * latest user text, and `tool.execute.before` runs the guardrails.
 *
 * V2 loads the default export { id, setup }: setup() registers every skill with
 * ctx.skill.transform, injects the bootstrap with ctx.session.hook("context"),
 * and runs the guardrails in ctx.tool.hook("execute.before") (throwing blocks
 * the tool call and shows the message to the model).
 *
 * No dependencies: plain JavaScript, plus git and bash on PATH.
 */
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { evaluateShell, evaluateEdit, isEditTool } from './lib/guard.js';
import { repoInfo, runVerify, writeTaskState } from './lib/git.js';

const here = path.dirname(fileURLToPath(import.meta.url));
export const skillsDir = path.resolve(here, '../../skills');

// ---- frontmatter ------------------------------------------------------------

export const extractAndStripFrontmatter = (content) => {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { frontmatter: {}, content };
  const frontmatter = {};
  let lastKey = null;
  for (const rawLine of match[1].split('\n')) {
    const line = rawLine.replace(/\r$/, '');
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0 && !/^\s/.test(line)) {
      lastKey = line.slice(0, colonIdx).trim();
      const value = line.slice(colonIdx + 1).trim();
      frontmatter[lastKey] = /^(>[+-]?|\|[+-]?)$/.test(value) ? '' : value;
    } else if (lastKey !== null && line.trim() !== '') {
      frontmatter[lastKey] = `${frontmatter[lastKey]} ${line.trim()}`.trim();
    }
  }
  for (const key of Object.keys(frontmatter)) frontmatter[key] = frontmatter[key].replace(/^(["'])([\s\S]*)\1$/, '$2');
  return { frontmatter, content: match[2] };
};

// ---- tool mapping (per host flavor) -------------------------------------------

const AGENT_LINES = `Subagent roles (agent names):
- \`implementer\`: builds one plan task or fix, test-first, commits slices; cannot dispatch subagents
- \`reviewer\`: read-only fresh-context review of a diff (code-review, task review, doubt)
- \`verifier\`: runs the checks and reports evidence; edits nothing
- \`planner\`: read-only exploration, grounding, plan and design drafts
- \`general\`: anything else`;

export const V1_MAPPING = `**Tool mapping for opencode:**
When skills request actions, use these:
- Create or update todos → \`todowrite\`
- Dispatch a subagent → \`task\` with \`subagent_type\` set to one of the agent names below, \`description\` and \`prompt\`
- Invoke a skill → the native \`skill\` tool
- Read files → \`read\`
- Create, edit or delete files → \`apply_patch\` (or \`edit\` / \`write\`)
- Run a shell command → \`bash\`
- Search → \`grep\`, \`glob\`; fetch a URL → \`webfetch\`

${AGENT_LINES}`;

export const V2_MAPPING = `**Tool mapping for opencode:**
When skills request actions, use these:
- Create or update todos → opencode v2 has no todo tool; keep the checklist in \`.workflow/\` (the plan or ledger)
- Dispatch a subagent → \`subagent\` with \`agent\` set to one of the agent names below, \`description\` and \`prompt\` (optionally \`background\`; pass \`sessionID\` to continue a previous subagent)
- Invoke a skill → the native \`skill\` tool
- Read files → \`read\`
- Create, edit or delete files → \`patch\` with \`patchText\` (or \`edit\` / \`write\`); delete with \`shell\`
- Run a shell command → \`shell\` (\`command\`, \`workdir\`, \`timeout\`, \`background\`); this host has no \`bash\` or \`task\` tool
- Search → \`grep\`, \`glob\`; fetch a URL → \`webfetch\`, \`websearch\`

${AGENT_LINES}`;

// ---- bootstrap ------------------------------------------------------------------

export const BOOTSTRAP_MARKER = 'WORKFLOW_BOOTSTRAP';
const _bootstrapCache = new Map();

export function getBootstrapContent(toolMapping) {
  if (_bootstrapCache.has(toolMapping)) return _bootstrapCache.get(toolMapping);
  const file = path.join(skillsDir, 'workflow', 'SKILL.md');
  if (!fs.existsSync(file)) {
    _bootstrapCache.set(toolMapping, null);
    return null;
  }
  const { content } = extractAndStripFrontmatter(fs.readFileSync(file, 'utf8'));
  const text = `<${BOOTSTRAP_MARKER}>
The workflow skill is ALREADY LOADED; you are following it now. Do not load "workflow" again. Run its intake before reading code or editing, for every new request.

${content}

**Scripts.** Skills name scripts as \`<X skill dir>/scripts/NAME\` or \`scripts/NAME\` inside skill X. The skills live in \`${skillsDir}\`. Run a script as \`"${skillsDir}/X/scripts/NAME" args\` and always wrap the path in double quotes (it may contain spaces); for example \`"${skillsDir}/workflow/scripts/task-state" show\`. Load a skill with the skill tool when its step starts; do not work from memory of what it says.

${toolMapping}
</${BOOTSTRAP_MARKER}>`;
  _bootstrapCache.set(toolMapping, text);
  return text;
}

// ---- child sessions and last user text ---------------------------------------------

const CHILD_SESSION_CACHE_MAX = 512;
const _childSessionCache = new Map();
const _cacheChildSession = (sessionID, isChild) => {
  if (_childSessionCache.size >= CHILD_SESSION_CACHE_MAX) {
    let toDrop = Math.ceil(CHILD_SESSION_CACHE_MAX / 4);
    for (const key of _childSessionCache.keys()) {
      if (toDrop-- <= 0) break;
      _childSessionCache.delete(key);
    }
  }
  _childSessionCache.set(sessionID, isChild);
};

export const isChildSession = async (fetchSession, sessionID) => {
  if (!sessionID) return false;
  if (_childSessionCache.has(sessionID)) return _childSessionCache.get(sessionID);
  let isChild = false;
  try {
    const result = await fetchSession(sessionID);
    if (!result || typeof result !== 'object' || Array.isArray(result)) throw new Error('no usable record');
    if (result.error != null || result.response?.ok === false) throw new Error('lookup unsuccessful');
    const session = 'data' in result ? result.data : result;
    if (!session || typeof session !== 'object' || session.id !== sessionID) throw new Error('invalid session identity');
    if (session.parentID !== undefined && (typeof session.parentID !== 'string' || session.parentID.length === 0)) throw new Error('invalid parent identity');
    isChild = session.parentID !== undefined;
  } catch (err) {
    console.error('[branchwright] session lookup failed, treating session as top-level:', err);
    return false;
  }
  _cacheChildSession(sessionID, isChild);
  return isChild;
};

const LAST_USER_MAX = 256;
const _lastUser = new Map();
export const rememberUserText = (sessionID, text) => {
  if (!sessionID || typeof text !== 'string') return;
  if (_lastUser.size >= LAST_USER_MAX && !_lastUser.has(sessionID)) _lastUser.delete(_lastUser.keys().next().value);
  _lastUser.set(sessionID, text);
};
export const lastUserText = (sessionID) => _lastUser.get(sessionID) || '';

// A V2 session can move itself into a worktree (opencode_session_move). The guard
// follows it, so commands without an explicit cd or workdir run against the right repo.
const _sessionDir = new Map();
export const noteSessionMove = (sessionID, tool, input) => {
  if (!sessionID || tool !== 'opencode_session_move' || !input || typeof input.directory !== 'string') return;
  if (_sessionDir.size >= LAST_USER_MAX && !_sessionDir.has(sessionID)) _sessionDir.delete(_sessionDir.keys().next().value);
  _sessionDir.set(sessionID, input.directory);
};
export const sessionDirectory = (sessionID, fallback) => _sessionDir.get(sessionID) || fallback;

const stripBootstrap = (text) => text.replace(new RegExp(`<${BOOTSTRAP_MARKER}>[\\s\\S]*?</${BOOTSTRAP_MARKER}>`, 'g'), '');
const textOfParts = (parts) => (parts || []).filter((p) => p && p.type === 'text' && typeof p.text === 'string').map((p) => stripBootstrap(p.text)).join('\n');

// ---- guardrail environment -------------------------------------------------------------

export function makeEnv(cwd, sessionID) {
  return {
    cwd,
    repoInfo,
    lastUserText: lastUserText(sessionID),
    runVerify: (dir) => runVerify(dir, skillsDir),
    skillsDir,
  };
}

/** Run the guard for one tool call; returns a reason string to block, else null. */
export async function guardToolCall({ tool, args, cwd, sessionID }) {
  const shellTool = tool === 'bash' || tool === 'shell';
  if (shellTool) {
    const command = args && typeof args.command === 'string' ? args.command : '';
    if (!command) return null;
    const dir = args.workdir ? (path.isAbsolute(args.workdir) ? args.workdir : path.join(cwd, args.workdir)) : cwd;
    const r = await evaluateShell(command, makeEnv(dir, sessionID));
    return r.block ? r.reason : null;
  }
  if (isEditTool(tool)) {
    const r = evaluateEdit(tool, args, makeEnv(cwd, sessionID));
    if (r.block) return r.reason;
    if (r.resetState) writeTaskState(r.resetState, 'working');
    return null;
  }
  return null;
}

// ---- V1 --------------------------------------------------------------------------------

export const BranchwrightPlugin = async ({ client, directory }) => {
  const cwd = directory || process.cwd();
  return {
    config: async (config) => {
      if (Array.isArray(config.skills)) return; // V2 shape: setup() registers skills
      config.skills = config.skills || {};
      config.skills.paths = config.skills.paths || [];
      if (!config.skills.paths.includes(skillsDir)) config.skills.paths.push(skillsDir);
    },

    'chat.message': async (input, output) => {
      rememberUserText(input && input.sessionID, textOfParts(output && output.parts));
    },

    'experimental.chat.messages.transform': async (_input, output) => {
      const messages = output.messages || [];
      const users = messages.filter((m) => m.info.role === 'user');
      const lastUser = users[users.length - 1];
      if (lastUser) rememberUserText(lastUser.info.sessionID, textOfParts(lastUser.parts));

      const bootstrap = getBootstrapContent(V1_MAPPING);
      if (!bootstrap || !messages.length) return;
      const firstUser = users[0];
      if (!firstUser || !firstUser.parts.length) return;
      if (firstUser.parts.some((p) => p.type === 'text' && p.text.includes(BOOTSTRAP_MARKER))) return;
      if (client && (await isChildSession((id) => client.session.get({ path: { id } }), firstUser.info.sessionID))) return;
      const ref = firstUser.parts[0];
      firstUser.parts.unshift({ ...ref, type: 'text', text: bootstrap });
    },

    'tool.execute.before': async (input, output) => {
      const reason = await guardToolCall({ tool: input.tool, args: output.args, cwd, sessionID: input.sessionID });
      if (reason) throw new Error(reason);
    },
  };
};

// ---- V2 --------------------------------------------------------------------------------

async function setup(ctx) {
  // V1 also calls default.setup with a V1-shaped ctx; the named export serves V1.
  if (!ctx || !ctx.skill || typeof ctx.skill.transform !== 'function' || !ctx.session || typeof ctx.session.hook !== 'function') return;
  const cwd = (ctx.location && ctx.location.directory) || process.cwd();

  try {
    const skills = [];
    if (fs.existsSync(skillsDir)) {
      for (const entry of fs.readdirSync(skillsDir, { withFileTypes: true })) {
        if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
        const skillPath = path.join(skillsDir, entry.name, 'SKILL.md');
        if (!fs.existsSync(skillPath)) continue;
        const { frontmatter, content } = extractAndStripFrontmatter(fs.readFileSync(skillPath, 'utf8'));
        skills.push({
          id: entry.name,
          name: frontmatter.name || entry.name,
          ...(frontmatter.description ? { description: frontmatter.description } : {}),
          path: skillPath,
          content,
        });
      }
    }
    await ctx.skill.transform((draft) => {
      for (const skill of skills) {
        try {
          draft.add(skill);
        } catch (err) {
          console.error(`[branchwright] skill "${skill.id}" rejected by host, skipping:`, err);
        }
      }
    });
  } catch (err) {
    console.error('[branchwright] skill registration failed:', err);
  }

  try {
    await ctx.session.hook('context', async (event) => {
      try {
        const messages = event.messages || [];
        const users = messages.filter((m) => m.role === 'user');
        const lastUser = users[users.length - 1];
        if (lastUser) rememberUserText(event.sessionID, textOfParts(lastUser.content));

        const bootstrap = getBootstrapContent(V2_MAPPING);
        if (!bootstrap || !messages.length) return;
        const firstUser = users[0];
        if (firstUser && (!firstUser.content || !firstUser.content.length)) return;
        if (firstUser?.content.some((p) => p.type === 'text' && p.text && p.text.includes(BOOTSTRAP_MARKER))) return;
        if (typeof ctx.session.get === 'function' && (await isChildSession((id) => ctx.session.get({ sessionID: id }), event.sessionID))) return;
        if (firstUser) firstUser.content.unshift({ type: 'text', text: bootstrap });
        else messages.push({ role: 'user', content: [{ type: 'text', text: bootstrap }] });
      } catch (err) {
        console.error('[branchwright] context hook failed:', err);
      }
    });
  } catch (err) {
    console.error('[branchwright] session hook registration failed:', err);
  }

  try {
    await ctx.tool.hook('execute.before', async (ev) => {
      let reason = null;
      try {
        noteSessionMove(ev.sessionID, ev.tool, ev.input);
        reason = await guardToolCall({ tool: ev.tool, args: ev.input, cwd: sessionDirectory(ev.sessionID, cwd), sessionID: ev.sessionID });
      } catch (err) {
        console.error('[branchwright] guard failed open:', err);
      }
      if (reason) throw new Error(reason);
    });
  } catch (err) {
    console.error('[branchwright] tool hook registration failed:', err);
  }
}

export default {
  id: 'branchwright',
  server: BranchwrightPlugin,
  setup,
};
