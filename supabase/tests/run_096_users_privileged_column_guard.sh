#!/usr/bin/env bash
# Local proof for migration 096. Creates a throwaway database, shows the
# pre-fix member escalation, then applies the migration and runs pgTAP.
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

echo "=== POST-FIX: apply 096 and run pgTAP ==="
"${PSQL[@]}" -d postgres -c "DROP DATABASE IF EXISTS ${DB};"
"${PSQL[@]}" -d postgres -c "CREATE DATABASE ${DB};"
"${PSQL[@]}" -d "$DB" -f "$ROOT/supabase/tests/096_users_priv_fixture.sql"
"${PSQL[@]}" -d "$DB" -f "$ROOT/supabase/migrations/096_users_privileged_column_guard.sql"

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
if ! grep -E '^1\.\.22$' "$TAP_OUT" >/dev/null; then
  echo "pgTAP plan was not 1..22" >&2
  exit 1
fi

echo "=== 22 tests passed ==="
rm -f "$TAP_OUT"
"${PSQL[@]}" -d postgres -c "DROP DATABASE IF EXISTS ${DB};"
