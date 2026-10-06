---
name: architect
description: "Sketch types, signatures and module structure before writing code, then fill in the code against the sketch. Use for code that crosses function boundaries, new modules, or design decisions with several viable shapes; scrap and redesign when implementation proves the sketch wrong."
---

# Architect

Design before implementing. Sketch types, function signatures, class shapes, and module boundaries with `not implemented` bodies and pseudocode. Design it twice, merge the better parts, then fill in code against the chosen sketch. If implementation proves the sketch wrong, throw it out and redesign.

## Start

Create a todo (or a checklist in `.workflow/`) with one entry per phase before starting.

1. Ground
2. Sketch
3. Agree
4. Implement
5. Scrap

## Phase A: Ground the problem

Build a real mental model of every system the new code touches. Load the `how` skill and run it over the relevant subsystems.

Naming a file isn't grounding. Produce the traced model `how` prescribes. If the design redefines ownership or layering, also run the `why` skill on the existing shape so the rationale becomes a constraint, not a guess.

Skip Phase A only when the work is genuinely greenfield with no surrounding system to integrate.

## Phase B: Sketch

Dispatch **two read-only subagents in parallel** (same model, different starting constraints), each producing a candidate design package from `references/runner-prompt.md`, the task, and the Phase A grounding files:

- Candidate 1: minimize the interface (1 to 3 entry points, most leverage per entry point).
- Candidate 2: optimize for the most common caller, making the default case trivial (or, when that is the same shape, design around ports and adapters for cross-seam dependencies).

Require two **structurally distinct** candidates before synthesis, even when the first looks sufficient: whole-shape alternatives, not point fixes inside one shape (the `principles` skill's section 7, and `codebase-design`'s `DESIGN-IT-TWICE.md` for the pattern). Each candidate is shaped per `references/rationale-template.md`.

Screen every candidate against [`references/design-red-flags.md`](references/design-red-flags.md). Assume the next contributor is an agent that sees only the files it opened, copies the nearest example, and takes the shortest path that compiles; prefer the design where a change that looks right from one file is right for the whole repo.

Compare viable candidates on interface depth: prefer the one that hides more complexity behind a smaller public surface (a rich interface can keep call chains short by concentrating capability). Pick a base, graft in the strongest parts of the other, and write the choice into the rationale's "Synthesis decision" section: which candidate became the base and why, what was adapted from the other, what was rejected and why.

## Phase C: Agree (opt-in)

Default: proceed directly to implementation with the synthesized design. No human checkpoint.

Opt in to a checkpoint when the invoker explicitly asks: "/architect with checkpoint," "stop and show me before implementing," or similar. Then surface the synthesized design and pause for sign-off.

The synthesis can ship as its own commit either way, as the "scaffold first" mode of `principles` section 2. Planned and scoped breakage during fill-in is fine, per `principles` section 7. For adversarial pressure on the design before implementing, use `doubt-driven-development` on the synthesized sketch.

If the human pushes back on the shape (in a checkpoint or after the fact), treat that as Phase A evidence. Re-ground and re-run Phase B before writing more code.

## Phase D: Implement against the sketch

Replace `not implemented` bodies with code, pseudocode with logic. The synthesized sketch is the contract.

Deviations from the sketch are signal worth surfacing, not friction to absorb silently. If a function needs a parameter the sketch didn't anticipate, ask whether the sketch was wrong, the requirement was missed, or the implementation is overreaching.

## Phase E: Scrap when the architecture is wrong

If implementation keeps producing friction the sketch can't absorb, throw the sketch out. Don't bolt fixes onto a wrong design, per `principles` section 7 and `debugging`.

The signal is a *pattern*, not single instances. Tells:

- The same shape of workaround appearing repeatedly across unrelated code.
- Multiple unrelated edge cases that all need special-case branches.
- Types that need escape hatches (`any`, casts, optional fields always set in practice) to compile.
- The "we need a lock" reflex when the sketch said the state wasn't shared.
- Callers having to know the abstraction's internal rules to use it.
- Two or more independent Phase D deviations of the same shape across the implementation.

Use judgment. A few edge cases don't condemn an architecture. Some problems are legitimately complex. Complexity in the data is not complexity in the design.

When you scrap:

1. Re-run the `how` skill over what's been built.
2. Redesign as if the new constraints had been day-one assumptions, per `principles` section 7.
3. Subtract before adding, per `principles` section 1. The new sketch should be smaller than the old one before it grows.
4. Return to Phase B and design again.

## Outputs

The caller's usage is written first and the type sketch derived from it. One file with new types and signatures for small changes. Module map plus type definitions for larger work. The rationale ships alongside, shaped per `references/rationale-template.md`, including the usage sketch and the synthesis decision.
