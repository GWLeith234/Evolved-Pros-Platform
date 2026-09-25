-- Local fixture only. Recreates the vulnerable public.users grants and
-- users_update_own policy so 096 can be applied and tested. Not production.

CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS private;

GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

CREATE OR REPLACE FUNCTION auth.role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    NULLIF(current_setting('request.jwt.claim.role', true), ''),
    NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'
  )
$$;

CREATE OR REPLACE FUNCTION auth.jwt()
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true), '')::jsonb
$$;

REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO postgres, service_role, authenticated;

CREATE TABLE public.users (
  id                   uuid PRIMARY KEY,
  email                text UNIQUE,
  display_name         text,
  bio                  text,
  role                 text NOT NULL DEFAULT 'member'
                         CHECK (role IN ('member', 'admin', 'guest')),
  tier                 text NOT NULL DEFAULT 'community'
                         CHECK (tier IN ('community', 'vip', 'pro')),
  tier_status          text DEFAULT 'active'
                         CHECK (tier_status IN ('active', 'trial', 'cancelled', 'expired', 'comp', 'past_due')),
  tier_expires_at      timestamptz,
  keynote_access       boolean NOT NULL DEFAULT false,
  access_status        text NOT NULL DEFAULT 'active'
                         CHECK (access_status IN ('active', 'suspended')),
  comp_promo_code_id   uuid,
  stripe_customer_id   text,
  stripe_subscription_id text,
  vendasta_account_id  text,
  points               integer NOT NULL DEFAULT 0,
  push_token           text,
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own" ON public.users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Original policy from packages/db/migrations/001_initial_schema.sql.
-- No TO clause, no column list, no WITH CHECK beyond the USING expression.
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE
  USING (auth.uid() = id);

-- Migration 024 grants table UPDATE to authenticated. service_role keeps ALL,
-- which is how adminClient writes today.
GRANT SELECT, UPDATE ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;
REVOKE UPDATE ON public.users FROM anon;

CREATE OR REPLACE FUNCTION private.viewer_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.role = 'admin'
      AND (
        u.id = auth.uid()
        OR (u.email IS NOT NULL AND u.email = auth.jwt() ->> 'email')
      )
  );
$$;

REVOKE ALL ON FUNCTION private.viewer_is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.viewer_is_admin() TO authenticated, service_role;

INSERT INTO public.users (id, email, display_name, bio, role, tier, tier_status, points)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'member@example.com', 'Member', 'bio', 'member', 'community', 'active', 3),
  ('00000000-0000-0000-0000-000000000002', 'admin@example.com', 'Admin', 'staff', 'admin', 'pro', 'active', 9);
