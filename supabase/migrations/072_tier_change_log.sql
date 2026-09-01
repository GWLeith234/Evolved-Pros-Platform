-- 072_tier_change_log.sql
-- SPRINT I — Reconciliation ONLY (no behavioural change).
--
-- WHY THIS EXISTS
-- public.tier_change_log has been LIVE in production for a while — it was
-- hand-applied in the Supabase SQL editor and NEVER captured as a migration.
-- The Stripe webhook (app/api/stripe/webhook/route.ts, logTierChange) INSERTs
-- into it on every actual tier change, and the legacy Vendasta path wrote to it
-- too. Because no migration ever defined it, a fresh environment built from
-- supabase/migrations/ would ship WITHOUT this table and the webhook would fail
-- on the first tier change. This file codifies the verified live schema so the
-- repo reproduces production.
--
-- IDEMPOTENCY CONTRACT
-- Fully idempotent — a safe no-op when run against production (where the table,
-- indexes, and policy already exist):
--   * CREATE TABLE IF NOT EXISTS   — no-op if present
--   * CREATE INDEX IF NOT EXISTS   — no-op if present
--   * DROP POLICY IF EXISTS ... then CREATE POLICY — re-applies cleanly
-- Additive only. Does not touch users or any other table.

-- Verified live schema, reproduced exactly.
CREATE TABLE IF NOT EXISTS public.tier_change_log (
  id          uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  old_tier    text NULL,
  new_tier    text NOT NULL,
  direction   text NOT NULL,
  changed_at  timestamptz NOT NULL DEFAULT now()
);

-- RLS on — enabling twice is a no-op.
ALTER TABLE public.tier_change_log ENABLE ROW LEVEL SECURITY;

-- ── tier_change_log_admin_read ──────────────────────────────────────────────
-- Only authenticated admins may read the audit log. Writes come from the
-- service-role webhook (adminClient), which bypasses RLS, so no INSERT policy
-- is required. auth.uid() is verified correct against live prod — do NOT
-- rewrite to an email lookup.
DROP POLICY IF EXISTS tier_change_log_admin_read ON public.tier_change_log;
CREATE POLICY tier_change_log_admin_read ON public.tier_change_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- ── indexes ──────────────────────────────────────────────────────────────────
-- user_id: per-user history lookups. changed_at DESC: the admin log view orders
-- most-recent first.
CREATE INDEX IF NOT EXISTS tier_change_log_user_id_idx
  ON public.tier_change_log (user_id);
CREATE INDEX IF NOT EXISTS tier_change_log_changed_at_idx
  ON public.tier_change_log (changed_at DESC);
