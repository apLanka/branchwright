#!/usr/bin/env bash
# Install the workflow into a project or into your global opencode config.
#
# Usage: install.sh [--project DIR | --global] [--flavor v1|v2|auto] [--enable skill,skill]
#   --project DIR   target project (default: current directory)
#   --global        target ~/.config/opencode instead
#   --flavor        which plugin key to write: "plugin" (V1) or "plugins" (V2); auto reads `opencode --version`
#   --enable LIST   optional skills to enable (their dependencies come along); everything else optional stays hidden
#
# Does: copies .opencode/agents and .opencode/commands into the target; creates or
# updates opencode.json with the plugin entry, the permission.skill rules that hide
# the 17 optional skills, and the permission.bash deny rules. Existing keys are kept.
# Re-run with a different --enable list to change which optional skills are visible.
set -euo pipefail

pkg=$(cd "$(dirname "$0")" && pwd)
target="" flavor=auto enable=""
while [ $# -gt 0 ]; do
  case "$1" in
    --project) target=$2; shift 2 ;;
    --global) target="$HOME/.config/opencode"; global=1; shift ;;
    --flavor) flavor=$2; shift 2 ;;
    --enable) enable=$2; shift 2 ;;
    -h|--help) sed -n '2,13p' "$0"; exit 0 ;;
    *) echo "install.sh: unknown argument $1" >&2; exit 2 ;;
  esac
done
global=${global:-0}
[ -n "$target" ] || target=$PWD
mkdir -p "$target"
target=$(cd "$target" && pwd)

if [ "$flavor" = auto ]; then
  v=$(opencode --version 2>/dev/null | grep -Eo '[0-9]+\.[0-9]+\.[0-9]+' | head -1 || true)
  case "${v%%.*}" in 2) flavor=v2 ;; 1) flavor=v1 ;; *) echo "install.sh: cannot detect the opencode version; pass --flavor v1|v2" >&2; exit 2 ;; esac
fi
case "$flavor" in v1|v2) ;; *) echo "install.sh: --flavor must be v1 or v2" >&2; exit 2 ;; esac

if [ "$global" = 1 ]; then cfgdir=$target; else cfgdir=$target/.opencode; fi
mkdir -p "$cfgdir/agents" "$cfgdir/commands"
cp "$pkg"/.opencode/agents/*.md "$cfgdir/agents/"
cp "$pkg"/.opencode/commands/*.md "$cfgdir/commands/"
echo "copied agents and commands to $cfgdir"

cfg="$target/opencode.json"
[ "$global" = 1 ] && [ -f "$target/opencode.jsonc" ] && cfg="$target/opencode.jsonc"
if [ -f "$target/opencode.jsonc" ] && [ ! -f "$target/opencode.json" ]; then
  echo "install.sh: $target/opencode.jsonc exists; it may hold comments that a rewrite would lose." >&2
  echo "Merge opencode.template.json into it by hand (plugin entry: \"$pkg\")." >&2
  exit 1
fi

PKG=$pkg CFG=$cfg FLAVOR=$flavor ENABLE=$enable python3 - <<'PY'
import json, os, re
pkg, cfg, flavor = os.environ["PKG"], os.environ["CFG"], os.environ["FLAVOR"]
enable = [x for x in re.split(r"[,\s]+", os.environ.get("ENABLE", "")) if x]
tpl = json.load(open(os.path.join(pkg, "opencode.template.json")))
hidden = list(tpl["permission"]["skill"].keys())
deps = {"wayfinder": ["research", "prototype"], "retro": ["writing-for-agents"]}
unknown = [e for e in enable if e not in hidden]
if unknown:
    raise SystemExit("install.sh: not optional skills: " + ", ".join(unknown))
on = set(enable)
for e in list(on):
    on.update(deps.get(e, []))

conf = {}
if os.path.exists(cfg):
    conf = json.load(open(cfg))
conf.setdefault("$schema", tpl["$schema"])
key = "plugins" if flavor == "v2" else "plugin"
other = "plugin" if flavor == "v2" else "plugins"
entries = conf.get(key, [])
if pkg not in entries:
    entries.append(pkg)
conf[key] = entries
if other in conf and pkg in conf[other]:
    conf[other] = [e for e in conf[other] if e != pkg]
    if not conf[other]:
        del conf[other]

perm = conf.setdefault("permission", {})
skill = perm.setdefault("skill", {})
for name in hidden:
    if name in on:
        if skill.get(name) == "deny":
            del skill[name]
    elif skill.get(name) in ("allow", "ask"):
        pass  # the user's explicit choice counts as enabled
    else:
        skill[name] = "deny"
bash = perm.setdefault("bash", {})
for pat, eff in tpl["permission"]["bash"].items():
    bash.setdefault(pat, eff)
json.dump(conf, open(cfg, "w"), indent=2)
open(cfg, "a").write("\n")
print("updated", cfg, "| plugin key:", key, "| optional skills enabled:", ", ".join(sorted(on)) or "none")
PY
echo "done. Restart opencode, then start a task with /task or just describe it."
