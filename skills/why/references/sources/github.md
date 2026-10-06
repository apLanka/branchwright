# Playbook: GitHub (pull requests, issues, reviews)

Read through `gh`; read-only.

## Find the PRs and issues behind the code

- From a commit: `gh pr list --search "<sha>" --state merged --json number,title,url`; or the `(#1234)` in the commit subject; `gh pr view <n> --json title,body,author,createdAt,mergedAt,labels,closingIssuesReferences,comments,reviews`.
- Review threads: `gh api repos/{owner}/{repo}/pulls/<n>/comments` (inline review comments often hold the real trade-off discussion).
- Linked issues: the `closingIssuesReferences` above, `Closes #N` or `Fixes #N` in bodies; `gh issue view <n> --comments`.
- Search by symbol or error string: `gh search issues --repo <owner>/<repo> "<term>"`, `gh search prs ...`.
- Reverts and incidents: PRs titled `Revert ...`; issues labelled `bug`, `incident`, `regression`, `postmortem`; follow the revert to the PR it undid, then to why.

## Read

Read each PR and issue completely: body, every comment, every review. The key sentence is often in the third comment or a follow-up PR. Follow links to other PRs and issues (stay inside GitHub).

## Capture

Quote with the location (PR number, comment author and date, URL). Record each query verbatim, including the ones that found nothing. When a PR description and the discussion disagree, record both.

## Watch for

- A PR description written before the final review round (the code changed since).
- Squash-merge messages that drop the discussion; the PR thread has it.
- Issues closed by a different PR than the one that touched the code you study.
- Defensive code (retries, null checks, timeouts, feature flags): look for an incident or bug issue near the date it was added.
