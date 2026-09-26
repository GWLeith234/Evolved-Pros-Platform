#!/usr/bin/env bash
# Local proof for migration 106. Creates a throwaway database, applies the
# media publish notification trigger, and checks one alert per member, no
# duplicate on re-save or republish, and no alert for admins.
# Does not connect to Supabase or any hosted database.
# Notification rows are not printed.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DB="media_publish_notify_test"

if ! sudo -u postgres psql -d postgres -c 'SELECT 1' >/dev/null 2>&1; then
  echo "local postgres is not available; skipped live-database work on purpose" >&2
  exit 1
fi

PSQL=(sudo -u postgres psql -v ON_ERROR_STOP=1)

ensure_role() {
  local name="$1"
  shift
  if "${PSQL[@]}" -d postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname = '$name'" | grep -q 1; then
    if [[ $# -gt 0 ]]; then
      "${PSQL[@]}" -d postgres -c "ALTER ROLE $name $*"
    fi
  else
    "${PSQL[@]}" -d postgres -c "CREATE ROLE $name $* NOLOGIN"
  fi
}

ensure_role anon
ensure_role authenticated
ensure_role service_role BYPASSRLS

"${PSQL[@]}" -d postgres -c "DROP DATABASE IF EXISTS ${DB};"
"${PSQL[@]}" -d postgres -c "CREATE DATABASE ${DB};"
"${PSQL[@]}" -d "$DB" -f "$ROOT/supabase/tests/106_media_publish_notify_fixture.sql"
"${PSQL[@]}" -d "$DB" -f "$ROOT/supabase/migrations/106_media_publish_notify.sql"
"${PSQL[@]}" -d "$DB" -f "$ROOT/supabase/tests/106_media_publish_notify_test.sql"
"${PSQL[@]}" -d postgres -c "DROP DATABASE IF EXISTS ${DB};"

echo "=== 106 media publish notify checks passed ==="
