-- Local fixture for the pro gate. Not production.
-- The runner creates anon, authenticated, and service_role first.
-- auth.uid() matches the hosted session helper: request.jwt.claim.sub,
-- then request.jwt.claims sub. It does not read email.

CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS private;

GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(
    COALESCE(
      NULLIF(current_setting('request.jwt.claim.sub', true), ''),
      NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'
    ),
    ''
  )::uuid
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

CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY
);

CREATE TABLE public.users (
  id                   uuid PRIMARY KEY,
  email                text UNIQUE,
  role                 text NOT NULL DEFAULT 'member',
  tier                 text NOT NULL DEFAULT 'community',
  tier_status          text DEFAULT 'active',
  tier_expires_at      timestamptz,
  comp_promo_code_id   uuid,
  CONSTRAINT users_tier_check CHECK (tier IN ('community', 'vip', 'pro')),
  CONSTRAINT users_tier_status_check CHECK (
    tier_status IS NULL
    OR tier_status IN ('active', 'trial', 'cancelled', 'expired', 'comp', 'past_due')
  )
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_select_own ON public.users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

GRANT SELECT ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;
