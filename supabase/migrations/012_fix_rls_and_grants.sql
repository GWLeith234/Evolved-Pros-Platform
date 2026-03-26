-- Fix posts SELECT policy: auth.role() = 'authenticated' can return unexpectedly
-- in some Supabase configurations, causing INSERT+SELECT to return null data.
-- auth.uid() IS NOT NULL is the more reliable pattern.
DROP POLICY IF EXISTS "posts_select_authenticated" ON posts;
CREATE POLICY "posts_select_authenticated" ON posts
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Ensure anon + authenticated roles have table-level access to the branding tables
-- created in migration 011. Without these GRANTs, PostgREST returns null silently
-- even when RLS policies permit the operation.
GRANT SELECT ON public.platform_settings TO anon, authenticated;
GRANT INSERT, UPDATE ON public.platform_settings TO authenticated;

GRANT SELECT ON public.platform_ads TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.platform_ads TO authenticated;

GRANT SELECT ON public.profile_banners TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.profile_banners TO authenticated;
