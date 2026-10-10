#!/usr/bin/env bash
# Throwaway database for migration 108 (EvPros Today brief: vip and pro).
# Applies 103 first, then 108. Does not connect to the hosted project.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DB="et_brief_vip_pro_test"

if ! sudo -u postgres psql -d postgres -c 'SELECT 1' >/dev/null 2>&1; then
  sudo service postgresql start >/dev/null 2>&1 || true
fi

if ! sudo -u postgres psql -d postgres -c 'SELECT 1' >/dev/null 2>&1; then
  echo "local postgres is not available" >&2
  exit 1
fi

PSQL=(sudo -u postgres psql -v ON_ERROR_STOP=1)

if grep -n $'\u2014\|\u2013' \
  "$ROOT/supabase/migrations/108_et_brief_vip_and_pro.sql" \
  "$ROOT/supabase/migrations/109_membership_prices_149_599.sql" \
  "$ROOT/supabase/tests/108_et_brief_vip_and_pro_test.sql"
then
  echo "em dash or en dash found in the pricing reshape SQL" >&2
  exit 1
fi

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

cleanup() {
  "${PSQL[@]}" -d postgres -c "DROP DATABASE IF EXISTS ${DB};" >/dev/null 2>&1 || true
}
trap cleanup EXIT

ensure_role anon
ensure_role authenticated
ensure_role service_role BYPASSRLS

run_file() {
  local db="$1"
  local file="$2"
  "${PSQL[@]}" -d "$db" < "$file"
}

cleanup
"${PSQL[@]}" -d postgres -c "CREATE DATABASE ${DB};"
run_file "$DB" "$ROOT/supabase/tests/103_et_viewer_fixture.sql"
run_file "$DB" "$ROOT/supabase/migrations/103_et_viewer_entitlement.sql"
run_file "$DB" "$ROOT/supabase/migrations/108_et_brief_vip_and_pro.sql"
run_file "$DB" "$ROOT/supabase/tests/108_et_brief_vip_and_pro_test.sql"

echo "=== 108 et brief vip and pro checks passed ==="
