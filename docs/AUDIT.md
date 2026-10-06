# Phase 1 audit

Scope: every `SKILL.md` in the four source repos (132 skills: Addy 25, Pocock 38, pstack 54, superpowers 15), plus each repo's scripts, reference files, and the superpowers opencode plugin. The four source folders are untouched. All new work lives in `branchwright/`.

Verdict key: **keep** (port with light edits), **adapt** (port with real changes), **merge** (becomes part of a named target skill), **drop** (not carried; reason given).

Environment facts used below (checked on this machine):

- opencode `v2.0.23` is installed, `gh` is logged in (`apLanka`, ssh), `node` 22, `python3`, `git` 2.50. `shellcheck` is absent, so scripts get `bash -n` plus a scratch-repo run.
- `~/.config/opencode` already loads superpowers through V2 `"plugins": [...]`. Phase 5 must disable it for the test project or the two workflows will collide.
- V1 plugin types are on disk (`@opencode-ai/plugin` 1.18.32): `tool.execute.before`, `tool.execute.after`, `command.execute.before`, `permission.ask`, `experimental.chat.messages.transform`, `experimental.session.compacting` all exist. V2 hook names are only known from the superpowers template (`ctx.skill.transform`, `ctx.session.hook("context")`). Whether V2 has a `tool.execute.before` equivalent is **unverified**; see D7.
- `opencode run` exists, so Phase 5 can drive end-to-end sessions headless.

---

## 1. Verdicts by source repo

### 1.1 superpowers (15)

| Skill | Verdict | Target | Reason |
|---|---|---|---|
| using-superpowers | drop | `workflow` | The router replaces it. Keep two ideas: "check for a skill before acting" and the process-over-implementation priority. Drop the 1%-chance-must-invoke zealotry (it fights tier scaling). |
| brainstorming | drop | `grilling` + `spec` | Visual companion, HTML mockups, and "ask the user to review the written spec" duplicate grilling + spec. Spec approval stays the one human gate. |
| writing-plans | merge | `writing-plans` | Base. Keep the header, Global Constraints, Interfaces blocks, step granularity, self-review, and proportion check. Add Addy's dependency graph and vertical slicing. **Deviation:** remove the "wait for user plan review and pick an execution method" step (see D3). |
| using-git-worktrees | keep | `using-git-worktrees` | Keep detection (Step 0), native tool first, ignore check, baseline tests. Remove the consent prompt (worktree is part of the Tier 2 path) and the "commit .gitignore" step (use `info/exclude`). |
| subagent-driven-development | adapt | `subagent-driven-development` | Base for the shared ledger, brief file, report file, and "rulings, not stalls". Strip model selection, "more capable model" escalation, and the five-round loop (now 3, see D5). Move artifacts to `.workflow/sdd/<plan>/`. |
| executing-plans | adapt | `executing-plans` | Same changes. Shares the ledger with SDD. Keep `task-start` and `task-done`. |
| dispatching-parallel-agents | keep | `dispatching-parallel-agents` | Remove nothing structural; add the shared-state rule from pstack `separate-before-serializing`. |
| test-driven-development | merge | `tdd` | Source of the anti-pattern list, rationalization table, and `writing-good-tests.md`. The "delete the code you wrote first" Iron Law stays as a stated rule, but not the all-caps tone. |
| systematic-debugging | merge | `debugging` | Keep root-cause tracing, defense in depth, condition-based waiting, `find-polluter.sh`, and the "3 failed fixes means question the architecture" rule. The four phases are replaced by Pocock's feedback-loop-first structure. Drop the test-pressure and CREATION-LOG files. |
| requesting-code-review | merge | `code-review` | Keep the reviewer template (strengths, Critical/Important/Minor, "declined to judge", read-only, "you do not dispatch subagents"). |
| receiving-code-review | keep | `receiving-code-review` | Keep as is, trimmed. |
| verification-before-completion | adapt | `verification-before-completion` | Keep the gate function and claim/evidence table. Add Addy's Definition of Done and stack discovery as sibling files. |
| finishing-a-development-branch | drop | `finish-task` | Its 3-option menu (merge locally, push, keep) contradicts the confirm-then-PR state machine. Keep only the worktree cleanup safety rules, moved into `finish-task`. |
| writing-skills | drop | (build-time) | 681 lines of skill-authoring method. Used as input for the validator and `writing-for-agents`, not shipped. |
| diagnosing-superpowers | drop | none | Superpowers-specific session forensics. |

### 1.2 Matt Pocock (38)

