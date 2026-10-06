# Stack discovery

The verification loop is universal; the commands are not. Use the repo's own, in this order of trust (what gates merges wins):

1. The `## Commands` table in `AGENTS.md` (read with `scripts/project-commands`).
2. CI workflows (`.github/workflows/*.yml`): the commands they run on pull requests.
3. Task runners: `Makefile`, `justfile`, `package.json` scripts, `pyproject.toml` tool tables, `tox.ini`, `noxfile.py`.
4. Checked-in wrappers over global tools (`make test`, `./scripts/check`).
5. README and CONTRIBUTING.

## Recognize

| Signal | Test | Typecheck | Lint |
|---|---|---|---|
| `package.json` (pnpm, npm, yarn, bun) | `scripts.test` (vitest, jest, node --test) | `tsc --noEmit` or `scripts.typecheck` | `scripts.lint` (eslint, biome) |
| `pyproject.toml` / `uv.lock` | `pytest` (via `uv run`, `poetry run`, or the venv) | `pyright` or `mypy` | `ruff check` (+ `ruff format --check`) |
| `Makefile` | `make test` | `make typecheck` | `make lint` |

Find how to run **one test file** and **one test name** too; the loop needs them.

When AGENTS.md has no table, run `setup-workflow`; until then say which commands you used and where you found them. Never assume a default like `npm test`: a pytest or Gradle project has its own.
