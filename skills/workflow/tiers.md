# Tier reference

Pick the tier from what the change needs, not from how it was phrased.

## Tier 0: edit, verify, commit

One file, no behavior change: typo, comment, rename inside one file, config value with no runtime effect, formatting.

1. Edit.
2. Run the verify commands (`scripts/run-verify`). Done when every configured command prints PASS.
3. Commit with `atomic-commits`. Set `ready`, report, stop.

Move up to Tier 1 when the edit changes what the program does.

## Tier 1: bug or small change

A bug fix, or a change inside one module with a clear target and no new design decision.

1. Bug: load `debugging`; build the feedback loop, find the cause. Small change: restate the target in one sentence.
2. Load `tdd`. Write the failing test at the highest seam that reaches the behavior, make it pass.
3. Verify (`verification-before-completion`), commit slices (`atomic-commits`).
4. Set `ready`, report, stop.

Move up to Tier 2 when you find yourself choosing between designs, adding a public interface, or touching several modules.

## Tier 2: feature

New capability, or a change with design decisions.

1. `grilling` with `domain-modeling` until the frontier is empty. Read the code first; ask the user only for decisions.
2. `spec`: publishes the issue, renames the branch with the issue number, stops for approval. The user's approval is the gate.
3. After approval: `writing-plans` (saved in `.workflow/plans/`), then `using-git-worktrees`.
4. Build with `subagent-driven-development` (a subagent tool exists and tasks are independent) or `executing-plans`. Both use `tdd` and `atomic-commits`.
5. `code-review`, fix findings, `verification-before-completion`.
6. Set `ready`, report, stop.

## Tier 3: several sessions

More than one session can hold, or several independent capabilities.

1. Foggy destination: `wayfinder`. Clear destination, many parts: a capability map inside `spec`.
2. `to-tickets`: each ticket is one issue with blocking edges.
3. Each ticket runs as Tier 2 on its own branch (its own task, its own PR).
4. `handoff` at every session boundary; `handoff` resume mode at the start of the next session.

## Tier never moves down

If a task looks smaller after more reading, keep the tier and take the shorter path inside it; the tier records the risk you took on.
