# TDD anti-patterns and rationalizations

Load when writing or changing a test, adding a mock, or tempted to skip a step.

## Name the break

Before the test body, name the production change that should make it fail, and whether that change is a bug or a decision.

- **Mirror assertion.** The expected value is computed by the code under test or its helpers. Replace it with a hand-derived literal.
- **Change detector.** Only an intentional decision can fail it (a constant's value, exact wording, private structure). Test the behavior that depends on the decision: not `MAX_RETRIES == 5`, but "a failing call is retried 5 times, and a 6th attempt never happens."
- **Absence-only.** `not.toThrow`, `toBeDefined`, `toEqual([])` alone. Assert the presence on the other input in the same test.
- **Fixture asserts fixture.** The subject never runs inside the body.
- **The framework's test.** Asserting that your router calls a registered handler tests the router. Test the contract at your boundary (the route you register, the query you emit).
- **The check:** would the test still pass if every function it imports returned `undefined`? If so, it observes nothing.

## Exercise the real thing

- A mock earns no assertions. If the mock is what you assert on, unmock it or delete the assertion.
- Mock at the right level: learn the real method's side effects first; mock the slow or external operation and keep what the test depends on real.
- Make doubles specific: give each branch (success, error, malformed) its own fixture so a wrong branch cannot satisfy the expectation.
- Mirror real data completely; a partial mock hides breakage in code that reads the omitted field.
- Production classes carry production methods only. Test-only cleanup lives in test utilities.
- When mock setup outgrows the test, switch to an integration test with real components.

## Rationalizations

| Excuse | Reality |
|---|---|
| "Too simple to test" | Simple code breaks; the test takes seconds. |
| "I'll add tests after" | A test written after passes at once and proves nothing; you never saw it fail. It also checks the cases you remembered, not the ones the test would have found. |
| "I tested it by hand" | Manual runs leave no record, cannot re-run, and skip cases under pressure. |
| "Deleting the code wastes the hours" | The hours are spent either way. Code you cannot trust is the waste. |
| "Keep it as reference, then write tests" | You will adapt it, which is testing after. Delete it. |
| "I need to explore first" | Fine. Throw the exploration away, then start with the test. |
| "The test is hard to write" | A hard test means a hard interface. Simplify the interface. |
| "I must mock everything" | The code is too coupled. Inject dependencies. |
| "TDD slows me down" | It catches the bug before the commit, not in review. |
| "The existing code has no tests" | You are changing it; add a test for the part you change. |

## Red flags: stop and restart the slice

Code before the test; the test passes on its first run; you cannot say why it failed; "just this once"; "it is about the spirit, not the ritual."

## Checklist before the last commit

- [ ] Every new function or behavior has a test that failed first, for the expected reason
- [ ] Minimal code to pass each test; no speculative features
- [ ] Tests use real code; mocks only at system boundaries
- [ ] Edge cases and error paths are covered
- [ ] Output is pristine (no warnings or stray logs); the full suite passes
- [ ] Every test is at a confirmed seam

## When stuck

| Problem | Move |
|---|---|
| Do not know how to test it | Write the call you wish existed, then the assertion, then the code. |
| Test too complicated | The design is too complicated; simplify the interface. |
| Setup is huge | Extract helpers; still huge means simplify the design. |
