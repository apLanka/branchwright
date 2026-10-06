# Issue tracker: GitHub

Specs, tickets and pull requests live on GitHub. Use the `gh` CLI. Inside a clone, `gh` infers the repo from `git remote`.

## Specs

- **Publish a spec**: `gh issue create --title "<title>" --body-file <file>`; no labels. The `spec` skill stops here and waits for approval.
- **Approve**: after the user approves, `gh issue edit <n> --add-label ready-for-agent`.
- **Read**: `gh issue view <n> --comments`.
- **Update**: `gh issue edit <n> --body-file <file>`; `gh issue comment <n> --body "..."`.

The `ready-for-agent` label means "spec approved, safe to build". It is never applied before approval.

## Pull requests

- **Open**: only through `finish-task`, which runs `gh pr create --base <default> --head <branch> --body-file <file>`. The body contains `Closes #<n>`.
- **Read**: `gh pr view <n> --comments`, `gh pr diff <n>`.
- The user merges, closes issues and deletes branches.

## Fetching

When a skill says "fetch the ticket": `gh issue view <n> --comments`. A bare `#42` may be an issue or a PR; try `gh issue view 42`, then `gh pr view 42`.

## Tickets and blocking (Tier 3, optional skills)

Used by `to-tickets` and `wayfinder`.

- **Create a ticket**: one issue per ticket, blockers first so later tickets can name real numbers.
- **Parent link**: add the ticket as a sub-issue of the spec or map with `gh api` on the sub-issues endpoint. When sub-issues are unavailable, put `Part of #<parent>` at the top of the body and list the child in a task list on the parent.
- **Blocking**: GitHub issue dependencies. `gh api --method POST repos/<owner>/<repo>/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-database-id>`, where the id comes from `gh api repos/<owner>/<repo>/issues/<n> --jq .id` (not the number, not the node id). When dependencies are unavailable, put `Blocked by: #<n>, #<n>` at the top of the body.
- **Frontier**: open children with no open blocker and no assignee, in the parent's order.
- **Claim**: `gh issue edit <n> --add-assignee @me`, before any work.
- **Resolve**: `gh issue comment <n> --body "<answer>"`, then `gh issue close <n>` for wayfinder decision tickets. For build tickets the PR's `Closes #<n>` closes them on merge.
- **Wayfinder map**: one issue labelled `wayfinder:map`; ticket types as labels `wayfinder:research|prototype|grilling|task`. `setup-repo` does not create these labels; `wayfinder` creates them on first use with `gh label create`.
