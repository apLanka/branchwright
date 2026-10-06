# Branchwright

A workflow plugin for [opencode](https://opencode.ai) that makes a coding agent work like a careful engineer: it sizes the task, gives it its own branch, writes the spec as a GitHub issue and waits for your approval, builds test-first in small commits, reviews its own work with fresh eyes, and then **stops** until you say it is done. Only then does it push and open the pull request.

It ships 47 skills, guardrails that enforce the rules instead of asking nicely, four subagents, nine slash commands and an installer. One plugin works on opencode V1 (1.x) and V2 (2.0.4 or later).

Built for TypeScript and Python projects, one model, GitHub through `gh`.

- [Quick start](#quick-start)
- [How a task runs](#how-a-task-runs)
- [Tiers](#tiers)
- [Task states and who decides](#task-states-and-who-decides)
- [Commands](#commands)
- [Guardrails](#guardrails)
- [Agents](#agents)
- [Skills](#skills)
- [Install options](#install-options)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
- [Status and limits](#status-and-limits)
- [Development](#development)
- [License and credits](#license-and-credits)

## Quick start

You need `git`, `bash`, `python3` and [`gh`](https://cli.github.com) (logged in) on your PATH, and opencode V1 1.x or V2 2.0.4+.

```bash
git clone git@github.com:apLanka/branchwright.git ~/branchwright
~/branchwright/install.sh --project /path/to/your/repo
```

Restart opencode in that project, then say:

> Set up the workflow for this repo.

The agent reads your repo, writes the test, typecheck and lint commands into `AGENTS.md`, creates the GitHub docs under `docs/agents/`, creates the `ready-for-agent` label, and git-excludes the `.workflow/` state folder. That is the whole setup. From then on, just describe what you want:

> Create a referral code system for this website.

## How a task runs

Every request goes through the same intake, and the process scales with the size of the task. A typo takes four steps; a feature takes the whole chain. Here is a feature (Tier 2) from start to finish:

1. **Intake.** The agent says its tier in one line ("Tier 2: referral code system"), reads the git state, and creates a new branch from `origin/<default>`. Features get a separate git worktree, so your current checkout is never touched.
2. **Questions.** It reads your code first, then asks you only *decisions*, each with a recommendation (who gets a code, what it earns, how abuse is prevented). It looks facts up itself. This repeats until nothing is left unclear.
3. **Spec.** It publishes the spec as a GitHub issue with no label, renames the branch to include the issue number, and **stops for your approval**.
4. **You approve.** Nothing is built before this.
5. **Plan and build.** It adds the `ready-for-agent` label, writes a plan, and builds task by task: a subagent writes a failing test, makes it pass, and commits one green slice at a time; other subagents review the result. It does not ask you anything here. When something is open it picks one, records a `Ruling:` line, and carries on; all rulings are listed in the final report.
6. **Review and verify.** Two fresh reviewers check the diff, one against your repo's standards and one against the spec. It fixes what they find, runs your test, typecheck and lint commands, marks the task `ready`, and **stops**. Nothing has been pushed.
7. **You confirm.** Say "done, open the PR" (or run `/done`). It pushes the branch with a plain push and opens the pull request with `Closes #N`.
8. **You merge.** Merging, closing the issue and deleting the branch stay with you.

For a bug (Tier 1), step 2 to 4 are replaced by building a feedback loop that reproduces the bug, finding the root cause, and writing the regression test first.

## Tiers

The agent picks the lowest tier that fits and only ever moves up.

| Tier | Task | Path |
|---|---|---|
| 0 | One-file edit, no behavior change | edit, verify, commit |
| 1 | Bug or small change | `debugging` for bugs, `tdd`, fix, verify, commit |
| 2 | Feature | `grilling`, `spec`, **your approval**, `writing-plans`, worktree, build with `tdd` and `atomic-commits`, `code-review`, verify |
| 3 | Several sessions, or several independent capabilities | `wayfinder` or a capability map, `to-tickets`, then each ticket runs as Tier 2 on its own branch; `handoff` between sessions |

## Task states and who decides

State lives in `.workflow/task.json` (never committed):

```
working  ->  ready  ->  confirmed  ->  pr-open
```

| State | Meaning | Who moves it |
|---|---|---|
| `working` | being built | the agent |
| `ready` | built, verified and reviewed; the agent has reported and stopped | the agent |
| `confirmed` | the task is accepted | **only you** ("done", "open the PR", or `/done`) |
| `pr-open` | branch pushed, pull request open | the `finish-task` skill |

The agent never moves to another task while one is `ready` and unconfirmed. If you give it an unrelated request in that state, it asks once: leave the task as it is, or confirm it and open the PR. An edit after `ready` puts the task back to `working`.

The rest of the rules:

- **One branch per task**, created locally. The test is "would a reviewer expect this change in the same pull request as the branch's task summary?" Same task: stay. Depends on unmerged work: stacked branch. Anything else: a new branch from `origin/<default>`.
- **Dirty work is stashed with a label**, never committed as work-in-progress, and restored when you return to that task.
- **Atomic commits.** The agent commits when a slice is green, stages by path, checks the staged diff, aims for about 100 lines, writes conventional messages, and never rewrites history.
- **Autonomy.** The agent never blocks on you for reversible implementation steps. The only human gates are spec approval, your done-confirmation, push and PR, and irreversible or outward-facing actions.

## Commands

You can say everything in plain words; the commands just run one step at a time.

| Command | Does |
|---|---|
| `/task <request>` | intake: states the tier, decides and creates the branch; does not start the work |
| `/spec <idea>` | grill, write the spec issue, stop for approval |
| `/plan` | write the plan for the approved spec and pick the executor |
| `/build` | build the plan task by task (subagent-driven or inline) |
| `/review [high-risk]` | two-axis code review with fixes and scoped re-review |
| `/ship` | verify, review, set `ready`, report, stop (does not push) |
| `/done` | your confirmation: sets `confirmed`, then `finish-task` pushes and opens the PR |
| `/next` | resume from the live state; continue the plan or take the next ticket |
| `/retro` | retrospective on the session (needs the `retro` skill enabled) |

`/review` shadows opencode's built-in `/review` command.

## Guardrails

Two layers. The static `permission.bash` rules in `opencode.json` work on both flavors. The plugin adds rules that depend on the task state, through `tool.execute.before` (V1) and `ctx.tool.hook("execute.before")` (V2). A blocked call throws, and the model sees the reason.

| Blocked | Unless |
|---|---|
| `git push` of anything | state is `confirmed`, you are on the task branch, and it is a plain push of that branch |
| force, mirror, delete or tag pushes; `--no-verify` anywhere | never |
| `git add -A`, `git add .`, `git add -u`, `git commit -a` | never (stage by path) |
| `git commit --amend`, `rebase`, `reset --hard`, `clean -f`, branch deletion, `filter-branch` | never |
| commits or edits on the default branch | never (`.workflow/` is exempt) |
| `git commit` while the project's verify commands fail | never (the gate runs your test, typecheck and lint from `AGENTS.md`; a tree that already passed is not re-run) |
| `gh pr create` | state is `confirmed` |
| `gh pr merge`, `pr close`, `issue close`, `issue develop`, `repo delete`, destructive `gh api` | never |
| setting a task to `confirmed` | your latest message says done, "open the PR", or comes from `/done` |
| editing `.workflow/task.json` by hand | never (use the `task-state` script) |

The guardrails parse shell commands as text. They are a safety net for an agent, not a security boundary: a determined shell trick can get around a text check. Read the diff before you merge.

## Agents

Four subagents, all running on your session's model. None can dispatch further subagents.

| Agent | Role | Can edit |
|---|---|---|
| `planner` | explores the code, grounds designs, drafts specs and plans | only `.workflow/` |
| `implementer` | builds one plan task or fix, test-first, commits green slices | yes |
| `reviewer` | fresh-context, read-only review of a diff, spec or decision | only `.workflow/review/` |
| `verifier` | runs the checks and reports evidence | only `.workflow/verify/` |

## Skills

47 skills, merged from four skill collections so that each topic has one winner. **30 are visible by default**; **17 are hidden** until you enable them. A hidden skill cannot be loaded at all, even by another skill.

### Visible by default

| Group | Skills |
|---|---|
| Spine | `workflow` (the entry point and router), `setup-workflow`, `branch-per-task`, `atomic-commits`, `finish-task`, `handoff` |
| Think and specify | `grilling`, `domain-modeling`, `spec` |
| Plan and build | `writing-plans`, `using-git-worktrees`, `tdd`, `incremental-implementation`, `subagent-driven-development`, `executing-plans`, `dispatching-parallel-agents` |
| Debug and verify | `debugging`, `verification-before-completion` |
| Review and ship | `code-review`, `receiving-code-review`, `doubt-driven-development`, `pr` |
| Craft | `correct`, `context-engineering`, `unslop`, `principles`, `typescript-best-practices`, `python-best-practices` |
| Understand | `how`, `why` |

### Optional (hidden until enabled)

| Group | Skills |
|---|---|
| Large efforts | `to-tickets`, `wayfinder` (needs `research` and `prototype`) |
| Exploration | `research`, `prototype`, `architect`, `codebase-design`, `blast-radius` |
| Quality of the repo | `create-verification-skill`, `retro` (needs `writing-for-agents`), `reflect`, `writing-for-agents`, `show-me-your-work` |
| Specialist | `security-and-hardening`, `performance-optimization`, `api-and-interface-design`, `ci-cd-and-automation`, `shipping-and-launch` |

Enable some with the installer:

```bash
~/branchwright/install.sh --project . --enable wayfinder,security-and-hardening
```

Dependencies come along (`wayfinder` brings `research` and `prototype`). Re-run without `--enable` to hide them again; a plain `"allow"` you wrote yourself in `permission.skill` is kept. `tdd` carries its own short `seams.md`, so it works without `codebase-design`.

## Install options

```bash
install.sh [--project DIR | --global] [--flavor v1|v2|auto] [--enable skill,skill]
```

What it does: copies `.opencode/agents` and `.opencode/commands` into the target; adds the plugin to `opencode.json` (key `plugins` on V2, `plugin` on V1, detected from `opencode --version`); hides the 17 optional skills; adds the static git deny rules. Existing keys are kept.

**Per project** (default): installs into `<project>/.opencode/` and `<project>/opencode.json`. Commit them to share with a team, or leave them untracked.

**Global:** `--global` installs into `~/.config/opencode`, so the guardrails apply in *every* git repo you open: edits on the default branch are blocked and pushes need a confirmed task, even in repos you never set up. Before a global install:

- Copy the folder to a path without spaces (for example `~/branchwright`). The installer stores the path it runs from.
- If your global config is `opencode.jsonc`, the installer refuses to rewrite it (comments would be lost). Merge `opencode.template.json` into it by hand: the plugin path under `"plugins"` (V2) or `"plugin"` (V1), and the `permission` block.
- Remove other workflow plugins (for example superpowers) from the config. Two bootstraps compete.
- Back up `~/.config/opencode` first.

**Manual:** V2: `"plugins": ["/absolute/path/to/branchwright"]` (the directory, not a file). V1: `"plugin": ["/absolute/path/to/branchwright"]`. The plugin registers the skills; copy `.opencode/agents` and `.opencode/commands` yourself.

## Configuration

- **`AGENTS.md`, `## Commands`.** One table that the commit gate, `verification-before-completion` and `run-verify` all read. A command of `-` means the repo has none:

  ```markdown
  ## Commands

  | Purpose | Command |
  |---|---|
  | test | pytest -q |
  | typecheck | pyright |
  | lint | ruff check |
  | format | - |
  | build | - |
  ```
- **`docs/agents/issue-tracker.md` and `docs/agents/domain.md`.** Written by `setup-workflow`; they tell the skills how to use `gh` and where the glossary and ADRs live.
- **`.workflow/`** (git-excluded through `.git/info/exclude`): `task.json`, `plans/`, `sdd/` (build ledgers), `review/`, `handoff/`, `spec.md`, `pr-body.md`.
- **`opencode.json`:** `permission.skill` hides optional skills; `permission.bash` holds the static git deny rules. Edit them like any other opencode permission.

## Troubleshooting

- **The agent edits `main` anyway / guardrails never fire.** Check the plugin loaded: `plugins` (V2) or `plugin` (V1) in `opencode.json` must point at this folder, and opencode must have been restarted.
- **Scripts fail with "no such file".** The install path contains spaces. Move the folder to a path without spaces and reinstall.
- **`/review` runs the built-in review.** Check `.opencode/commands/review.md` exists in the project (or `~/.config/opencode/commands` for global).
- **A skill that should be hidden loads, or the wrong copy of a skill loads.** You may have global skills with the same names (`code-review`, `grilling`, `domain-modeling`, `codebase-design`). Remove or rename the older copies.
- **A hidden skill is needed.** Enable it with `--enable` (dependencies included).
- **Commit blocked: "verify commands failed".** The gate ran your `## Commands`; fix the failure it printed, or run `scripts/run-verify` from the `workflow` skill yourself.
- **PR not opened: "gh is not authenticated".** Run `gh auth login`. Nothing is pushed when this check fails, and the task stays `confirmed`.

## Status and limits

Verified live on opencode 2.0.23 (V2), with the free default model, in a real private GitHub repo: setup, a Tier 1 bug fix, an unrelated request with a dirty tree, going back to stashed work, a ready task left unconfirmed, confirm-then-PR, and a Tier 2 feature from spec to an open PR with `Closes #N`. Guardrail blocks were also verified live. Results and what broke are in [`docs/RESULTS.md`](docs/RESULTS.md).

Not verified:

- **V1** (opencode 1.x): covered only by mock-host tests and the V1 type definitions, never run on a real V1 install.
- **Tier 3** (`wayfinder`, `to-tickets`) and the optional skills: checked structurally, never run by an agent.
- **Interactive use:** human answers to the spec and the "ask once" question were simulated in headless runs.
- **Skill name collisions** with your own global skills: which copy loads was not determined.

## Development

```bash
node tools/validate-skills.mjs --complete   # frontmatter, links, set membership, dependencies, scripts
bash tests/spine.test.sh                    # git flows, task state, finish-task (scratch repos)
bash tests/review-package.test.sh
bash tests/sdd.test.sh
bash tests/install.test.sh
node --test tests/plugin.test.mjs           # parser, guard rules, V1 and V2 entry points on mock hosts
```

Layout:

```
skills/                 47 skills (SKILL.md plus sibling references and scripts)
.opencode/plugins/      workflow.js (V1 and V2 entry), lib/ (shell parser, guard rules, git helpers)
.opencode/agents/       planner, implementer, reviewer, verifier
.opencode/commands/     task spec plan build review ship done next retro
opencode.template.json  the permission rules install.sh merges
install.sh              installer
index.js                directory-form entry for V2
tools/                  validate-skills.mjs, skillset.json (the 47-skill manifest)
tests/                  shell and node tests
docs/AUDIT.md           how the four source collections were curated
docs/RESULTS.md         end-to-end test results
```

Skills follow one shape: `SKILL.md` stays short, with a completion criterion on each step; reference material lives in sibling files. Scripts are syntax-checked with `bash -n` and exercised in scratch repos.

## License and credits

[MIT](LICENSE), Copyright (c) 2026 Pasindu Lanka.

Branchwright adapts ideas, structure and some text from four MIT-licensed skill collections: **superpowers** (Jesse Vincent), **pstack** (Lauren Tan), **agent-skills** (Addy Osmani) and **skills** (Matt Pocock). Their copyright notices are in [`NOTICE`](NOTICE), and [`SOURCES.md`](SOURCES.md) lists which skill draws on which. The `pr` skill's summary-visuals menu comes from Dex Horthy's `show-me` skill.
