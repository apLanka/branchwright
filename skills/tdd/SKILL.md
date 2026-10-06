---
name: tdd
description: Build behavior test-first, one vertical slice at a time. Use when implementing any feature, fixing any bug, or changing behavior, before writing the production code; applies to TypeScript and Python.
---

# Test-driven development

One loop: write a failing test at an agreed seam, make it pass with the least code, commit the slice. Repeat. The test is the proof that the behavior exists and the guard that keeps it.

Read `GLOSSARY.md` (if present) so test names use the project's domain words, and respect ADRs in the area you touch.

## Before the first test

1. **Discover the commands.** Take test, typecheck and lint from the `## Commands` table in `AGENTS.md`; learn how to run one test file and one test name. Done when you have run the focused command once and seen it work.
2. **Fix the seams.** A *seam* is the public boundary where behavior is observed (a function, route, CLI command, or module interface). Read the seams from the spec's Testing Decisions. With no spec (Tier 1), choose the highest existing seam that reaches the behavior, and record `Ruling: seam = <seam> — <why>`. Vocabulary and examples: [seams.md](seams.md). Done when the seams are written down and no test targets anything else.

## The loop (per slice)

1. **Red.** Write one test for one behavior, through the seam, with an expected value from an independent source (a literal, a worked example, the spec). Run it. Done when it fails for the expected reason (the behavior is missing, not a typo or import error).
2. **Green.** Write the least production code that passes. Run the focused test, then the neighbouring tests. Done when the focused test passes and nothing else broke.
3. **Commit** the slice with `atomic-commits` (test and code together).
4. **Next slice**, shaped by what this one taught you.

Rules:

- **Red before green.** Code written before its test is deleted, not adapted; implement it again from the test.
- **Vertical slices.** One test, one implementation, repeat. Writing all tests first tests imagined behavior.
- **Refactor** only while green, as its own commit.
- **Bugs.** Turn the minimised reproduction from `debugging` into the failing test, watch it fail, fix, watch it pass; then revert the fix once to see the test go red again (it proves the test can fail).
- **Typecheck regularly**, run single files often, and the full suite before the last commit of the task.

## What a good test is

It calls the code the way its users do and asserts what they observe, against a literal. It would fail if the behavior broke and survives any refactor that keeps behavior. Examples: [tests.md](tests.md). Mocking boundaries: [mocking.md](mocking.md). Traps, the rationalization table and the checklist: [anti-patterns.md](anti-patterns.md). Python specifics (pytest, fixtures, parametrize, property tests): [python.md](python.md).

## Done

Every new behavior has a test that failed first; the full suite, typecheck and lint pass (`verification-before-completion`); no test mocks the thing it claims to test.
