# Standards checklist

What the Standards reviewer weighs, in order. Skip any item tooling enforces.

## 1. Correctness
- Does the code do what the task says? Edge cases (empty, null, boundaries) and error paths, not only the happy path.
- Root cause or symptom? A guard that masks a deeper invariant violation, a retry hiding a broken contract, a cast silencing a modeling error, a fix in module A that belongs in B's contract.
- Idempotence: what happens on a second run, or after a crash halfway?
- Shared mutable state: serialized structurally, or by a convention that will not hold?

## 2. Verification
- Tests exist for the change, at a seam, asserting behavior with literal expected values.
- Mutation check: invert one condition the change adds, run the suite, restore the file; a green run names a missing test.
- Real-artifact evidence for bug fixes (red before, green after).

## 3. Design and structure
- Fits the existing patterns, or the new pattern is justified.
- Validation and error handling at the boundary; internal code trusts its types.
- Layers and state: a wrapper with one caller, an adapter with no second implementation, hidden mutable state, a new flag threaded through many layers.
- A new conditional bolted onto an unrelated flow, or repeated conditionals on one shape: a missing model or dispatcher.
- Feature logic leaking into a shared module; a near-duplicate of an existing helper.
- Old and new paths both alive after a refactor with no external consumers.
- Does a "cleaner" version reduce the concepts a reader must hold, or only relocate them?

## 4. Readability
- Names reveal intent; control flow is straightforward; no clever tricks; no dead code, debug output or commented-out blocks.
- Could it be fewer lines? Do abstractions earn their weight (a third use case, not a second)?

## 5. Security and performance (pointers)
- Untrusted input validated at the boundary; secrets out of code and logs; authorization checked; parameterized queries. Deep dive: `security-and-hardening` when enabled.
- N+1 queries, unbounded loops or fetches, sync work that should be async, missing pagination. Deep dive: `performance-optimization` when enabled.

## 6. Change shape
- About 100 changed lines is good, 300 acceptable for one logical change, 1000 too large: split.
- Refactors and behavior changes are separate commits. Commit messages stand alone in history.

## Structural remedies (propose the move, not just the problem)
Replace a conditional chain with a typed model or dispatcher; collapse duplicate branches; separate orchestration from business logic; move feature logic to its owning package; reuse the canonical helper; make a type boundary explicit; delete a pass-through wrapper; split a file that holds more than one job.
