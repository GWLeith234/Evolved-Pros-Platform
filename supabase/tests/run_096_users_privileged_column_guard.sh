#!/usr/bin/env bash
# Local proof for migrations 096 and 097. Creates a throwaway database, shows
# the pre-fix member escalation, checks that 096 still leaves INSERT, DELETE,
# TRUNCATE, and TRIGGER in place, then applies 097 and runs pgTAP.
# Does not connect to Supabase or any hosted database.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DB="users_priv_guard_test"
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

echo "=== PRE-FIX: authenticated member updates own tier and role ==="
"${PSQL[@]}" -d postgres -c "DROP DATABASE IF EXISTS ${DB};"
"${PSQL[@]}" -d postgres -c "CREATE DATABASE ${DB};"
"${PSQL[@]}" -d "$DB" -f "$ROOT/supabase/tests/096_users_priv_fixture.sql"
"${PSQL[@]}" -d "$DB" <<'SQL'
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', false);
SELECT set_config('request.jwt.claim.role', 'authenticated', false);
SET ROLE authenticated;
UPDATE public.users
   SET tier = 'pro', role = 'admin', tier_status = 'active', stripe_customer_id = 'cus_self'
 WHERE id = '00000000-0000-0000-0000-000000000001'
 RETURNING id, role, tier, tier_status, stripe_customer_id;
RESET ROLE;
DO $$
DECLARE
  got_role text;
  got_tier text;
BEGIN
  SELECT role, tier INTO got_role, got_tier
  FROM public.users
  WHERE id = '00000000-0000-0000-0000-000000000001';
  IF got_role IS DISTINCT FROM 'admin' OR got_tier IS DISTINCT FROM 'pro' THEN
    RAISE EXCEPTION 'pre-fix escalation did not land: role=% tier=%', got_role, got_tier;
  END IF;
END $$;
SQL

echo "=== AFTER 096, BEFORE 097: INSERT/DELETE/TRUNCATE/TRIGGER still granted ==="
"${PSQL[@]}" -d postgres -c "DROP DATABASE IF EXISTS ${DB};"
"${PSQL[@]}" -d postgres -c "CREATE DATABASE ${DB};"
"${PSQL[@]}" -d "$DB" -f "$ROOT/supabase/tests/096_users_priv_fixture.sql"
"${PSQL[@]}" -d "$DB" -f "$ROOT/supabase/migrations/096_users_privileged_column_guard.sql"
"${PSQL[@]}" -d "$DB" <<'SQL'
DO $$
BEGIN
  IF NOT has_table_privilege('authenticated', 'public.users', 'INSERT')
     OR NOT has_table_privilege('authenticated', 'public.users', 'DELETE')
     OR NOT has_table_privilege('authenticated', 'public.users', 'TRUNCATE')
     OR NOT has_table_privilege('authenticated', 'public.users', 'TRIGGER') THEN
    RAISE EXCEPTION '096 was expected to leave INSERT, DELETE, TRUNCATE, and TRIGGER in place';
  END IF;
END $$;
SELECT privilege_type
  FROM information_schema.table_privileges
 WHERE table_schema = 'public'
   AND table_name = 'users'
   AND grantee = 'authenticated'
   AND privilege_type IN ('INSERT', 'DELETE', 'TRUNCATE', 'TRIGGER')
 ORDER BY 1;
SQL

echo "=== POST-FIX: apply 097 and run pgTAP ==="
"${PSQL[@]}" -d "$DB" -f "$ROOT/supabase/migrations/097_users_revoke_writes_and_audit.sql"

TAP_OUT="$(mktemp)"
set +e
"${PSQL[@]}" -q -A -t -d "$DB" -f "$ROOT/supabase/tests/096_users_privileged_column_guard_test.sql" | tee "$TAP_OUT"
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
if ! grep -E '^1\.\.45$' "$TAP_OUT" >/dev/null; then
  echo "pgTAP plan was not 1..45" >&2
  exit 1
fi

echo "=== 45 tests passed ==="
rm -f "$TAP_OUT"
"${PSQL[@]}" -d postgres -c "DROP DATABASE IF EXISTS ${DB};"
