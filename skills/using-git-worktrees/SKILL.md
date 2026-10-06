---
name: using-git-worktrees
description: Work in an isolated git worktree for the task branch. Use at the start of Tier 2 and 3 work, before executing a plan, when the main checkout must stay untouched, or to confirm you are already in one.
---

# Using git worktrees

Tier 2 and 3 tasks run in a linked worktree so the user's main checkout, its branch and its dirty files stay untouched. No consent prompt is needed: this is part of the path.

## Steps

1. **Detect.** Compare `git rev-parse --git-dir` with `git rev-parse --git-common-dir` (resolve both with `pwd -P`). If they differ and `git rev-parse --show-superproject-working-tree` prints nothing, you are already in a linked worktree: skip to step 4.
2. **Create it with the branch.** Use the harness's native worktree tool if it has one. Otherwise `branch-per-task/scripts/branch-new --name <branch> --summary "<summary>" --tier <n> --worktree <dir>`, which wraps `git worktree add --no-track -b`. Place the directory beside the repo (`../<repo>-<slug>`), outside the working tree, so nothing needs ignoring. Done when `git -C <dir> branch --show-current` prints the branch.
3. **Work from that directory** for the rest of the task (commands, edits, `.workflow/` state). Done when `pwd` is the worktree.
4. **Set up the project.** Install dependencies the repo's way (lockfile first: `npm ci`, `pnpm install --frozen-lockfile`, `uv sync`, `pip install -e .`), reading the commands from `AGENTS.md`/README.
5. **Baseline.** Run `scripts/run-verify` (workflow skill). Done when the result is known: green, or the failing commands are listed. A red baseline is reported and recorded as a `Ruling:`; proceed only on failures unrelated to the task and name them in the report so they are not blamed on the change.

## Cleanup

Only when the user asks, after the PR is open or merged: from outside the worktree, `git worktree remove <dir>` then `git worktree prune`. If removal is refused for untracked files, show `git -C <dir> status --porcelain -uall` and ask; never `--force` on your own. Leave worktrees you did not create.

## Notes

- `.workflow/` in a worktree is its own (task state is per working tree) and is excluded by the repository-wide `info/exclude`.
- The stash is shared across worktrees; stash labels carry the branch name.
- If `git worktree add` is blocked by a sandbox, say so and work in place with `branch-new` (stash flow).
