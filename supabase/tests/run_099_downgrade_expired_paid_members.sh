#!/usr/bin/env bash
# Local proof for migration 099. Creates a throwaway database, applies the
# 097 audit trigger, applies 099, and checks comps, admins, open periods, and
# one tier_change_log row per downgrade.
# Does not connect to Supabase or any hosted database.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DB="downgrade_expired_paid_test"

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
"${PSQL[@]}" -d "$DB" -f "$ROOT/supabase/tests/099_downgrade_fixture.sql"
"${PSQL[@]}" -d "$DB" -f "$ROOT/supabase/migrations/097_users_revoke_writes_and_audit.sql"
"${PSQL[@]}" -d "$DB" -f "$ROOT/supabase/migrations/099_downgrade_expired_paid_members.sql"
"${PSQL[@]}" -d "$DB" -f "$ROOT/supabase/tests/099_downgrade_expired_paid_members_test.sql"
"${PSQL[@]}" -d postgres -c "DROP DATABASE IF EXISTS ${DB};"

echo "=== 099 downgrade checks passed ==="
