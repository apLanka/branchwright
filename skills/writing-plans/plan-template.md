# Plan template

````markdown
# <Feature> implementation plan

**Goal:** one sentence.
**Architecture:** two or three sentences on the approach.
**Stack:** key technologies.
**Spec:** <issue URL or path> (the plan argues from it; executors read both)

## Global constraints

The spec's project-wide requirements (version floors, dependency limits, naming and copy rules, platform requirements), one line each with exact values copied from the spec. Every task includes this section implicitly.

## Review focus

The inputs or failure modes the spec implies but no task's tests cover, most likely to bite first, one line each. Each line has its pinning test in the task that owns the code.

---

## Task 1: <component>

**Files:**
- Create: `path/to/new_file.py`
- Modify: `path/to/existing.py` (the function or region)
- Test: `tests/path/test_new_file.py`

**Interfaces:**
- Consumes: exact signatures this task uses from earlier tasks
- Produces: exact names, parameters and return types later tasks rely on (an implementer sees only its own task; this block is how it learns neighbours' names)

- [ ] **Step 1: write the failing test** `test_<behavior>` asserting <literal values from the spec>
- [ ] **Step 2: run it, expect FAIL** with `<command>`: "<expected failure>"
- [ ] **Step 3: implement** `name(params) -> Return` in `path`: one line on approach where signature and test leave a choice
- [ ] **Step 4: run it, expect PASS** with `<command>`
- [ ] **Step 5: commit** `<type>(<scope>): <summary>`
````

## What a step contains

- **Test step:** the test's name and assertions as code, with the spec's exact values.
- **Code step:** the exact signature, the file, and the values the spec pins. The implementer writes the body; a body appears only for an algorithm the signature and tests do not determine, or for exact copy the spec fixes.
- **Verification step:** the command and the output that means pass.
- **Reference to another task:** that task's Interfaces block says what to use; do not repeat its code.

Commands come from `AGENTS.md`; the plan does not restate them beyond the focused test command per step.