| Skill | Verdict | Target | Reason |
|---|---|---|---|
| tdd (+ tests.md, mocking.md) | merge | `tdd` | Base: seams, vertical slices, tracer bullets, red-before-green. Keep `tests.md` and `mocking.md`. |
| to-spec | merge | `spec` | Base template. Changes in section 3 (merged skills). |
| code-review | merge | `code-review` | Base: two axes, parallel read-only subagents, fixed-point diff, Fowler smell baseline. |
| diagnosing-bugs (+ hitl-loop script) | merge | `debugging` | Base: build a tight red-capable feedback loop first, 3-5 ranked hypotheses, tagged debug logs, cleanup list. |
| codebase-design (+ DEEPENING, DESIGN-IT-TWICE) | keep | `codebase-design` (hidden) | Remove "parallel sub-agents" model wording only. |
| domain-modeling (+ GLOSSARY-FORMAT, ADR-FORMAT) | keep | `domain-modeling` | |
| grilling | keep | `grilling` | Add Addy `interview-me` ideas: confidence stop, "want vs should want". |
| grill-with-docs, grill-me | drop | `workflow` | One-line wrappers. `workflow` and `spec` call `grilling` and `domain-modeling` directly. |
| handoff | merge | `handoff` | Base for write mode. Change the target from the OS temp dir to `.workflow/handoff/`. |
| pr | keep | `pr` | Add `Closes #N`. Keep the summary visual, evidence, and merge-danger sections. Keep CREDITS. |
| to-tickets | keep | `to-tickets` (hidden) | Replace `ready-for-agent` auto-apply and the local tracker with GitHub only. Add native blocking via `gh api` (see finding F6). |
| wayfinder | keep | `wayfinder` (hidden) | GitHub-only. It needs `research` and `prototype`. |
| prototype (+ LOGIC.md, UI.md) | keep | `prototype` (hidden) | |
| research | keep | `research` (hidden) | Absorb Addy `source-driven-development` (detect versions, cite sources). |
| retro | keep | `retro` (hidden) | Needs `writing-for-agents`. Remove Claude-specific session-log paths. |
| writing-for-agents (+ SKILL-MECHANICS) | keep | `writing-for-agents` (hidden) | Rewrite `SKILL-MECHANICS` for opencode frontmatter rules. |
| setup-matt-pocock-skills (+ templates) | merge | `setup-workflow` | Keep the explore, confirm, write shape and the issue-tracker-github / domain templates. Drop GitLab, local tracker, triage labels. |
| ask-matt (+ PHASE-BOUNDARIES) | drop | `workflow`, `handoff` | The router replaces it. Phase-boundary tree goes into `handoff` as a reference. |
| implement | drop | `workflow` | "Commit to the current branch" contradicts branch-per-task. |
| implement-spec | drop | `to-tickets`, SDD | Integration branch + merger subagent contradicts "each ticket is its own branch and PR". Keep the task-graph / frontier idea in `to-tickets`. |
| improve-codebase-architecture | drop | none | HTML report flow is outside the set. `architect` + `codebase-design` cover it. |
| triage | drop | none | Triage of external issues is out of scope (spec lives in issues, nobody else files them). |
| wizard | drop | none | Generates human-only bash wizards. Not in the set. |
| in-progress/chief-of-staff, claude-handoff, loop-me, setup-ts-deep-modules | drop | none | Unfinished or Claude-only. |
| in-progress/writing-beats, writing-fragments, writing-shape | drop | none | Article-writing skills. |
| misc/git-guardrails-claude-code | drop | plugin | The idea (block dangerous git commands) is implemented in the plugin guardrails (Phase 4). The skill is Claude Code hooks only. |
| misc/migrate-to-shoehorn, scaffold-exercises, setup-pre-commit | drop | none | Off topic or Husky-specific. The commit gate is a plugin concern. |
| productivity/teach, to-questionnaire, wait-what | drop | none | Not in the set. |

### 1.3 pstack (54)

