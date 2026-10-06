# Definition of Done

A standing bar every change clears, the same each time. Acceptance criteria ("did we build this thing?") vary per task; this answers "is it finished to standard?". A task is done only when its criteria and this list are both satisfied.

## Correctness
- [ ] Every acceptance and success criterion is met
- [ ] Behavior verified at runtime, not just compiled or typechecked
- [ ] New behavior has tests that fail without the change and pass with it
- [ ] Existing tests pass; no regressions
- [ ] Edge cases and error paths handled

## Quality
- [ ] Names and structure reveal intent
- [ ] No duplicated business logic
- [ ] No dead code, debug output or commented-out blocks
- [ ] The change is scoped to the task; no unrelated edits
- [ ] Lint and formatting pass

## Integration
- [ ] Works with the rest of the system, not only alone
- [ ] Migrations, config changes and feature flags accounted for
- [ ] Backward compatibility considered for any public interface

## Documentation
- [ ] Public interfaces and user-facing behavior documented
- [ ] Decisions worth keeping recorded (ADR, via `domain-modeling`)
- [ ] Docs describe the current state, not the change history

## Ship readiness (when the change ships)
- [ ] Untrusted input, authentication and data handling reviewed (`security-and-hardening` when enabled)
- [ ] A rollback path exists for anything risky (`shipping-and-launch` when enabled)
- [ ] The user has reviewed before merge or deploy (their step, not yours)

## Red flags
"Done, I just have not run it"; "tests pass" used as a synonym for done; a lower bar under deadline pressure; acceptance criteria treated as the whole bar.
