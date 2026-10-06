#!/usr/bin/env bash
# Git-flow tests for the Phase 2 scripts, run in scratch repos.
# Usage: bash tests/spine.test.sh
set -uo pipefail

root=$(cd "$(dirname "$0")/.." && pwd)
S="$root/skills"
TS="$S/workflow/scripts/task-state"
tmp=$(mktemp -d "${TMPDIR:-/tmp}/spine.XXXXXX")
trap 'rm -rf "$tmp"' EXIT

pass=0 failed=0
ok()   { pass=$((pass + 1)); echo "  ok   $1"; }
bad()  { failed=$((failed + 1)); echo "  FAIL $1"; }
check() { # check "name" command...
  local name=$1; shift
  if "$@" >/dev/null 2>&1; then ok "$name"; else bad "$name"; fi
}
refuse() { # refuse "name" command...  (command must fail)
  local name=$1; shift
  if "$@" >/dev/null 2>&1; then bad "$name (should have failed)"; else ok "$name"; fi
}
eq() { if [ "$2" = "$3" ]; then ok "$1"; else bad "$1 (got '$2', want '$3')"; fi; }

export GIT_AUTHOR_NAME=t GIT_AUTHOR_EMAIL=t@t GIT_COMMITTER_NAME=t GIT_COMMITTER_EMAIL=t@t
export GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_SYSTEM=/dev/null

mkrepo() { # mkrepo name -> creates $tmp/name with origin $tmp/name.git
  git init -q --bare -b main "$tmp/$1.git"
  git init -q -b main "$tmp/$1"
  (cd "$tmp/$1" && git remote add origin "$tmp/$1.git" && echo base > a.txt && git add a.txt && git commit -qm "init" && git push -q -u origin main)
}

echo "== setup-repo"
mkrepo r1; cd "$tmp/r1"
"$S/setup-workflow/scripts/setup-repo" --no-label >/dev/null
check ".workflow exists" test -d .workflow
check "excluded in info/exclude" grep -qx '.workflow/' "$(git rev-parse --git-path info/exclude)"
"$S/setup-workflow/scripts/setup-repo" --no-label >/dev/null
eq "idempotent (one exclude line)" "$(grep -c '^.workflow/$' "$(git rev-parse --git-path info/exclude)")" 1
eq "git status ignores .workflow" "$(git status --porcelain)" ""

echo "== default-branch"
eq "origin/main detected" "$("$S/workflow/scripts/default-branch")" main

echo "== state machine"
cd "$tmp/r1"
"$TS" start --branch feat/x --base origin/main --summary "x" --tier 1
eq "state starts working" "$("$TS" get state)" working
refuse "working -> confirmed rejected" "$TS" transition confirmed
check "working -> ready" "$TS" transition ready
refuse "ready -> pr-open rejected" "$TS" transition pr-open
check "tier up ok" "$TS" set tier=2
refuse "tier down rejected" "$TS" set tier=1
refuse "bad field rejected" "$TS" set colour=red
"$TS" transition working
eq "ready -> working allowed" "$("$TS" get state)" working

echo "== branch-new (clean, from origin/main)"
cd "$tmp/r1"
git switch -q main
rm -rf .workflow/task.json
"$S/branch-per-task/scripts/branch-new" --name feat/one --summary "task one" --tier 1 >/dev/null
eq "on new branch" "$(git branch --show-current)" feat/one
eq "no upstream" "$(git rev-parse --abbrev-ref feat/one@{upstream} 2>/dev/null || echo none)" none
eq "task branch" "$("$TS" get branch)" feat/one
eq "task base" "$("$TS" get base)" origin/main
eq "task tier" "$("$TS" get tier)" 1
refuse "duplicate branch rejected" "$S/branch-per-task/scripts/branch-new" --name feat/one --summary s --tier 1

echo "== unrelated task, dirty tree"
cd "$tmp/r1"
echo "work" > feature.txt && git add feature.txt && git commit -qm "feat: one"
echo "edit" >> feature.txt
echo "untracked" > scratch.txt
"$S/branch-per-task/scripts/branch-new" --name fix/two --summary "task two" --tier 1 >/dev/null
eq "now on fix/two" "$(git branch --show-current)" fix/two
eq "tree clean after stash" "$(git status --porcelain)" ""
eq "new branch is from origin/main, not feat/one" "$(git rev-list --count origin/main..HEAD)" 0
eq "stash label (git adds the 'On <branch>:' prefix)" "$(git stash list --format=%s | head -1)" "On feat/one: feat/one: task one"
check "old task archived" test -f .workflow/tasks/feat__one.json
eq "archived stash field" "$(python3 -c "import json;print(json.load(open('.workflow/tasks/feat__one.json'))['stash'])")" "feat/one: task one"
eq "current task is two" "$("$TS" get summary)" "task two"

