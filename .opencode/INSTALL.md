# Installing Branchwright for opencode (global)

Instructions for an agent. Follow the steps in order, run the commands yourself, and ask the user only where a step says **ask**. Do not skip the backup.

Branchwright is a workflow plugin: 47 skills, guardrails (no push before the user confirms a task, no force-push, no `git add -A`, no edits or commits on the default branch, a commit gate), four subagents and nine slash commands. A global install applies it to **every** git repository the user opens with opencode.

## 1. Check the prerequisites

Run each and report anything missing; stop if one is missing.

```bash
git --version
bash --version | head -1
python3 --version
gh auth status          # gh must be installed and logged in
opencode --version
```

The opencode major version decides the flavor: `2.x` is **v2**, `1.x` is **v1**.

## 2. Ask the user to confirm the scope

**Ask:** "Installing globally means Branchwright's guardrails apply in every git repo you open with opencode (edits and commits on the default branch are blocked, and pushes need a confirmed task). Continue with a global install? (Or install into one project with `install.sh --project <dir>` instead.)" Wait for the answer. If they want one project, run step 3, then `"$HOME/.local/share/branchwright/install.sh" --project <dir> --flavor <v1|v2>` and skip to step 7.

## 3. Get the code

Use a path without spaces.

```bash
if [ -d "$HOME/.local/share/branchwright/.git" ]; then
  git -C "$HOME/.local/share/branchwright" pull --ff-only
else
  git clone https://github.com/apLanka/branchwright.git "$HOME/.local/share/branchwright"
fi
```

## 4. Back up the global config

```bash
B="$HOME/.config/opencode.backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$B"
cp -R "$HOME/.config/opencode/"opencode.json* "$HOME/.config/opencode/agents" "$HOME/.config/opencode/commands" "$B"/ 2>/dev/null || true
echo "backup in $B"
```

## 5. Look at the existing config

```bash
ls "$HOME/.config/opencode"
```

- **Other workflow plugins** (for example `superpowers`) in `"plugin"` or `"plugins"`: two bootstraps compete. **Ask** the user whether to remove it. Remove it only if they say yes.
- **Skills or agents with the same names** as Branchwright's (`code-review`, `grilling`, `domain-modeling`, `codebase-design`, `tdd`, `debugging`, `reviewer`, `planner`, `implementer`, `verifier`): tell the user which exist; leave them unless the user asks you to remove them.

## 6. Install

Pick the case:

**6a. The global config is `opencode.json`, or does not exist yet.**

```bash
"$HOME/.local/share/branchwright/install.sh" --global --flavor <v1|v2>
```

It copies the agents and commands to `~/.config/opencode`, adds the plugin (key `plugins` on v2, `plugin` on v1), hides the 17 optional skills, and adds the static git deny rules. Existing keys are kept.

**6b. The global config is `opencode.jsonc`** (the installer will copy the agents and commands, then refuse to rewrite the file, to protect comments). Run the installer anyway for the copy, then edit `~/.config/opencode/opencode.jsonc` yourself, keeping its comments and existing entries:

```bash
"$HOME/.local/share/branchwright/install.sh" --global --flavor <v1|v2>   # expect it to stop with a message about opencode.jsonc
```

Then add:

1. The plugin entry: the directory `"$HOME/.local/share/branchwright"` written as an **absolute path** (`~` is not expanded), under `"plugins"` on v2 or `"plugin"` on v1.
2. Every key under `permission.skill` and `permission.bash` from `$HOME/.local/share/branchwright/opencode.template.json`, merged into any existing `permission` block (do not overwrite entries that are already there).

Validate that the file still parses (for example with `node -e` using a JSONC-tolerant check, or by starting opencode).

**Optional skills.** 17 skills are hidden by default. **Ask** whether to enable any (`to-tickets`, `wayfinder`, `research`, `prototype`, `architect`, `codebase-design`, `blast-radius`, `create-verification-skill`, `retro`, `reflect`, `writing-for-agents`, `show-me-your-work`, `security-and-hardening`, `performance-optimization`, `api-and-interface-design`, `ci-cd-and-automation`, `shipping-and-launch`). With 6a, re-run `install.sh --global --flavor <v1|v2> --enable a,b` (dependencies come along: `wayfinder` needs `research` and `prototype`; `retro` needs `writing-for-agents`). With 6b, delete those names from `permission.skill`.

## 7. Restart and verify

Tell the user to **restart opencode** (the plugin loads at startup). After the restart, in any git repository:

- The `skill` tool lists `workflow`, `branch-per-task`, `tdd`, `code-review` and the rest of the visible skills.
- The slash commands `/task`, `/spec`, `/plan`, `/build`, `/ship`, `/done`, `/next` exist.
- Asking the agent to edit a file while the repo is on `main` is refused with "the default branch" and a pointer to `branch-per-task`.

## 8. Tell the user how to start

> In each repository, say: "Set up the workflow for this repo." The agent writes your test, typecheck and lint commands into `AGENTS.md`, creates the GitHub docs and the `ready-for-agent` label, and git-excludes `.workflow/`. After that, just describe what you want. The agent states a tier, makes a branch, asks you the decisions it needs, publishes a spec for your approval, builds test-first in small commits, and stops at `ready` until you say "done" (or run `/done`), which pushes and opens the pull request.

The README (`$HOME/.local/share/branchwright/README.md`) has the full guide.

## Updating

```bash
git -C "$HOME/.local/share/branchwright" pull --ff-only
"$HOME/.local/share/branchwright/install.sh" --global --flavor <v1|v2>   # idempotent; add --enable ... again if you use it
```

## Uninstalling

1. Remove the plugin path from `"plugins"` / `"plugin"` in the global config, and the `permission.skill` and `permission.bash` entries Branchwright added.
2. Delete the copied agents (`planner.md`, `implementer.md`, `reviewer.md`, `verifier.md`) from `~/.config/opencode/agents` and the commands (`task`, `spec`, `plan`, `build`, `review`, `ship`, `done`, `next`, `retro`) from `~/.config/opencode/commands`.
3. Optionally delete `~/.local/share/branchwright`. Per-repo state lives in each repo's git-excluded `.workflow/` folder and can be deleted there.
