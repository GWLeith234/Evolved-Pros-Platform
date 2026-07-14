-- Migration 063: Friends of George invites + tracking.
-- SPRINT P — admin invites friends by email (magic link) and tracks
-- redemptions. Builds on 062 (promo_codes / promo_redemptions / redeemComp).
--
-- Security model (house style): RLS enabled, NO member-facing policies — admin
-- manages invites through the service-role adminClient in API routes. The
-- public /welcome?token= route resolves an invite through the SECURITY DEFINER
-- lookup_friend_invite() RPC, which takes the secret token and returns only
-- what the welcome screen needs.

-- 1. friend_invites ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.friend_invites (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  promo_code_id UUID REFERENCES public.promo_codes(id) ON DELETE SET NULL,
  invited_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  token         UUID UNIQUE DEFAULT gen_random_uuid(),
  status        TEXT NOT NULL DEFAULT 'invited'
                  CHECK (status IN ('invited', 'redeemed', 'revoked')),
  sent_at       TIMESTAMPTZ DEFAULT now(),
  redeemed_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_friend_invites_status
  ON public.friend_invites (status);

-- 2. RLS — admin-only via service role; no public policies -------------------
ALTER TABLE public.friend_invites ENABLE ROW LEVEL SECURITY;

-- 3. lookup_friend_invite() — the /welcome route's only path to an invite ----
-- Resolves the secret token to the invite the welcome screen needs. Returns no
-- rows for an unknown token. SECURITY DEFINER so it works before the invitee
-- has authenticated.
CREATE OR REPLACE FUNCTION public.lookup_friend_invite(p_token uuid)
RETURNS TABLE (
  invite_id     uuid,
  email         text,
  promo_code_id uuid,
  status        text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, email, promo_code_id, status
  FROM public.friend_invites
  WHERE token = p_token
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.lookup_friend_invite(uuid)
  TO anon, authenticated, service_role;

COMMENT ON TABLE public.friend_invites IS
  'Friends of George invites. Admin manages via service role; /welcome resolves tokens via lookup_friend_invite() RPC.';
