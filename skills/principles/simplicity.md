# 1. Simplicity

Most result with the least code and complexity. Subtract before you add.

- **Prefer deletion.** On a refactor or improvement, look for removals before additions. Remove dead code, redundant validators and stub references first, then build on the simpler base; cut before you polish.
- **Smallest diff** that solves the problem. Fewer lines beat elegant boilerplate. Design for observed usage, not speculative edge cases; no validators, parsers or guards beyond what the spec demands.
- **Flat call hierarchy.** If answering a question means tracing more than three files or layers, flatten. A rich interface hiding substantial work is not a deep chain.
- **One source of truth.** Do not repeat a choice in several places: decide once, pass the result as a simple value.
- **Question the threading.** A new signal passed through types, schemas and pipelines needs a more direct path first.
- **Sweat small leaks.** Remove one-caller wrappers, pass-throughs, representation leaks and duplicated choices before they spread.
- **Reader load has two axes:** layers to trace and state to hold. Collapse layers that cost more than they save (wrappers with one caller, adapters with no second implementation). Shrink state scope: pure returns over mutation, locals over fields, fields over module state, module state over globals; derive rather than sync. Name an invariant at the boundary once so consumers need not.
- Before adding a layer or piece of state ask: does it reduce reader load elsewhere by at least as much?

**Test:** would a new maintainer answer "where does X come from?" and "what can change X?" in 30 seconds? Would a developer find the result exhausting to maintain? If so, cut layers or state.
