#!/usr/bin/env bash
# Every check the site and the explainers must pass, in one command.
#
#   bash tools/check_all.sh            # build everything, then run all checks
#   bash tools/check_all.sh --no-build # checks only
#
# Prints one line per check; full output goes to $LOG (default: a temp file).
# Exit code 0 only when every check passed. Checks whose tools are missing on
# this machine (Playwright, sky-skills, tech-writing-gate) are reported as SKIP,
# never as passed.
set -u
cd "$(dirname "$0")/.."

LOG="${LOG:-$(mktemp -t aidoc-check.XXXXXX)}"
SKY="${SKY_SKILLS:-$HOME/linux-kernel/github/sky-skills}"
GATE="${TECH_WRITING_GATE:-$HOME/.claude/skills/tech-writing-gate/scripts}"
export PLAYWRIGHT="${PLAYWRIGHT:-$SKY/node_modules/playwright/index.mjs}"
fail=0

run() {  # run <name> <command...>
  local name="$1"; shift
  printf '\n===== %s\n$ %s\n' "$name" "$*" >>"$LOG"
  if "$@" >>"$LOG" 2>&1; then printf '  ok    %s\n' "$name"; else printf '  FAIL  %s\n' "$name"; fail=1; fi
}
skip() { printf '  SKIP  %s (%s)\n' "$1" "$2"; }

echo "aidoc checks — log: $LOG"

if [ "${1:-}" != "--no-build" ]; then
  run "build: original pages"   python3 docs/scripts/build.py
  run "build: explainer pages"  python3 docs/scripts/explain_build.py
  run "build: homepage preview" python3 docs/scripts/home_v2.py
fi

run "python unit tests" python3 -m unittest discover -s tools/tests -p 'test_*.py'
run "js unit tests"     node --test tools/tests/*.test.js
if [ -f "$PLAYWRIGHT" ]; then run "browser tests" node --test tools/tests/browser.test.mjs
else skip "browser tests" "no Playwright at \$PLAYWRIGHT"; fi

for d in explain-src/*/; do
  run "sources: ${d%/}" python3 tools/check_sources.py "${d%/}"
  run "punctuation: ${d%/}/zh.json" python3 tools/fix_cjk_punct.py --check "${d}zh.json"
done
run "original article text unchanged" python3 tools/check_articles_unchanged.py check

pages=(docs/sample/index.html docs/zh/explain/*.html)
if [ -f "$SKY/skills/design-review/scripts/check_objective.mjs" ]; then
  run "objective defects (light + dark)" node "$SKY/skills/design-review/scripts/check_objective.mjs" --themes=dark,light "${pages[@]}"
else skip "objective defects" "no sky-skills at \$SKY_SKILLS"; fi

if [ -f "$GATE/check_buzzwords.py" ]; then
  for f in explain-src/*/zh.json "${pages[@]}"; do
    run "buzzwords: $f" python3 "$GATE/check_buzzwords.py" --strict "$f"
    run "private shorthand: $f" python3 "$GATE/check_buzzwords.py" --rules "$GATE/jargon.tsv" --strict "$f"
  done
else skip "word lists" "no tech-writing-gate at \$TECH_WRITING_GATE"; fi

if [ "$fail" = 0 ]; then echo "ALL CHECKS PASSED"; else echo "SOME CHECKS FAILED — see $LOG"; fi
exit "$fail"
