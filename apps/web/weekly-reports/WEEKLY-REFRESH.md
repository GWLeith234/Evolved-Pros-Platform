# Weekly report refresh

Run this on the operator machine, from `apps/web/weekly-reports`:

```bash
export SUPABASE_URL="https://<project>.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="<service-role key already on that machine>"
python3 _build/refresh.py
```

`NEXT_PUBLIC_SUPABASE_URL` is accepted in place of `SUPABASE_URL`. Both variables already exist for the Platform. This does not add a new environment variable to Railway.

What it does:

1. Rebuilds each `report.json` from the on-box feeds. Those files are gitignored. Do not commit them, do not put them in a public bucket, and do not paste them into logs or HTML.
2. Upserts each payload with `POST /rest/v1/rpc/weekly_report_upsert` using the service role. That RPC writes `private.weekly_reports` and is not granted to anon or authenticated. There is no public write route.
3. The script prints a byte count and the HTTP status on failure. It does not print the payload or the key.

If the two variables are unset, the local files are still written and the upsert is skipped.

The hosted app reads the row after the allowlist check and returns it as `report.json` with `Cache-Control: private, no-store` and `Vary: Cookie`.

Apply `supabase/migrations/105_private_weekly_reports.sql` once, by hand, before the first upsert. Do not run it from CI and do not apply it to a hosted database until George says YES.

`--today YYYY-MM-DD` still changes the week label and stale flags.
