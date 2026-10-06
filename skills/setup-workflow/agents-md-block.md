## Workflow

This repo uses the opencode workflow. Start every task with the `workflow` skill.

## Commands

The commit gate, `verification-before-completion` and the plugin read this table. A command of `-` means the repo has none.

| Purpose | Command |
|---|---|
| test | <command> |
| typecheck | <command or -> |
| lint | <command or -> |
| format | <command or -> |
| build | <command or -> |

## Docs

- Issue tracker: GitHub through `gh`. See `docs/agents/issue-tracker.md`.
- Domain docs: single-context. See `docs/agents/domain.md`.
