# 5. Shared state and retries

**Separate before serializing.** When concurrent actors might write the same mutable state (a file, branch, key, API), first ask whether they need the same object at all. Usually they publish independent facts: give each actor its own file, key, branch or state directory and merge only at the read or report boundary. Only when one shared write target is a real invariant, serialize structurally (lockfile, sequential phases, single-writer actor, atomic compare-and-swap). Conventions and instructions are not concurrency control. "We need a lock" is a design smell to check, not the default answer.

**Make operations idempotent.** Every state-changing operation answers: what if it runs twice? What if the previous run crashed halfway at any point? Converge to the correct state however many times it runs and wherever it starts.

- Startup scans for existing state, cleans stale artifacts, adopts live work.
- Cleanup compares by content equivalence, not creation order.
- Locks detect staleness (a dead PID) and heal.
- Failed work respawns cleanly; fresh input is regenerated each cycle.

**Test:** run it twice in a row; kill it at every step; does re-execution reach the same end state? If the answer is "it depends on what was left behind", add a reconciliation step.
