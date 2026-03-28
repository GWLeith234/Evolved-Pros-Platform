-- Add columns that migration 016 defined but may not have been applied to production
ALTER TABLE public.platform_ads ADD COLUMN IF NOT EXISTS tool_name         text;
ALTER TABLE public.platform_ads ADD COLUMN IF NOT EXISTS endorsement_quote text;
ALTER TABLE public.platform_ads ADD COLUMN IF NOT EXISTS special_offer     text;
ALTER TABLE public.platform_ads ADD COLUMN IF NOT EXISTS sort_order        integer NOT NULL DEFAULT 0;

-- Expand placement constraint to allow academy / community / events / all placements
ALTER TABLE public.platform_ads DROP CONSTRAINT IF EXISTS platform_ads_placement_check;
ALTER TABLE public.platform_ads ADD CONSTRAINT platform_ads_placement_check
  CHECK (placement IN ('sidebar', 'topnav', 'academy', 'community', 'events', 'all'));

-- Ensure authenticated users can read active ads
GRANT SELECT ON public.platform_ads TO authenticated;

-- Seed ad rotation interval setting (used by sidebar + sponsor hooks)
INSERT INTO public.platform_settings (key, value)
VALUES ('ad_sidebar_interval', '8')
ON CONFLICT (key) DO NOTHING;

-- Seed a placeholder sidebar ad so the ad unit renders after deployment
-- (remove or replace via the Admin > Branding portal)
INSERT INTO public.platform_ads (placement, headline, cta_text, link_url, is_active, sort_order)
VALUES ('sidebar', 'Powered by Evolved Pros', 'Learn More →', 'https://evolvedpros.com', true, 0)
ON CONFLICT DO NOTHING;
