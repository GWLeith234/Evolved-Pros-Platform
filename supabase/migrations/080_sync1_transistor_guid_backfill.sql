-- 080_sync1_transistor_guid_backfill.sql
-- SPRINT SYNC-1
--
-- The backfill was completed outside this migration with the correct RSS
-- feed GUIDs (UUIDs), not Transistor play IDs. Writing play IDs into
-- transistor_episode_id would make the next sync INSERT duplicate rows
-- because upserts conflict on that column.
--
-- This file now only drops the redundant partial unique index from 038.
-- Migration 046 already added episodes_transistor_episode_id_unique, which
-- the sync upsert uses via onConflict: 'transistor_episode_id'. A fresh
-- environment bootstrap replays 038 (creates idx_episodes_transistor_unique)
-- and 046 (adds the real one); keeping this DROP preserves production parity.

DROP INDEX IF EXISTS public.idx_episodes_transistor_unique;
