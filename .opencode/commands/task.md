---
description: Start a task - states the tier and sets up the branch, nothing else
---
Start a new task: $ARGUMENTS

Follow the `workflow` intake exactly: read the state with `branch-decide`, resolve any pending `ready` task (ask once if the new request is unrelated), state the tier in one line, then decide stay, stacked or new branch with the `branch-per-task` skill and create it. For Tier 2 and 3 use a worktree.

Stop after the branch exists and `task.json` shows the tier. Report the tier, the branch and the first step of the tier's path. Do not start the work.