echo "== unrelated task, clean tree"
"$S/branch-per-task/scripts/branch-new" --name chore/three --summary "task three" --tier 0 >/dev/null
eq "no new stash" "$(git stash list | wc -l | tr -d ' ')" 1
eq "on chore/three" "$(git branch --show-current)" chore/three

echo "== branch-switch back pops stash"
"$S/branch-per-task/scripts/branch-switch" feat/one >/dev/null
eq "back on feat/one" "$(git branch --show-current)" feat/one
check "modified file restored" grep -q edit feature.txt
check "untracked file restored" test -f scratch.txt
eq "stash popped" "$(git stash list | wc -l | tr -d ' ')" 0
eq "task one restored" "$("$TS" get summary)" "task one"
eq "stash field cleared" "$("$TS" get stash)" ""
git checkout -q -- feature.txt; rm -f scratch.txt

echo "== stacked branch"
"$S/branch-per-task/scripts/branch-new" --name feat/one-b --summary "follow-up" --tier 1 --stacked >/dev/null
eq "stacked base is parent branch" "$("$TS" get base)" feat/one
eq "stacked contains parent commit" "$(git rev-list --count origin/main..HEAD)" 1

echo "== worktree mode leaves main checkout alone"
"$S/branch-per-task/scripts/branch-switch" feat/one >/dev/null
echo dirty >> feature.txt
"$S/branch-per-task/scripts/branch-new" --name feat/big --summary "big" --tier 2 --worktree "$tmp/wt-big" >/dev/null
eq "main checkout still on feat/one" "$(git branch --show-current)" feat/one
check "main checkout still dirty (no stash)" test -n "$(git status --porcelain)"
eq "worktree branch" "$(git -C "$tmp/wt-big" branch --show-current)" feat/big
eq "worktree task.json" "$(cd "$tmp/wt-big" && "$TS" get summary)" big
eq "worktree base" "$(cd "$tmp/wt-big" && "$TS" get base)" origin/main
eq "worktree ignores .workflow (shared exclude)" "$(git -C "$tmp/wt-big" status --porcelain)" ""
eq "main task untouched" "$("$TS" get summary)" "task one"
git checkout -q -- feature.txt

echo "== branch-rename"
cd "$tmp/wt-big"
"$S/branch-per-task/scripts/branch-rename" --issue 42 >/dev/null
eq "branch has issue number" "$(git branch --show-current)" feat/42-big
eq "task branch updated" "$("$TS" get branch)" feat/42-big
eq "task issue set" "$("$TS" get issue)" 42
eq "old name gone" "$(git branch --list feat/big | wc -l | tr -d ' ')" 0
eq "nothing pushed" "$(git ls-remote --heads origin 'feat/*' | wc -l | tr -d ' ')" 0

echo "== branch-decide"
cd "$tmp/r1"
out=$("$S/branch-per-task/scripts/branch-decide")
echo "$out" | grep -q '^default=main$' && ok "reports default" || bad "reports default"
echo "$out" | grep -q '^task_summary=task one$' && ok "reports task" || bad "reports task"
echo "$out" | grep -q '^ahead_of_default=1$' && ok "reports ahead count" || bad "reports ahead count"

echo "== staged-check"
mkrepo r2; cd "$tmp/r2"
refuse "nothing staged -> exit 1" "$S/atomic-commits/scripts/staged-check"
echo SECRET=1 > .env; git add -f .env
refuse ".env staged -> exit 1" "$S/atomic-commits/scripts/staged-check"
git reset -q; rm .env
echo "x" > ok.txt; git add ok.txt
check "small slice passes" "$S/atomic-commits/scripts/staged-check"
git reset -q; seq 1 400 > big.txt; git add big.txt
out=$("$S/atomic-commits/scripts/staged-check"); echo "$out" | grep -q 'WARN 400 changed lines' && ok "warns on large slice" || bad "warns on large slice"
git reset -q

echo "== project-commands / run-verify"
cd "$tmp/r2"
cat > AGENTS.md <<'EOF'
# Project

## Commands

| Purpose | Command |
|---|---|
| test | echo tests-ran |
| typecheck | - |
| lint | `echo lint-ran` |

