# Phase 5 results: end-to-end runs

Setup: opencode 2.0.23 (V2), model `fledge-alpha-free` (the default free model; one model throughout), a throwaway private GitHub repo (`apLanka/workflow-e2e-20261006-1158`, a small Python package `textkit` with `unittest` tests), the plugin installed with `install.sh --flavor v2`, run headless with `opencode run --standalone --auto`. A human was never in the loop, so questions that need an answer were either cancelled by the harness or answered inline in the prompt.

## Scenarios

| # | Scenario | Result |
|---|---|---|
| 0 | `setup-workflow` on a fresh repo | Passed. Wrote `AGENTS.md` (Commands table with the repo's unittest command), `docs/agents/*`, ran `setup-repo`, committed on `chore/setup-workflow`, pushed nothing. Found bug B1. |
| A | Tier 1 bug ("trailing dash in `slugify`") | Passed. Branch created, failing regression tests first (red), one-line fix, green, conventional commit, state `ready`, no push. First run did not load most skills and stated the tier only at the end: fixed (F3, F4). |
| B1 | Unrelated request, **dirty tree** (uncommitted edit plus an untracked file) | Passed. Tier stated first; `branch-per-task` loaded; new branch from `origin/main` (not stacked); work stashed as `feat/truncate: Add truncate function to textkit`; docs commit; old task archived. |
| B2 | Related follow-up on a `ready` branch ("stay") | Passed. Stayed on the branch, second atomic commit; the edit returned the task to `working`, and the agent set `ready` again. |
| B3 | "Go back to the half-done work" | Passed. Used `branch-switch`: stash popped (including the untracked file), task state restored, finished with a regression test first, state `ready`. |
| C | **Ready task left unconfirmed** plus an unrelated request | Passed. Asked once (the headless harness cancelled the question), left the previous task `ready`, started a new branch from `origin/main`. Nothing pushed; remote held only `main`. |
| D | Confirm, then PR (Tier 1) | Passed after fixes. `/done` template: `confirmed`, `finish-task`, plain push of the task branch, PR #1 (`feat/truncate` into `main`), state `pr-open`. Other branches never pushed. |
| E | Tier 2 feature (`wrap`), turn 1: grill and spec | Passed. `grilling` and `domain-modeling` loaded, rulings recorded, spec issue #2 published with **no label**, branch renamed `feat/2-wrap` (worktree), stopped for approval. |
| E | Tier 2, turn 2: approval, plan, build, review, ready | Passed. `ready-for-agent` added after approval, plan in `.workflow/plans/`, an `implementer` subagent built `wrap` test-first, two `reviewer` subagents ran the Standards and Spec axes, two commits, `run-verify` green, state `ready`, no push. |
| E | Tier 2 `/done` | Passed. PR #3 (`feat/2-wrap` into `main`), body ends with `Closes #2`, state `pr-open`. |

Guardrails, live (earlier in Phase 4, same environment): edit on the default branch, `git add -A`, `git push --force`, and a commit with failing verify commands were all blocked with the right message. In the runs above no guardrail fired wrongly except B2 below.

## What broke, and the fix

| ID | Problem found | Fix |
|---|---|---|
| B1 | `agents-md-block.md` put `### Commands` under `## Workflow`, but `project-commands` only read a level-2 heading, so the commit gate and `run-verify` found nothing. The model noticed and worked around it. | Template uses flat `## Commands`; parser accepts heading levels 2 to 4. Test added. |
| B2 | Guard false positive: any shell command containing `task.json` and `>` (for example `... 2>&1`) was refused as a hand edit of task state. | Writes are matched precisely (`> ...task.json`, `tee`, `mv`, `rm`, `sed -i` on the file). Tests added. |
| B3 | Script paths contain spaces; the unquoted path in the bootstrap broke the first call in every session. | Bootstrap says to always double-quote script paths and gives a quoted example. |
| B4 | `branch-new` called with positional arguments, and the agent fell back to a plain `git checkout -b` (no `task.json`). | `branch-new` prints its usage on any argument error; `workflow` says to use `branch-new`. |
| B5 | `finish-task` pushed, then failed at `gh pr create` when `gh` was not logged in, leaving a half-done state; and it required a fully clean tree, so the agent **moved the user's untracked `notes.txt` out of the repo** to satisfy it. | `finish-task` checks `gh auth status` before pushing, and only requires tracked files to be committed (untracked files are reported and left alone). The skill says never to move, delete or stash files that are not yours. Tests added. |
| B6 | The agent states the tier late and loads few skills (A loaded only `debugging`; commits and verification were done from memory). | `workflow`: the tier line is "the first text you write"; skills are loaded with the skill tool at the start of their step; the tier table names `verification-before-completion` and `atomic-commits`. After this, B1 to E loaded `branch-per-task`, `tdd`, `debugging`, `verification-before-completion`, `finish-task`, `pr`, `writing-plans`, `code-review` as expected. |
| B7 | In V2 a session can move itself into a worktree (`opencode_session_move`), but the guard kept judging commands against the directory the plugin started in. | The V2 hook records the move and judges that session's commands in the worktree. Test added. |
| B8 | The agent sometimes tried a `bash` tool on V2 (it recovers). | The V2 mapping states that the host has no `bash` or `task` tool. |

## Skill descriptions

No description needed rewording for triggering in these runs: the right skills loaded for setup, bugs, branching, TDD, planning, review, verification, PRs. What mattered was the instruction in `workflow` to load a skill at the start of its step; with that change the model followed the tier paths. Descriptions all say when to use the skill and are under 1024 characters (validator).

## Harness and environment notes

- The free model backend was flaky: about a third of runs ended with no output after the full timeout, or with `OpenAI Chat tool call delta is missing id or name`. These were retried (the failures happened before any tool ran); they are not workflow failures. Back-to-back `opencode run` calls need about 10 seconds between them.
- `opencode run "/command"` does not invoke slash commands, so `/done` and `/spec` were exercised by sending their template text as the message. The commands' loading as native slash commands was not tested.
- Questions to the user (`question` tool) are cancelled in a headless run, so the "ask once" step for a `ready` task was observed as the agent asking, then continuing with the safe choice (leave the task as is). Waiting for a real answer is untested.
- Global skills in `~/.claude/skills` and `~/.agents/skills` (including same-named ones such as `code-review`, `grilling`, `codebase-design`) were visible in the same skill listing. Which copy loads when a name exists in both places was **not determined**: a probe to read the registry hit the same backend stalls and was abandoned. In the runs above the workflow behaved as designed, which suggests the plugin's skills were the ones loaded, but that is not proven.

## Not covered

- V1 (no V1 install available; mock-host tests only).
- Tier 3 (`wayfinder`, `to-tickets`) and the hidden skills in general: validated structurally, never run by an agent.
- `reflect`, `retro`, `show-me-your-work`, which depend on `opencode session export`.
- The agents' permission denies were not tested adversarially (for example, a reviewer attempting an edit).
- Interactive use (the TUI): human answers to the spec and the ready-task question.

## Cleanup

The test repo `apLanka/workflow-e2e-20261006-1158` is private and has two open PRs and one open issue. The `gh` token on this machine lacks the `delete_repo` scope, so it was not deleted: remove it in the GitHub settings, or run `gh auth refresh -h github.com -s delete_repo` and then `gh repo delete apLanka/workflow-e2e-20261006-1158`.
