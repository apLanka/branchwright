---
description: Build the plan task by task, test-first, committing green slices
---
Build the plan: $ARGUMENTS

Use the plan path given, or the newest plan in `.workflow/plans/`. Work in the task's worktree (`using-git-worktrees`).

Use `subagent-driven-development` when a subagent tool exists and the tasks are mostly independent; otherwise `executing-plans`. Both run `tdd` and `atomic-commits`, share one ledger in `.workflow/sdd/`, and do not pause between tasks: decide, record `Ruling:` lines, and keep going.

At the end run `/review`'s steps, then the `verification-before-completion` checks. Do not push.
