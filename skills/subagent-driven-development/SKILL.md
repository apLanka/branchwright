---
name: subagent-driven-development
description: Execute an implementation plan by dispatching a fresh implementer subagent per task, with a spec-and-quality review after each task and a whole-branch review at the end. Use when a plan exists, the tasks are mostly independent, and a subagent tool is available.
---

# Subagent-driven development

Fresh implementer per task, review per task, broad review at the end. The controller (you) coordinates and keeps context clean; subagents carry the code. Everything crosses between you and them as **files**, not pasted text.

**Continuous execution.** Do not pause between tasks. Stop only for: an irreversible or destructive operation; a security-sensitive action; a side effect outside this worktree that needs asking first (a merge, a push, a publish); a plan so broken that every path forward is a guess.

**Rulings, not stalls.** Conflicts, ambiguities, plan defects: decide. The spec is the binding authority, the plan is its argument. Record `Ruling: <what> — <why> — <cost if wrong>` in the ledger and keep going. They are listed at the end for the user.

## Setup

1. Work in the task's branch or worktree (`using-git-worktrees`); never on the default branch.
2. **Workspace and ledger.** `scripts/sdd-workspace <plan>` prints `.workflow/sdd/<plan>/`. The ledger is `progress.md` there; its first line is `# SDD ledger — plan: <plan path>`. Tasks with a `Task <N>: complete` line are done: resume at the first without one. After a context reset trust the ledger and `git log`, not memory. `executing-plans` shares this ledger, so a plan can switch executors mid-way.
3. Read the plan and its spec once. Create a todo per task (or a checklist in the ledger when no todo tool exists).
4. **Pre-flight scan.** Write a table to the ledger: one row per pair of tasks sharing a file or interface (what one produces, what the other consumes, finding) and one row per task (does its own text agree: tests against code, files created against files touched). Rule on every conflict before Task 1. Done when the table is in the ledger.

## Per task

1. **Record BASE** (`git rev-parse HEAD`). Make the brief: `scripts/task-brief <plan> <N>`. Done when it prints the brief path.
2. **Dispatch the implementer** with [implementer-prompt.md](implementer-prompt.md): one line on where the task fits, the brief path ("read this first, it holds the exact values"), interfaces from earlier tasks the brief cannot know, your rulings on any ambiguity, the report-file path (`task-<N>-report.md` beside the brief). No pasted history, no accumulated summaries. One implementer at a time. Record its identity for resuming.
3. **Read its status:** `DONE` go to review. `DONE_WITH_CONCERNS`: address correctness or scope concerns first, note observations. `NEEDS_CONTEXT`: supply it and re-dispatch. `BLOCKED`: add context, split the task, or rule on the plan defect; never re-dispatch unchanged.
4. **Review the task.** `code-review/scripts/review-package BASE` writes the diff. Dispatch a fresh read-only reviewer with [task-reviewer-prompt.md](task-reviewer-prompt.md): brief, report, diff, and the spec's binding constraints verbatim. It returns two verdicts (spec compliance, quality). Do not pre-judge findings for it.
5. **Fix loop, at most 3 rounds** when spec fails or any Critical or Important finding stands:
   - Minor findings go to the ledger as `Task <N>: minor (deferred): <one-liner>`; they never enter the loop.
   - A finding that conflicts with the plan text is yours to rule on, recorded before acting.
   - Rounds 1-2: resume the implementer with the open findings verbatim. Round 3: a fresh implementer (same model) with the brief, the report file and the findings: "a prior implementer tried twice; read the report file."
   - Every round: fix, re-run covering tests, append a fix report (what changed, tests, command, output), then a scoped re-review ([re-review prompt](../code-review/re-review-prompt.md)) on `review-package <previous-head>`.
   - Append `Task <N>: fix round <R>/3 (<X> addressed, <Y> open; commits a..b)`.
   - After round 3, adjudicate each open finding: park it (`Task <N>: parked — <finding> — Ruling: <why>`) or, when load-bearing for later tasks, rule on the smallest change that unblocks them and carry it into the next dispatch.
   You never fix findings in the controller session: that skips review and fills your context.
6. **Complete.** Append `Task <N>: complete (commits <base7>..<head7>, review clean)` (or `<K> parked`). Mark the todo done.

Batch same-shape edits (the same one-line change across files) into one dispatch and review them as one diff.

## Final review

`review-package <merge-base>`; run the `code-review` skill on the whole branch (two axes, high-risk mode when it applies), pointing it at the ledger's deferred minors and parked findings. Fix with ONE implementer dispatch holding the whole findings list, then one scoped re-review. Residual findings are adjudicated with rulings.

## Finish

Collect every `Ruling:` line from the ledger into your final report under "Rulings I made", in order, each with its cost-if-wrong. The list is exhaustive; it is how the user learns what you decided for them. Then delete the plan's workspace (`rm -rf .workflow/sdd/<plan>`); git history is the record. Continue with `verification-before-completion`, then set the task `ready`.

## Rationalizations

| Excuse | Reality |
|---|---|
| "Close enough on the spec" | A reviewer found a gap, so it is not done: fix it or adjudicate after round 3. |
| "I will fix it myself, dispatching is overhead" | Controller fixes pollute your context and skip review. |
| "One more round will converge" | Past the cap the failure is structural: adjudicate. |
| "The finding is obviously wrong" | Adjudicate only at the cap, and every ruling is a ledger line. |
| "The fix was small, skip the re-review" | Unreviewed fixes are how regressions land. |
| "The implementer can spawn its own reviewer" | That duplicates the task review and counts for nothing. |
| "Ledger bookkeeping is overhead" | The ledger survives a context reset; memory does not. |
