ALTER TABLE public.platform_ads
  ADD COLUMN IF NOT EXISTS body_copy TEXT,
  ADD COLUMN IF NOT EXISTS cta_text TEXT;
