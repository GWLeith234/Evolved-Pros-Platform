-- Sprint M2: Add placements array to platform_ads for media ad support

ALTER TABLE platform_ads ADD COLUMN IF NOT EXISTS placements TEXT[] DEFAULT ARRAY['platform'];

-- Backfill: existing ads get 'platform' placement
UPDATE platform_ads SET placements = ARRAY['platform'] WHERE placements IS NULL;
