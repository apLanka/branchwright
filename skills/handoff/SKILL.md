---
name: handoff
description: Write a handoff document so a fresh session can continue the work, or resume from one. Use at the end of a session or phase, before switching tools or directories, between Tier 3 tickets, and at the start of a session when asked to catch up or continue earlier work.
---

# Handoff

Two modes: **write** a handoff before leaving, **resume** from state when starting. Decide whether you need one at all with [phase-boundaries.md](phase-boundaries.md).

## Write

1. **Gather** only what is not already in an artifact: the issue and its URL, the branch and `task.json`, the plan path and ledger, ADRs, the last commits. Reference artifacts by path or URL; do not copy them in.
2. **Write** `.workflow/handoff/<yyyy-mm-dd-hhmm>-<slug>.md`, git-excluded and outside any commit, with these sections (skip empty ones):
   - **Goal:** one line, and what the next session will focus on (from the user's request when they gave one).
   - **State:** tier, task state, branch, worktree path, base; which tasks are complete (ledger line), which is next.
   - **Decisions:** the choices that shaped the work and the `Ruling:` lines, one line each with the why.
   - **Verified:** commands run and their results; what remains unverified.
   - **Open:** unresolved questions, risks, approvals still needed (spec, done-confirmation).
   - **Next:** the single next action, concrete.
   - **Suggested skills:** which skills the next session should load.
3. **Redact** secrets, tokens and personal data. Done when the file names no credential and every pointer resolves.
4. Tell the user the path.

## Resume

1. **Find the record.** The user's path, else the newest file in `.workflow/handoff/`, else none.
2. **Read the live state**, which beats any document: `scripts/branch-decide` (workflow's branch skill), `task-state show`, `git status`, `git log --oneline -15`, the ledger in `.workflow/sdd/*/progress.md`, and the issue (`gh issue view <N> --comments`) and open PR (`gh pr list --head <branch>`).
3. **Reconcile** the handoff with reality. When they disagree, reality wins and you say so.
4. **Report a capsule**, tight:
   - Capsule: at most 5 bullets: what the work is and where it stands.
   - Threads: one line each, tagged `[merged #N]`, `[open PR #N]`, `[in flight <branch>]`, `[verified, uncommitted]`, `[reverted #N]` or `[planned]`.
   - Problems: at most 5 recurring ones, including any fix that shipped and was reverted.
   - Next move: the one concrete action.
5. **Continue** from the next move unless the user redirects. Write the capsule through `unslop`.

For "what has been happening around this code" across the history, use `why`.
