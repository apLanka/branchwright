# High-risk mode

Use for changes where a miss is expensive and hard to undo: authentication and authorization, payments, data migrations or deletes, concurrency and shared state, parsing of untrusted input, public API or wire-format changes, anything that cannot be rolled back with a revert.

Dispatch **three reviewers on the same diff in the same step**, each with the common rules from [reviewer-prompt.md](reviewer-prompt.md) and one lens. The lenses differ; the model does not.

| Lens | Question it answers |
|---|---|
| Correctness and concurrency | What input or interleaving makes this wrong? Trace the call chain for every possible failure. Idempotence, retries, races, ordering, partial failure. |
| Security and boundaries | What can an untrusted caller do? Validation at the boundary, injection, authorization, secrets, error leaks, unsafe defaults, data exposure. |
| Simplicity and reader load | Is this the smallest design that solves it? Layers to trace, hidden state, dual paths left alive, speculative generality, a fix at the wrong layer. |

Add to each prompt: "Assume the author is overconfident. Find what is wrong; do not validate or summarize. If you find nothing after thorough examination, say so and show what you checked."

## Synthesis (you are the lead, not a vote counter)

1. Parse all findings; merge duplicates and note which lenses raised each. A finding raised by two lenses weighs more.
2. Verify each against the code yourself before accepting it. Accepted, rejected (with the evidence), or deferred.
3. Collect the three "Declined to judge" lists; rule on each line (`Ruling:`), none is dropped silently.
4. Feed accepted findings into the normal fix loop (severity, 3-round cap). Present rejected ones with reasons in the report.
