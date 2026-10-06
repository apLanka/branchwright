---
name: python-best-practices
description: Python best practices for typed, testable code. Use when reading or editing any .py file, adding a Python module, or reviewing Python changes.
---

# Python best practices

The type checker is a proof assistant: make illegal states unrepresentable, parse at the boundary, trust types inside. Follow the repo's own toolchain first (`AGENTS.md`, `pyproject.toml`); the defaults below apply when it is silent: `uv`, `ruff`, `pyright` (or `mypy`), `pytest`.

| Rule | Summary |
|---|---|
| Annotate | Full annotations on every public function, method and module-level variable. Strict mode for new code (`pyright --strict`-style settings, or `mypy --strict`). |
| Sum types | Model variants as a union of small frozen dataclasses (or `Literal` tag plus `TypedDict`/dataclass), not one class with optional fields. Match with `match` and end with `assert_never`. |
| Frozen data | `@dataclass(frozen=True, slots=True)` or `pydantic.BaseModel` with `frozen=True` for values. Mutation is a deliberate exception. |
| NewType | Brand semantic primitives (`UserId = NewType("UserId", str)`) and validate once where they are created. |
| `object` over `Any` | External data is `object` or `Unknown`, then parsed. `Any` only with a comment naming why. |
| Parse at the boundary | Validate with the repo's schema library (pydantic, msgspec, attrs, cattrs) into a named domain type; inside the system trust the type. No `dict[str, Any]` past the parse. |
| No `cast`, no `# type: ignore` | Each is a latent crash. Narrow with `isinstance`, a `TypeGuard`/`TypeIs` that actually checks, or validation. A suppression names the rule and the reason. |
| Exhaustiveness | `assert_never(x)` in the default arm so a new variant fails the type check. |
| Non-empty by construction | Take `(head, *rest)` or a small `NonEmpty` type instead of `list` plus a length check every caller repeats. |
| Protocols at seams | Depend on a `Protocol` for the behavior you need; pass collaborators in, do not construct them inside. |
| Explicit errors | Raise specific exceptions from a small hierarchy; catch at the boundary that can act. No bare `except`, no `except Exception: pass`. |
| Resources | `with` for files, locks, connections, temp dirs; `pathlib.Path` over string paths. |
| Pure core, thin shell | Business logic in pure functions returning values; I/O at the edges. |
| Imports and layout | Absolute imports; no import-time side effects; one module per concept; no circular imports (move the shared type). |
| Async | One event loop owner; never call blocking I/O in `async def`; await real conditions, not `sleep`; cancel and time out explicitly. |
| Real tests | Test through public seams with literal expectations; fakes over `patch`; see `tdd` (`python.md`). |
| Structured logging | `logging` with context ids, no `print` in shipped code, no secrets in messages. |

Examples: [references/patterns.md](references/patterns.md).
