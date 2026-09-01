-- Migration 064: reversible beta access gate.
-- SPRINT Q — replaces the old permanent SQL wipe with a reversible flag. An
-- admin can pause ALL non-admin, non-comped access for the closed beta and
-- restore it later with ZERO data loss.
--
-- Only ONE column is added. tier / tier_status / comp_promo_code_id are left
-- untouched, so a restore (access_status -> 'active') is exact.
--
-- RLS: public.users already has row-level security enabled with its existing
-- policies (a user reads their own row; service-role adminClient manages all).
-- access_status is a plain column on that table, so it inherits those policies
-- — admin writes go through adminClient, member reads through the own-row
-- policy. No new policy is required.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS access_status text NOT NULL DEFAULT 'active'
    CHECK (access_status IN ('active', 'suspended'));

-- Partial index: the gate and the admin "suspended list" only ever query the
-- suspended minority.
CREATE INDEX IF NOT EXISTS idx_users_access_status_suspended
  ON public.users (access_status)
  WHERE access_status = 'suspended';

COMMENT ON COLUMN public.users.access_status IS
  'SPRINT Q beta gate. ''suspended'' pauses a non-admin, non-comped member (redirect to /beta-paused); admins and comped Friends (comp_promo_code_id IS NOT NULL) are never gated. Reversible — flip back to ''active''. tier/tier_status/comp flag untouched so restore is exact.';
