-- 051_lessons_thumbnail_url.sql — lesson thumbnail cache.
--
-- lessons.mux_asset_id actually stores HeyGen video_ids for these lessons
-- (they're HeyGen embeds, not real Mux assets — see embed_url). Add a
-- thumbnail_url cache populated by a one-time backfill script hitting
-- HeyGen's API, plus thumbnail_fetched_at so a lesson whose HeyGen video was
-- deleted (fetch attempted, no thumbnail returned) can be told apart from a
-- lesson never attempted yet — the backfill should not retry the former.

ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS thumbnail_url        TEXT,
  ADD COLUMN IF NOT EXISTS thumbnail_fetched_at TIMESTAMPTZ;
