-- 096: stop a signed-in member from granting themselves tier, role, or billing.
--
-- Finding: public.users still has users_update_own
-- (packages/db/migrations/001_initial_schema.sql) which is
-- FOR UPDATE USING (auth.uid() = id) with no column list.
-- supabase/migrations/024_tier_rename_and_keynote.sql grants
-- SELECT, UPDATE on the whole table to authenticated.
-- supabase/migrations/081 revokes that write grant from anon only.
-- supabase/migrations/084 replaces SELECT policies and does not touch UPDATE.
-- The only BEFORE UPDATE trigger (users_updated_at) stamps updated_at.
--
-- A member JWT plus the browser anon key can therefore PATCH their own row
-- and set role, tier, tier_status, Stripe ids, and the other billing columns.
-- Checked against a local fixture only. Do not replay that statement on production.
--
-- Fix, least disruptive path that still lets service_role and admins write:
-- 1. Column privileges. REVOKE table UPDATE from authenticated, then GRANT
--    UPDATE only on profile columns that exist. service_role keeps its own
--    table grant, so the Stripe webhook, adminClient, cron, and onboarding
--    are unchanged. New columns are not writable by authenticated until a
--    later migration grants them.
-- 2. BEFORE UPDATE trigger. Column checks run first, so this is a backstop
--    for a later GRANT UPDATE ON public.users TO authenticated (the 024
--    shape). service_role, the migration owner, and private.viewer_is_admin()
--    may change privileged columns. Everyone else is rejected.
--
-- users_update_own stays. Members can still update their own profile row.
-- Display writes from /api/user/me, onboarding, and admin tools already go
-- through adminClient. The mobile client writes push_token with the user
-- session, and that column stays granted.

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO postgres, service_role, authenticated;

-- ── 1. Column privileges ───────────────────────────────────────────────────
DO $$
DECLARE
  safe text[] := ARRAY[
    'display_name',
    'full_name',
    'first_name',
    'last_name',
    'bio',
    'role_title',
    'location',
    'company',
    'avatar_url',
    'banner_url',
    'linkedin_url',
    'website_url',
    'twitter_handle',
    'phone',
    'phone_visible',
    'current_pillar',
    'goal_90day',
    'goal_visible',
    'notification_preferences',
    'theme',
    'push_token',
    'pioneer_driver_type',
    'focus_pillar',
    'onboarding_completed',
    'onboarding_step',
    'onboarded_at',
    'email'
  ];
  present text[] := ARRAY[]::text[];
  col text;
BEGIN
  REVOKE UPDATE ON TABLE public.users FROM PUBLIC;
  REVOKE UPDATE ON TABLE public.users FROM anon;
  REVOKE UPDATE ON TABLE public.users FROM authenticated;

  FOREACH col IN ARRAY safe
  LOOP
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name = col
    ) THEN
      present := present || col;
    END IF;
  END LOOP;

  IF COALESCE(array_length(present, 1), 0) = 0 THEN
    RAISE EXCEPTION '096: no safe profile columns found on public.users';
  END IF;

  EXECUTE format(
    'GRANT UPDATE (%s) ON TABLE public.users TO authenticated',
    (SELECT string_agg(format('%I', c), ', ') FROM unnest(present) AS c)
  );
END
$$;

-- ── 2. Trigger backstop ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION private.users_guard_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO public
AS $$
DECLARE
  protected text[] := ARRAY[
    'id',
    'role',
    'tier',
    'tier_status',
    'tier_expires_at',
    'keynote_access',
    'access_status',
    'comp_promo_code_id',
    'stripe_customer_id',
    'stripe_subscription_id',
    'vendasta_contact_id',
    'vendasta_account_id',
    'vendasta_account_group_id',
    'vendasta_sku',
    'vendasta_subscription_started_at',
    'vendasta_last_event_at',
    'points',
    'created_at',
    'courses_completed',
    'is_alumni',
    'program_completed_at',
    'academy_completed_at',
    'academy_started_at',
    'last_summary_sent_at'
  ];
  col text;
  old_row jsonb := to_jsonb(OLD);
  new_row jsonb := to_jsonb(NEW);
BEGIN
  -- adminClient, Stripe webhook, cron, onboarding, and SQL migrations.
  IF current_user IN (
    'service_role',
    'postgres',
    'supabase_admin',
    'supabase_auth_admin'
  ) THEN
    RETURN NEW;
  END IF;

  IF to_regprocedure('auth.role()') IS NOT NULL AND auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Same authenticated role as members. Allow only when the caller is an admin.
  -- 084 defines private.viewer_is_admin(). If it is missing, fail closed.
  IF to_regprocedure('private.viewer_is_admin()') IS NOT NULL
     AND private.viewer_is_admin() THEN
    RETURN NEW;
  END IF;

  FOREACH col IN ARRAY protected
  LOOP
    IF (old_row ? col)
       AND (new_row ? col)
       AND ((old_row -> col) IS DISTINCT FROM (new_row -> col)) THEN
      RAISE EXCEPTION 'cannot change privileged column %.%', TG_TABLE_NAME, col
        USING ERRCODE = '42501';
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.users_guard_privileged_columns() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.users_guard_privileged_columns() TO authenticated, service_role;

DROP TRIGGER IF EXISTS users_guard_privileged_columns ON public.users;
CREATE TRIGGER users_guard_privileged_columns
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION private.users_guard_privileged_columns();

COMMENT ON FUNCTION private.users_guard_privileged_columns() IS
  'Rejects member updates of role, tier, tier_status, and billing columns. service_role and admins pass. Column GRANTs are the primary lock; this trigger covers a later table-level GRANT UPDATE.';

NOTIFY pgrst, 'reload schema';
