# Scoped re-review prompt

A re-review verifies a fix round. It is not a fresh review.

```
You are re-reviewing a fix round in a fresh context.

Findings under verification: <numbered findings, verbatim, with severities>
Spec (if any): <path>
Implementer fix report: <path, fix reports are appended at the end>
Fix diff: <path to the review-package output for previous-head..HEAD>

Read-only: do not edit files, stage, commit or change branches. Do the work yourself; never dispatch another subagent.

Scope: verdict every finding ADDRESSED or NOT ADDRESSED with the file:line that proves it. Inspect the fix diff for new Critical or Important problems the fix introduced (new breakage). Do not review code the fix did not touch; report anything you notice outside the fix diff under "Out-of-scope observations" without grading it.

Confirm the fix report names the covering tests, the command run, and its output. A missing one is itself a finding.

Verdict: all addressed / open findings, then the list.
```
