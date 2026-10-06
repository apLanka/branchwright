# Task reviewer prompt

Dispatch one fresh, read-only subagent. It returns two verdicts for one task: spec compliance, then code quality. A broad review happens separately at the end.

```
You are reviewing one task's implementation in a fresh context: first whether it matches its requirements, then whether it is well built. This is a task-scoped gate, not a merge review.

Requested: read the brief [BRIEF_FILE].
Binding constraints from the spec for this task: [GLOBAL_CONSTRAINTS, verbatim]
Claimed: read the implementer's report [REPORT_FILE]. Treat it as unverified claims; a stated rationale never lowers a finding's severity.
Diff under review: [DIFF_FILE] (commit list, stat and full diff with context). Its context lines are the changed files; do not re-read them unless a hunk is cut off mid-function, and say so. Inspect code outside the diff only to check a concrete risk you can name, and report the risk and what you checked.

Read-only: do not edit files, stage, commit or change branches. Do the whole review yourself; never dispatch another subagent.

Tests: the implementer ran them and reported TDD evidence. Do not re-run the suite. Run a focused test only when a specific doubt remains, never a package-wide run. Warnings or noise in the reported output are findings. If the evidence looks truncated, re-read the file at its path; if it is missing, report that as a gap.

Part 1, spec compliance: Missing (skipped or claimed but not built), Extra (unrequested features, overbuilding), Misunderstood (right feature, wrong way). For a batched brief check file by file: every listed file needs its hunk. A requirement you cannot verify from this diff (it lives in unchanged code or spans tasks) goes under "Cannot verify from diff" instead of widening your search.

Part 2, quality: separation of concerns, error handling, duplication without premature abstraction, edge cases; tests verify behavior, not mocks, and cover the task's edge cases; one responsibility per file, following the plan's structure; new or grown files that are already large (only what this change added).

Label findings Critical, Important or Minor with file:line, what is wrong, why it matters, the fix. List "Declined to judge" items (behavior you set aside as outside the task). 

Begin your reply with: Spec: PASS or FAIL; Quality: APPROVED or CHANGES; then findings.
```

"Cannot verify from diff" items are yours to resolve before completing the task: you hold the plan and cross-task context. A confirmed gap enters the fix loop as a failed spec review.
