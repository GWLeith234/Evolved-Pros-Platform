-- Own-folder writes for members on the public Branding bucket.
--
-- NOT APPLIED. Nothing in the app or the test suite runs this file.
-- Do not apply it until George says yes. Do not db push.
--
-- Live catalog read 2026-11-16 (project udbwrapkshfjkctylbmm):
--   "Members can upload avatars and banners" INSERT and
--   "Members can update their avatar and banner" UPDATE let any
--   signed-in user write anywhere under avatars/ or banners/.
--   Policies are OR'd, so those two are dropped, not supplemented.
--   "Banner upload by owner" and "Banner update by owner" already
--   require banners/<auth.uid()>/ and are replaced by the two
--   policies below, which use the same folder check for avatars
--   and banners. Migration 025 created the same broad write under
--   different names; those are dropped so a replay cannot leave them.
--
-- "Branding admin upload" and "Branding admin update" are not
-- changed. They allow any key in Branding for public.users.role =
-- 'admin', which covers banners/preset_* and banners/custom_*.
-- Public SELECT policies are not changed.
--
-- file_size_limit is 10MB (10485760). That matches the avatar route
-- and the admin image helper. The largest live image is 6793415 bytes.
-- Objects already stored are not re-checked. The 14104824-byte PDF is
-- outside the mime list, so this ceiling does not have to cover it.

DROP POLICY IF EXISTS "Members can upload avatars and banners" ON storage.objects;
DROP POLICY IF EXISTS "Members can update their avatar and banner" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar or banner" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar or banner" ON storage.objects;
DROP POLICY IF EXISTS "Banner upload by owner" ON storage.objects;
DROP POLICY IF EXISTS "Banner update by owner" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view branding files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own banners" ON storage.objects;

DROP POLICY IF EXISTS "Members upload own avatar and banner" ON storage.objects;
CREATE POLICY "Members upload own avatar and banner"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'Branding'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN ('avatars', 'banners')
    AND (storage.foldername(name))[2] = (auth.uid())::text
  );

DROP POLICY IF EXISTS "Members update own avatar and banner" ON storage.objects;
CREATE POLICY "Members update own avatar and banner"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'Branding'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN ('avatars', 'banners')
    AND (storage.foldername(name))[2] = (auth.uid())::text
  )
  WITH CHECK (
    bucket_id = 'Branding'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN ('avatars', 'banners')
    AND (storage.foldername(name))[2] = (auth.uid())::text
  );

-- Live objects are image/jpeg and image/png, plus text/plain credit
-- files under media-heroes/. The app also writes image/webp and
-- image/gif. No route writes application/pdf or image/svg+xml.
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'text/plain'
],
file_size_limit = 10485760
WHERE id = 'Branding';
