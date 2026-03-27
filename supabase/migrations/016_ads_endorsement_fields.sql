-- Expand placement CHECK constraint
ALTER TABLE public.platform_ads DROP CONSTRAINT IF EXISTS platform_ads_placement_check;
ALTER TABLE public.platform_ads ADD CONSTRAINT platform_ads_placement_check
  CHECK (placement IN ('sidebar', 'topnav', 'academy', 'community', 'events', 'all'));

-- Add new columns
ALTER TABLE public.platform_ads ADD COLUMN IF NOT EXISTS tool_name text;
ALTER TABLE public.platform_ads ADD COLUMN IF NOT EXISTS endorsement_quote text;
ALTER TABLE public.platform_ads ADD COLUMN IF NOT EXISTS special_offer text;
