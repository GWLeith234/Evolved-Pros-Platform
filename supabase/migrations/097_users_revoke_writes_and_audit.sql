-- 097: members may update profile columns only.
--
-- Live read-only audit (not modified here): authenticated holds column UPDATE
-- on tier_expires_at, access_status, comp_promo_code_id, stripe_customer_id,
-- and stripe_subscription_id, plus table INSERT, DELETE, TRUNCATE, and TRIGGER
-- on public.users. TRUNCATE ignores RLS, so that grant can wipe the table.
--
-- 096 revokes table UPDATE and grants profile columns. On Postgres 16 that
-- table revoke also clears column UPDATE. It does not revoke INSERT, DELETE,
-- TRUNCATE, or TRIGGER. This migration revokes those from anon and
-- authenticated, revokes every column UPDATE, then grants the profile columns
-- again. Re-running it puts the same lock back if a later GRANT widens it.
--
-- Signup does not need an authenticated INSERT. Profile creation goes through
-- adminClient (service_role):
--   apps/web/app/api/welcome/claim/route.ts
--   apps/web/app/api/invite/thanks/claim/route.ts
--   apps/web/app/api/admin/invite/route.ts
--   apps/web/app/api/onboarding/complete/route.ts (upsert)
-- There is no "Users can insert own profile" policy in the migrations.
--
-- tier_change_log gains nullable role, tier_status, and actor columns so the
-- Stripe webhook insert (user_id, old_tier, new_tier, direction) still works.
-- An AFTER UPDATE trigger records tier, role, and tier_status changes with
-- current_user and auth.uid().

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO postgres, service_role, authenticated;

-- ── 1. Grants: profile UPDATE only, no table writes ────────────────────────
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
  REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER
    ON TABLE public.users FROM PUBLIC;
  REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER
    ON TABLE public.users FROM anon;
  REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER
    ON TABLE public.users FROM authenticated;

  -- Column ACLs are separate from the table grant. Clear every column, then
  -- put back only the profile list. service_role is not in this revoke.
  FOR col IN
    SELECT c.column_name
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = 'users'
  LOOP
    EXECUTE format(
      'REVOKE UPDATE (%I) ON TABLE public.users FROM PUBLIC, anon, authenticated',
      col
    );
  END LOOP;

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
    RAISE EXCEPTION '097: no safe profile columns found on public.users';
  END IF;

  EXECUTE format(
    'GRANT UPDATE (%s) ON TABLE public.users TO authenticated',
    (SELECT string_agg(format('%I', c), ', ') FROM unnest(present) AS c)
  );
END
$$;

-- ── 2. Audit columns ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tier_change_log (
  id          uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  old_tier    text NULL,
  new_tier    text NOT NULL,
  direction   text NOT NULL,
  changed_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tier_change_log
  ADD COLUMN IF NOT EXISTS old_role text,
  ADD COLUMN IF NOT EXISTS new_role text,
  ADD COLUMN IF NOT EXISTS old_tier_status text,
  ADD COLUMN IF NOT EXISTS new_tier_status text,
  ADD COLUMN IF NOT EXISTS actor_role text,
  ADD COLUMN IF NOT EXISTS actor_uid uuid;

COMMENT ON COLUMN public.tier_change_log.actor_role IS
  'Database role that issued the users update (current_user), such as service_role or authenticated.';
COMMENT ON COLUMN public.tier_change_log.actor_uid IS
  'auth.uid() claim on that statement. Null when the caller has no user JWT.';

-- ── 3. Trigger ─────────────────────────────────────────────────────────────
-- Insert runs as the function owner so RLS on tier_change_log does not block
-- service_role or an admin JWT. Direct calls are rejected: this is not a
-- general logging RPC. The trigger passes current_user from the invoker.
CREATE OR REPLACE FUNCTION private.insert_tier_change_log(
  p_user_id uuid,
  p_old_tier text,
  p_new_tier text,
  p_direction text,
  p_old_role text,
  p_new_role text,
  p_old_tier_status text,
  p_new_tier_status text,
  p_actor_role text,
  p_actor_uid uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  IF pg_trigger_depth() < 1 THEN
    RAISE EXCEPTION 'tier_change_log writes are trigger-only'
      USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.tier_change_log (
    user_id,
    old_tier,
    new_tier,
    direction,
    old_role,
    new_role,
    old_tier_status,
    new_tier_status,
    actor_role,
    actor_uid
  ) VALUES (
    p_user_id,
    p_old_tier,
    p_new_tier,
    p_direction,
    p_old_role,
    p_new_role,
    p_old_tier_status,
    p_new_tier_status,
    p_actor_role,
    p_actor_uid
  );
END;
$$;

REVOKE ALL ON FUNCTION private.insert_tier_change_log(
  uuid, text, text, text, text, text, text, text, text, uuid
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.insert_tier_change_log(
  uuid, text, text, text, text, text, text, text, text, uuid
) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.users_audit_privilege_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO public
AS $$
DECLARE
  bits text[] := ARRAY[]::text[];
  actor uuid;
BEGIN
  IF NEW.tier IS DISTINCT FROM OLD.tier THEN
    bits := array_append(bits, 'tier');
  END IF;
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    bits := array_append(bits, 'role');
  END IF;
  IF NEW.tier_status IS DISTINCT FROM OLD.tier_status THEN
    bits := array_append(bits, 'tier_status');
  END IF;

  IF COALESCE(array_length(bits, 1), 0) = 0 THEN
    RETURN NEW;
  END IF;

  actor := NULL;
  IF to_regprocedure('auth.uid()') IS NOT NULL THEN
    actor := auth.uid();
  END IF;

  PERFORM private.insert_tier_change_log(
    NEW.id,
    OLD.tier,
    COALESCE(NEW.tier, OLD.tier, ''),
    array_to_string(bits, ','),
    OLD.role,
    NEW.role,
    OLD.tier_status,
    NEW.tier_status,
    current_user,
    actor
  );
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.users_audit_privilege_change() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.users_audit_privilege_change() TO authenticated, service_role;

DROP TRIGGER IF EXISTS users_audit_privilege_change ON public.users;
CREATE TRIGGER users_audit_privilege_change
  AFTER UPDATE OF role, tier, tier_status ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION private.users_audit_privilege_change();

COMMENT ON FUNCTION private.users_audit_privilege_change() IS
  'Writes tier, role, and tier_status changes to tier_change_log with current_user and auth.uid().';

NOTIFY pgrst, 'reload schema';
