-- AdCellerant Evolution Partner seed
-- Premium home/sidebar sponsor: Denver skyline creative + #1 DBJ claim.
-- Assets ship in apps/web/public/sponsors/adcellerant/ (relative public URLs).

-- Ensure placement can include 'all' (already present in 023); home fetch
-- treats placement IN ('home','all') — we seed as 'all'.

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
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'AdCellerant — Evolution Partner',
  'all',
  'A',
  'image',
  'AdCellerant',
  'AdCellerant',
  '#1 Largest Advertising Agency in Denver',
  'Recognized by the Denver Business Journal',
  'Denver''s #1 advertising agency — full-funnel media and agency services for brands that scale.',
  'Partner with Us',
  '/sponsors/adcellerant/logo-white.png',
  'https://www.adcellerant.com/',
  'https://www.adcellerant.com/',
  true,
  0
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
