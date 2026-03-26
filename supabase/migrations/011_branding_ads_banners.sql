-- Platform settings (logo URLs, theme config, ad intervals)
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key text primary key,
  value text,
  updated_at timestamptz default now()
);

-- Sidebar and topnav ad placements
CREATE TABLE IF NOT EXISTS public.platform_ads (
  id uuid default gen_random_uuid() primary key,
  placement text not null check (placement in ('sidebar', 'topnav')),
  image_url text,
  headline text,
  cta_text text,
  link_url text,
  sort_order integer default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Profile banner images (pillar-themed presets)
CREATE TABLE IF NOT EXISTS public.profile_banners (
  id uuid default gen_random_uuid() primary key,
  pillar integer check (pillar between 1 and 6),
  title text,
  image_url text not null,
  sort_order integer default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Add banner_url to users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS banner_url text;

-- Expand tier check to include 'vip'
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_tier_check;
ALTER TABLE public.users ADD CONSTRAINT users_tier_check
  CHECK (tier IN ('community', 'vip', 'pro'));

-- RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read settings"
  ON public.platform_settings FOR SELECT USING (true);

CREATE POLICY "Admins can manage settings"
  ON public.platform_settings FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Anyone can read active ads"
  ON public.platform_ads FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage ads"
  ON public.platform_ads FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Anyone can read active banners"
  ON public.profile_banners FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage banners"
  ON public.profile_banners FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Seed default settings
INSERT INTO public.platform_settings (key, value) VALUES
  ('logo_dark_url', ''),
  ('logo_light_url', ''),
  ('favicon_url', ''),
  ('platform_name', 'Evolved Pros'),
  ('primary_color', '#112535'),
  ('accent_color', '#ef0e30'),
  ('default_theme', 'dark'),
  ('ad_sidebar_interval', '10'),
  ('members_can_toggle_theme', 'true')
ON CONFLICT (key) DO NOTHING;

-- Seed pillar profile banners
INSERT INTO public.profile_banners (pillar, title, image_url, sort_order) VALUES
  (1, 'P1 — Spiritual Foundation', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=300&fit=crop&q=80', 1),
  (2, 'P2 — Identity', 'https://images.unsplash.com/photo-1519834785169-98be25ec3f84?w=1200&h=300&fit=crop&q=80', 2),
  (3, 'P3 — Mental Toughness', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&h=300&fit=crop&q=80', 3),
  (4, 'P4 — Strategic Approach', 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&h=300&fit=crop&q=80', 4),
  (5, 'P5 — Accountability', 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&h=300&fit=crop&q=80', 5),
  (6, 'P6 — Execution', 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=300&fit=crop&q=80', 6)
ON CONFLICT DO NOTHING;
