---
name: finish-task
description: Push the task branch and open its pull request. Use only after the user has said the task is done or to open the PR (state confirmed). Never run it on your own initiative.
---

# Finish task

Runs once per task, only after the user's explicit "done" or "open the PR". Until then the task stays `ready` and nothing is pushed.

## Preconditions

State is `confirmed` in `.workflow/task.json`. If it is `working` or `ready`, stop: the user has not confirmed. Set `confirmed` yourself only when the user's last message says so in plain words ("done", "looks good, open the PR", "ship it"). Silence, "thanks", or a new request do not count.

```
<workflow skill dir>/scripts/task-state transition confirmed   # only on the user's words
```

## Steps

1. **Re-verify.** Run the `verification-before-completion` checks on the branch tip. Done when output shows everything green and no tracked file has uncommitted changes. Untracked files that are not yours (scratch notes, the user's files) stay where they are: never move, delete or stash them to get a clean tree.
2. **Write the PR body.** Load the `pr` skill and write the body to `.workflow/pr-body.md`. When the task has an issue, the body ends with `Closes #<N>`. Done when the file exists and holds the summary, evidence and merge-danger sections.
3. **Push and open the PR.**
   ```
   scripts/finish-task --body-file .workflow/pr-body.md [--title "<conventional title>"] [--draft]
   ```
   The script checks the state, the branch, tracked files committed, `gh` login, commits ahead of base and the `Closes` line, then runs a plain `git push -u origin <branch>` and `gh pr create`, and sets `pr-open`. Done when it prints `pr=<url>`.
4. **Report** the URL, the commits, and the rulings you made. Stop.

## Boundaries

- A plain push of the task branch is the only push. No force, no `--no-verify`, no pushing other branches.
- Merging, closing the issue, and deleting the branch or worktree belong to the user.
- Worktree cleanup, when the user asks for it afterwards: `git worktree remove <path>` from outside the worktree; if it refuses because of untracked files, show them and ask. Never `--force` on your own.
- If the push is rejected, the remote moved: report it and ask. Do not force.
