-- ── STORAGE: BRANDING BUCKET POLICIES ───────────────────────────────────────
-- The branding bucket already exists and is public.
-- These policies allow authenticated users to upload to their own folder
-- (banners/{userId}/...) and allow public reads for logos and banners.

-- Public read — anyone can view branding assets (logos, banners)
CREATE POLICY "Branding read public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'Branding');

-- Authenticated users can upload to their own banner folder only
-- Path format: banners/{userId}/{filename}
-- (storage.foldername returns the path segments array)
CREATE POLICY "Banner upload by owner"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'Branding'
    AND auth.role() = 'authenticated'
    AND (
      -- User banner path: banners/{userId}/...
      (storage.foldername(name))[1] = 'banners'
      AND (storage.foldername(name))[2] = auth.uid()::text
    )
  );

-- Authenticated users can update/replace their own banner files
CREATE POLICY "Banner update by owner"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'Branding'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = 'banners'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- Admins can upload/update anything in the branding bucket (logos, etc.)
CREATE POLICY "Branding admin upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'Branding'
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Branding admin update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'Branding'
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
