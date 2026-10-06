# Branchwright

A workflow plugin for opencode (package and plugin id `branchwright`).

A tiered, branch-per-task coding workflow for [opencode](https://opencode.ai): 47 skills, guardrails that enforce the rules, four subagents and nine slash commands. One plugin works on opencode V1 (1.x) and V2 (2.0.4 or later).

It is built for TypeScript and Python projects, one model, GitHub through `gh`, and a human who keeps four decisions: spec approval, "done", push and PR, and anything irreversible.

## What it does

Every request starts with the `workflow` skill, which states a tier and sets up the branch:

| Tier | Task | Path |
|---|---|---|
| 0 | One-file edit, no behavior change | edit, verify, commit |
| 1 | Bug or small change | `debugging` for bugs, `tdd`, fix, verify, commit |
| 2 | Feature | `grilling`, `spec`, **your approval**, `writing-plans`, worktree, build with `tdd` and `atomic-commits`, `code-review`, verify |
| 3 | Several sessions or capabilities | `wayfinder` or a capability map, `to-tickets`, each ticket as Tier 2 on its own branch |

- **One branch per task**, created locally from `origin/<default>`. Unrelated work gets its own branch; dirty work is stashed with a label, never WIP-committed.
- **Task state** in `.workflow/task.json` (git-excluded): `working`, then `ready` (verified and reviewed, the agent stops), then `confirmed` (only your explicit "done" or `/done`), then `pr-open` (plain push and `gh pr create`, `Closes #N`). You keep merge, issue close and branch deletion.
- **Atomic commits**: one green slice at a time, staged by path, conventional messages.
- **Specs live as GitHub issues**; plans, ledgers and review packages live in `.workflow/`.

## Requirements

`git`, `bash`, `python3`, and `gh` (logged in) on PATH; opencode V1 1.x or V2 2.0.4+. Install the package at a path without spaces if you can: skills run scripts by absolute path and quoting is easier to get right.

## Install

```bash
git clone <this repo> ~/branchwright        # or any path
~/branchwright/install.sh --project /path/to/your/repo
```

`install.sh` copies the agents and commands into the project's `.opencode/`, adds the plugin to `opencode.json` (key `plugins` on V2, `plugin` on V1; detected from `opencode --version`, or pass `--flavor v1|v2`), hides the 17 optional skills, and adds the static git deny rules. Existing keys are kept. `--global` installs into `~/.config/opencode` instead. Then:

1. Restart opencode in the project.
2. Run `setup-workflow` (ask for it, or say "set up the workflow"). It writes the `## Commands` table into `AGENTS.md`, the GitHub and domain docs under `docs/agents/`, the `ready-for-agent` label, and git-excludes `.workflow/`.
3. Commit `opencode.json`, `.opencode/` and `AGENTS.md` if you want them shared, or leave them untracked.

Manual V2 setup: `"plugins": ["/absolute/path/to/branchwright"]` (the directory, not a file). Manual V1 setup: `"plugin": ["/absolute/path/to/branchwright"]`. The skills directory is registered by the plugin; copy `.opencode/agents` and `.opencode/commands` yourself.

Your own global opencode plugins and skills keep working. If a global skill has the same name as one here (for example `code-review`, `grilling`, `tdd`), check which one the `skill` tool loads; remove or rename the one you do not want.

## Optional skills

17 skills are hidden by `permission.skill` rules until enabled: `to-tickets`, `wayfinder`, `research`, `prototype`, `architect`, `codebase-design`, `blast-radius`, `create-verification-skill`, `retro`, `reflect`, `writing-for-agents`, `show-me-your-work`, `security-and-hardening`, `performance-optimization`, `api-and-interface-design`, `ci-cd-and-automation`, `shipping-and-launch`.

```bash
install.sh --project . --enable wayfinder,security-and-hardening
```

Dependencies come along (`wayfinder` brings `research` and `prototype`; `retro` needs `writing-for-agents`, name both). Re-run without `--enable` to hide them again; an explicit `"allow"` you wrote yourself is kept. A hidden skill cannot be loaded at all, even by another skill, so `tdd` carries its own `seams.md` and uses `codebase-design` only when enabled.

## Commands

| Command | Does |
|---|---|
| `/task <request>` | intake: tier, branch decision, branch created; does not start the work |
| `/spec <idea>` | grill, write the spec issue, stop for approval |
| `/plan` | plan for the approved spec, pick the executor |
| `/build` | build the plan task by task (subagent-driven or inline) |
| `/review [high-risk]` | two-axis code review with fixes and scoped re-review |
| `/ship` | verify, review, set `ready`, report, stop (no push) |
| `/done` | your confirmation: sets `confirmed`, runs `finish-task` (push, PR) |
| `/next` | resume state; continue the plan or take the next ticket |
| `/retro` | retrospective on the session (needs `retro` enabled) |

Note: `/review` shadows opencode's built-in `/review`.

## Agents

`planner` (read-only, writes under `.workflow/`), `implementer` (builds one task test-first, cannot dispatch subagents), `reviewer` (fresh-context, read-only), `verifier` (runs checks, edits nothing). All run on the session's model; none can dispatch further subagents.

## Guardrails

Two layers. The static `permission.bash` rules (in `opencode.json`) work on both flavors. The plugin adds state-aware rules through `tool.execute.before` (V1) and `ctx.tool.hook("execute.before")` (V2); a thrown error blocks the call and the model sees the reason.

| Blocked | Unless |
|---|---|
| `git push` of anything | state is `confirmed`, on the task branch, a plain push of that branch only |
| force, mirror, delete or tag pushes, `--no-verify` anywhere | never |
| `git add -A`, `.`, `-u`, `git commit -a` | never (stage by path) |
| `git commit --amend`, `rebase`, `reset --hard`, `clean -f`, branch deletion, `filter-branch` | never |
| commits on the default branch; edits on the default branch | never (`.workflow/` is exempt) |
| `git commit` when the project's verify commands fail | never (the gate runs `run-verify` from `AGENTS.md`; a tree that already passed is not re-run) |
| `gh pr create` | state is `confirmed` |
| `gh pr merge`, `pr close`, `issue close`, `issue develop`, `repo delete`, destructive `gh api` | never |
| setting `confirmed` | your latest message says done / "open the PR" / `/done` |
| writing `.workflow/task.json` by hand | never (use `task-state`) |

An edit after `ready` or `confirmed` returns the task to `working`. The guardrails are a safety net for an agent, not a security boundary: a determined shell command can get around a text check. Review the diff before you merge.

## Layout

```
skills/                 47 skills (SKILL.md plus sibling references and scripts)
.opencode/plugins/      workflow.js (V1 + V2 entry), lib/ (parser, guard, git helpers)
.opencode/agents/       planner, implementer, reviewer, verifier
.opencode/commands/     spec plan build review ship retro done task next
opencode.template.json  the permission rules install.sh merges
install.sh              installer
tools/                  validate-skills.mjs, skillset.json
tests/                  shell and node tests
docs/AUDIT.md           how the four source repos were curated
SOURCES.md              credits (MIT sources: superpowers, Pocock, pstack, Osmani)
```

## Develop

```bash
node tools/validate-skills.mjs --complete     # frontmatter, links, set membership, dependencies, scripts
bash tests/spine.test.sh                      # git flows, task state, finish-task (scratch repos)
bash tests/review-package.test.sh
bash tests/sdd.test.sh
bash tests/install.test.sh
node --test tests/plugin.test.mjs             # parser, guard rules, V1 and V2 entry points with mock hosts
```

Status: verified live on opencode 2.0.23 (V2): plugin loading, bootstrap injection, `permission.skill` and `permission.bash` rules, blocking by the tool hook, and full Tier 1 and Tier 2 runs through to an open PR (see `docs/RESULTS.md`). The V1 entry point is covered by mock-host tests and the V1 type definitions only; it has not been run on a real V1 install.
