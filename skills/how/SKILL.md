---
name: how
description: Explain how a part of the codebase works at the level of a senior engineer onboarding to it. Use for "how does X work", code walkthroughs before changing something, and placement, ownership or layering questions.
---

# How

Answer "how does X work?" with an explanation that builds a working mental model: enough to change the code confidently, not so much that it reads as annotated source. For intent and history ("why is it like this?") use `why`.

## Steps

1. **Assess complexity.** If the scope is ambiguous, state your interpretation and explore; the user can redirect.
   - **Simple** (one module, a small utility, a narrow question): no explorers. One explainer explores and explains in one pass (step 3).
   - **Complex** (a subsystem across files or services, a cross-cutting feature, an architectural overview): explore in parallel first (step 2).
   When in doubt, take the simple path.
2. **Explore (complex only).** Split the question into 2 to 4 distinct angles (slices of the subsystem). Dispatch one read-only subagent per angle in the same step, each with [references/explorer-prompt.md](references/explorer-prompt.md) and its angle filled in. Done when every explorer has reported.
3. **Explain.** Dispatch one fresh read-only subagent with [references/explainer-prompt.md](references/explainer-prompt.md): the question, plus all explorer findings when step 2 ran. It writes the explanation.
4. **Present** the explanation. Light edits for clarity or conversation context are fine; do not substantially rewrite it.

## Output

The sections in `references/explainer-prompt.md`, dropping those that do not apply: Overview, Key Concepts, How It Works, Where Things Live, Gotchas. Use the project's glossary words and cite `file:line`.
