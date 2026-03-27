-- Seed a default sidebar ad so the SidebarAdUnit renders during development
INSERT INTO public.platform_ads (placement, headline, cta_text, link_url, is_active, sort_order)
VALUES (
  'sidebar',
  'Upgrade to Pro',
  'Learn More',
  '/membership-upgrade',
  true,
  1
)
ON CONFLICT DO NOTHING;
