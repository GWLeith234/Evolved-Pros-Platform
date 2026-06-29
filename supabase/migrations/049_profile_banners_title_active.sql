-- 049_profile_banners_title_active.sql — branding portal banner fields.
--
-- The branding portal (app/(admin)/admin/branding) reads and writes
-- profile_banners.title and profile_banners.is_active, but the table only had
-- the legacy `label` column and no active flag. Add both idempotently and
-- backfill title from the existing label so current banners keep a name.

ALTER TABLE public.profile_banners
  ADD COLUMN IF NOT EXISTS title     TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Backfill title from the legacy label where unset.
UPDATE public.profile_banners
  SET title = label
  WHERE title IS NULL AND label IS NOT NULL;
