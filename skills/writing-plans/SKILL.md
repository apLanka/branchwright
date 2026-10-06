---
name: writing-plans
description: Turn an approved spec into an implementation plan of small tasks, each with exact interfaces and tests. Use after spec approval and before building any multi-step change; picks the executor and continues without waiting.
---

# Writing plans

A plan is the set of decisions an implementer cannot make alone: which files, which names and signatures, which spec values, which tests prove each task. Write it for an engineer who has not seen this codebase or the spec. A plan longer than the code it describes has written the code instead.

Save it to `.workflow/plans/<yyyy-mm-dd>-<slug>.md` (git-excluded). Link the spec issue in its header.

## Steps

1. **Check scope.** A spec with several independent subsystems becomes several plans, each producing working, testable software. Done when one plan covers one buildable unit.
2. **Map the files.** List files to create or modify with one responsibility each; follow the codebase's patterns; files that change together live together. Done when every task can name its files.
3. **Draw the dependency graph** between pieces (what must exist first, what can run in parallel) and slice **vertically**: each task is a thin path through every layer it needs, verifiable on its own. Risk-first when something is uncertain. Done when the order follows dependencies, not importance.
4. **Write the tasks** from [plan-template.md](plan-template.md). A task is the smallest unit that carries its own test cycle and is worth a fresh reviewer's gate: fold setup, config and docs into the task that needs them; split only where a reviewer could reject one and accept its neighbour. Each step is one action with a checkable result.
5. **Self-review**, yourself, no subagent:
   - *Spec coverage:* point to a task for every requirement and user story; add missing tasks.
   - *Step scan:* each step lets the implementer write exactly one reasonable thing; nothing decides nothing ("handle edge cases"), and no body is spelled out that the signature and tests already determine.
   - *Type consistency:* names and signatures match across tasks (`clearLayers()` in task 3 and `clearFullLayers()` in task 7 is a bug).
   - *Review focus:* the five inputs or failure modes the spec implies that no task's tests cover and that would hurt a user most; add each one's test to the owning task.
   - *Proportion:* a plan several times longer than its spec is a transcript of the program; replace bodies with signatures and assertions.
   Fix what you find inline. Done when each check has a result.
6. **Pick the executor and go.** `subagent-driven-development` when a subagent tool exists and the tasks are mostly independent; `executing-plans` otherwise or when tasks are tightly coupled. Record `Ruling: executor = <skill> — <why>` in the ledger, tell the user in one line, and continue. The plan is not a human gate.

Hand the plan to the executor by path.
