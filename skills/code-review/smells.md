# Smell baseline

A fixed set of code smells (Fowler, *Refactoring*, ch. 3) the Standards reviewer applies even when the repo documents nothing. Two rules: the repo overrides (where it endorses something here, suppress the smell), and each smell is a labelled judgement call ("possible Feature Envy"), never a hard violation. Skip what tooling enforces.

Each reads *what it is* → *fix*.

- **Mysterious Name**: a function, variable or type whose name hides what it does or holds. → rename; if no honest name comes, the design is murky.
- **Duplicated Code**: the same logic shape in more than one hunk or file. → extract the shared shape, call it from both.
- **Feature Envy**: a method reaching into another object's data more than its own. → move it onto the data it envies.
- **Data Clumps**: the same few fields or parameters travelling together. → bundle them into one type.
- **Primitive Obsession**: a primitive or string standing in for a domain concept. → give it a small type.
- **Repeated Switches**: the same switch or if-cascade on one type recurring across the change. → polymorphism, or one map both sites share.
- **Shotgun Surgery**: one logical change forcing scattered edits across many files. → gather what changes together into one module.
- **Divergent Change**: one module edited for several unrelated reasons. → split so each changes for one reason.
- **Speculative Generality**: abstraction, parameters or hooks for needs the spec does not have. → delete; inline until a real need appears.
- **Message Chains**: `a.b().c().d()` navigation the caller should not depend on. → hide the walk behind one method.
- **Middle Man**: a class or function that mostly delegates. → cut it, call the target directly.
- **Refused Bequest**: a subclass that ignores or overrides most of what it inherits. → composition over inheritance.
