#!/usr/bin/env bash
# Local proof for migration 101. Creates a throwaway database, applies the
# media_stories hero trigger, and checks publish, draft, redirect, and view
# updates. Does not connect to Supabase or any hosted database.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DB="media_stories_hero_test"

if ! sudo -u postgres psql -d postgres -c 'SELECT 1' >/dev/null 2>&1; then
  echo "local postgres is not available; skipped live-database work on purpose" >&2
  exit 1
fi

PSQL=(sudo -u postgres psql -v ON_ERROR_STOP=1)

"${PSQL[@]}" -d postgres -c "DROP DATABASE IF EXISTS ${DB};"
"${PSQL[@]}" -d postgres -c "CREATE DATABASE ${DB};"
"${PSQL[@]}" -d "$DB" -f "$ROOT/supabase/tests/101_media_stories_fixture.sql"
"${PSQL[@]}" -d "$DB" -f "$ROOT/supabase/migrations/101_media_stories_publish_requires_hero.sql"
"${PSQL[@]}" -d "$DB" -f "$ROOT/supabase/tests/101_media_stories_publish_requires_hero_test.sql"
"${PSQL[@]}" -d postgres -c "DROP DATABASE IF EXISTS ${DB};"

echo "=== 101 media story hero checks passed ==="
