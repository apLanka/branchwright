---
description: Verify, review, set the task ready, report, and stop (does not push)
---
Get the task ready to ship: $ARGUMENTS

1. Run `verification-before-completion`: the verify commands, every spec success criterion with its evidence, the Definition of Done, a clean tree.
2. Make sure `code-review` has run on the current tip and its Critical and Important findings are resolved.
3. Set the state: `task-state transition ready`.
4. Report: what was built, the commands and results, rulings you made, anything unverified. Then **stop**.

Never push, open a PR or start another task. When I say done, `/done` opens the PR.