| Skill | Verdict | Target | Reason |
|---|---|---|---|
| principle-* (24) | merge / redistribute | see 1.3.1 | |
| recall | merge | `handoff` (resume mode) | Strip `~/.cursor` transcript paths, parallel cheap-model fan-out, and the MCP sweep. Resume mode reads `.workflow/` state, `git log`, `gh`, and the latest handoff file. |
| correct | keep | `correct` | |
| unslop | keep | `unslop` | |
| typescript-best-practices (+ references/patterns.md) | keep | `typescript-best-practices` | Remove the `paths:` and `disable-model-invocation` fields (no effect in opencode). |
| how (+ references) | adapt | `how` | Remove the model-role lines (`pstack-models.mdc`). One model. |
| why (+ references) | adapt | `why` | Remove the 7-category MCP discovery. Sources become git, `gh` (PRs, issues), docs in the repo. Keep the epistemics file. |
| architect | adapt | `architect` (hidden) | Replace the arena phase with "design it twice" by two same-model subagents (Pocock DESIGN-IT-TWICE). Remove `arena` references. |
| blast-radius | adapt | `blast-radius` (hidden) | Remove the arena step. |
| create-verification-skill (+ references) | adapt | `create-verification-skill` (hidden) | Output path becomes `.opencode/skills/verify-<app>/`. Fold `maintain-verification-skill` in as a "maintain" section. |
| maintain-verification-skill | merge | `create-verification-skill` | |
| reflect (+ references) | adapt | `reflect` (hidden) | Three same-model reviewers with different lenses. Remove the model table and Cursor `create-skill` handoff. |
| show-me-your-work (+ scripts/log.sh) | adapt | `show-me-your-work` (hidden) | The cross-model review of the trail becomes a fresh-context same-model review. Default location `.workflow/decisions.tsv`. |
| benchmark-checklist | merge | `performance-optimization` | Becomes a reference file. |
| interrogate | drop | `code-review` high-risk mode | Multi-model by design. The rubric and lead-judgment files are mined for the three-lens mode. |
| arena | drop | none | Multi-model bakeoff. Named in the prompt for removal. |
| swarm | drop | `dispatching-parallel-agents` | Same job. |
| figure-it-out | drop | `wayfinder`, `writing-plans` | "Auditable playbook" overlap. |
| poteto-mode, poteto-help, setup-pstack, automate-me | drop | none | Personal router, model routing, Cursor "-mode" skills. Mined for: autonomy rules ("No is an acceptable answer"), kept in `workflow`. |
| teach, bro, no-comments, make-bot-ui, technical-writing | drop | none | Not in the set. `unslop` covers prose. |
| automations/benny/* (3) | drop | none | Slack triage bot. |

#### 1.3.1 Where the 24 pstack principles go

| Destination | Principles |
|---|---|
| `principles` section 1 Simplicity | laziness-protocol, subtract-before-you-add, minimize-reader-load |
| `principles` section 2 Domain and data shape | model-the-domain, foundational-thinking |
| `principles` section 3 Boundaries | boundary-discipline |
| `principles` section 4 Build the lever | build-the-lever |
| `principles` section 5 Shared state and retries | separate-before-serializing-shared-state, make-operations-idempotent |
| `principles` section 6 Measurement | explain-the-number |
| `principles` section 7 Redesign and migration | redesign-from-first-principles, attack-the-premise, outcome-oriented-execution, migrate-callers-then-delete-legacy-apis |
| `workflow` | never-block-on-the-human |
| `verification-before-completion` | prove-it-works |
| `debugging` | fix-root-causes |
| `tdd` | test-behavior-not-implementation |
| `typescript-best-practices`, `python-best-practices` | type-system-discipline |
| `correct` | encode-lessons-in-structure |
| `atomic-commits` | sequence-verifiable-units |
| `context-engineering` | guard-the-context-window |
| `architect`, `prototype` | exhaust-the-design-space |
| `spec` | experience-first (user-perspective framing) |

### 1.4 Addy Osmani (25)

| Skill | Verdict | Target | Reason |
|---|---|---|---|
| spec-driven-development | merge | `spec` | Boundaries (always / ask first / never), commands, success criteria, assumptions list, capability map for Tier 3. Drop its `tasks/plan.md` output paths and "stop turn" wording (replaced by the approval gate). |
| test-driven-development | merge | `tdd` | Test pyramid and sizes, prove-it pattern, stack discovery (moves to verification). |
| debugging-and-error-recovery | merge | `debugging` | Stop-the-line rule, bisect, error output as data. |
| code-review-and-quality | merge | `code-review` | Five-axis checklist feeds the Standards axis. Change sizing, severity labels, mutation check on tests. |
| planning-and-task-breakdown | merge | `writing-plans` | Dependency graph, vertical slicing, task sizing. |
| incremental-implementation | keep | `incremental-implementation` | |
| git-workflow-and-versioning | merge | `atomic-commits`, `branch-per-task` | Commit size, message form. Trunk-based remarks dropped (branch-per-task is the policy). |
| doubt-driven-development | adapt | `doubt-driven-development` | Remove the Codex and Gemini CLI reviewer calls. The reviewer is a same-model fresh-context subagent. |
| context-engineering | keep | `context-engineering` | Add guard-the-context-window. |
| interview-me | merge | `grilling` | |
| source-driven-development | merge | `research` | |
| security-and-hardening (+ references) | keep | `security-and-hardening` (hidden) | |
| performance-optimization (+ references) | keep | `performance-optimization` (hidden) | Absorbs `benchmark-checklist`. |
| api-and-interface-design | keep | `api-and-interface-design` (hidden) | |
| ci-cd-and-automation | adapt | `ci-cd-and-automation` (hidden) | GitHub Actions only. |
| shipping-and-launch | keep | `shipping-and-launch` (hidden) | |
| using-agent-skills | drop | `workflow` | Operating behaviors ("surface assumptions", "push back", "scope discipline") move into `workflow`. |
| constraint-driven-development | drop | none | Overlaps AGENTS.md Commands + `correct` + Definition of Done. |
| code-simplification | merge | `principles` section 1, `code-review` | |
| browser-testing-with-devtools | drop | none | Chrome DevTools MCP specific. `create-verification-skill` covers driving the app. |
| frontend-ui-engineering | drop | none | Outside the TypeScript/Python scope given. |
| idea-refine | drop | none | `grilling` + `prototype`. |
| deprecation-and-migration | drop | none | Not in the set. Migration rules live in `principles` section 7. |
| documentation-and-adrs | drop | `domain-modeling` | ADR format already there. |
| observability-and-instrumentation | drop | none | Not in the set. |

Repo-level Addy material not carried: `agents/` (Claude personas), `commands/` (toml), `hooks/` (Claude), `evals/`, `docs/`. Kept: `references/definition-of-done.md` (into verification), `references/testing-patterns.md` (into tdd), the `security`/`performance`/`observability` checklists (into their hidden skills), and `scripts/validate-skills.js` ideas (for the Phase 3 validator).

### 1.5 Totals

| Repo | Skills read |
|---|---|
| superpowers | 15 |
| Pocock | 38 |
| pstack | 54 (51 in `skills/`, 3 in `automations/benny`) |
| Addy | 25 |
| **Total** | **132** |

47 skills are delivered. The rest are merged into them or dropped, as listed in the tables above. Per-verdict counts are not tallied here: several sources feed more than one target, so a count would mislead.

---

## 2. Findings

**F1. Prompt vs source contradictions (prompt wins; deviations in section 5).**

- pstack `tdd`: "use only when the user explicitly asks for TDD". Prompt: TDD is on the Tier 1 and 2 paths.
- Pocock `tdd`: refactoring is not part of the loop. Superpowers and Addy include a refactor step. Followed Pocock (D4).
- Pocock `implement` / `implement-spec`: commit to the current branch / one integration branch. Prompt: branch per task.
- Superpowers `finishing-a-development-branch`: offers local merge. Prompt: the user keeps merge, PR is only opened after `confirmed`.
- Superpowers `writing-plans`: waits for user plan review. Prompt: only spec approval, done-confirmation, and push/PR are human gates.
- Pocock `to-spec`: applies `ready-for-agent` on publish. Prompt: label only after approval.
- Pocock `diagnosing-bugs` and `to-spec` confirm things with the user mid-flow. Prompt: autonomy for reversible steps. Resolved in D4 and D8.

**F2. Multi-model, Claude-only, and Cursor-only content that must be removed.**

- Multi-model: `arena`, `interrogate`, `swarm` model slots, `setup-pstack`, `how`/`why`/`reflect`/`architect` role lines, `show-me-your-work` cross-model review, `doubt-driven-development` Codex/Gemini calls, SDD "Model Selection" and fix-round escalation, `blast-radius` arena step.
- Cursor-only: `~/.cursor/projects/.../agent-transcripts` paths (`recall`, `reflect`, `show-me-your-work`), `pstack-models.mdc`, `.cursor/skills/` output (`create-verification-skill`), `poteto-agent` subagent type, `paths:` and `disable-model-invocation` frontmatter (no effect in opencode).
- Claude Code-only: Pocock `git-guardrails-claude-code`, `claude-handoff`, Addy `hooks/`, `agents/`, `commands/`.
- Tool-name leaks: "Call the Skill tool", `Task`, `AskQuestion`, `TodoWrite` appear across Pocock/pstack/superpowers. All become neutral action language (the plugin supplies the mapping).

**F3. Scripts to port and test.** From superpowers SDD: `sdd-workspace`, `task-brief`, `review-package`; from executing-plans: `task-start`, `task-done`; from debugging: `find-polluter.sh`, `condition-based-waiting-example.ts`; from Pocock: `hitl-loop.template.sh`; from pstack: `show-me-your-work/scripts/log.sh`. New: `branch-per-task` helpers, `task-state` (read/write `task.json`), `finish-task`, `validate-skills`. Port changes: workspace root `.superpowers/sdd/` becomes `.workflow/sdd/`; the self-ignoring `.gitignore` trick is no longer needed because `.workflow/` is excluded via `info/exclude`.

**F4. Hard dependencies and hidden skills.** Enabling a hidden skill must enable its hard dependencies. Bundles: `wayfinder` + `research` + `prototype`; `retro` + `writing-for-agents`. `tdd` (visible) needs `codebase-design` (hidden): a conflict, see Q1. Also `architect` and `blast-radius` reference `how`/`why` (visible, fine).

**F5. `permission.skill` semantics to verify in Phase 4.** My understanding: `deny` hides a skill from the listing and rejects loading it. That means a hidden skill cannot be loaded as a dependency of a visible one. This is why Q1 matters. I will confirm on opencode 2.0.23 and on V1 before writing the template.

**F6. GitHub-specific gaps.** `gh issue develop` pushes (banned by the prompt). Native issue blocking and sub-issues have no first-class `gh` subcommand: use `gh api` against the issue-dependencies and sub-issues REST endpoints, falling back to a "Blocked by #N" body line when the API is unavailable. `setup-workflow` must create the `ready-for-agent` label (and `wayfinder:*` labels only when `wayfinder` is enabled).

**F7. Worktrees and `.workflow/`.** `.git/info/exclude` lives in the common git dir, so one exclude entry covers every linked worktree (to be proven in the Phase 2 scratch repo). Each worktree has its own `.workflow/`, so `task.json` is per working tree (D6). Stash is repo-global, not per worktree, so stash labels must carry the branch name (already specified).

**F8. The plugin template is solid but unguarded.** `superpowers.js` handles V1/V2 skill registration, first-user-message bootstrap, child-session detection by `parentID` with a bounded cache, and per-flavor tool mapping. It has no `tool.execute.before`. All guardrails are new work.

**F9. Skill size.** Superpowers SDD is 568 lines, executing-plans 373, writing-skills 681, systematic-debugging 283. The prompt asks for short SKILL.md with sibling files. Target: SKILL.md under about 150 lines for process skills, the rest in sibling files linked from the body.

---

## 3. Merged-skill designs (for Phase 3)

**spec.** Pocock to-spec template (problem, solution, user stories, implementation decisions, testing decisions, out of scope, further notes) plus Addy's boundaries (always / ask first / never), commands, success criteria, assumptions list. Tier 3 adds the capability map (module ids, dependency direction, build order). Steps: explore, list assumptions, propose test seams, confirm seams with the user, draft, publish the issue **without** `ready-for-agent`, `git branch -m` to include the issue number, update `task.json`, stop for approval. After approval: add the label.

**tdd.** Pocock seams and vertical-slice loop, `tests.md`, `mocking.md`; superpowers anti-patterns and rationalization table; Addy test sizes and prove-it for bugs; Python equivalents (pytest, fixtures, `monkeypatch`, `hypothesis` optional). Seams come from the spec's Testing Decisions. Without a spec (Tier 1), pick the highest seam and record `Ruling:`.

**debugging.** Phase 1 builds a red-capable feedback loop (Pocock). Then 3-5 ranked hypotheses, tagged instrumentation, root-cause tracing, regression test at a correct seam, fix, cleanup. Supporting files: `root-cause-tracing.md`, `defense-in-depth.md`, `condition-based-waiting.md`, `find-polluter.sh`. Rule: three failed fixes means question the architecture and stop to report.

**code-review.** Fresh-context read-only subagents on a diff written to `.workflow/review/`. Two axes: Standards (repo standards, five-axis checklist, Fowler smell baseline) and Spec (the issue). Severities Critical, Important, Minor. Scoped re-review, capped at 3 rounds. High-risk mode: three same-model reviewers with different lenses (correctness/concurrency, security/boundaries, simplicity/reader load), synthesized by the lead with a "declined to judge" list.

**subagent-driven-development / executing-plans.** Shared ledger `.workflow/sdd/<plan>/progress.md`, one brief file per task, report file per task, `Ruling:` lines, final "Rulings I made" list. Task loop capped at 3 rounds to match code-review (D5).

---

## 4. Final skill set (47)

Legend: B = base source, + = merged contribution. "Siblings" lists planned reference or script files.

### 4.1 Visible by default (30)

| # | Skill | Sources | Siblings |
|---|---|---|---|
| 1 | workflow | new; Addy using-agent-skills (behaviors), pstack never-block, Pocock ask-matt (flow map) | `tiers.md`, `tool-mapping.md` |
| 2 | setup-workflow | B Pocock setup-matt-pocock-skills | `issue-tracker-github.md`, `domain.md`, `agents-md-block.md` |
| 3 | branch-per-task | new; Addy git-workflow | `scripts/task-state`, `scripts/branch-decide`, `reference.md` |
| 4 | atomic-commits | new; Addy git-workflow, pstack sequence-verifiable-units | `commit-gate.md` |
| 5 | finish-task | new; superpowers finishing (cleanup rules) | `scripts/finish-task` |
| 6 | handoff | B Pocock handoff, + pstack recall (resume mode) | `phase-boundaries.md` |
| 7 | grilling | B Pocock grilling, + Addy interview-me | |
| 8 | domain-modeling | Pocock domain-modeling | `GLOSSARY-FORMAT.md`, `ADR-FORMAT.md` |
| 9 | spec | B Pocock to-spec, + Addy spec-driven-development, pstack experience-first | `template.md`, `capability-map.md` |
| 10 | writing-plans | B superpowers writing-plans, + Addy planning-and-task-breakdown | `plan-template.md` |
| 11 | using-git-worktrees | superpowers | |
| 12 | tdd | B Pocock tdd, + superpowers TDD, Addy TDD, pstack test-behavior | `tests.md`, `mocking.md`, `anti-patterns.md`, `python.md`, `seams.md` |
| 13 | incremental-implementation | Addy | |
| 14 | subagent-driven-development | superpowers | `implementer-prompt.md`, `task-reviewer-prompt.md`, `re-review-prompt.md`, `scripts/*` |
| 15 | executing-plans | superpowers | `scripts/task-start`, `scripts/task-done` |
| 16 | dispatching-parallel-agents | superpowers, + pstack swarm, separate-before-serializing | |
| 17 | debugging | B Pocock diagnosing-bugs, + superpowers systematic-debugging, Addy debugging, pstack fix-root-causes | `root-cause-tracing.md`, `defense-in-depth.md`, `condition-based-waiting.md`, `scripts/find-polluter.sh`, `scripts/hitl-loop.template.sh` |
| 18 | verification-before-completion | B superpowers, + Addy definition-of-done and stack discovery, pstack prove-it-works | `definition-of-done.md`, `stack-discovery.md` |
| 19 | code-review | B Pocock code-review, + superpowers requesting-code-review, Addy code-review-and-quality, pstack interrogate (rubric) | `reviewer-prompt.md`, `standards-checklist.md`, `smells.md`, `high-risk.md`, `scripts/review-package` |
| 20 | receiving-code-review | superpowers | |
| 21 | doubt-driven-development | Addy | |
| 22 | pr | Pocock pr | `CREDITS.md` |
| 23 | correct | pstack correct, + encode-lessons-in-structure | |
| 24 | context-engineering | Addy, + pstack guard-the-context-window | |
| 25 | unslop | pstack | |
| 26 | principles | 13 pstack principles in 7 sections (see 1.3.1) | one file per section |
| 27 | typescript-best-practices | pstack, + type-system-discipline | `references/patterns.md` |
| 28 | python-best-practices | **new** (no source) | `references/patterns.md` |
| 29 | how | pstack | `references/*` |
| 30 | why | pstack | `references/*` |

### 4.2 Hidden until enabled (17)

| # | Skill | Sources | Needs |
|---|---|---|---|
| 31 | to-tickets | Pocock | |
| 32 | wayfinder | Pocock | research, prototype |
| 33 | research | Pocock, + Addy source-driven-development | |
| 34 | prototype | Pocock | |
| 35 | architect | pstack (arena removed) | |
| 36 | codebase-design | Pocock | |
| 37 | blast-radius | pstack (arena removed) | |
| 38 | create-verification-skill | pstack, + maintain-verification-skill | |
| 39 | retro | Pocock | writing-for-agents |
| 40 | reflect | pstack | |
| 41 | writing-for-agents | Pocock | |
| 42 | show-me-your-work | pstack | |
| 43 | security-and-hardening | Addy | |
| 44 | performance-optimization | Addy, + pstack benchmark-checklist | |
| 45 | api-and-interface-design | Addy | |
| 46 | ci-cd-and-automation | Addy | |
| 47 | shipping-and-launch | Addy | |

Hard dependency table: `tdd` needs `codebase-design` (Q1), `wayfinder` needs `research` and `prototype`, `retro` needs `writing-for-agents`. Arena references removed from `architect` and `blast-radius`.

---

## 5. Resolved decisions

- **D1. Tiers and the router.** `workflow` states the tier at intake, in one line, and only moves up. It carries the autonomy rules (never block on reversible steps, "no is an acceptable answer") and the surface-assumptions habit.
- **D2. Neutral tool language.** Skills say "dispatch a subagent", "create a todo", "run a shell command". The plugin injects the V1 or V2 mapping. V2 has no todo tool, so the mapping tells the agent to keep the checklist in `.workflow/`.
- **D3. Plan review is not a gate.** Superpowers pauses for plan review and an execution-method choice. Here `writing-plans` picks `subagent-driven-development` when a subagent tool exists and tasks are independent, else `executing-plans`, records the choice as a `Ruling:`, and continues. Deviation from the source, per the prompt's list of human gates.
- **D4. TDD loop.** Red then green, one vertical slice at a time (Pocock). Refactor is a separate atomic commit made only while green. No "ask the human to confirm seams" inside `tdd`: seams are confirmed once, in `spec` (Tier 2). In Tier 1, pick the highest seam and record a `Ruling:`.
- **D5. Review caps unified at 3 rounds.** The SDD task loop was 5 rounds with model escalation on 4-5. Now: rounds 1-2 resume the implementer, round 3 uses a fresh implementer (same model) with the report file. Matches the code-review cap. After round 3, adjudicate with `Ruling:` lines as in the source.
- **D6. Where task state lives.** `task.json` and the rest of `.workflow/` live in the current working tree's root (`git rev-parse --show-toplevel`). One task per working tree. Tier 2 and 3 tasks go into a linked worktree created with `git worktree add -b <branch> <path> origin/<default>`, so the user's main checkout stays untouched and needs no stash. Tier 0/1 tasks branch in place and stash dirty work with the labelled message. Worktree creation needs no consent prompt (it is part of the Tier 2 path).
- **D7. Guardrails in two layers.** Static `permission.bash` deny/ask globs in `opencode.json` work on both flavors (force-push, `--no-verify`, `git add -A`, `git add .`). The plugin's `tool.execute.before` adds the state-dependent rules (push only when `confirmed`, no edits on the default branch, commit gate). If V2 has no equivalent hook, the V2 build ships the static layer plus a command-level check and says so in the README. Verify on 2.0.23 in Phase 4.
- **D8. Seam confirmation vs autonomy.** Seams are confirmed during spec approval (already a human gate), so `tdd` never blocks.
- **D9. Enabling hidden skills.** The `opencode.json` template denies the 17 by name. Enabling = removing a line (or setting it to `allow`). `setup-workflow` asks which optional skills to enable and edits the project's `opencode.json`, enabling dependencies together (bundles in F4).
- **D10. AGENTS.md contract.** `setup-workflow` writes a block with a `Commands` table (test, typecheck, lint, format, build) and pointers to `docs/agents/issue-tracker.md` and `docs/agents/domain.md`. The commit gate, `verification-before-completion`, and the plugin all read that table. Format fixed in Phase 2.
- **D11. Language scope.** TypeScript and Python only: `frontend-ui-engineering`, `browser-testing-with-devtools`, `deprecation-and-migration` and observability are dropped.
- **D12. Labels.** One triage label (`ready-for-agent`, added after spec approval). Triage vocabulary and GitLab/local trackers are dropped.
- **D13. Credits.** `SOURCES.md` credits each of the four MIT repos with authors (Osmani, Pocock, Tan, Vincent) and lists, per delivered skill, which sources it draws on. Pocock's `pr` keeps its `CREDITS.md` (Dex Horthy, Humanlayer).
- **D14. Skill rewrite rules.** Positive phrasing, a completion criterion on each step, one source of truth per fact, nothing the environment already states (commands come from AGENTS.md, not repeated in skills). Rationalization tables and red-flag lists are kept only in `tdd`, `debugging`, `verification-before-completion`, `code-review` where they earn their place.

---

## 6. Open questions

These are the ones I could not settle from your prompt. Each has a default I will use unless you say otherwise.

- **Q1. `tdd` needs `codebase-design`, but `codebase-design` is hidden.** If hidden means `permission.skill` deny, `tdd` cannot load it (F5). Options: (a) **default**: `tdd` ships a self-contained `seams.md` with the 10-line module/interface/seam/depth vocabulary, and loads `codebase-design` only if enabled; (b) move `codebase-design` to visible (31 visible / 16 hidden); (c) use `ask` instead of `deny` for it (prompts the user, which breaks autonomy). I recommend (a).
- **Q2. Which "seven principle skills"?** pstack has 24. I read "seven" as the seven sections of 1.3.1 (13 principles folded into 7 headings, the other 11 homed in the skills they belong to). If you meant seven specific principles, name them and I will regroup.
- **Q3. `python-best-practices` has no source.** I will write it by mirroring the TypeScript skill's rule table with Python equivalents. Defaults for toolchain mentions: `uv`, `ruff`, `pyright`, `pytest`. Tell me if you use `mypy`, `poetry`, or `pip-tools` instead.
- **Q4. Is a pre-granted worktree OK for Tier 2/3?** Superpowers asks for consent first. Your tier table lists "worktree" with no consent step, so D6 creates it unprompted. Say so if you want a prompt.
- **Q5. V2 guardrail fallback.** If opencode V2 turns out to have no pre-tool hook, is "static permission rules only on V2, full guardrails on V1" acceptable, or should V2 support be gated on finding an equivalent?

---

## 7. Deviations from the prompt

None so far that contradict it. Interpretations that go beyond the literal text: D3 (plan review is not a gate, from your gate list), D5 (3-round cap on SDD, from the code-review cap), D6 (worktree for Tier 2/3, stash for Tier 0/1, from the tier table plus the stash rule), and Q1.

## 8. Next

Phase 2 (core spine): `workflow`, `branch-per-task`, `atomic-commits`, `finish-task`, `setup-workflow`, plus `task-state` and the git flow scripts, tested in a scratch repo. I will not start until you have reviewed this file.

---

## 9. Phase 3 outcome

All 47 skills exist and pass `node tools/validate-skills.mjs --complete` (frontmatter, name = directory, description at most 1024 chars and saying when to use, relative links, no references to skills outside the set, `bash -n` on scripts, hard dependencies present). Test scripts: `tests/spine.test.sh` (73), `tests/review-package.test.sh` (11), `tests/sdd.test.sh` (14), all passing.

Decisions made while porting:

- **Q1 default applied.** `tdd/seams.md` carries the module/interface/seam/depth vocabulary; `codebase-design` stays hidden and `tdd` loads it only when enabled.
- **Q2 default applied.** `principles` has seven section files covering 13 pstack principles; the other 11 live in the skills named in section 1.3.1.
- **Q3 default applied.** `python-best-practices` assumes `uv`, `ruff`, `pyright`, `pytest` when the repo is silent; its code examples compile (`compile()` check), but they were not run through pyright.
- **`why` lost its MCP source categories.** Investigators are code archaeology, GitHub (`gh`), and repo docs; other sources run only when the environment provides a tool, and are reported "not searched" otherwise. Databricks, Datadog, Linear, Notion, Sentry and Slack playbooks were dropped.
- **`architect`** uses two same-model subagents with different starting constraints (design it twice); `blast-radius` uses three read-only lenses for wide changes.
- **`reflect`, `retro`, `show-me-your-work`** read the session through `opencode session list` and `opencode session export <id>`. The command exists on 2.0.23; the export's JSON shape has not been inspected, so the reflect and retro steps are untested until Phase 5.
- **`to-tickets`** publishes GitHub issues only and applies `ready-for-agent` only because Tier 3 specs are approved first.
- **Round caps are 3** everywhere (code-review re-review, SDD task loop), as in D5.
- **Long Addy-derived skills** (`ci-cd-and-automation`, `api-and-interface-design`, `shipping-and-launch`, `performance-optimization`, `security-and-hardening`) and the long `receiving-code-review` and `pr` had bulky sections moved into sibling files; SKILL.md bodies are now 55 to 170 lines. Their remaining text is lightly edited from the source, not rewritten to the positive-phrasing and completion-criterion style used in the core skills.
- **Skill descriptions are first drafts.** Tuning them so the right skill loads happens in Phase 5.
- **Script references** use `<workflow skill dir>/scripts/...`; Phase 4's plugin should inject the real skill directories (or the skill tool's base path suffices).

---

## 10. Phase 4 outcome

Open questions resolved by testing on opencode 2.0.23 (V2):

- **Q5 (V2 pre-tool hook): resolved, V2 gets full guardrails.** `ctx.tool.hook("execute.before", handler)` receives `{tool, sessionID, agent, messageID, id, input}`; throwing from the handler blocks the call and the model sees the message. The plugin stays loaded. V2 tool names: `shell` (input `command`, `workdir`), `edit`, `write`, `patch` (`patchText`), `subagent`, `skill`.
- **F5 (`permission.skill`): confirmed.** `deny` hides the skill from the listing and rejects loading with "Permission denied: skill". It applies to skills registered by a plugin too. So a hidden skill cannot be a dependency of a visible one (Q1 default stands).
- **`permission.bash` deny globs** work on V2 (mapped to the `shell` action).
- **Markdown agents** in `.opencode/agents/` load on V2. Frontmatter `permission: {task: deny, subagent: deny}` is accepted (V1 uses `task`, V2 `subagent`).
- **Headless limits.** `opencode run "/cmd"` does not invoke a slash command (the model treats it as text), so the nine commands' templates were not exercised as commands; Phase 5 must run them through their template text or the TUI. Back-to-back `opencode run --standalone` calls need about 10 seconds between them or they print nothing.

Decisions:

- Agents and commands ship as markdown (portable, documented format) and `install.sh` copies them; the plugin registers skills, bootstrap and guards only.
- The "only the user can confirm" rule is enforced by tracking each session's latest user message (V1 `chat.message`, V2 context hook) and refusing `task-state ... confirmed` unless it says done / open the PR / contains the `/done` marker. Subagent sessions never see the user's words, so they cannot confirm.
- The commit gate runs `run-verify`; `run-verify` records a hash of the exact tree (`verify-key`), so a tree that just passed is not re-run.
- Added guards beyond the prompt's list, each for a rule the prompt states elsewhere: `git commit -a` and `git add -u` (stage precisely), amend, rebase, `reset --hard`, `clean -f`, branch deletion (never rewrite history; the user keeps branch deletion), `gh pr merge/close`, `gh issue close/develop` (the user keeps merge and close), hand-editing `task.json`.
- An edit while the task is `ready` or `confirmed` sets it back to `working`.

Known limits: V1 runs only against mock hosts and the V1 type definitions (no V1 install here). `/review` shadows opencode's built-in command. The guards parse commands as text: a determined shell trick can bypass them, and the static `permission.bash` rules are a second layer, not a guarantee.