## Other
| test | not-this |
EOF
eq "reads test command" "$("$S/workflow/scripts/project-commands" test)" "echo tests-ran"
eq "strips backticks" "$("$S/workflow/scripts/project-commands" lint)" "echo lint-ran"
refuse "dash means absent" "$S/workflow/scripts/project-commands" typecheck
printf '## Workflow\n\n### Commands\n\n| Purpose | Command |\n|---|---|\n| test | echo nested |\n\n### Docs\n| test | not-this |\n' > "$tmp/nested.md"
( cd "$tmp/r2" && cp AGENTS.md "$tmp/agents.bak" && cp "$tmp/nested.md" AGENTS.md && eq "level-3 Commands heading is read" "$("$S/workflow/scripts/project-commands" test)" "echo nested" && cp "$tmp/agents.bak" AGENTS.md )
check "run-verify passes" "$S/workflow/scripts/run-verify"
sed -i.bak 's/echo tests-ran/false/' AGENTS.md
refuse "run-verify fails when a command fails" "$S/workflow/scripts/run-verify"
rm -f AGENTS.md.bak AGENTS.md
rc=0; "$S/workflow/scripts/run-verify" >/dev/null 2>&1 || rc=$?
eq "run-verify with nothing to run exits 3" "$rc" 3

echo "== finish-task"
cat > "$tmp/fake-gh" <<'EOF'
#!/usr/bin/env bash
echo "$@" >> "$FAKE_GH_LOG"
echo "https://github.com/o/r/pull/7"
EOF
chmod +x "$tmp/fake-gh"
export GH_BIN="$tmp/fake-gh" FAKE_GH_LOG="$tmp/gh.log"
mkrepo r3; cd "$tmp/r3"
"$S/branch-per-task/scripts/branch-new" --name feat/f --summary "do f" --tier 1 >/dev/null
echo f > f.txt && git add f.txt && git commit -qm "feat: f"
printf 'Summary\n\nCloses #9\n' > "$tmp/body.md"
"$TS" set issue=9
refuse "refuses while state=working" "$S/finish-task/scripts/finish-task" --body-file "$tmp/body.md"
"$TS" transition ready
refuse "refuses while state=ready" "$S/finish-task/scripts/finish-task" --body-file "$tmp/body.md"
"$TS" transition confirmed
printf 'Summary only\n' > "$tmp/nobody.md"
refuse "refuses body without Closes #N" "$S/finish-task/scripts/finish-task" --body-file "$tmp/nobody.md"
echo dirty >> f.txt
refuse "refuses uncommitted tracked change" "$S/finish-task/scripts/finish-task" --body-file "$tmp/body.md"
git checkout -q -- f.txt
echo scratch > untracked-notes.txt
export GH_BIN_REAL="$GH_BIN"
cat > "$tmp/bad-gh" <<'BADGH'
#!/usr/bin/env bash
[ "$1" = auth ] && exit 1
echo "https://github.com/o/r/pull/7"
BADGH
chmod +x "$tmp/bad-gh"
GH_BIN="$tmp/bad-gh" "$S/finish-task/scripts/finish-task" --body-file "$tmp/body.md" >/dev/null 2>&1; eq "unauthenticated gh refuses before pushing" "$?" 1
eq "nothing pushed after the refusal" "$(git ls-remote --heads origin feat/f | wc -l | tr -d ' ')" 0
eq "state stays confirmed after the refusal" "$("$TS" get state)" confirmed
out=$("$S/finish-task/scripts/finish-task" --body-file "$tmp/body.md" 2>&1); rc=$?
eq "finish succeeds with an untracked file present" "$rc" 0
check "untracked file untouched" test -f untracked-notes.txt
echo "$out" | grep -q "1 untracked path" && ok "reports untracked paths" || bad "reports untracked paths"
echo "$out" | grep -q 'pr=https://github.com/o/r/pull/7' && ok "prints PR url" || bad "prints PR url"
eq "state is pr-open" "$("$TS" get state)" pr-open
eq "branch pushed with upstream" "$(git rev-parse --abbrev-ref feat/f@{upstream})" origin/feat/f
check "remote has the branch" git ls-remote --exit-code --heads origin feat/f
grep -q -- '--base main --head feat/f' "$tmp/gh.log" && ok "gh called with base and head" || bad "gh called with base and head"
refuse "no second PR once pr-open" "$S/finish-task/scripts/finish-task" --body-file "$tmp/body.md"

echo "== finish-task refuses the default branch"
mkrepo r4; cd "$tmp/r4"
"$TS" start --branch main --base main --summary m --tier 1
"$TS" transition ready; "$TS" transition confirmed
echo "$tmp/body.md" >/dev/null
refuse "default branch refused" "$S/finish-task/scripts/finish-task" --body-file "$tmp/body.md"

echo
echo "passed: $pass  failed: $failed"
[ $failed -eq 0 ]
