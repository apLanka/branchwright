---
name: grilling
description: Interview the user relentlessly to reach shared understanding of a plan, design or idea. Use at the start of Tier 2 and 3 work, before the spec, or whenever the user wants to stress-test their thinking or says grill.
---

# Grilling

Interview until you and the user share one understanding. Map the idea as a **design tree**: every decision branches into the decisions that hang off it. Facts are your job (look them up); decisions are the user's (ask, with a recommendation).

## Steps

1. **Orient.** Read the relevant code, `GLOSSARY.md`, ADRs and the issue or request text. State a hypothesis of what the user wants, with a confidence number. Done when you can say what you believe and how sure you are.
2. **Compute the frontier**: every decision whose prerequisites are settled, the questions you can ask now without guessing answers you have not heard.
3. **Ask the whole frontier in one round**, numbered, each with your recommended answer:
   ```
   Q1 - <title>: <question, with options when it helps>
   Recommended: <answer and why>
   ```
   Then wait for the answers. A question that depends on an open one waits for a later round.
4. **Look up facts yourself.** When a frontier question needs a fact from the environment (a file, a tool, behavior), dispatch a subagent or read it; do not ask the user. Ask the rest of the frontier now; only questions downstream of the lookup wait for it.
5. **Listen for "want versus should want".** When an answer sounds like what the user thinks they ought to say, ask what they would pick if nobody was watching. Restate their intent in their own words and ask for a plain yes.
6. **Keep the domain model current** with `domain-modeling` as terms get resolved.
7. **Recompute the frontier** after each round and repeat. Done when the frontier is empty: every branch visited, nothing assumed silently, and the user has confirmed the shared understanding in words ("yes, that's it"), not by silence.

Reversible implementation details are not questions for the user: pick one, note it, move on. Ask about product direction, scope, trade-offs with real cost, and anything the repo cannot answer.

Do not act on the result (no spec, no code) until the user confirms. In Tier 2 the next step is `spec`.
