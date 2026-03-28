INSERT INTO public.profile_banners (pillar, title, image_url, sort_order)
VALUES (
  NULL,
  'Evening',
  'https://udbwrapkshfjkctylbmm.supabase.co/storage/v1/object/public/Branding/banner-evening.png',
  10
)
ON CONFLICT DO NOTHING;
