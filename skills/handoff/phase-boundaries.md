# Phase boundaries

A phase ends when you think "ok, done with that" (grilling, implementation, review). The boundary between phases is the only place to decide how to carry context. Mid-phase there is nothing to decide: continue, or split what remains into subagents; compacting mid-phase loses the thread.

Work down this list at the boundary; the first yes wins.

1. **Continue in this session?** Yes when the next phase needs this one as a primary source (grilling into implementation wants the reasoning verbatim), or when enough window remains for the next phase to fit. Continuing is free and loses nothing; rule it out first.
2. **Is everything here disposable?** Then clear: start a clean session. Cheap, but one-way: clearing relevant context loses the why behind what was built, and reading the diff does not bring it back.
3. **Must the work travel?** Write a handoff (`handoff` skill) only for: a new tool, a new directory or repo, a colleague, or forking a side task found mid-phase. It buys portability.
4. **Can a subagent do it unattended?** A tightly scoped task (a review, a lookup, a bounded implementation) goes to a subagent; this session stays untouched.
5. **Otherwise compact:** relevant context, same tool, same directory, you stay in the loop. Give the compaction an instruction so the summary keeps what the next phase needs. It is the default, not the first reach: the questions above are cheaper or more precise, and a summary can flatten a decision.

Every move except continuing turns a primary source (the session as it happened) into a secondary one (a summary of it): less noise and more room, but lossy. That is why continuing comes first.
