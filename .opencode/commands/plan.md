---
description: Write the implementation plan for the approved spec
---
Write the plan for: $ARGUMENTS

Use the issue number given, or the issue in `.workflow/task.json`. Check the issue has the `ready-for-agent` label (the spec was approved); if it does not, stop and say the spec still needs approval.

Load `writing-plans` and write the plan under `.workflow/plans/`, self-review it, choose the executor, record the ruling, and report the plan path and the executor. Then stop; `/build` starts the work.
