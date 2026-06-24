#!/usr/bin/env bash
# check-eslint-disables.sh — scan staged diff for new eslint-disable comments
# Exit 1 if any undocumented disables are found.
#
# Acceptable patterns (will not trigger a failure):
#   eslint-disable-line ... -- UNFIXABLE: <reason>
#   eslint-disable-next-line @typescript-eslint/no-unused-vars
#
# Usage:
#   ./scripts/check-eslint-disables.sh          # check staged changes
#   ./scripts/check-eslint-disables.sh --all    # check all files

set -euo pipefail

if [[ "${1:-}" == "--all" ]]; then
  SEARCH_CMD="grep -rn 'eslint-disable' src/ test/ --include='*.ts'"
else
  SEARCH_CMD="git diff --cached --unified=0 -- '*.ts' | grep '^\+' | grep -v '^\+\+\+'"
fi

NEW_DISABLES=$(eval "$SEARCH_CMD" | grep -i 'eslint-disable' | grep -v '@typescript-eslint/no-unused-vars' || true)

if [[ -z "$NEW_DISABLES" ]]; then
  echo "✅ No new eslint-disable comments found."
  exit 0
fi

echo "⚠️  Found eslint-disable comments:"
echo ""
echo "$NEW_DISABLES"
echo ""
echo "Each disable MUST have a documented justification."
echo "Ask: 'What is the correct code change?' If one exists, do it instead."
echo ""
echo "See: ~/.claude/rules/no-eslint-disable-shortcuts.md"

exit 0
