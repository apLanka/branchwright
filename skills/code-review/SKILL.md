---
name: code-review
description: Review a change along two axes, Standards and Spec, with fresh-context read-only subagents. Use after implementation and before reporting a task ready, when asked to review a branch or diff, and in high-risk mode for security, concurrency, migration or public-interface changes.
---

# Code review

Two reviewers read the same diff in clean contexts: **Standards** (does it follow this repo's standards and sound design?) and **Spec** (does it do what the issue asked, no more, no less?). A change can pass one and fail the other, so the reports stay separate.

## Steps

1. **Pin the range.** BASE is `task.json` `base`, or the merge-base with the default branch. Run `scripts/review-package [BASE]`; it writes the diff to `.workflow/review/` and prints the path. Done when the range is non-empty and the file exists.
2. **Find the spec.** The task's issue (`gh issue view <N> --comments`), else a spec file or plan the user named, else none (the Spec reviewer then reports "no spec available").
3. **Find the standards.** `AGENTS.md`, `CONTRIBUTING.md`, `CODING_STANDARDS.md`, linters' configs. Add [standards-checklist.md](standards-checklist.md) and the [smell baseline](smells.md). A documented repo standard always overrides the baseline.
4. **Dispatch in parallel**, one subagent each, read-only, no further subagents, using [reviewer-prompt.md](reviewer-prompt.md). Pass file paths (the diff, the spec text saved to `.workflow/review/spec.md`, the standards list), not pasted content, and not your own conclusions. High-risk change? Also run [high-risk.md](high-risk.md). Done when every reviewer has returned its report.
5. **Aggregate.** Present `## Standards` and `## Spec` verbatim or lightly cleaned. Do not merge or re-rank across axes. End with a line per axis: counts per severity and the worst finding.
6. **Act on findings** by severity:
   - **Critical** (broken behavior, security, data loss, spec violated): fix now.
   - **Important** (design, missing requirement, error handling, test gap): fix before `ready`.
   - **Minor** (style, polish): list in the report, do not loop on them.
   Verify each finding against the code before acting (`receiving-code-review`); a finding you rule wrong gets a `Ruling:` line with the evidence.
7. **Re-review, scoped.** After fixes, run `scripts/review-package <previous-head>`; dispatch [re-review-prompt.md](re-review-prompt.md) with the open findings and that diff. The re-reviewer verdicts each finding ADDRESSED or NOT ADDRESSED and inspects only the fix diff. Maximum **3 rounds**: rounds 1-2 resume the same implementer, round 3 uses a fresh implementer with the report file. After round 3 adjudicate each open finding yourself: fix it, or park it with `Ruling: <finding> — <why it stands or is deferred> — <cost if wrong>`.
8. **Record** the final report in `.workflow/review/report.md` and in your task report (Critical/Important fixed, Minor listed, rulings).

## Fix discipline

Fixes are made by an implementer (the original subagent, or you when working inline), each with a failing test first when the finding is a behavior (`tdd`), each its own commit (`atomic-commits`). Never fix a Critical finding without re-running the checks (`verification-before-completion`).

## Severity

Label by effect, not by volume: not everything is Critical. Praise only what is accurate; vague feedback ("improve error handling") is not a finding. Every finding names `file:line`, what is wrong, why it matters, and the fix when not obvious.
