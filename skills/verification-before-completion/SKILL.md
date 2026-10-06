---
name: verification-before-completion
description: Prove work is done with fresh command output before claiming it. Use before saying anything is complete, fixed or passing, before every commit, before setting a task ready, and before opening a PR.
---

# Verification before completion

Evidence before claims. A claim of success without output from this message's verification run is a guess.

## The gate

Before any statement of status or satisfaction:

1. **Identify** the command that proves the claim.
2. **Run** it in full, fresh. Done when it has finished and you have its output.
3. **Read** all output: exit code, failure count, warnings.
4. **Compare** the output with the claim. If it does not match, state the actual status with the evidence.
5. Only then **claim**, quoting the evidence ("`pytest`: 214 passed, 0 failed").

## What proves what

| Claim | Needs | Not enough |
|---|---|---|
| Tests pass | the test command's output, 0 failures | an earlier run, "should pass" |
| Types and lint clean | typecheck and lint output, 0 errors | tests passing |
| Build works | the build command, exit 0 | lint passing, plausible logs |
| Bug fixed | the original symptom's loop now passes | "code changed" |
| Regression test works | red before the fix, green after (revert the fix once to see red) | one passing run |
| A subagent finished | the diff on disk and its tests run by you | its report saying success |
| Requirements met | a line-by-line check against the spec's success criteria | tests passing |
| Feature works | the real thing exercised (run it, call it, read the value) | compiling |

Check the real artifact, not a proxy: read the value, run the feature, inspect the diff. When a check fails, suspect your method of observing before you blame the system. Script a check you will repeat, and keep the script's output.

## Task-ready checklist

Run in order before setting a task `ready`; each item cites output:

1. Project commands: `scripts/run-verify` (workflow skill) prints PASS for typecheck, lint, test, plus `build` when the table has one. Stack discovery for repos with no table: [stack-discovery.md](stack-discovery.md).
2. Spec success criteria checked one by one; each has the command or observation that shows it.
3. Definition of Done: [definition-of-done.md](definition-of-done.md), the correctness, quality and integration items.
4. Clean tree: `git status` shows nothing uncommitted; `git log` shows the slices as atomic commits.
5. Review done (`code-review`): Critical and Important resolved or ruled.
6. Report: what was built, how it was verified (the commands and results), rulings made, anything unverified and why.

## Red flags

"Should work", "probably", "seems to"; satisfaction before the run ("Done!"); trusting a subagent's success report; a partial check standing in for the full one; "just this once". Each means: run the command.
