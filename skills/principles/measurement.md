# 6. Measurement

A measured number is a claim about a system. Before you trust, report or act on it, find what limits it and rule out that it measured something else. A broken run still prints a plausible number: failed requests, a cache that skipped the work, code that never ran, one side left on defaults, run-to-run noise.

- **Ask "why not double?"** Name the resource or code path that bounds the result (a core, a lock, the disk, the network, the load generator). Take it from a profile or counters during a run, mapped to source; a guess from reading code is not a limiter.
- **List what else the number could be measuring** (errors, skipped or cached work, an untuned side, noise, a piece too small to matter end to end) and rule out each with evidence.
- **Keep the evidence with the number:** run count, spread and the limiter, in the notes or a linked artifact.
- For a performance number run the full checklist in `performance-optimization` when enabled. For an eval result ask the same of the trials: did every run do the task, does the gap hold across trials, does the scenario matter.

You skipped this when a number has no run count, no spread or no named limiter, or when the time saved exceeds the time the changed piece took.
