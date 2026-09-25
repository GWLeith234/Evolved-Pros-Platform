#!/usr/bin/env bash
# Local proof for migration 098. Creates a throwaway database, shows that anon
# can TRUNCATE tier_change_log while the pre-fix grants are in place, applies
# 098 twice, then runs pgTAP.
# Does not connect to Supabase or any hosted database.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DB="tier_change_log_revoke_test"
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

echo "=== PRE-FIX: anon can TRUNCATE tier_change_log ==="
"${PSQL[@]}" -d postgres -c "DROP DATABASE IF EXISTS ${DB};"
"${PSQL[@]}" -d postgres -c "CREATE DATABASE ${DB};"
"${PSQL[@]}" -d "$DB" -f "$ROOT/supabase/tests/096_users_priv_fixture.sql"
"${PSQL[@]}" -d "$DB" -f "$ROOT/supabase/migrations/096_users_privileged_column_guard.sql"
"${PSQL[@]}" -d "$DB" -f "$ROOT/supabase/migrations/097_users_revoke_writes_and_audit.sql"
"${PSQL[@]}" -d "$DB" <<'SQL'
ALTER TABLE public.tier_change_log ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER
  ON public.tier_change_log TO anon, authenticated;
GRANT ALL ON public.tier_change_log TO service_role;
DO $$
BEGIN
  IF NOT has_table_privilege('anon', 'public.tier_change_log', 'INSERT')
     OR NOT has_table_privilege('anon', 'public.tier_change_log', 'DELETE')
     OR NOT has_table_privilege('anon', 'public.tier_change_log', 'TRUNCATE')
     OR NOT has_table_privilege('authenticated', 'public.tier_change_log', 'INSERT')
     OR NOT has_table_privilege('authenticated', 'public.tier_change_log', 'UPDATE')
     OR NOT has_table_privilege('authenticated', 'public.tier_change_log', 'DELETE')
     OR NOT has_table_privilege('authenticated', 'public.tier_change_log', 'TRUNCATE')
     OR NOT has_table_privilege('authenticated', 'public.tier_change_log', 'TRIGGER') THEN
    RAISE EXCEPTION 'pre-fix write grants were not in place';
  END IF;
END $$;
SET ROLE anon;
TRUNCATE public.tier_change_log;
RESET ROLE;
SQL

echo "=== POST-FIX: apply 098 twice and run pgTAP ==="
"${PSQL[@]}" -d "$DB" -f "$ROOT/supabase/migrations/098_tier_change_log_revoke_writes.sql"
"${PSQL[@]}" -d "$DB" -f "$ROOT/supabase/migrations/098_tier_change_log_revoke_writes.sql"

TAP_OUT="$(mktemp)"
set +e
"${PSQL[@]}" -q -A -t -d "$DB" -f "$ROOT/supabase/tests/098_tier_change_log_revoke_writes_test.sql" | tee "$TAP_OUT"
tap_status=${PIPESTATUS[0]}
set -e

if [[ "$tap_status" -ne 0 ]]; then
  echo "psql exited $tap_status" >&2
  exit "$tap_status"
fi
if grep -E '^(not ok |# Looks like you failed)' "$TAP_OUT" >/dev/null; then
  echo "pgTAP reported failures" >&2
  exit 1
fi
if ! grep -E '^1\.\.23$' "$TAP_OUT" >/dev/null; then
  echo "pgTAP plan was not 1..23" >&2
  exit 1
fi

echo "=== 23 tests passed ==="
rm -f "$TAP_OUT"
"${PSQL[@]}" -d postgres -c "DROP DATABASE IF EXISTS ${DB};"
