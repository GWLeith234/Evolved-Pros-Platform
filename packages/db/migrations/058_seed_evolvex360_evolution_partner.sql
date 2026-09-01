-- EvolveX360 Evolution Partner seed
-- Unlock the Future AI creative: glowing lock hero + global locations.
-- Assets: apps/web/public/sponsors/evolvex360/

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
  'd4e5f6a7-b8c9-0123-def0-234567890123',
  'EvolveX360 — Evolution Partner',
  'all',
  'A',
  'image',
  'EvolveX360',
  'EvolveX360',
  'Unlock the Future with AI Solutions from EvolveX360',
  'AI-powered business efficiency and growth — strategy, media, and execution that open new markets worldwide.',
  'Reykjavik, Iceland | Denver, CO USA | Saskatoon & Regina, SK Canada | Durban, SA',
  'Unlock AI Growth',
  '/sponsors/evolvex360/logo-white.svg',
  'https://www.evolvex360.com/',
  'https://www.evolvex360.com/',
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
