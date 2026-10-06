# 4. Build the lever

When the work is not trivial, build the tool that does it or proves it (a codemod, script, generator, rerunnable check) instead of working by hand. Throughput: it does the work the same way every time and reruns free. Confidence: a reviewer can read and rerun one artifact, where hand edits can only be redone.

- Do the first unit by hand to learn the recipe; then build the tool; prove it by rerunning it on that unit and diffing against your hand version. Make it safe to rerun.
- Codemod or script for edits, generator for repetitive files, a query over a dump for analysis, a rerunnable check for verification.
- A deterministic lever beats fan-out: if one pass of a script handles every unit, run it yourself; do not give subagents hand edits a script can do.
- When you do fan out, write the recipe, the verification contract and the do-not-touch fences as one file the delegates read, outside their write scope.
- Smallest script that does or proves the job, never a framework. Skip the lever only for a couple of edits visible at a glance.
- Applying this principle produces a file. If you cite it and the diff has no script, you did not apply it. Commit the lever when the work outlives the session.
