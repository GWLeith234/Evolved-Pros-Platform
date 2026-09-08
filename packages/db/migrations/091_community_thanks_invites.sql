-- Migration 091: Thank-you free Community invite cadence (THANKS_COMMUNITY).
-- NEW lane. Does not alter friend_invites, lookup_friend_invite, or
-- FRIENDSOFGEORGE. FOG /welcome stays the Friends of George claim path.
-- Cadence: 12 emails, cadence_step 0-11 (E01 D0 ... E12 D56).
-- Stop on redeem OR after step 11. App expiry is 90 days from create.
--
-- Security model (house style, mirrors friend_invites): RLS enabled, NO
-- member-facing policies. Admin manages through the service-role adminClient.
-- The public /invite/thanks?token= route resolves an invite through the
-- SECURITY DEFINER lookup_thanks_invite() RPC.

-- 1. Seed THANKS_COMMUNITY (never FRIENDSOFGEORGE) --------------------------
INSERT INTO public.promo_codes (code, label, grants_tier)
VALUES ('THANKS_COMMUNITY', 'Thank you Community', 'community')
ON CONFLICT (code) DO NOTHING;

-- 2. community_thanks_invites ----------------------------------------------
CREATE TABLE IF NOT EXISTS public.community_thanks_invites (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email                TEXT UNIQUE NOT NULL,
  first_name           TEXT,
  promo_code_id        UUID REFERENCES public.promo_codes(id) ON DELETE SET NULL,
  invited_by           UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  token                UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  status               TEXT NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending', 'sent', 'redeemed', 'stopped', 'expired')),
  cadence_step         SMALLINT NOT NULL DEFAULT 0
                         CHECK (cadence_step BETWEEN 0 AND 11),
  expires_at           TIMESTAMPTZ NOT NULL,
  next_send_at         TIMESTAMPTZ,
  last_sent_at         TIMESTAMPTZ,
  sent_at              TIMESTAMPTZ,
  redeemed_at          TIMESTAMPTZ,
  stopped_reason       TEXT,
  batch_id             UUID,
  fog_override         BOOLEAN NOT NULL DEFAULT false,
  fog_override_reason  TEXT,
  delivered_count      INT NOT NULL DEFAULT 0,
  last_resend_id       TEXT,
  opened_at            TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_community_thanks_invites_status
  ON public.community_thanks_invites (status);

CREATE INDEX IF NOT EXISTS idx_community_thanks_invites_next_send
  ON public.community_thanks_invites (next_send_at)
  WHERE next_send_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_community_thanks_invites_batch
  ON public.community_thanks_invites (batch_id)
  WHERE batch_id IS NOT NULL;

-- 3. Send log (delivery + optional opens if a webhook is added later) ------
CREATE TABLE IF NOT EXISTS public.community_thanks_sends (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_id     UUID NOT NULL REFERENCES public.community_thanks_invites(id) ON DELETE CASCADE,
  cadence_step  SMALLINT NOT NULL CHECK (cadence_step BETWEEN 0 AND 11),
  resend_id     TEXT,
  status        TEXT NOT NULL CHECK (status IN ('sent', 'failed')),
  opened_at     TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_community_thanks_sends_invite
  ON public.community_thanks_sends (invite_id);

-- 4. Nudge queue: due steps land as pending_approval. Never auto-sends. ----
CREATE TABLE IF NOT EXISTS public.community_thanks_nudge_queue (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_id    UUID NOT NULL REFERENCES public.community_thanks_invites(id) ON DELETE CASCADE,
  cadence_step SMALLINT NOT NULL CHECK (cadence_step BETWEEN 0 AND 11),
  due_at       TIMESTAMPTZ NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending_approval'
                 CHECK (status IN ('pending_approval', 'approved', 'sent', 'cancelled')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at  TIMESTAMPTZ,
  approved_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE (invite_id, cadence_step)
);

CREATE INDEX IF NOT EXISTS idx_community_thanks_nudge_queue_status
  ON public.community_thanks_nudge_queue (status, due_at);

-- 5. RLS — admin-only via service role; no public policies -----------------
ALTER TABLE public.community_thanks_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_thanks_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_thanks_nudge_queue ENABLE ROW LEVEL SECURITY;

-- 6. lookup_thanks_invite() — /invite/thanks only path to an invite --------
CREATE OR REPLACE FUNCTION public.lookup_thanks_invite(p_token uuid)
RETURNS TABLE (
  invite_id   uuid,
  email       text,
  first_name  text,
  status      text,
  expires_at  timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, email, first_name, status, expires_at
  FROM public.community_thanks_invites
  WHERE token = p_token
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.lookup_thanks_invite(uuid)
  TO anon, authenticated, service_role;

COMMENT ON TABLE public.community_thanks_invites IS
  'Thank-you Community invites (THANKS_COMMUNITY). Admin manages via service role; /invite/thanks resolves tokens via lookup_thanks_invite() RPC. Separate from friend_invites / FOG.';
COMMENT ON FUNCTION public.lookup_thanks_invite(uuid) IS
  'Public claim lookup for thank-you Community tokens. Does not read friend_invites.';
