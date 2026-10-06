---
name: setup-workflow
description: One-time setup of a repository for the workflow. Use when a project has no "## Commands" table in AGENTS.md, the user asks to set up or reconfigure the workflow, or the first task in a new repo starts.
---

# Setup workflow

Prepares one repository: the `.workflow/` state directory, the `AGENTS.md` block with the project's commands, the issue-tracker and domain docs, and the optional-skill choice. Explore first, confirm, then write. Safe to re-run.

## Steps

1. **Explore.** Read, do not assume:
   - `git remote -v`: GitHub remote? which repo? default branch (`<workflow skill dir>/scripts/default-branch`).
   - `AGENTS.md` or `CLAUDE.md`: existing `## Workflow` or `## Commands` sections.
   - Manifests and CI: `package.json` scripts, `pyproject.toml` (ruff, pyright/mypy, pytest sections), `Makefile`, `.github/workflows/*.yml`.
   - `GLOSSARY.md`, `GLOSSARY-MAP.md`, `docs/adr/`, `docs/agents/`.
   - `opencode.json` / `opencode.jsonc` in the repo root.
   Done when you can list, for test, typecheck, lint, format and build, the command the repo already uses, or "none".
2. **Draft.** Fill [agents-md-block.md](agents-md-block.md) with the discovered commands, taking them from CI first (what gates merges), then manifests. Use `-` for a missing one. Done when every row holds a command you have seen in the repo or `-`.
3. **Confirm with the user** in one message: the Commands table, the issue tracker (GitHub, from the remote), the domain layout (single-context unless the repo is a monorepo with several contexts), and which optional skills to enable. Done when the user has answered or accepted the defaults.
4. **Write.**
   - Edit the existing `AGENTS.md` (or `CLAUDE.md` when that is the one that exists); create `AGENTS.md` otherwise. Replace an existing `## Workflow` block in place; leave the rest of the file alone.
   - Copy [issue-tracker-github.md](issue-tracker-github.md) and [domain.md](domain.md) to `docs/agents/`.
   - Run `scripts/setup-repo --docs`: creates `.workflow/`, excludes it through `info/exclude`, creates the `ready-for-agent` label when `gh` and a GitHub remote exist.
   Done when `git status` shows only `AGENTS.md` and `docs/agents/*` as new or changed.
5. **Enable optional skills** the user chose by editing the repo's `opencode.json` `permission.skill` block: set the chosen names to `allow` (or delete their lines), together with their dependencies: `wayfinder` + `research` + `prototype`; `retro` + `writing-for-agents`; `tdd` works without `codebase-design` but loads it when enabled. Done when the file parses as JSON and names only skills that exist.
6. **Prove it.** Run `<workflow skill dir>/scripts/run-verify`. Done when it prints PASS for each configured command (or you report the failing one).
7. **Report** what was written and which commands the commit gate will run. Commit the new files as one commit on a task branch (`chore/setup-workflow`) with `atomic-commits`.

## Rules

- Ask only what you cannot observe. A command that exists in CI is not a question.
- Never overwrite a user's `AGENTS.md` content outside the `## Workflow` block.
- Do not push anything. Pushing follows `finish-task` like any other task.
