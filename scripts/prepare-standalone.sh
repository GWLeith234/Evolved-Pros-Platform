#!/usr/bin/env bash
# Copy Next.js static + public assets into the standalone output so
# `node …/server.js` can serve them. Required for Nixpacks (the Dockerfile
# does the same copy in its runner stage).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEB="$ROOT/apps/web"
STANDALONE_ROOT="$WEB/.next/standalone"

if [[ ! -d "$STANDALONE_ROOT" ]]; then
  echo "prepare-standalone: missing $STANDALONE_ROOT — run pnpm --filter web build first" >&2
  exit 1
fi

# Monorepo emit (outputFileTracingRoot = repo root) nests the app.
if [[ -f "$STANDALONE_ROOT/apps/web/server.js" ]]; then
  TARGET="$STANDALONE_ROOT/apps/web"
elif [[ -f "$STANDALONE_ROOT/server.js" ]]; then
  TARGET="$STANDALONE_ROOT"
else
  echo "prepare-standalone: no server.js under $STANDALONE_ROOT" >&2
  find "$STANDALONE_ROOT" -name 'server.js' -print >&2 || true
  exit 1
fi

mkdir -p "$TARGET/.next"
rm -rf "$TARGET/.next/static" "$TARGET/public"
cp -a "$WEB/.next/static" "$TARGET/.next/static"
if [[ -d "$WEB/public" ]]; then
  cp -a "$WEB/public" "$TARGET/public"
fi

echo "prepare-standalone: assets copied next to $TARGET/server.js"
