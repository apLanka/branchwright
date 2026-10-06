# Branch-per-task reference

## State file

`.workflow/task.json` in the working tree root (each linked worktree has its own):

| Field | Meaning |
|---|---|
| branch | task branch, kept in sync by `branch-rename` |
| base | where it started: `origin/<default>` or a parent branch when stacked |
| summary | one-line task summary; the reviewer test compares new requests against it |
| issue | GitHub issue number, null until `spec` publishes |
| tier | 0-3, only moves up |
| state | `working`, `ready`, `confirmed`, `pr-open` |
| stash | label of the stash holding this task's uncommitted work, or null |

Tasks you leave are archived to `.workflow/tasks/<branch>.json` (slashes become `__`) and restored by `branch-switch`.

`.workflow/` is excluded through `git rev-parse --git-path info/exclude`, so nothing needs a commit, and linked worktrees share the exclusion.

## Choosing stay, stacked, or new

| Situation | Choice |
|---|---|
| Follow-up fix to what this branch builds | stay |
| Reviewer feedback or a test gap in this branch's change | stay |
| New feature that needs this branch's unmerged code | stacked |
| Unrelated bug, refactor, docs, or dependency bump | new |
| On the default branch | new |
| Previous task is `pr-open` or merged | new |

When unsure between stay and new, choose new: a second small PR costs less than a mixed one.

## Stash labels

`git stash push -u -m "<branch>: <summary>"`. Git stores it as `On <branch>: <branch>: <summary>`; `branch-switch` finds it by the label recorded in the archived task. Untracked files travel with the stash; `.workflow/` is ignored and stays put.

## Edge cases

- **No remote.** The base is the local default branch. `finish-task` refuses until `origin` exists.
- **Fetch fails.** `branch-new` warns and uses the last known `origin/<default>`.
- **Detached HEAD.** `--stacked` is refused. Create the branch from the default instead.
- **Stash pop conflicts.** `branch-switch` leaves the stash in place and prints the conflict; resolve, then `git stash drop` the entry.
- **Branch name exists.** `branch-new` refuses; pick another slug or `branch-switch` to it.
