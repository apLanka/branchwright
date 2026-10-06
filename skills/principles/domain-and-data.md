# 2. Domain and data shape

Get the data right before writing logic; encode the domain in a structure instead of scattering it across conditionals.

- **Data structures first.** Define core types early, trace every access pattern, choose structures that match the dominant paths. DRY the structure, not every line: three similar statements beat a premature abstraction. Explicit over clever.
- **Structure matches the domain:** a state machine instead of scattered booleans; a typed model instead of loose parameters; a map, registry or discriminated union instead of branching spread over files; a reducer or event model instead of ad hoc mutation; a module organized around one body of domain knowledge rather than a sequence (load, validate, transform, save: execution order is not ownership); a queue, index, graph or normalized collection where access patterns call for it. When none fits, work out what the code must never allow and how data is read, then find the structure that encodes exactly that.
- **Scaffold first.** Do first whatever helps every later phase: CI, lint, test infrastructure, shared types. Setup before features, tests before fixes. Subtract before scaffolding.
- **Concurrency corollary.** Before sharing state between actors ask what happens if another actor changes it concurrently; if the answer is not "nothing", isolate (section 5).
- Each increment lands a coherent abstraction or deepens one; do not spread a new capability across callers as special-case coordination.
- Prefer boring code when the current shape is clear, local and unlikely to grow. Be skeptical of an abstraction that adds indirection without removing branches, duplicated rules, invalid states or lifecycle risk.

**Sign you skipped it:** a feature that grows an if/else chain by one branch; a second boolean that must stay in sync with the first; phase-named modules repeating the same domain rules.
