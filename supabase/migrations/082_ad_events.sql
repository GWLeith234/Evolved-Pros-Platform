-- First-party house-ad impression / click ledger.
-- Admin /admin/ads reads this table (not the GA4 Data API). The same events
-- are also sent client-side via gtag to the existing property G-LLQZZBWWKS.
-- Additive only — no platform_ads column drops.

CREATE TABLE IF NOT EXISTS public.ad_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id           uuid,
  event_type      text NOT NULL CHECK (event_type IN ('impression', 'click')),
  creative_name   text,
  creative_slot   text NOT NULL CHECK (creative_slot IN ('300x250', '728x90', '300x600')),
  promotion_id    text,
  promotion_name  text NOT NULL DEFAULT 'academy_house',
  location_id     text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ad_events_slot_type
  ON public.ad_events (creative_slot, event_type);

CREATE INDEX IF NOT EXISTS idx_ad_events_ad_id
  ON public.ad_events (ad_id);

CREATE INDEX IF NOT EXISTS idx_ad_events_created_at
  ON public.ad_events (created_at DESC);

-- Service-role only. Public ingest goes through /api/ads/events (adminClient).
-- Admin dashboard reads through adminClient. No browser policies.
ALTER TABLE public.ad_events ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.ad_events IS
  'House Academy ad impressions and clicks. Source of truth for /admin/ads results. Mirrored to GA4 G-LLQZZBWWKS via gtag view_promotion / select_promotion / house_ad_click.';
