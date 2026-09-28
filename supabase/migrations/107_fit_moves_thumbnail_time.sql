-- 107: poster frame time for signed Fit thumbnails.
--
-- Fit playback ids are signed. A playback token (aud v) does not authorize
-- image.mux.com, so every player paints the same blank poster. thumbnail_time
-- is the offset in seconds for a thumbnail token (aud t). Null omits the
-- time claim and Mux uses its default frame.
--
-- Do not seed this column. The owner sets the frame time on the three
-- live moves after this migration is approved.
--
-- service_role already has table-level GRANT ALL (102), so it can read the
-- new column. anon and authenticated stay on the 102 column list. This
-- file does not grant playback ids.
--
-- This file is not applied by the app.
--
-- ROLLBACK:
--   ALTER TABLE public.fit_moves DROP COLUMN IF EXISTS thumbnail_time;

ALTER TABLE public.fit_moves ADD COLUMN thumbnail_time numeric;

COMMENT ON COLUMN public.fit_moves.thumbnail_time IS
  'Seconds into the Fit video for the signed Mux poster. Null uses the Mux default frame.';

NOTIFY pgrst, 'reload schema';
