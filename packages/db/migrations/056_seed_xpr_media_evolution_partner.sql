-- XPR Media Evolution Partner seed
-- Content syndication / distribution partner for the home two-up row.
-- Logo: apps/web/public/sponsors/xpr-media/logo.svg

INSERT INTO public.platform_ads (
  id,
  title,
  placement,
  zone,
  ad_type,
  sponsor_name,
  tool_name,
  headline,
  endorsement_quote,
  body_copy,
  cta_text,
  image_url,
  click_url,
  link_url,
  is_active,
  sort_order
)
VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'XPR Media — Evolution Partner',
  'all',
  'A',
  'image',
  'XPR Media',
  'XPR Media',
  'Amplify Your Story Across 1,000+ Premium Sites',
  'Content syndication that puts PR, publishers, and brands in front of the right audience — at scale.',
  'XPR Media powers press release and content distribution across a curated network of high-authority publishers.',
  'Expand Your Reach',
  '/sponsors/xpr-media/logo.svg',
  'https://www.xpr.media/',
  'https://www.xpr.media/',
  true,
  1
)
ON CONFLICT (id) DO UPDATE SET
  title              = EXCLUDED.title,
  placement          = EXCLUDED.placement,
  zone               = EXCLUDED.zone,
  sponsor_name       = EXCLUDED.sponsor_name,
  tool_name          = EXCLUDED.tool_name,
  headline           = EXCLUDED.headline,
  endorsement_quote  = EXCLUDED.endorsement_quote,
  body_copy          = EXCLUDED.body_copy,
  cta_text           = EXCLUDED.cta_text,
  image_url          = EXCLUDED.image_url,
  click_url          = EXCLUDED.click_url,
  link_url           = EXCLUDED.link_url,
  is_active          = EXCLUDED.is_active,
  sort_order         = EXCLUDED.sort_order,
  updated_at         = now();
