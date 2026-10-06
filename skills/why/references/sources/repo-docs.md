# Playbook: documents in the repository

Search the repo's own prose for rationale.

- `docs/adr/` and any `adr/` or `decisions/` folder; `GLOSSARY.md`; `README`, `ARCHITECTURE`, `CONTRIBUTING`, `CHANGELOG`, `docs/`, design notes, RFC folders.
- Comments and docstrings near the target, and `TODO`, `FIXME`, `HACK`, `NOTE` lines with a reason.
- Commit trailers and test names that state intent (`test_rejects_empty_title_because_...`).
- `.workflow/` notes if present (specs, handoffs, decision logs).

Method: grep for the symbol, the feature name and its synonyms (use the glossary), then read the whole document around each hit, not the matching line alone. Record the file path and heading for every quote, and the queries that found nothing. A doc that predates the code or contradicts it is a finding; date it with `git log -1 --format=%ad -- <file>`.
