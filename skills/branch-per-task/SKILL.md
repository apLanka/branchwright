---
name: branch-per-task
description: Decide the branch before the first edit of any new request - stay, stacked, or new - and create it locally. Use at intake, when a request arrives, when the user changes topic mid-task, or when the current branch is the default branch.
---

# Branch per task

One task, one branch, one pull request. The decision happens before any edit, on every new request.

Scripts are in `scripts/` next to this file. They never push.

## Steps

1. **Read the state.** Run `scripts/branch-decide`. Done when you can state: current branch, default branch, dirty or clean, task summary and state.
2. **Apply the test.** Ask: *would a reviewer expect this change in the same pull request as the branch's task summary?*
   - **Yes** → **stay**. Add the request to the current task (the tier may rise).
   - **Yes, but it depends on unmerged work and reads better as a separate review** → **stacked**: `branch-new --stacked`.
   - **No**, or the current branch is the default branch, or there is no task → **new**: `branch-new` from `origin/<default>`.
   Done when you have said which of the three and the one-line reason.
3. **Create the branch** (new or stacked):
   ```
   scripts/branch-new --name <type>/<slug> --summary "<one line>" --tier <n> [--stacked] [--worktree <dir>]
   ```
   - Name: conventional type prefix (`feat`, `fix`, `chore`, `docs`, `refactor`, `test`) and a short slug.
   - Tier 2 and 3: add `--worktree ../<repo>-<slug>`, then work from that directory. The main checkout is left untouched.
   - Tier 0 and 1: in place. A dirty tree is stashed as `<branch>: <summary>`; never commit work-in-progress to get a clean tree.
   Done when `scripts/branch-decide` shows the new branch, `task_state=working`, and `dirty_files=0`.
4. **Come back later.** To resume an earlier task: `scripts/branch-switch <branch>` (stashes current dirt, restores that task's state and stash).

## Rules

- Never edit on the default branch.
- Create branches locally only. `gh issue develop` pushes; do not use it. Pushing belongs to `finish-task`.
- A pending `ready` task is handled in `workflow` intake (ask once) before you create anything.
- The `spec` skill renames the branch to include the issue number with `scripts/branch-rename --issue <N>` once the issue exists.
- If `branch-decide` shows `task_matches_branch=no`, the branch was changed outside the workflow: run `branch-switch` to the right task, or start a new task with `branch-new`.

Edge cases (detached HEAD, no remote, stash conflicts): [reference.md](reference.md).
