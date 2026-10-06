---
description: Confirm the task is done: opens the pull request (push and gh pr create)
---
[workflow:done] The user confirms the task is done and asks you to open the pull request. $ARGUMENTS

1. Read the state (`task-state show`). If it is `working`, the task is not ready: say so, run the `/ship` steps first, and stop. If it is `ready`, set `confirmed` with `task-state transition confirmed` (this message is the user's explicit confirmation). If it is already `confirmed`, continue.
2. Load `finish-task` and follow it: re-verify, write the PR body with the `pr` skill (ending with `Closes #<issue>`), run `finish-task` (plain push of the task branch, then `gh pr create`).
3. Report the PR URL and stop. Merging, closing the issue and deleting the branch are mine.
