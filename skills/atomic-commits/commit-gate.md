# Commit gate

The workflow plugin runs the project's verify commands before any `git commit` the agent issues. This file says what the gate expects.

## What runs

`run-verify` reads `AGENTS.md` → `## Commands` and runs, in order: `typecheck`, `lint`, `test`. A row with `-` is skipped. The gate blocks the commit when a command fails and shows the last 40 lines of its output.

## Reading a failure

1. Read the first failing line of the output, not the last.
2. Fix the cause in the slice you are committing. Re-run `scripts/run-verify` yourself until it passes.
3. Stage again and re-run `scripts/staged-check`; a fix often touches a file that was not staged.

## When the gate cannot run

- `AGENTS.md` has no `## Commands` table: run `setup-workflow`, or run the project's test command by hand and state which command you ran.
- A command is slow (full end-to-end suite): list the fast checks under `typecheck`, `lint`, `test` and put the slow one under a purpose the gate ignores (for example `e2e`); run it at `verification-before-completion`.

## What the gate does not do

It does not stage files, edit messages, or decide slice size. Those stay in the `atomic-commits` steps.
