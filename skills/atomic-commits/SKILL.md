---
name: atomic-commits
description: Commit as you build, one green slice at a time. Use whenever code is ready to commit - after each passing test cycle or finished step - to stage precisely, check the staged diff, and write a conventional message.
---

# Atomic commits

A commit is one logical change that leaves the project green. Commit when a slice is done, not at the end of the task.

## The commit step

1. **Verify green.** Run `scripts/run-verify` from the `workflow` skill (typecheck, lint, test from the `## Commands` table in `AGENTS.md`). Done when it prints PASS for every configured command. If it exits 3, no commands are configured: run the project's own test command and say so.
2. **Stage precisely.** `git add <file>` or `git add -p` for exactly this slice. Done when `git status` shows nothing staged that belongs to another slice.
3. **Check the staged diff.** Run `scripts/staged-check`, then read `git diff --staged`. Done when staged-check exits 0 and the diff holds only this slice (no debug output, no unrelated edits).
4. **Commit** with a conventional message:
   ```
   <type>(<scope>): <imperative summary, under 72 chars>

   <why this change, when the diff does not say it>
   ```
   Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`. Reference the issue in the body (`Refs #N`) when one exists.
5. **Confirm.** `git log -1 --stat`. Done when the commit holds the files you meant.

## Size and shape

- Aim for about 100 changed lines. Past 150, check it is one logical change; past 300, split.
- A test and the code that makes it pass go in the same commit (`tdd` slice = one commit). Refactors are their own commits, made while green.
- Mechanical sweeps (renames, formatting) go in their own commit, separate from behavior changes.
- Each commit builds and passes on its own, so a reviewer can read the branch commit by commit.

## Rules

- Stage by path. Never `git add -A` or `git add .`.
- Never `--no-verify`. When a hook fails, fix the cause and make a new commit.
- Never rewrite history (`--amend`, rebase, `reset --hard` over commits). A mistake gets a new commit.
- Never commit `.workflow/`, `.env`, keys, or generated output; `staged-check` stops the common cases.
- A red slice stays uncommitted. Fix it or `git stash` it with a label; do not commit work-in-progress.

Commit-gate details (what the plugin enforces, how to read a failure): [commit-gate.md](commit-gate.md).
