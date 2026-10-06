#!/usr/bin/env bash
# Tests for install.sh and the agent/command files.
set -uo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
tmp=$(mktemp -d "${TMPDIR:-/tmp}/inst.XXXXXX"); trap 'rm -rf "$tmp"' EXIT
pass=0; failed=0
ok(){ pass=$((pass+1)); echo "  ok   $1"; }; bad(){ failed=$((failed+1)); echo "  FAIL $1"; }
eq(){ [ "$2" = "$3" ] && ok "$1" || bad "$1 (got '$2', want '$3')"; }
py(){ python3 -c "import json,sys; d=json.load(open('$1')); print($2)"; }

echo "== agents and commands"
for a in planner implementer reviewer verifier; do
  f="$root/.opencode/agents/$a.md"
  head -1 "$f" | grep -q '^---$' && grep -q '^description: ' "$f" && grep -q '^mode: subagent' "$f" && ok "agent $a frontmatter" || bad "agent $a frontmatter"
done
for c in spec plan build review ship retro done task next; do
  f="$root/.opencode/commands/$c.md"
  head -1 "$f" | grep -q '^---$' && grep -q '^description: ' "$f" && ok "command $c frontmatter" || bad "command $c frontmatter"
done
eq "nine commands" "$(ls "$root/.opencode/commands" | wc -l | tr -d ' ')" 9
eq "four agents" "$(ls "$root/.opencode/agents" | wc -l | tr -d ' ')" 4
grep -q '\[workflow:done\]' "$root/.opencode/commands/done.md" && ok "/done carries the confirmation marker" || bad "/done marker"
for a in implementer reviewer planner verifier; do grep -q 'subagent: deny' "$root/.opencode/agents/$a.md" && grep -q 'task: deny' "$root/.opencode/agents/$a.md" && ok "$a cannot dispatch" || bad "$a dispatch deny"; done

echo "== install into a project"
p="$tmp/proj"; mkdir -p "$p"
echo '{"model":"x/y","permission":{"bash":{"rm -rf*":"deny"},"skill":{"retro":"allow"}},"plugins":["other-plugin"]}' > "$p/opencode.json"
bash "$root/install.sh" --project "$p" --flavor v2 >/dev/null 2>&1; eq "install exits 0" "$?" 0
eq "agents copied" "$(ls "$p/.opencode/agents" | wc -l | tr -d ' ')" 4
eq "commands copied" "$(ls "$p/.opencode/commands" | wc -l | tr -d ' ')" 9
eq "plugin entry added after existing" "$(py "$p/opencode.json" "d['plugins']")" "['other-plugin', '$root']"
eq "user keys kept" "$(py "$p/opencode.json" "d['model']")" "x/y"
eq "user bash rule kept" "$(py "$p/opencode.json" "d['permission']['bash']['rm -rf*']")" "deny"
eq "17 skills hidden except user-allowed retro" "$(py "$p/opencode.json" "sum(1 for v in d['permission']['skill'].values() if v=='deny')")" 16
eq "user's allow kept" "$(py "$p/opencode.json" "d['permission']['skill']['retro']")" "allow"
eq "push --force denied" "$(py "$p/opencode.json" "d['permission']['bash']['git push --force*']")" "deny"
bash "$root/install.sh" --project "$p" --flavor v2 >/dev/null 2>&1
eq "idempotent plugin entry" "$(py "$p/opencode.json" "len(d['plugins'])")" 2

echo "== enable optional skills with dependencies"
bash "$root/install.sh" --project "$p" --flavor v2 --enable wayfinder >/dev/null 2>&1
eq "wayfinder visible" "$(py "$p/opencode.json" "'wayfinder' in d['permission']['skill']")" False
eq "research comes along" "$(py "$p/opencode.json" "'research' in d['permission']['skill']")" False
eq "prototype comes along" "$(py "$p/opencode.json" "'prototype' in d['permission']['skill']")" False
eq "others stay hidden" "$(py "$p/opencode.json" "d['permission']['skill']['architect']")" deny
bash "$root/install.sh" --project "$p" --flavor v2 --enable bogus >/dev/null 2>&1; [ $? -ne 0 ] && ok "unknown skill rejected" || bad "unknown skill rejected"
bash "$root/install.sh" --project "$p" --flavor v2 >/dev/null 2>&1
eq "re-run without --enable hides wayfinder again" "$(py "$p/opencode.json" "d['permission']['skill']['wayfinder']")" deny

echo "== V1 flavor and fresh project"
q="$tmp/p2"; bash "$root/install.sh" --project "$q" --flavor v1 >/dev/null 2>&1
eq "v1 key is plugin" "$(py "$q/opencode.json" "list(k for k in d if k.startswith('plugin'))")" "['plugin']"
eq "17 hidden in fresh project" "$(py "$q/opencode.json" "len(d['permission']['skill'])")" 17

echo "== jsonc is not clobbered"
r="$tmp/p3"; mkdir -p "$r"; printf '// comment\n{}\n' > "$r/opencode.jsonc"
bash "$root/install.sh" --project "$r" --flavor v2 >/dev/null 2>&1; [ $? -ne 0 ] && ok "refuses to rewrite opencode.jsonc" || bad "refuses jsonc"
grep -q '// comment' "$r/opencode.jsonc" && ok "jsonc untouched" || bad "jsonc untouched"

echo "== global install"
HOME="$tmp/home" bash "$root/install.sh" --global --flavor v2 >/dev/null 2>&1; eq "global exits 0" "$?" 0
[ -f "$tmp/home/.config/opencode/opencode.json" ] && [ -d "$tmp/home/.config/opencode/agents" ] && ok "global files in ~/.config/opencode" || bad "global files"
echo; echo "passed: $pass  failed: $failed"; [ $failed -eq 0 ]
