-- Local fixture for migration 099. Not production.
-- Minimal public.users so 097's audit trigger can be applied, then 099.

CREATE SCHEMA IF NOT EXISTS auth;

CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

CREATE TABLE public.users (
  id                   uuid PRIMARY KEY,
  email                text UNIQUE,
  display_name         text,
  role                 text NOT NULL DEFAULT 'member'
                         CHECK (role IN ('member', 'admin', 'guest')),
  tier                 text NOT NULL DEFAULT 'community'
                         CHECK (tier IN ('community', 'vip', 'pro')),
  tier_status          text DEFAULT 'active'
                         CHECK (tier_status IN ('active', 'trial', 'cancelled', 'expired', 'comp', 'past_due')),
  tier_expires_at      timestamptz,
  comp_promo_code_id   uuid,
  updated_at           timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.users TO service_role;
