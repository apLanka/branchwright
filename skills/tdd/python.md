# TDD in Python

The loop and seams are the same. Tooling defaults (use the repo's own when it differs): `pytest`, `pytest-cov`, `ruff`, `pyright` or `mypy`.

## Running

- One test: `pytest path/test_x.py::test_name -x -q`
- One file: `pytest path/test_x.py -q`
- Whole suite: the `test` row of the `## Commands` table.
- Stop at the first failure while looping (`-x`); drop it for the final run.

## Shape of a test

```python
def test_slugify_collapses_punctuation():
    assert slugify("Hello, World!") == "hello-world"
```

Plain `assert` with a literal on the right. Name the behavior, not the function.

## Tools

| Need | Use |
|---|---|
| Several inputs, one behavior | `@pytest.mark.parametrize("raw, want", [("a b", "a-b"), ...])`, with literal `want` values |
| Shared setup | a fixture returning a real object; scope it narrowly (`function` by default) |
| Temp files and dirs | `tmp_path` |
| Env vars, attributes, time | `monkeypatch`, only at system boundaries |
| Errors | `with pytest.raises(ValidationError, match="title"):` |
| Floats | `pytest.approx` |
| Async code | the repo's async plugin (`pytest-asyncio` or `anyio`); mark the test, await the real call |
| Properties over many inputs | `hypothesis` when installed: assert an invariant (round trip, idempotence), never a recomputation |

## Mocking

Prefer a small fake class with the same interface over `unittest.mock.patch` of internals. `patch` the boundary (HTTP client, clock, filesystem outside `tmp_path`), at the place where your module looks the name up (`patch("app.billing.client")`, not the library's own module). Use `create_autospec` or `spec=True` so a typo in the double fails.

## Common traps

- `assert mock.called` as the only assertion: observes nothing.
- A fixture that builds the expected value with the code under test.
- Tests that depend on order or on a shared database row: isolate with fixtures and transactions.
- `time.sleep` in a test: wait on the condition (see `debugging`, condition-based waiting).
- Global state set at import time: reset it in a fixture.
