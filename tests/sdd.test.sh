#!/usr/bin/env bash
# Tests for sdd-workspace, task-brief, task-start, task-done in a scratch repo.
set -uo pipefail
root=$(cd "$(dirname "$0")/.." && pwd); S="$root/skills"
tmp=$(mktemp -d "${TMPDIR:-/tmp}/sdd.XXXXXX"); trap 'rm -rf "$tmp"' EXIT
pass=0; failed=0
ok(){ pass=$((pass+1)); echo "  ok   $1"; }; bad(){ failed=$((failed+1)); echo "  FAIL $1"; }
eq(){ [ "$2" = "$3" ] && ok "$1" || bad "$1 (got '$2', want '$3')"; }
export GIT_AUTHOR_NAME=t GIT_AUTHOR_EMAIL=t@t GIT_COMMITTER_NAME=t GIT_COMMITTER_EMAIL=t@t GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_SYSTEM=/dev/null
git init -q -b main "$tmp/r"; cd "$tmp/r"; echo a > a; git add a; git commit -qm init
mkdir -p .workflow/plans
cat > .workflow/plans/p.md <<'PLAN'
# Plan

## Task 1: first
- [ ] do one
```
## Task 9: not a heading (in a fence)
```

## Task 2: second
- [ ] do two

### Task 12: twelve
- [ ] do twelve
PLAN

ws=$("$S/subagent-driven-development/scripts/sdd-workspace" .workflow/plans/p.md)
case "$ws" in */.workflow/sdd/p) ok "workspace path";; *) bad "workspace path ($ws)";; esac
eq "git status clean" "$(git status --porcelain)" ""

B="$S/subagent-driven-development/scripts/task-brief"
out=$("$B" .workflow/plans/p.md 1); f=$(echo "$out" | sed -n 's/^wrote \(.*\): .*/\1/p')
grep -q 'do one' "$f" && ok "brief 1 has task 1" || bad "brief 1 has task 1"
grep -q 'Task 9' "$f" && ok "fenced heading kept inside task" || bad "fenced heading kept inside task"
grep -q 'do two' "$f" && bad "brief 1 leaks task 2" || ok "brief 1 stops at task 2"
f=$("$B" .workflow/plans/p.md 2 | sed -n 's/^wrote \(.*\): .*/\1/p')
grep -q 'do twelve' "$f" && bad "task 2 matched task 12" || ok "task 2 not confused with task 12"
"$B" .workflow/plans/p.md 7 >/dev/null 2>&1; eq "missing task exits 3" "$?" 3

out=$("$S/executing-plans/scripts/task-start" .workflow/plans/p.md 1)
echo "$out" | grep -q '^brief: ' && echo "$out" | grep -q "^base: $(git rev-parse HEAD)$" && ok "task-start prints brief and base" || bad "task-start"
base=$(git rev-parse HEAD)
echo x > x.txt; git add x.txt; git commit -qm x
D="$S/executing-plans/scripts/task-done"
"$D" .workflow/plans/p.md 1 "$base" -- bash -c 'echo FAILING; exit 1' >/dev/null 2>&1; eq "failing tests exit 1" "$?" 1
[ -f "$ws/progress.md" ] && bad "failure must not write ledger" || ok "failure writes no ledger"
"$D" .workflow/plans/p.md 1 "$base" -- bash -c 'echo "3 passed"' >/dev/null 2>&1; eq "passing tests exit 0" "$?" 0
head -1 "$ws/progress.md" | grep -q '^# SDD ledger — plan: .workflow/plans/p.md' && ok "ledger header" || bad "ledger header"
grep -q "^Task 1: complete (commits ${base:0:7}\.\.$(git rev-parse --short=7 HEAD)" "$ws/progress.md" && ok "completion line with commit range" || bad "completion line"
"$D" .workflow/plans/p.md 1 deadbeef -- true >/dev/null 2>&1; eq "bad BASE exits 2" "$?" 2
echo; echo "passed: $pass  failed: $failed"; [ $failed -eq 0 ]
