-- 080_sync1_transistor_guid_backfill.sql
-- SPRINT SYNC-1
--
-- 1) Backfill Transistor feed GUIDs (play IDs) onto Ep 8 / Ep 9 when the
--    catalog row still has a null transistor_episode_id. Without this, the next
--    RSS sync inserts a second row (UNIQUE treats NULLs as distinct) and the
--    slug collision handler suffixes the duplicate so both survive.
-- 2) Drop the redundant partial unique index from 038 — migration 046 already
--    added episodes_transistor_episode_id_unique, which the sync upsert uses
--    via onConflict: 'transistor_episode_id'.

-- Play IDs from Transistor (same values the feed exposes as <guid>).
-- Only write when no other row already owns that GUID (avoids UNIQUE clashes
-- if a prior bad sync already inserted a duplicate with the GUID set).
UPDATE public.episodes e
SET transistor_episode_id = v.guid
FROM (
  VALUES
    (8, '124107842'),
    (9, '124366491')
) AS v(episode_number, guid)
WHERE e.episode_number = v.episode_number
  AND e.transistor_episode_id IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.episodes x
    WHERE x.transistor_episode_id = v.guid
  );

DROP INDEX IF EXISTS public.idx_episodes_transistor_unique;
