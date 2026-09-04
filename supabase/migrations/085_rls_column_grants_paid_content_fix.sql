-- 085: table-level SELECT made 084 column REVOKEs ineffective.
-- Reshape grants: revoke table SELECT, re-grant only safe catalog columns.

REVOKE SELECT ON TABLE public.lessons FROM PUBLIC, anon, authenticated;
GRANT SELECT (
  id,
  course_id,
  slug,
  title,
  duration_seconds,
  sort_order,
  is_published,
  created_at,
  module_number,
  lesson_type,
  duration_minutes,
  checkin_type,
  event_id,
  thumbnail_url,
  thumbnail_fetched_at
) ON public.lessons TO anon, authenticated;

REVOKE SELECT ON TABLE public.events FROM PUBLIC, anon, authenticated;
GRANT SELECT (
  id,
  title,
  description,
  event_type,
  starts_at,
  ends_at,
  required_tier,
  registration_count,
  is_published,
  created_at,
  event_type_keynote,
  is_featured,
  image_url,
  tier_access,
  is_draft,
  hero_image_url,
  pillar,
  format,
  attending_count,
  host_name,
  host_role,
  host_avatar_url,
  price_cents,
  watermark,
  tagline,
  cta_text
) ON public.events TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
