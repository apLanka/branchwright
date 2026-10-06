# Domain docs

How skills read this repo's domain documentation.

## Before exploring, read

- `GLOSSARY.md` at the repo root, or `GLOSSARY-MAP.md` (points to one `GLOSSARY.md` per context; read the relevant ones).
- `docs/adr/` entries that touch the area you are about to change. In multi-context repos also `src/<context>/docs/adr/`.

When these files do not exist, continue without comment. The `domain-modeling` skill creates them when a term or decision is actually resolved.

## Layout

Single context (default):

```
GLOSSARY.md
docs/adr/0001-<decision>.md
```

Multi-context (a root `GLOSSARY-MAP.md` exists): one `GLOSSARY.md` and `docs/adr/` per context, system-wide ADRs in the root `docs/adr/`.

## Use the vocabulary

Name domain concepts as `GLOSSARY.md` defines them in issues, specs, plans, tests and commit messages. A missing term means either invented language (reconsider) or a gap (hand to `domain-modeling`).

## Flag ADR conflicts

When work contradicts an ADR, say so: "Contradicts ADR-0007 (<title>), but worth reopening because ...". Do not override it silently.
