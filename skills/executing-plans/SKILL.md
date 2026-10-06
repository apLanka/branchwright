---
name: executing-plans
description: Execute an implementation plan yourself, task by task, in this session with one whole-branch review at the end. Use when no subagent tool is available, the tasks are tightly coupled, or inline execution is cheaper than a subagent per task.
---

# Executing plans

You implement every task; one fresh-context review of the whole branch comes at the end. What per-task subagents would buy, this skill keeps by other means: the brief is the spec, the ledger is your memory, TDD is the per-task gate, the final reviewer is the second pair of eyes.

**Continuous execution.** No check-ins between tasks. Stop only for: an irreversible or destructive operation; a security-sensitive action; a side effect outside this worktree that needs asking first (a merge, a push, a publish); a plan so broken that every path forward is a guess.

**Rulings, not stalls.** Conflicts, ambiguities and plan defects are yours to decide, the spec being the binding authority. Record `Ruling: <what> — <why> — <cost if wrong>` in the ledger before acting; deviating from the plan without a ruling is a decision made in secret.

## Setup

1. Work in the task's worktree (`using-git-worktrees`), never on the default branch.
2. **Workspace and ledger** shared with `subagent-driven-development`: `subagent-driven-development/scripts/sdd-workspace <plan>` prints `.workflow/sdd/<plan>/`. If `progress.md` there starts with your plan's path, tasks with a `Task <N>: complete` line are done; resume at the first without one. Trust the ledger and `git log` over memory after a context reset. Otherwise create it with first line `# SDD ledger — plan: <plan path>`.
3. Read the plan and its spec once; create a todo per task (or a checklist in the ledger).
4. Run the same pre-flight conflict scan as `subagent-driven-development` (table in the ledger, rulings before Task 1).

## Per task

1. `scripts/task-start <plan> <N>` prints the brief path and BASE. Read the brief; it is your requirements. Done when you have both.
2. Work the steps in order with `tdd`, running every verification and reading every output. A step output that differs from the plan's Expected: a code bug goes to `debugging`; a plan bug gets a ruling.
3. Commit as the plan's commit steps say, with `atomic-commits`.
4. `scripts/task-done <plan> <N> <BASE> -- <focused test command>` runs the tests, keeps the log, and appends the completion line only if they passed. Mark the todo done.

## Final review and finish

1. `code-review` on the whole branch (a fresh read-only subagent per axis; when no subagent tool exists, review the diff yourself in two passes, Standards then Spec, after a break from the code: re-read the spec first).
2. Fix Critical and Important findings in one pass, each red-then-green with a green suite; Minor ones go in the report. Cap of 3 re-review rounds.
3. List every `Ruling:` line from the ledger in your final report under "Rulings I made". Delete the plan's workspace (`rm -rf .workflow/sdd/<plan>`).
4. `verification-before-completion`, then set the task `ready`.

Prefer `subagent-driven-development` when a review gate on every task matters, or when the plan is long enough that its later tasks would run on a compacted context.
