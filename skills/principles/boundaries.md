# 3. Boundaries

Validate, narrow and handle errors at system boundaries; trust internal code. Business logic lives in pure functions; the shell is thin and mechanical.

- **At boundaries** (CLI args, config files, external APIs, network protocols, database rows): validate, parse into named domain types, return or raise clear errors, handle defensively.
- **Inside:** typed data, error propagation, no re-validation, no redundant null checks deep in call chains once the boundary validated.
- **Across a boundary** expose domain concepts, not its private representation: do not re-export transport, storage, framework or wire types through the public surface. Keep general-purpose mechanism inside and special-purpose policy at the edge.
- **Organization:** business logic in pure functions with no framework dependencies, so it tests without the framework; parse functions are pure transforms from raw input to typed state; the shell wires, it does not decide.
- Scattered validation is noise and a false sense of safety.

**Test:** can you point to the one place each input is validated? Can the business logic run in a test with no framework started?
