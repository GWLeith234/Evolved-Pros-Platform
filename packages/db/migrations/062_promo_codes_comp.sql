-- Migration 062: Comp codes ("Friends of George") + redemptions.
-- SPRINT O — one shared comp code grants free Pro until revoked, plus the
-- member-facing redeem flow. Admin invite UI is Sprint P.
--
-- Security model (matches crm_prospects / house style): RLS is enabled on the
-- new tables with NO member-facing policies. Members must never read
-- promo_codes directly — the service-role adminClient handles admin writes in
-- API routes, and members validate a code through the SECURITY DEFINER
-- validate_promo_code() RPC below, which exposes only active + capacity.

-- 1. promo_codes ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code             TEXT UNIQUE NOT NULL,
  label            TEXT,
  grants_tier      TEXT NOT NULL DEFAULT 'pro',
  price_cents      INT  NOT NULL DEFAULT 0,
  active           BOOLEAN NOT NULL DEFAULT true,
  max_redemptions  INT,               -- NULL = unlimited
  redemption_count INT  NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Case-insensitive lookup (members may type any case; validate_promo_code
-- matches on upper(code)).
CREATE INDEX IF NOT EXISTS idx_promo_codes_code_upper
  ON public.promo_codes (upper(code));

-- 2. promo_redemptions ------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.promo_redemptions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT,
  redeemed_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (promo_code_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_promo_redemptions_user
  ON public.promo_redemptions (user_id);

-- 3. users.comp_promo_code_id ----------------------------------------------
-- Marks a member as comped and by which code, so admin/MRR logic can tell a
-- comped Pro from a paying Pro, and so a comp can be revoked later.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS comp_promo_code_id UUID REFERENCES public.promo_codes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_users_comp_promo_code_id
  ON public.users (comp_promo_code_id)
  WHERE comp_promo_code_id IS NOT NULL;

-- 4. RLS --------------------------------------------------------------------
-- Enable RLS, add no public policies: service_role (adminClient) bypasses RLS
-- for admin reads/writes; members reach codes only via validate_promo_code().
ALTER TABLE public.promo_codes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_redemptions ENABLE ROW LEVEL SECURITY;

-- 5. validate_promo_code() — the only path a member has to a code -----------
-- Returns a single row when the code is usable (active AND within capacity);
-- returns no rows otherwise. It deliberately exposes nothing beyond what the
-- redeem/welcome UI needs to show the offer, and never the full table.
CREATE OR REPLACE FUNCTION public.validate_promo_code(p_code text)
RETURNS TABLE (
  promo_code_id uuid,
  grants_tier   text,
  price_cents   int,
  label         text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, grants_tier, price_cents, label
  FROM public.promo_codes
  WHERE upper(code) = upper(btrim(p_code))
    AND active = true
    AND (max_redemptions IS NULL OR redemption_count < max_redemptions)
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.validate_promo_code(text)
  TO authenticated, service_role;

-- 5b. Keep redemption_count in sync automatically. The unique
-- (promo_code_id, user_id) constraint means each member can only insert once
-- per code, so the counter can never double-count a member. Redeem logic just
-- inserts the redemption row; the count maintains itself.
CREATE OR REPLACE FUNCTION public.bump_promo_redemption_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.promo_codes
     SET redemption_count = redemption_count + 1
   WHERE id = NEW.promo_code_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_promo_redemption_count ON public.promo_redemptions;
CREATE TRIGGER trg_promo_redemption_count
  AFTER INSERT ON public.promo_redemptions
  FOR EACH ROW EXECUTE FUNCTION public.bump_promo_redemption_count();

-- 6. Seed the one shared comp code -----------------------------------------
INSERT INTO public.promo_codes (code, label, grants_tier)
VALUES ('FRIENDSOFGEORGE', 'Friends of George', 'pro')
ON CONFLICT (code) DO NOTHING;

COMMENT ON TABLE public.promo_codes IS
  'Comp / access codes. Members validate via validate_promo_code() RPC; admin manages via service role.';
COMMENT ON COLUMN public.users.comp_promo_code_id IS
  'Set when a member redeemed a comp code (free tier grant); NULL for paying/organic members. Used to exclude comps from MRR and to support revocation.';
