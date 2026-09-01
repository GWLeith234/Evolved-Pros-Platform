-- Vendasta Evolution Partner seed
-- AI Workforce creative: dark teal hero, people + sparkle, Get a demo CTA.
-- Assets: apps/web/public/sponsors/vendasta/

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
  'c3d4e5f6-a7b8-9012-cdef-123456789012',
  'Vendasta — Evolution Partner',
  'all',
  'A',
  'image',
  'Vendasta',
  'Vendasta',
  'Meet the AI Workforce for local businesses',
  'Boost more traffic, capture more leads, and grow revenue with AI employees that work 24/7.',
  'Vendasta''s AI Workforce helps agencies and local businesses automate marketing, capture demand, and scale client results.',
  'Get a demo',
  '/sponsors/vendasta/logo-white.svg',
  'https://www.vendasta.com/',
  'https://www.vendasta.com/',
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
