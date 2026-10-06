---
name: incremental-implementation
description: Build a change in thin vertical slices that each leave the project working. Use when implementing any multi-file change or a feature from a plan, or whenever you are about to write more than about 100 lines before running anything.
---

# Incremental implementation

Implement one slice, prove it, commit it, then expand. Every slice leaves the project building and its tests green.

## The cycle (per slice)

1. **Choose the slice.** The smallest piece that works end to end (a path through every layer it touches), shaped by the plan task or spec story. Done when you can state in one line what a user or caller can do after it.
2. **Implement it test-first** with `tdd`.
3. **Verify** with the focused tests, then `scripts/run-verify` (workflow skill) for typecheck, lint and test. Done when all pass. Re-run a command only after the code changed.
4. **Commit** with `atomic-commits`.
5. **Next slice**, carrying forward what you learned; do not restart.

## Choosing slice order

- **Vertical (default):** create, then list, then edit, then delete, each end to end.
- **Contract first:** when two sides develop in parallel, slice 0 defines the types or interface, then each side builds against it, then integrate.
- **Risk first:** put the least certain piece first, so a dead end shows before the rest is built on it.

## Rules

- **Simplest thing that works.** Three similar lines beat a premature abstraction. Build the naive, obviously correct version first; optimize only with a test that proves the need.
- **Scope discipline.** Touch only what the task needs: no adjacent cleanup, import shuffling, or modernizing files you only read. Note what you saw ("noticed, not touching: ...") in the report instead.
- **One thing per slice and per commit.** A refactor and a feature are separate commits.
- **Keep it compilable.** No red state between slices.
- **Unfinished user-visible work** merges behind a flag that defaults to off.
- **Safe defaults.** New behavior is conservative and opt-in.
- **Revertable.** Additive changes are easy to revert; replace in a later commit than the one that deletes. Migrations come with a rollback.

## Checklist after each slice

- [ ] One logical change, complete
- [ ] Existing tests pass; typecheck and lint pass
- [ ] The new behavior works (output seen, not assumed)
- [ ] Committed

| Excuse | Reality |
|---|---|
| "I will test it all at the end" | A bug in slice 1 makes slices 2 to 5 wrong. |
| "All at once is faster" | Until something breaks and one of 500 lines is the cause. |
| "Too small to commit alone" | Small commits are free; big ones hide bugs. |
| "This refactor is small enough to include" | Mixed commits are harder to review and revert. |
