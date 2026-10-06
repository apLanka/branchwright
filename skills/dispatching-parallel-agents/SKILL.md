---
name: dispatching-parallel-agents
description: Run independent investigations or tasks in parallel with one subagent per problem domain. Use when facing two or more failures, questions or tasks that share no state and do not depend on each other's results.
---

# Dispatching parallel agents

One subagent per independent problem domain, all started in the same step. Each gets isolated context built for its task; none inherits your session.

## When

Parallel: several failing test files with different causes, separate subsystems, independent research questions, a coverage sweep over disjoint files.
Sequential or single agent: failures that may share one cause (fix one, retest), work that needs the whole system's state, tasks that edit the same files.

## Steps

1. **Split by domain.** Group the work by what is broken or asked (file A: approval flow; file B: batch completion). Done when each group can be understood without the others.
2. **Check for shared state.** If two agents could write the same file, branch, key or database row, remove the sharing first (give each its own file or worktree, merge at the read boundary). Serialize only when sharing is real, and by structure (sequential phases, exclusive ownership), not by instruction. Done when no two agents share a write target.
3. **Write one focused brief per agent:** the scope (a file, a subsystem), the goal with success criteria, constraints ("do not change production code outside X"), pointers to files rather than pasted content, and the output you want (a summary of the cause and the changes, written to a named file).
4. **Dispatch all in one step**, in the background where the tool allows. Do local work while they run; reconcile any that finish without reporting.
5. **Integrate.** Read each report (verify claims against the diff; an agent's "success" is not evidence). Check for conflicts between their changes, run the full suite once, and commit per domain with `atomic-commits`.

## Brief quality

- Focused: one domain per agent, not "fix all the tests".
- Self-contained: everything it needs is in the brief or a file it can read.
- Specific about output: "return the root cause and the files changed" rather than "report back".
- Bounded: say what it must not touch.

## Avoid

Agents sharing mutable state; briefs that paste whole files; fan-out for a task a script can do in one pass (write the script instead); more agents than domains.
