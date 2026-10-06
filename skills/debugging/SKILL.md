---
name: debugging
description: Find and fix the root cause of a bug, failing test, build break, flaky test or performance regression. Use when something is broken, throwing, failing or slow, before proposing any fix.
---

# Debugging

A feedback loop first, then hypotheses, then a fix at the root. Without a command that goes red on this bug, theorizing is guessing.

Read `GLOSSARY.md` (if present) and ADRs in the area. **Redact** secrets in everything you show (`<REDACTED>`); build loops against environment variables so the credential stays in the environment.

## 1. Build a feedback loop

Spend most of the effort here. Choose the first that fits, in order:

1. A failing test at the seam that reaches the bug.
2. A curl or HTTP script against a running dev server.
3. A CLI call with a fixture input, diffed against a known-good output.
4. A headless browser script that asserts on DOM, console or network.
5. A replay of a captured request, payload or log through the code path.
6. A throwaway harness exercising the code path with one call.
7. A property or fuzz loop for "sometimes wrong".
8. A bisection harness (`git bisect run`) when it broke between two known states.
9. A differential run of old version against new.
10. A human-in-the-loop script (`scripts/hitl-loop.template.sh`) as the last resort.

Tighten it: faster (narrow the scope), sharper (assert the specific symptom), more deterministic (pin time, seed randomness, isolate the filesystem). For intermittent bugs raise the reproduction rate (loop it 100 times, add stress, narrow timing) until it is debuggable.

**Done when** you can name one command, already run once with its (redacted) output shown, that is red-capable (asserts the user's exact symptom), deterministic, fast (seconds) and runnable unattended. If you cannot build one, stop, list what you tried, and ask for access, a captured artifact, or permission to add temporary instrumentation. Do not theorize without a loop.

## 2. Reproduce and minimise

Run it red. Confirm it shows the symptom the user described (not a neighbour), repeatably. Then cut inputs, callers, config and steps one at a time, re-running after each, until **every remaining element is load-bearing** (removing any one makes it green).

## 3. Hypothesize

Write 3 to 5 ranked, falsifiable hypotheses: "If X is the cause, then changing Y makes the bug disappear." A hypothesis without a prediction is discarded or sharpened. Show the list in your report and proceed with your ranking; do not wait for an answer.

Read the error and stack trace completely, check recent changes (`git log`, `git diff`), compare against working code. When the failing symptom is deep in the stack, trace backward to the source: [root-cause-tracing.md](root-cause-tracing.md).

## 4. Instrument

Each probe maps to one prediction; change one variable at a time. Prefer a debugger or REPL; otherwise targeted logs at the boundaries that separate hypotheses, each tagged with a unique prefix (`[DEBUG-a4f2]`) so cleanup is one grep. For multi-component systems log what enters and leaves each boundary once, then read where it breaks. For performance, measure first (baseline timing or profile), then bisect; never "log everything and grep".

Test pollution (a test leaves files or state behind): `scripts/find-polluter.sh`. Flaky timing: replace arbitrary sleeps with [condition-based waiting](condition-based-waiting.md).

## 5. Fix and regress

1. Write the regression test **before** the fix, at a correct seam: one where the test exercises the real bug pattern as it occurs at the call site. Hand the failing test to `tdd`. If only a too-shallow seam exists, record that as a finding (the architecture is blocking the lock-down) and say so in the report.
2. Watch it fail. Fix the root cause with one change, no bundled refactor. Watch it pass.
3. Re-run the phase 1 loop on the original, un-minimised scenario.
4. Add validation at the other layers the bad value passed through: [defense-in-depth.md](defense-in-depth.md).

A guard that silences a crash (a null check, a try/catch) is a symptom fix. If a workaround needs a paragraph of comment to justify, fix the code.

## 6. Three failed fixes: question the architecture

Count fixes that did not hold. After the third, stop fixing. Each fix revealing a new coupling elsewhere, or needing a large refactor, means the design is wrong, not the hypothesis. Write up the evidence, state what you recommend, and report to the user. Do not attempt a fourth.

## 7. Clean up

- [ ] The original reproduction no longer fails (loop re-run, output shown)
- [ ] The regression test passes, or the missing seam is documented
- [ ] Every `[DEBUG-...]` line is removed (`grep` the prefix)
- [ ] Throwaway harnesses deleted or moved to a marked location
- [ ] The commit message states the hypothesis that proved correct and the cause

## Rationalizations

| Thought | Move |
|---|---|
| "Quick fix first, investigate later" | The first fix sets the pattern; build the loop. |
| "It is probably X" | Predict what changes if it is X, and test that. |
| "Several changes at once saves time" | You cannot tell which one worked. One variable at a time. |
| "I see the problem" | Seeing a symptom is not knowing its cause; trace it. |
| "One more attempt" (after two) | Three failures means architecture; stop. |
| "No root cause, it is the environment" | Ninety-five percent of these are unfinished investigations. When it is real: handle it (retry, timeout, clear error), add logging, and say what you ruled out. |
