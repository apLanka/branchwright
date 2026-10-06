---
name: why
description: Investigate why code is shaped the way it is - design rationale, a regression's origin, a postmortem, why a threshold or pattern exists. Use for "why does X work this way", "why did we pick Y", or before changing code whose reasons you do not know.
---

# Why

Companion to `how`: `how` says what the code does; `why` says which forces shaped it. Work as a careful, cautious investigator. Be honest about what you know against what you infer; follow [references/epistemics.md](references/epistemics.md) (confidence tiers and phrasing).

## Steps

1. **Parse the target and the question.** The target is code, a pattern, a feature or a named decision; the question is a rationale, trade-off, motivating edge case, external constraint, dead code, or a history sweep. For a vague ask, guess from context (open files, recent edits), state the interpretation in one line, and go on.
2. **Anchor in code.** Collect: file paths and line ranges, key symbols, the last commits touching them, PR numbers from `(#1234)` in subjects, linked issue numbers.
   ```
   git blame -L <start>,<end> <file>
   git log --follow -p -- <file>
   git log --oneline -20 -- <file>
   git log -S"<symbol>" --oneline          # when it appeared or vanished
   gh pr view <n> --json title,body,author,createdAt,mergedAt,labels,closingIssuesReferences,comments,reviews
   ```
   Done when you hold a seed context (paths, symbols, commits, PRs, issues).
3. **Dispatch investigators in parallel**, one subagent per source, read-only, each reading its own playbook; build each prompt from [references/investigator-prompt.md](references/investigator-prompt.md):
   - **Code archaeology**: `references/sources/code-archaeology.md` (history, blame, renames, tests as intent, comments).
   - **GitHub**: `references/sources/github.md` (PRs, review threads, issues, reverts, incidents).
   - **Repo docs**: `references/sources/repo-docs.md` (ADRs, docs, changelog, glossary, comments).
   - **Other sources** only when the environment gives you a tool for them (an issue tracker or docs MCP, chat, error tracking): one investigator per tool, never one agent covering several. With no tool, record the category as "not searched" in the report, as a gap and not a choice.
   Skip a source only when it is provably irrelevant (state why). For a one-commit target whose PR body answers everything, you may answer inline after confirming the searches would be redundant; say so.
   Done when every investigator has reported, nulls included.
4. **Synthesize** with one fresh subagent using [references/synthesizer-prompt.md](references/synthesizer-prompt.md): findings with queries, the code anchor, the question, and the epistemics file. It spot-verifies citations read-only.
5. **Present** the synthesis without rewriting its confidence language. Output sections: The Question, The Code in Question, What We Found, What We Can Reasonably Infer, Competing Hypotheses, What We Don't Know, Sources Consulted, Confidence Summary.
6. **If the question precedes a change**, convert the lineage into a Preserve / Change / Avoid / Risk list the plan can use.

## Failure modes

- Recency bias: the current shape is often many earlier decisions; trace back.
- Mechanics read as motivation: a diff shows the change, not why.
- A neat story: if the fourth source contradicts three, the contradiction is the finding.
- Invention: a partial finding is labelled partial.
