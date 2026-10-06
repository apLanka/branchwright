---
name: domain-modeling
description: Build and sharpen the project's domain language and decision records. Use while grilling or designing, when a term is fuzzy or overloaded, when code and the user's words disagree, or when a hard-to-reverse decision should become an ADR.
---

# Domain modeling

The active discipline of sharpening the domain model while you design: challenge terms, test them against edge cases, and write them down the moment they settle. (Merely reading `GLOSSARY.md` for vocabulary is a one-line habit any skill has; this skill is for changing the model.)

## Files

Most repos have one context: `GLOSSARY.md` and `docs/adr/` at the root. If a `GLOSSARY-MAP.md` exists the repo has several contexts, each with its own `GLOSSARY.md` and `docs/adr/` beside the code, system-wide decisions in the root `docs/adr/`. Create files lazily, only when there is something to write.

## During the session

- **Challenge against the glossary.** When the user's term conflicts with `GLOSSARY.md`, say so at once: "The glossary defines cancellation as X, you seem to mean Y. Which?"
- **Sharpen fuzzy language.** Propose one canonical term for a vague or overloaded one ("account": Customer or User?).
- **Test with scenarios.** Invent concrete edge cases that force the user to say where one concept ends and another begins.
- **Cross-check the code.** When the user says how something works, check the code. Surface contradictions: "The code cancels whole orders, but you said partial cancellation exists."
- **Update `GLOSSARY.md` inline** the moment a term is resolved, in the format of [GLOSSARY-FORMAT.md](GLOSSARY-FORMAT.md). The glossary holds language only: no implementation details, specs or scratch notes.
- **Offer an ADR sparingly**, only when all three hold: hard to reverse; surprising without context; the result of a real trade-off between genuine alternatives. Format: [ADR-FORMAT.md](ADR-FORMAT.md). When one is missing, skip the ADR.

Done when every term used in the spec has one meaning, the glossary matches, and each qualifying decision has an ADR.
