-- 102: private Fit video.
-- 100 and 101 are reserved by other changes. 092 stays as it shipped.
--
-- Adds Mux asset tracking and a description to fit_moves, hides
-- mux_playback_id (and mux_asset_id) from anon and authenticated, and
-- creates a private fit-media bucket. Playback ids are read with the
-- service role only after the Fit gate, then returned with a signed token.
-- Objects in fit-media are written by the service role and read through
-- signed URLs. This file is not applied by the app.

ALTER TABLE public.fit_moves
  ADD COLUMN IF NOT EXISTS mux_asset_id text;

ALTER TABLE public.fit_moves
  ADD COLUMN IF NOT EXISTS description text;

ALTER TABLE public.fit_moves
  ADD COLUMN IF NOT EXISTS video_status text NOT NULL DEFAULT 'draft';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fit_moves_video_status_check'
      AND conrelid = 'public.fit_moves'::regclass
  ) THEN
    ALTER TABLE public.fit_moves
      ADD CONSTRAINT fit_moves_video_status_check
      CHECK (video_status IN ('draft', 'processing', 'ready', 'errored'));
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS fit_moves_mux_asset_id_uidx
  ON public.fit_moves (mux_asset_id);

COMMENT ON COLUMN public.fit_moves.mux_asset_id IS
  'Mux asset id. Unique when set. Server-only. Webhooks match on this column.';
COMMENT ON COLUMN public.fit_moves.mux_playback_id IS
  'Mux playback id. Not selectable by anon or authenticated. Signed tokens only.';
COMMENT ON COLUMN public.fit_moves.video_status IS
  'draft, processing, ready, or errored. Public metadata. ready is required before a token is signed.';

-- Table SELECT would make a column revoke useless (see 085). Re-grant
-- the catalog columns only. service_role keeps full access for the
-- token route and the Mux webhook.
REVOKE SELECT ON TABLE public.fit_moves FROM PUBLIC, anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.fit_moves FROM PUBLIC, anon, authenticated;

GRANT SELECT (
  id,
  code,
  slug,
  title,
  focus,
  location,
  status,
  featured,
  hip_mod,
  hip_mod_note,
  reps,
  duration_minutes,
  duration_label,
  thumbnail_url,
  required_tier,
  published_at,
  sort_order,
  created_at,
  updated_at,
  description,
  video_status
) ON public.fit_moves TO anon, authenticated;

GRANT ALL ON TABLE public.fit_moves TO service_role;

ALTER TABLE public.fit_moves ENABLE ROW LEVEL SECURITY;

-- Private bucket. public = false. No anon or authenticated policy, so
-- those roles cannot read or write. service_role bypasses RLS and is
-- the only writer. Members receive objects through signed URLs.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'fit-media',
  'fit-media',
  false,
  524288000,
  ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
  SET public = false,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "fit_media_service_role_all" ON storage.objects;
CREATE POLICY "fit_media_service_role_all"
  ON storage.objects
  FOR ALL
  TO service_role
  USING (bucket_id = 'fit-media')
  WITH CHECK (bucket_id = 'fit-media');

NOTIFY pgrst, 'reload schema';
