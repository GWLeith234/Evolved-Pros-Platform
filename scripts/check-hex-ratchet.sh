#!/usr/bin/env bash
# Hex ratchet (STYLEGUIDE.md §4) — raw hex in UI code may only go DOWN.
#
# Counts 6-digit hex literals in apps/web/app + apps/web/components (*.tsx)
# and compares against the integer baseline in .hex-baseline at repo root.
#   count >  baseline → fail (you added raw hex; use a token instead)
#   count <= baseline → pass (if you converted hex to tokens, LOWER the
#                       baseline to the new count in the same commit)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BASELINE_FILE="$ROOT/.hex-baseline"

if [[ ! -f "$BASELINE_FILE" ]]; then
  echo "hex-ratchet: FAIL — missing $BASELINE_FILE" >&2
  exit 1
fi

baseline="$(tr -d '[:space:]' < "$BASELINE_FILE")"
if ! [[ "$baseline" =~ ^[0-9]+$ ]]; then
  echo "hex-ratchet: FAIL — .hex-baseline must contain a single integer (got: '$baseline')" >&2
  exit 1
fi

count="$(grep -rEo "#[0-9a-fA-F]{6}\b" "$ROOT/apps/web/app" "$ROOT/apps/web/components" --include="*.tsx" | wc -l | tr -d '[:space:]')"

if (( count > baseline )); then
  echo "hex-ratchet: FAIL — $count raw hex values in apps/web/app + apps/web/components (baseline: $baseline)." >&2
  echo "Raw hex is banned (STYLEGUIDE.md §1): map the color to an existing token in" >&2
  echo "tailwind.config.ts / globals.css, or add a new token there first." >&2
  exit 1
fi

if (( count < baseline )); then
  echo "hex-ratchet: PASS — $count raw hex values (baseline: $baseline). Nice — you converted some;" >&2
  echo "ratchet it in by lowering .hex-baseline to $count in this commit." >&2
else
  echo "hex-ratchet: PASS — $count raw hex values (baseline: $baseline)."
fi
