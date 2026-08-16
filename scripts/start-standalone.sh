#!/usr/bin/env bash
# Replica-friendly Next.js standalone boot. Do not use `next start` —
# next.config.mjs sets output: 'standalone', and `next start` logs
# `"next start" does not work with "output: standalone"`.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

major="$(node -p "process.versions.node.split('.')[0]")"
if (( major < 20 )); then
  echo "Refusing to boot Node $(node -v) — production requires Node 20+ (see package.json engines, nixpacks.toml, .nvmrc)." >&2
  exit 1
fi

CANDIDATES=(
  "$ROOT/apps/web/.next/standalone/apps/web/server.js"
  "$ROOT/apps/web/.next/standalone/server.js"
)

for f in "${CANDIDATES[@]}"; do
  if [[ -f "$f" ]]; then
    export HOSTNAME="${HOSTNAME:-0.0.0.0}"
    export PORT="${PORT:-3000}"
    exec node "$f"
  fi
done

echo "standalone server.js not found. Looked in:" >&2
printf '  %s\n' "${CANDIDATES[@]}" >&2
echo "Did the build run scripts/prepare-standalone.sh?" >&2
exit 1
