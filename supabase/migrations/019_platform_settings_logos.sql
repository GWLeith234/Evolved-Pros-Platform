INSERT INTO platform_settings (key, value) VALUES
  ('logo_nav_light_url',   'https://udbwrapkshfjkctylbmm.supabase.co/storage/v1/object/public/Branding/logo_nav_light.png'),
  ('logo_stacked_dark_url','https://udbwrapkshfjkctylbmm.supabase.co/storage/v1/object/public/Branding/logo_stacked_dark.png'),
  ('logo_circle_dark_url', 'https://udbwrapkshfjkctylbmm.supabase.co/storage/v1/object/public/Branding/logo_circle_dark.png')
ON CONFLICT (key) DO NOTHING;
