-- 046_episodes_unique_transistor.sql
-- The /api/admin/podcast/sync route upserts with
--   onConflict: 'transistor_episode_id'
-- but the column had no UNIQUE constraint, so Postgres returned
--   "there is no unique or exclusion constraint matching the ON CONFLICT
--    specification"
-- and the admin UI surfaced the raw error.
--
-- Adding the constraint lets the upsert dedupe RSS items by their feed GUID
-- (which `transistor_episode_id` stores). The constraint is created NOT
-- VALID-free because we already verified no duplicate non-null values exist
-- in the live table; multiple NULLs remain allowed (default UNIQUE behaviour
-- treats NULLs as distinct).

ALTER TABLE public.episodes
  ADD CONSTRAINT episodes_transistor_episode_id_unique
    UNIQUE (transistor_episode_id);
