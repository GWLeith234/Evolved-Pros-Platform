-- 031_ads_zones.sql
-- Extend platform_ads for IAB zone-based ad management

ALTER TABLE public.platform_ads ADD COLUMN IF NOT EXISTS zone        varchar(10)  DEFAULT 'A';
ALTER TABLE public.platform_ads ADD COLUMN IF NOT EXISTS start_date  timestamptz;
ALTER TABLE public.platform_ads ADD COLUMN IF NOT EXISTS end_date    timestamptz;
ALTER TABLE public.platform_ads ADD COLUMN IF NOT EXISTS click_url   text;
ALTER TABLE public.platform_ads ADD COLUMN IF NOT EXISTS sponsor_name text;
ALTER TABLE public.platform_ads ADD COLUMN IF NOT EXISTS ad_type     varchar(20)  DEFAULT 'image';

-- Zone reference:
--   A = 300×250 sidebar rectangle
--   B = native in-feed
--   C = 728×90 leaderboard banner
--   D = pre-roll video
