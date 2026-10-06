---
name: spec
description: Turn a grilled idea into an approved spec on a GitHub issue. Use for Tier 2 and 3 work after grilling, before any plan or code; publishes the issue without the ready label, renames the branch, and stops for the user's approval.
---

# Spec

The spec is the contract between you and the user: what is built, how success is checked, where the limits are. It lives only as a GitHub issue. Approval is a human gate; nothing after this step starts without it.

Use the project's glossary words. Respect ADRs. Do not put file paths or code snippets in the spec (they go stale); a snippet from a prototype that encodes a decision more precisely than prose is the one exception.

## Steps

1. **Explore the code** if you have not (areas touched, existing seams, prior art for tests). Done when you can name the modules involved.
2. **List assumptions** you are making, one line each, and the open questions. Resolve what the repo answers; carry the rest into the spec's Open Questions. Done when nothing ambiguous is silently filled in.
3. **Choose the test seams.** Prefer existing seams, the highest that reaches the behavior; the ideal number of new seams is one (vocabulary: the `tdd` skill's `seams.md`). Done when each user story maps to a seam.
4. **Tier 3 only: map capabilities** first ([capability-map.md](capability-map.md)): module ids, dependency direction, build order. One spec per module, in dependency order. Done when the user has seen the map in the same approval step.
5. **Write the spec** from [template.md](template.md) to `.workflow/spec.md`. Done when every section is filled or marked "none", success criteria are checkable, and boundaries are set.
6. **Publish**: `gh issue create --title "<title>" --body-file .workflow/spec.md` with **no labels**. Done when `gh` prints the issue URL.
7. **Rename the branch** to carry the number: `<branch-per-task skill dir>/scripts/branch-rename --issue <N>`. It runs `git branch -m` locally and updates `task.json`. Done when `task.json` shows the issue and the new branch.
8. **Stop for approval.** Reply with: the issue link, a six-line summary (problem, solution, seams, boundaries, success criteria, open questions), and "Approve, or tell me what to change." Do not start the plan or any code in this turn.
9. **On approval:** `gh issue edit <N> --add-label ready-for-agent`, then continue to `writing-plans`. **On changes:** edit `.workflow/spec.md`, `gh issue edit <N> --body-file .workflow/spec.md`, and ask again. Done when the label is on the issue.

## Confirming the seams

The seams are part of what the user approves: step 8's summary lists them. They are the only test targets for the build; changing them later needs the user's say, recorded on the issue.

## Keep it alive

When a later decision changes the contract, update the issue body first, then the code; a comment on the issue records why.
