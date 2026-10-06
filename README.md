# Branchwright

A workflow plugin for [opencode](https://opencode.ai) that makes a coding agent work like a careful engineer: it sizes the task, gives it its own branch, writes the spec as a GitHub issue and waits for your approval, builds test-first in small commits, reviews its own work with fresh eyes, and then **stops** until you say it is done. Only then does it push and open the pull request.

It ships 47 skills, guardrails that enforce the rules instead of asking nicely, four subagents, nine slash commands and an installer. One plugin works on opencode V1 (1.x) and V2 (2.0.4 or later).

Built for TypeScript and Python projects, one model, GitHub through `gh`.

- [Quick start](#quick-start)
- [How to use it](#how-to-use-it)
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

**Let your agent install it (global).** Once the repo is public, tell opencode:

> Fetch and follow instructions from https://raw.githubusercontent.com/apLanka/branchwright/refs/heads/main/.opencode/INSTALL.md

The agent checks the prerequisites, asks you to confirm a global install, clones the repo to `~/.local/share/branchwright`, backs up your opencode config, runs the installer (or merges the settings into an `opencode.jsonc` by hand), and tells you to restart. The instructions are in [`.opencode/INSTALL.md`](.opencode/INSTALL.md).

**Or install it yourself, into one project:**


You need `git`, `bash`, `python3` and [`gh`](https://cli.github.com) (logged in) on your PATH, and opencode V1 1.x or V2 2.0.4+.

```bash
git clone git@github.com:apLanka/branchwright.git ~/branchwright
~/branchwright/install.sh --project /path/to/your/repo
```

Restart opencode in that project, then say:

> Set up the workflow for this repo.

The agent reads your repo, writes the test, typecheck and lint commands into `AGENTS.md`, creates the GitHub docs under `docs/agents/`, creates the `ready-for-agent` label, and git-excludes the `.workflow/` state folder. That is the whole setup. From then on, just describe what you want:

> Create a referral code system for this website.

## How to use it

You talk to the agent normally. Branchwright decides how much process the request needs, and the agent only stops for you at a few fixed points. Your job is small: describe what you want, answer the questions it asks, approve the spec, and say "done" when you are satisfied.

### The four things you do

| When | What you do | What to say |
|---|---|---|
| Starting | describe the work in plain words | "Add a dark mode toggle." / "Login fails when the email has a plus sign." |
| The agent asks questions (features) | answer the decisions; say "your call" for any you don't care about | "Codes expire after 30 days. Self-referral is not allowed. Your call on the rest." |
| The agent publishes the spec | read the issue, then approve or ask for changes | "Approved." / "Change: reward is 10 credits, not 5." |
| The agent reports `ready` | look at the result, then confirm | "Done, open the PR." / `/done` |

Everything between those points runs without you.

### Words that matter

Two of your messages are special, because the guardrails read them:

- **Approving the spec.** Any clear approval works ("approved", "go ahead"). Until you approve, the agent builds nothing.
- **Confirming the task.** Say "done", "open the PR", "ship it", "lgtm", "looks good" or "confirmed", or use `/done`. A message like "thanks" or "ok" does **not** confirm. The check is a plain keyword match on your latest message, so while a task is `ready` avoid using those words in other senses ("not done yet" would count as "done"). If you are unsure, use `/done`: it always counts.

### Example 1: a feature

The conversations below are illustrative: the real wording varies, and a real site will produce more questions and a longer build.

> **You:** Create a referral code system for this website.
>
> **Agent:** Tier 2: referral code system. *(creates a branch and a worktree, reads your signup and user code)*
> Round 1 of questions:
> Q1 – Who gets a code: every user at signup, or on request? *Recommended: every user at signup.*
> Q2 – What does a successful referral earn, and who receives it? *Recommended: the referrer, a fixed credit.*
> Q3 – Do codes expire or have limits? ...
>
> **You:** Q1 signup. Q2 referrer gets 10 credits. Q3 no expiry, max 50 uses. Self-referral not allowed.
>
> **Agent:** *(asks any follow-ups the answers raised, then writes the spec)* Spec published: issue #12. Branch renamed to `feat/12-referral-codes`. Summary: problem, solution, the test points, boundaries, success criteria, two open questions with defaults. Approve, or tell me what to change.
>
> **You:** Approved.
>
> **Agent:** *(plans, builds task by task, reviews, verifies)* Ready. Built the code model, the signup hook and the redemption endpoint; 31 tests pass, typecheck and lint clean. Rulings I made: (1) code format is 8 uppercase characters; (2) redeeming a used-up code returns 409. Nothing is pushed. Say "done" to open the PR.
>
> **You:** Done, open the PR.
>
> **Agent:** PR opened: github.com/you/site/pull/13 (`Closes #12`).

Then you review the PR on GitHub, merge it, and the issue closes.

### Example 2: a bug

> **You:** Checkout crashes when the cart has an item with no price.
>
> **Agent:** Tier 1: bug in checkout. *(new branch `fix/checkout-missing-price`)* Reproduced it with a failing test: a cart with a priceless item raises `TypeError`. Cause: `total()` assumes every item has a price. Fixed at the source, not with a try/except; the test passes, the suite is green. Committed as `fix(checkout): handle items without a price`. Ready, nothing pushed.
>
> **You:** `/done`
>
> **Agent:** PR opened.

There was no spec and no approval step: a bug is small enough to go straight to the fix.

### Example 3: switching tasks in the middle

You are halfway through a feature when you think of something else.

> **You:** Unrelated, but fix the typo "recieve" in the README.
>
> **Agent:** Tier 0: README typo. This is not part of the referral work, so I'm starting a new branch from `main` and stashing your half-done changes as `feat/12-referral-codes: ...`. *(fixes, commits, `ready`)*
>
> **You:** Good, now go back to the referral work.
>
> **Agent:** *(restores the stash and the task, continues)*

Your unfinished work is never lost or committed half-finished. If the earlier task was `ready` and you had not confirmed it, the agent asks once whether to leave it or confirm it first.

### Example 4: a big project

> **You:** We need a full subscription billing system: plans, invoices, trials, webhooks.

This is Tier 3: too big for one branch. With the optional `to-tickets` skill enabled (`install.sh --enable to-tickets`), the agent writes a capability map for you to approve (billing plans, invoices, trials, webhooks, and their build order), publishes one spec per part, splits each into tickets on GitHub, and then runs each ticket as its own Tier 2 task on its own branch and PR. Use `/next` to pick up the next ticket, and `handoff` when a session gets long. (The Tier 3 flow has not been run by an agent yet; see [Status and limits](#status-and-limits).) For a vague, foggy idea ("rebuild our onboarding"), enable `wayfinder` as well.

### Everyday phrases

| You want | Say |
|---|---|
| start something without building yet | `/task <request>` |
| only the spec, no build | `/spec <idea>` |
| see where things stand | "What's the status?" or `/next` |
| a more careful review | "Review this as high-risk" or `/review high-risk` |
| change the spec after approval | "Change the spec: ..." (the agent updates the issue first, then the code) |
| fix something after `ready` | just ask; the task goes back to `working` and the agent re-verifies |
| continue yesterday's work | "Continue where we left off" or `/next` |
| stop without a PR | say nothing; a `ready` task is never pushed |
| not interested in a question | "Your call" (it records the choice as a Ruling) |

### Reading what the agent reports

- **Tier line.** The first thing it writes. If it is too low or too high for the job, say so ("this is bigger than a bug fix") and it moves up.
- **`Ruling:` lines.** Decisions it made for you because you were not asked. Each has a reason and a cost if wrong. Skim them: if you disagree, tell it and it reworks that part.
- **Evidence.** Test counts and command output, not "should work". If a claim has no command output behind it, ask for it.
- **Status.** `ready` means built, verified and reviewed, waiting for you. Check it any time with `.workflow/task.json` in the repo, or ask.

### What the agent will not do

It will not push before you confirm, force-push, rewrite history, stage everything with `git add -A`, skip hooks, or edit and commit on `main`. If you ask it to, it explains and tells you what to do yourself. Merging, closing issues and deleting branches are always yours.

### Tips

- Say what you want, not how to build it. The questions will pull out the rest.
- For features, answer the questions in one message; the agent asks the whole open set each round.
- Keep your test, typecheck and lint commands correct in `AGENTS.md`: the commit gate and every "verified" claim rely on them.
- Review the PR diff before merging, as you would a colleague's. The guardrails are a safety net, not a guarantee.
- One chat can hold several tasks, but one branch holds one task: unrelated requests get their own branch automatically.

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
