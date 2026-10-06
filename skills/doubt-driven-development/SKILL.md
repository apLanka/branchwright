---
name: doubt-driven-development
description: Cross-examine non-trivial decisions with a fresh-context adversarial reviewer before they stand. Use when about to commit branching or boundary-crossing logic, assert something the compiler cannot verify (thread safety, idempotence, ordering), make an architecture call under uncertainty, or touch irreversible things.
---

# Doubt-driven development

A confident answer is not a correct one: long sessions turn assumptions into "facts" unnoticed. This is an in-flight posture, not a verdict on a finished artifact (that is `code-review`). A fresh-context reviewer, told to disprove, cross-examines the decision while changing course is still cheap.

Apply it to **non-trivial** decisions: they add or change branching logic; cross a module or service boundary; assert a property the type system cannot verify; depend on context a future reader cannot see; or are irreversible (migration, public API, deploy). Skip it for renames, formatting, file moves, one-line obvious fixes, reading code, and running tools. Doubting every keystroke ships nothing.

Run it from the main session (a subagent cannot spawn another); if you are inside a subagent, report the doubt to the main session instead.

## Cycle

1. **Claim.** Write the decision in two or three lines plus why it matters: `CLAIM: the cache is safe under the read-heavy load in the spec. MATTERS: a race corrupts user data.` If you cannot write it that compactly it is a vibe: sharpen it.
2. **Extract** the smallest reviewable unit: the diff or function, or the proposal in 3 to 5 sentences with its constraints, plus the contract it must satisfy. Strip your reasoning; conclusions invite agreement. Over 300 lines? Decompose first. Save artifact and contract to `.workflow/doubt/<n>.md`.
3. **Doubt.** Dispatch a fresh, read-only subagent with this prompt, passing the artifact and the contract **but not the claim**:
   ```
   Adversarial review. Find what is wrong with this artifact. Assume the author is overconfident. Look for unstated assumptions, unhandled edge cases, hidden coupling or shared state, ways the contract can be violated, conventions it may break, failure modes under unexpected input. Do not validate or summarize. Find issues, or state that you cannot find any after thorough examination and show what you checked.
   ARTIFACT / CONTRACT: <paths>
   ```
4. **Reconcile.** Classify every finding against the artifact text: real (fix it), contestable (rule with evidence, `Ruling:`), noise (say why). Check claims against the code yourself before accepting or rejecting.
5. **Stop** when findings are trivial, after 3 cycles, or when the user says to move on. After the third cycle, record what stands and what was ruled.

## Pitfalls

- Handing over the claim biases the reviewer toward agreement.
- Treating "no findings" as proof: it is one more piece of evidence.
- Doubting what the compiler or a test already proves.
