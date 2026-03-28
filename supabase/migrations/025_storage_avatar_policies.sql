-- Migration 025: Storage policies for user avatar + banner uploads
-- Fixes "Avatar upload failed" error by granting authenticated users
-- write access to the avatars/ and banners/ paths in the Branding bucket.

-- Allow authenticated users to upload avatars and banners
CREATE POLICY IF NOT EXISTS "Users can upload their own avatar or banner"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'Branding'
    AND auth.uid() IS NOT NULL
    AND (name LIKE 'avatars/%' OR name LIKE 'banners/%')
  );

-- Allow authenticated users to update (re-upload) avatars and banners
CREATE POLICY IF NOT EXISTS "Users can update their own avatar or banner"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'Branding'
    AND auth.uid() IS NOT NULL
    AND (name LIKE 'avatars/%' OR name LIKE 'banners/%')
  );

-- Ensure authenticated role has necessary storage permissions
GRANT ALL ON storage.objects TO authenticated;
