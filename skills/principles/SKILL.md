---
name: principles
description: Engineering principles for design and refactoring decisions. Use when shaping code structure, deciding how much to build, handling shared state or retries, validating at boundaries, measuring performance, or reworking a design when a requirement changes.
---

# Principles

Seven short sections; load the one the situation names, not all. Each ends in a test you can apply.

| Situation | Section |
|---|---|
| About to add a layer, abstraction, flag threaded through types, or a big diff; code is hard to trace | [1. Simplicity](simplicity.md) |
| Writing stateful logic, branching on a shape in many files, choosing core types and the order of scaffold and feature | [2. Domain and data shape](domain-and-data.md) |
| Wiring validation, error handling, adapters, framework glue | [3. Boundaries](boundaries.md) |
| Any non-trivial edit, migration, analysis or check you could do by hand | [4. Build the lever](build-the-lever.md) |
| Concurrent actors write the same file, branch or key; commands that retry or crash halfway | [5. Shared state and retries](shared-state-and-retries.md) |
| About to trust or report a measured number (speedup, latency, eval score) | [6. Measurement](measurement.md) |
| A new requirement lands on an existing design; two fixes sharing a premise failed; a planned migration; a new API beside an old one | [7. Redesign and migration](redesign-and-migration.md) |

Principles that live elsewhere: root causes in `debugging`; real-artifact checks in `verification-before-completion`; testing behavior in `tdd`; type discipline in the TypeScript and Python skills; encoding repeated lessons as structure in `correct`; small verifiable units in `atomic-commits`; context discipline in `context-engineering`.
