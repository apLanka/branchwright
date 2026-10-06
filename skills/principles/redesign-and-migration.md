# 7. Redesign and migration

**Redesign from first principles.** Do not bolt a new requirement onto the old design. Read every affected file, ask "if we wrote this from scratch with this requirement, what would we build?", propagate the change through every reference (types, docs, examples, rationale), think about the whole redesign, then deliver it incrementally.

**Attack the premise.** When two or more fixes sharing one premise fail the same gate, suspect the premise. Write the premise down (the one sentence every failed fix assumed); take a census per actor of where the imbalance sits (as a rerunnable script); if the same few actors hold it every run, find what assigns them that role and remove the asymmetry (rotate or randomize the role, or move it) instead of compensating. Do not start the next fix before the premise is written and the census exists. An even census means the premise is not the cause.

**Outcome-oriented execution.** For planned rewrites and migrations with explicit phase boundaries, converge on the target architecture instead of preserving every smooth intermediate state: transitional compatibility code becomes long-lived debt. Intermediate breakage is acceptable when planned, scoped and reversible. Declare where it is allowed; keep high-signal checks on touched areas; require full static and runtime verification at the end.

**Migrate callers, then delete the legacy API** in the same wave when no external users depend on compatibility: inventory callers, migrate them, delete the old path, update tests to assert the new contract. A temporary adapter is exceptional and time-boxed. Two APIs side by side make the codebase append-only.

**Test:** after the change, would a reader believe the design always accounted for this requirement? Is exactly one path left?
