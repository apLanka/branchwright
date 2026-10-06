---
description: Two-axis code review of the current branch (Standards and Spec), with fixes and scoped re-review
---
Review this branch: $ARGUMENTS

Load `code-review`. Range: the task's base to HEAD. Use high-risk mode when I say so in the arguments ("high-risk") or when the change touches authentication, payments, migrations, concurrency, untrusted input, or a public interface.

Dispatch the reviewers, aggregate the two axes without merging them, fix Critical and Important findings with failing tests first, run scoped re-reviews (at most 3 rounds), and report with `Ruling:` lines for anything you decided. Do not push.
