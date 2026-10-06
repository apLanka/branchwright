# Seams and deep modules

Short vocabulary for choosing where tests go. Use these words exactly. When the `codebase-design` skill is enabled, load it for the full treatment (deepening, design-it-twice).

- **Module**: anything with an interface and an implementation (function, class, package, slice).
- **Interface**: everything a caller must know: signature, invariants, ordering, error modes, configuration, performance traits.
- **Seam**: a place where behavior can be observed or altered without editing in place; where a module's interface lives. Tests live at seams, never against internals.
- **Adapter**: a concrete thing that satisfies an interface at a seam (the Postgres repo; the in-memory fake).
- **Depth**: how much behavior a caller (or test) gets per unit of interface learned. Deep: much behavior behind a small interface. Shallow: interface nearly as complex as the implementation.
- **Leverage / locality**: what depth gives callers (more capability per unit learned) and maintainers (change, bugs and checks concentrate in one place).

## Choosing seams

- Prefer an existing seam over a new one; prefer the highest seam that reaches the behavior. The ideal number of new seams is one.
- The interface is the test surface. If the test needs to reach past the interface, the module has the wrong shape; fix the shape.
- One adapter means a hypothetical seam; two adapters means a real one. Add a seam only where something varies across it.
- Deletion test: if deleting the module would only move complexity to its callers' one-liners, it was a pass-through.

## Designing for testability

- Accept dependencies, do not create them inside (`process(order, gateway)`, not `new StripeGateway()` inside).
- Return results rather than mutating (`discount(cart) -> Discount`).
- Keep the surface small: fewer methods and parameters mean fewer tests and simpler setup.
