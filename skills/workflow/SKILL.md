---
name: workflow
description: Entry point for every coding request. Use at the start of any task, before reading code or editing. Sets the tier (0-3), decides the branch, and routes to the skills that build, review and ship the change.
---

# Workflow

Every request runs this intake before any edit. The process scales with the size of the task: a typo takes four steps, a feature takes the full chain.

Scripts live in `scripts/` next to this file (call them by the absolute path of this skill's directory).

## Intake

1. **Read the state.** Run `branch-decide` (in the `branch-per-task` skill). Done when you have the git state and any `task.json` printed.
2. **Resolve a pending task.** When `task_state=ready` and the new request is unrelated, ask once: "Leave `<branch>` as it is, or confirm it and open the PR?" Wait for the answer. Done when the previous task is left, or the user confirms it.
3. **Set the tier** from the table below and say it in one line as the first text you write, before reading code or editing: `Tier 1: bug in the date parser.` A tier only moves up. Done when the line is written.
4. **Decide the branch.** Load the `branch-per-task` skill and follow it (use its `branch-new` script, which also writes `task.json`; plain `git checkout -b` does not). Done when you are on the task's branch and `task.json` shows the tier.
5. **Follow the tier path.** Load each named skill (`debugging`, `tdd`, `atomic-commits`, `verification-before-completion`, ...) with the skill tool when its step starts, not before and not from memory.

## Tiers

| Tier | Task | Path |
|---|---|---|
| 0 | One-file edit, no behavior change | edit, verify (`verification-before-completion`), commit (`atomic-commits`) |
| 1 | Bug or small change | `debugging` for bugs, `tdd`, fix, verify (`verification-before-completion`), commit (`atomic-commits`) |
| 2 | Feature | `grilling` (+ `domain-modeling`), `spec`, **user approval**, `writing-plans`, `using-git-worktrees`, `subagent-driven-development` or `executing-plans` (with `tdd`, `atomic-commits`), `code-review`, verify |
| 3 | Several sessions or several independent capabilities | `wayfinder` or a capability map in `spec`, `to-tickets`, then each ticket runs as Tier 2 on its own branch; `handoff` between sessions |

Pick the lower tier when two fit; move up the moment the work shows more scope (a "bug" that needs a design decision is Tier 2). Details and examples: [tiers.md](tiers.md).

`to-tickets` and `wayfinder` are optional skills; if they are not listed, tell the user to enable them (see `setup-workflow`).

## Task states

`working` then `ready` then `confirmed` then `pr-open`, stored in `.workflow/task.json`. Change state only with `scripts/task-state transition <state>`.

- **ready.** Set when verification and review are done. Report what was built and how it was verified, then **stop**. Do not start another task, push, or open a PR until the user says so.
- **confirmed.** Set only when the user explicitly says done or "open the PR". Then run the `finish-task` skill.
- **pr-open.** Set by `finish-task`. Merge, issue close and branch deletion stay with the user.

## Human gates

Stop and wait for the user at exactly these points:

- spec approval (Tier 2 and 3)
- the done-confirmation that moves `ready` to `confirmed`
- push and PR (only after `confirmed`)
- irreversible or outward-facing actions: force-push, deleting data or branches, publishing, messages to other people, spending money

Everything else is reversible: decide, act, report. When a choice is open, pick one, record `Ruling: <what> — <why> — <cost if wrong>` in the ledger or the final report, and continue. "No" is an acceptable answer to a request that does not earn its place; say so with the reason.

## Operating habits

- State assumptions before acting on an ambiguous request; correct them in one line when the user redirects.
- Run the project's commands from the `## Commands` table in `AGENTS.md` (`scripts/project-commands`); the table is the one source for test, typecheck and lint.
- Claims of success carry command output (`verification-before-completion`).
- Keep the diff to what the task needs; note unrelated problems in the report instead of fixing them.

## Skills that are not listed

Some skills are hidden until enabled (`to-tickets`, `wayfinder`, `architect`, `retro` and others). When a step names one that is missing, say which skill would help and continue with the closest visible one.
