---
name: to-tickets
description: Break an approved spec or plan into tracer-bullet GitHub tickets, each declaring its blocking edges. Use for Tier 3 work after spec approval, when one spec is too big for a single branch and pull request.
---

# To Tickets

Break a plan, spec, or conversation into a set of **tickets**: tracer-bullet vertical slices, each declaring the tickets that **block** it.

Tickets live on GitHub; the commands are in `docs/agents/issue-tracker.md` (written by `setup-workflow`). Each ticket runs later as its own Tier 2 task on its own branch and pull request.

## Process

### 1. Gather context

Work from whatever is already in the conversation context. If the user passes a reference (a spec path, an issue number or URL) as an argument, fetch it and read its full body and comments.

### 2. Explore the codebase (optional)

If you have not already explored the codebase, do so to understand the current state of the code. Ticket titles and descriptions should use the project's domain glossary vocabulary, and respect ADRs in the area you're touching.

Look for opportunities to prefactor the code to make the implementation easier. "Make the change easy, then make the easy change."

### 3. Draft vertical slices

Break the work into **tracer bullet** tickets.

<vertical-slice-rules>

- Each slice cuts a narrow but COMPLETE path through every layer (schema, API, UI, tests): vertical, NOT a horizontal slice of one layer
- A completed slice is demoable or verifiable on its own
- Each slice is sized to fit in a single fresh context window
- Any prefactoring should be done first

</vertical-slice-rules>

Give each ticket its **blocking edges**: the other tickets that must complete before it can start. A ticket with no blockers can start immediately.

**Wide refactors are the exception to vertical slicing.** A **wide refactor** is one mechanical change (rename a column, retype a shared symbol) whose **blast radius** fans across the whole codebase, so a single edit breaks thousands of call sites at once and no vertical slice can land green. Don't force it into a tracer bullet; sequence it as **expand–contract**. First expand: add the new form beside the old so nothing breaks. Then migrate the call sites over in batches sized by blast radius (per package, per directory), each batch its own ticket blocked by the expand, keeping CI green batch to batch because the old form still exists. Finally contract: delete the old form once no caller remains, in a ticket blocked by every migrate batch. When even the batches can't stay green alone, keep the sequence but let them share an integration branch that all block a final integrate-and-verify ticket; green is promised only there.

### 4. Quiz the user

Present the proposed breakdown as a numbered list. For each ticket, show:

- **Title**: short descriptive name
- **Blocked by**: which other tickets (if any) must complete first
- **What it delivers**: the end-to-end behaviour this ticket makes work

Ask the user:

- Does the granularity feel right? (too coarse / too fine)
- Are the blocking edges correct: does each ticket only depend on tickets that genuinely gate it?
- Should any tickets be merged or split further?

Iterate until the user approves the breakdown.

### 5. Publish the tickets to GitHub

Publish the approved tickets, blockers first, so each ticket's blocking edges can name real issue numbers. Follow "Tickets and blocking" in `docs/agents/issue-tracker.md`:

- One `gh issue create` per ticket, body from the template below.
- Link each as a sub-issue of the spec issue (or put `Part of #<spec>` at the top of the body).
- Wire the blocking edges in a second pass, once every ticket has a number: native issue dependencies through `gh api`, or a `Blocked by: #<n>` line when dependencies are unavailable.
- Apply `ready-for-agent` to each ticket **only when its parent spec is approved** (it is, in Tier 3: the spec was approved before tickets). Tickets are agent-grabbable by construction.
- Each ticket's body repeats `Part of #<spec>` and its acceptance criteria; the builder's PR will say `Closes #<ticket>`.

Work the **frontier**: any ticket whose blockers are all closed. For a linear chain that is top to bottom. Each ticket becomes a task: `workflow` intake, `branch-per-task`, then the Tier 2 path from `writing-plans` (the spec already exists, as the ticket).

Do NOT close or modify the parent spec issue.

<issue-template>

## Parent

A reference to the parent issue on the tracker (if the source was an existing issue, otherwise omit this section).

## What to build

The end-to-end behaviour this ticket makes work, from the user's perspective, not layer-by-layer implementation.

## Acceptance criteria

- [ ] Criterion 1
- [ ] Criterion 2

## Blocked by

- A reference to each blocking ticket, or "None (can start immediately)".

</issue-template>

Avoid specific file paths or code snippets: they go stale fast. Exception: if a prototype produced a snippet that encodes a decision more precisely than prose can (state machine, reducer, schema, type shape), inline it and note briefly that it came from a prototype. Trim to the decision-rich parts, not a working demo, just the important bits.
