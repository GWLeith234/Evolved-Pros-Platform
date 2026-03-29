-- 030_episodes_transcript.sql
-- Add transcript column to episodes table

ALTER TABLE episodes ADD COLUMN IF NOT EXISTS transcript text;
