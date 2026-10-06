#!/usr/bin/env bash
# Tests for code-review/scripts/review-package in scratch repos.
set -uo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
RP="$root/skills/code-review/scripts/review-package"
tmp=$(mktemp -d "${TMPDIR:-/tmp}/rp.XXXXXX"); trap 'rm -rf "$tmp"' EXIT
pass=0; failed=0
ok(){ pass=$((pass+1)); echo "  ok   $1"; }; bad(){ failed=$((failed+1)); echo "  FAIL $1"; }
eq(){ [ "$2" = "$3" ] && ok "$1" || bad "$1 (got '$2', want '$3')"; }
export GIT_AUTHOR_NAME=t GIT_AUTHOR_EMAIL=t@t GIT_COMMITTER_NAME=t GIT_COMMITTER_EMAIL=t@t GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_SYSTEM=/dev/null

git init -q --bare -b main "$tmp/o.git"; git init -q -b main "$tmp/r"; cd "$tmp/r"
git remote add origin "$tmp/o.git"; echo a > a.txt; git add a.txt; git commit -qm init; git push -q -u origin main
git switch -q -c feat/x
echo one > one.txt; git add one.txt; git commit -qm "one"
echo two > two.txt; git add two.txt; git commit -qm "two"

echo "== review-package"
out=$("$RP"); rc=$?
eq "exits 0" "$rc" 0
f=$(echo "$out" | sed -n 's/^wrote \(.*\): [0-9]* commit.*/\1/p')
[ -f "$f" ] && ok "file written" || bad "file written"
case "$f" in */.workflow/review/*) ok "under .workflow/review";; *) bad "under .workflow/review";; esac
eq "covers both commits" "$(grep -c '^[0-9a-f]\{7,\} ' "$f")" 2
grep -q '^+one$' "$f" && grep -q '^+two$' "$f" && ok "diff has both changes" || bad "diff has both changes"
eq "git status clean (.workflow ignored)" "$(git status --porcelain)" ""

base=$(git rev-parse HEAD~1)
out=$("$RP" "$base"); echo "$out" | grep -q '1 commit' && ok "explicit BASE narrows range" || bad "explicit BASE narrows range"
"$RP" HEAD >/dev/null 2>&1; eq "empty range exits 3" "$?" 3
"$RP" nonsense >/dev/null 2>&1; eq "bad BASE exits 2" "$?" 2
git switch -q main; "$RP" feat/x >/dev/null 2>&1; eq "non-ancestor BASE exits 3" "$?" 3
"$RP" "$(git rev-parse feat/x)" main >/dev/null 2>&1; eq "BASE after HEAD exits 3" "$?" 3
echo; echo "passed: $pass  failed: $failed"; [ $failed -eq 0 ]
