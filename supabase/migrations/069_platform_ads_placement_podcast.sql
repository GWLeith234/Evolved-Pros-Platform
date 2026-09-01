-- Align the placement check with the code: fetchPodcastSponsorAds /
-- getPodcastSponsorPool already query placement in ('podcast','all'), but the
-- constraint rejected 'podcast'. Add it (keep existing values) so podcast-
-- surface ad rows are allowed.
ALTER TABLE public.platform_ads DROP CONSTRAINT IF EXISTS platform_ads_placement_check;
ALTER TABLE public.platform_ads ADD CONSTRAINT platform_ads_placement_check
  CHECK (placement IN ('sidebar', 'topnav', 'academy', 'community', 'events', 'podcast', 'all'));
