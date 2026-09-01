-- Migration 070: Guest persona + guest_engagements.
-- Introduces the "guest" persona (podcast/keynote guests who receive comped
-- Professional access to the platform) reusing the existing public.users schema.
--
-- NON-DESTRUCTIVE ONLY. This migration:
--   1. Widens the users.role CHECK to allow 'guest' (was member|admin).
--   2. Widens the users.tier_status CHECK to allow 'comp'  (comped access,
--      no Stripe subscription — MUST be excluded from MRR, see lib/pricing.ts).
--   3. Creates public.guest_engagements (spec §4b): the intake + tracking row
--      for each guest, keyed to a signed, unique access_token.
--
-- No columns are dropped or altered destructively; every existing row already
-- satisfies the widened CHECKs. No Stripe/billing objects are touched.
--
-- Security model (house style, mirrors friend_invites / crm_prospects):
-- RLS enabled; admin has full access via authenticated policy; the guest sees
-- only its own row (auth.uid() = user_id) if it ever authenticates. The public
-- /guest/[token] route is anonymous, so it resolves the token through the
-- SECURITY DEFINER lookup_guest_engagement() RPC (granted to anon), and all
-- privileged writes go through the service-role adminClient in the route
-- handlers. The access_token is the bearer credential (magic-link trust model).

-- 1. Persona: widen the role CHECK to include 'guest' -----------------------
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users
  ADD CONSTRAINT users_role_check
  CHECK (role = ANY (ARRAY['member'::text, 'admin'::text, 'guest'::text]));

-- 2. Comped access: widen the tier_status CHECK to include 'comp' -----------
-- A guest is tier='pro', tier_status='comp' — full Professional entitlements
-- but $0 revenue and no Stripe subscription. Revenue code (lib/pricing.ts,
-- admin revenue/stats) excludes tier_status='comp' and role='guest'.
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_tier_status_check;
ALTER TABLE public.users
  ADD CONSTRAINT users_tier_status_check
  CHECK (tier_status = ANY (ARRAY['active'::text, 'trial'::text, 'cancelled'::text, 'expired'::text, 'comp'::text]));

-- 3. guest_engagements ------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.guest_engagements (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- The guest's platform user row (created at invite time; role='guest').
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  -- Optional episode this guest is being booked for.
  episode_id        UUID REFERENCES public.episodes(id) ON DELETE SET NULL,
  status            TEXT NOT NULL DEFAULT 'invited'
                      CHECK (status IN ('invited', 'viewed', 'submitted', 'confirmed', 'revoked')),
  -- Signed, unique bearer token (see lib/guest/token.ts). DB default is a
  -- random hex fallback so the column is never null even on raw inserts; the
  -- app overwrites it with the signed value when minting an invite.
  access_token      TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  token_expires_at  TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  -- Intake submission payload -------------------------------------------------
  one_liner         TEXT,
  short_bio         TEXT,
  headshot_url      TEXT,
  topics            JSONB NOT NULL DEFAULT '[]'::jsonb,
  links             JSONB NOT NULL DEFAULT '[]'::jsonb,
  av_notes          TEXT,
  tee_size          TEXT,
  consent_release   BOOLEAN NOT NULL DEFAULT false,
  submitted_at      TIMESTAMPTZ,
  -- Who invited this guest (admin user).
  invited_by        UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_guest_engagements_user_id
  ON public.guest_engagements (user_id);

CREATE INDEX IF NOT EXISTS idx_guest_engagements_episode_id
  ON public.guest_engagements (episode_id)
  WHERE episode_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_guest_engagements_status
  ON public.guest_engagements (status);

CREATE INDEX IF NOT EXISTS idx_guest_engagements_token_expires_at
  ON public.guest_engagements (token_expires_at);

-- 4. RLS --------------------------------------------------------------------
ALTER TABLE public.guest_engagements ENABLE ROW LEVEL SECURITY;

-- Admin: full access (SELECT/INSERT/UPDATE/DELETE) for authenticated admins.
CREATE POLICY "guest_engagements_admin_all"
  ON public.guest_engagements
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

-- Guest: read only its own row (if it ever authenticates). The anonymous
-- /guest/[token] route reads via the SECURITY DEFINER RPC below instead.
CREATE POLICY "guest_engagements_select_own"
  ON public.guest_engagements
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 5. lookup_guest_engagement() — the /guest/[token] route's anon read path ---
-- Resolves a signed access_token to the row the guide + intake page needs,
-- joining the guest's identity from public.users for personalization/prefill.
-- Returns no rows for an unknown token. SECURITY DEFINER so a logged-out guest
-- can resolve it. Token signature + expiry are re-checked in app code.
CREATE OR REPLACE FUNCTION public.lookup_guest_engagement(p_token text)
RETURNS TABLE (
  engagement_id     uuid,
  user_id           uuid,
  episode_id        uuid,
  status            text,
  token_expires_at  timestamptz,
  one_liner         text,
  short_bio         text,
  headshot_url      text,
  topics            jsonb,
  links             jsonb,
  av_notes          text,
  tee_size          text,
  consent_release   boolean,
  submitted_at      timestamptz,
  guest_email       text,
  guest_full_name   text,
  guest_first_name  text,
  guest_last_name   text,
  guest_avatar_url  text,
  guest_bio         text,
  guest_company     text,
  guest_role_title  text,
  guest_linkedin_url text,
  guest_twitter_handle text,
  episode_title     text,
  episode_slug      text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ge.id, ge.user_id, ge.episode_id, ge.status, ge.token_expires_at,
    ge.one_liner, ge.short_bio, ge.headshot_url, ge.topics, ge.links,
    ge.av_notes, ge.tee_size, ge.consent_release, ge.submitted_at,
    u.email, u.full_name, u.first_name, u.last_name, u.avatar_url, u.bio,
    u.company, u.role_title, u.linkedin_url, u.twitter_handle,
    ep.title, ep.slug
  FROM public.guest_engagements ge
  JOIN public.users u ON u.id = ge.user_id
  LEFT JOIN public.episodes ep ON ep.id = ge.episode_id
  WHERE ge.access_token = p_token
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.lookup_guest_engagement(text)
  TO anon, authenticated, service_role;

COMMENT ON TABLE public.guest_engagements IS
  'Guest persona intake + tracking (spec §4b). One row per guest booking. Admin manages via service role; /guest/[token] resolves the signed access_token via lookup_guest_engagement() RPC. Comped Professional access — excluded from MRR.';
