-- Migration 066: own products / prices catalogue (SPRINT I Phase 2).
-- Our own source-of-truth commerce catalogue, replacing the hardcoded
-- lib/admin/products defaults + platform_settings overrides + Vendasta SKU
-- wiring. Products carry an optional membership tier and a kind (membership /
-- LIVE event / high-ticket); prices are recurring (month/year) or one-time.
-- Stripe linkage columns (stripe_product_id / stripe_price_id) let the
-- catalogue be mirrored to Stripe and let checkout resolve a Stripe price id
-- straight from our schema.
--
-- Seed amounts are the canonical membership prices from lib/pricing.ts
-- (Community free · VIP $49/mo, $490/yr · Professional $249/mo, $2,490/yr).
-- Strangler: additive only — nothing existing is dropped here.

CREATE TABLE IF NOT EXISTS public.products (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              text UNIQUE NOT NULL,
  name              text NOT NULL,
  description       text,
  kind              text NOT NULL DEFAULT 'membership'
                      CHECK (kind IN ('membership', 'live_event', 'high_ticket')),
  tier              text CHECK (tier IS NULL OR tier IN ('community', 'vip', 'pro')),
  active            boolean NOT NULL DEFAULT true,
  sort_order        integer NOT NULL DEFAULT 0,
  stripe_product_id text,
  metadata          jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.prices (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  interval        text NOT NULL DEFAULT 'month'
                    CHECK (interval IN ('month', 'year', 'one_time')),
  unit_amount     integer NOT NULL CHECK (unit_amount >= 0),   -- minor units (cents)
  currency        text NOT NULL DEFAULT 'usd',
  active          boolean NOT NULL DEFAULT true,
  stripe_price_id text,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prices_product_id ON public.prices (product_id);
CREATE UNIQUE INDEX IF NOT EXISTS products_stripe_product_id_key
  ON public.products (stripe_product_id) WHERE stripe_product_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS prices_stripe_price_id_key
  ON public.prices (stripe_price_id) WHERE stripe_price_id IS NOT NULL;
-- One active recurring price per (product, interval) keeps checkout resolution
-- unambiguous.
CREATE UNIQUE INDEX IF NOT EXISTS prices_product_interval_active_key
  ON public.prices (product_id, interval) WHERE active;

-- RLS: catalogue is readable by anyone (public pricing display); writes go
-- through the service-role adminClient (admin Products screen + Stripe sync),
-- which bypasses RLS. Mirrors the pattern used elsewhere in this schema.
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prices   ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products readable by all" ON public.products;
CREATE POLICY "products readable by all" ON public.products
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "prices readable by all" ON public.prices;
CREATE POLICY "prices readable by all" ON public.prices
  FOR SELECT USING (true);

-- ---------------------------------------------------------------------------
-- Seed the membership ladder (canonical amounts from lib/pricing.ts).
-- Idempotent on products.slug; prices seeded only when absent for the product.
-- ---------------------------------------------------------------------------
INSERT INTO public.products (slug, name, description, kind, tier, sort_order)
VALUES
  ('membership_community', 'Community', 'Free entry membership', 'membership', 'community', 0),
  ('membership_vip',       'VIP Membership', 'Core membership',   'membership', 'vip',       1),
  ('membership_pro',       'Professional Membership', 'Full system access', 'membership', 'pro', 2)
ON CONFLICT (slug) DO NOTHING;

-- VIP: $49/mo, $490/yr
INSERT INTO public.prices (product_id, interval, unit_amount, currency)
SELECT p.id, v.iv, v.amt, 'usd'
FROM public.products p
CROSS JOIN (VALUES ('month', 4900), ('year', 49000)) AS v(iv, amt)
WHERE p.slug = 'membership_vip'
  AND NOT EXISTS (
    SELECT 1 FROM public.prices x WHERE x.product_id = p.id AND x.interval = v.iv
  );

-- Professional: $249/mo, $2,490/yr
INSERT INTO public.prices (product_id, interval, unit_amount, currency)
SELECT p.id, v.iv, v.amt, 'usd'
FROM public.products p
CROSS JOIN (VALUES ('month', 24900), ('year', 249000)) AS v(iv, amt)
WHERE p.slug = 'membership_pro'
  AND NOT EXISTS (
    SELECT 1 FROM public.prices x WHERE x.product_id = p.id AND x.interval = v.iv
  );

COMMENT ON TABLE public.products IS
  'SPRINT I Phase 2 — own commerce catalogue (source of truth). kind: membership | live_event | high_ticket. tier set for memberships. Mirrored to Stripe via stripe_product_id.';
COMMENT ON TABLE public.prices IS
  'SPRINT I Phase 2 — prices for public.products. unit_amount in minor units (cents). Recurring (month/year) or one_time. stripe_price_id links the mirrored Stripe price; checkout resolves it from here.';
