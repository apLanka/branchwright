---
description: Pick up where things stand - resume state, then the next ticket or next plan task
---
What is next: $ARGUMENTS

1. Load `handoff` in resume mode: read the live state (`branch-decide`, `task-state show`, ledger, issue, PRs) and report the capsule.
2. Then act on the first case that applies:
   - a plan with unfinished tasks in `.workflow/sdd/`: continue it (`/build`'s executor, resuming from the ledger);
   - a task in state `ready`: remind me it awaits my confirmation (`/done`) and stop;
   - a Tier 3 parent with open tickets (when `to-tickets` is enabled): take the first unblocked, unassigned ticket (see `docs/agents/issue-tracker.md`, "Tickets and blocking"), claim it with `gh issue edit <n> --add-assignee @me`, and start it as a new task (`/task`), Tier 2 on its own branch;
   - nothing pending: say so and ask what to work on.
