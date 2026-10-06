# Spec template

Publish this as the issue body. Keep each section as short as the content allows, except User Stories, which should be thorough.

```markdown
## Problem statement

The problem, from the user's point of view.

## Solution

The solution, from the user's point of view.

## User stories

1. As a <actor>, I want <capability>, so that <benefit>
(Numbered and extensive: every behavior the feature must have, including error and edge cases.)

## Objective and success criteria

What done looks like, as specific checks (numbers, observable states, a command that passes). Reframe vague asks into checkable ones: "faster" becomes "p95 under 300 ms on the list endpoint".

## Assumptions

1. <assumption> (the user corrects now or it stands)

## Implementation decisions

- Modules built or changed, and their interfaces
- Schema, API contract, architecture decisions, specific interactions
(No file paths. No code, except a prototype-derived snippet that states a decision.)

## Test seams and testing decisions

- Seams: <each seam, existing or new, and what is observed there>
- What a good test is here (external behavior only)
- Prior art: similar tests in the repo

## Commands

Build, test, lint, typecheck, dev: full commands with flags (from AGENTS.md).

## Boundaries

- **Always:** <run tests before commit; follow naming conventions; validate input>
- **Ask first:** <schema changes; new dependencies; CI changes>
- **Never:** <commit secrets; edit vendored code; delete failing tests>

## Out of scope

What this spec does not cover.

## Open questions

Anything unresolved, with the default the build will use if nobody answers.

## Further notes
```
