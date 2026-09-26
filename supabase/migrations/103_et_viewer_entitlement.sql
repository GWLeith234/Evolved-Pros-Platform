-- 103_et_viewer_entitlement.sql
-- Pro gate for the member session.
--
-- The signed-in member calls these functions with their own session.
-- There is no user id argument. The result is that caller's effective tier
-- only. auth.uid() is read directly. private.viewer_user_ids() is not used,
-- so an email match cannot switch the caller to another member.
--
-- Numbered 103. 100 is open PR #178, 101 is already on this branch (PR #189),
-- and 102 is open PR #191. 103 is the next free number.
--
-- Not applied to the hosted project by this change.

-- The internal key professional is normalized to the tier value pro before
-- the period rules run, matching toTierKey in apps/web/lib/entitlements.ts.
-- Comp, admin, and period rules then match effectiveTier in
-- apps/web/lib/membershipPeriod.ts when the caller passes the period end,
-- the role, and the comp flag:
--   * comp (tier_status comp, or comp_promo_code_id set) keeps the stored tier
--   * admin keeps the stored tier
--   * cancelled keeps the stored tier while tier_expires_at is still open
--   * a paid tier whose period has ended drops to community
--   * past_due keeps the stored tier
--   * unpaid, canceled, cancelled (period closed), and expired drop to community
-- A missing public.users row returns community. A null session raises
-- not_authenticated so a signed-out call is not reported as a free member.
-- Returned tier values are only community, vip, and pro.

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;

DO $$
BEGIN
  IF to_regprocedure('auth.uid()') IS NULL THEN
    RAISE EXCEPTION 'auth.uid() is required';
  END IF;

  IF to_regclass('public.users') IS NULL THEN
    RAISE EXCEPTION 'public.users is required';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM (VALUES
      ('tier'),
      ('tier_status'),
      ('tier_expires_at'),
      ('role'),
      ('comp_promo_code_id')
    ) AS needed(column_name)
    WHERE NOT EXISTS (
      SELECT 1
      FROM information_schema.columns c
      WHERE c.table_schema = 'public'
        AND c.table_name = 'users'
        AND c.column_name = needed.column_name
    )
  ) THEN
    RAISE EXCEPTION 'public.users is missing a column the pro gate reads';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION private.et_effective_tier()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tier text;
  v_status text;
  v_expires timestamptz;
  v_role text;
  v_comp uuid;
  v_raw text;
  v_status_l text;
  v_ended boolean;
  v_still_open boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT u.tier, u.tier_status, u.tier_expires_at, u.role, u.comp_promo_code_id
    INTO v_tier, v_status, v_expires, v_role, v_comp
  FROM public.users u
  WHERE u.id = auth.uid();

  IF NOT FOUND THEN
    RETURN 'community';
  END IF;

  v_raw := lower(btrim(coalesce(v_tier, '')));
  IF v_raw = 'professional' THEN
    v_raw := 'pro';
  END IF;

  v_status_l := lower(btrim(coalesce(v_status, '')));

  IF v_status_l = 'comp' OR v_comp IS NOT NULL OR lower(btrim(coalesce(v_role, ''))) = 'admin' THEN
    NULL;
  ELSE
    v_ended := v_expires IS NOT NULL AND v_expires < now();
    v_still_open := v_expires IS NOT NULL AND NOT v_ended;

    IF v_status_l IN ('cancelled', 'canceled') AND v_still_open THEN
      NULL;
    ELSIF v_status_l <> '' AND v_status_l IN ('unpaid', 'canceled', 'cancelled', 'expired') THEN
      v_raw := 'community';
    ELSIF v_status_l = 'past_due' THEN
      NULL;
    ELSIF v_ended AND v_raw IN ('vip', 'pro') THEN
      v_raw := 'community';
    END IF;
  END IF;

  IF v_raw IN ('pro', 'professional') THEN
    RETURN 'pro';
  ELSIF v_raw = 'vip' THEN
    RETURN 'vip';
  END IF;

  RETURN 'community';
END;
$$;

COMMENT ON FUNCTION private.et_effective_tier() IS
  'Caller only. Effective tier community, vip, or pro. Not granted to member roles.';

REVOKE ALL ON FUNCTION private.et_effective_tier() FROM PUBLIC;
DO $$
DECLARE
  owner_name text;
BEGIN
  SELECT pg_get_userbyid(proowner)
    INTO owner_name
  FROM pg_proc
  WHERE pronamespace = 'private'::regnamespace
    AND proname = 'et_effective_tier'
    AND pg_get_function_identity_arguments(oid) = '';

  EXECUTE format('GRANT EXECUTE ON FUNCTION private.et_effective_tier() TO %I', owner_name);
END $$;

CREATE OR REPLACE FUNCTION public.et_viewer_entitlement()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'effective_tier', t,
    'is_pro', t = 'pro'
  )
  FROM (SELECT private.et_effective_tier() AS t) s;
$$;

COMMENT ON FUNCTION public.et_viewer_entitlement() IS
  'Caller only. jsonb keys effective_tier (community, vip, or pro) and is_pro (boolean). No arguments.';

CREATE OR REPLACE FUNCTION public.et_viewer_is_pro()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT private.et_effective_tier() = 'pro';
$$;

COMMENT ON FUNCTION public.et_viewer_is_pro() IS
  'Caller only. True when et_viewer_entitlement().effective_tier is pro. No arguments.';

REVOKE ALL ON FUNCTION public.et_viewer_entitlement() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.et_viewer_is_pro() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.et_viewer_entitlement() TO authenticated;
GRANT EXECUTE ON FUNCTION public.et_viewer_is_pro() TO authenticated;
