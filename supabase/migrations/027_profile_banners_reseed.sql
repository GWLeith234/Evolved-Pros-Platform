-- Align profile_banners with production schema (label + pillar_tag columns)
-- and reseed with pillar images from Supabase Branding storage bucket.
ALTER TABLE public.profile_banners ADD COLUMN IF NOT EXISTS label text;
ALTER TABLE public.profile_banners ADD COLUMN IF NOT EXISTS pillar_tag text
  CHECK (pillar_tag IN ('p1','p2','p3','p4','p5','p6') OR pillar_tag IS NULL);

-- Reseed with correct pillar banners
DELETE FROM public.profile_banners;

INSERT INTO public.profile_banners (label, image_url, pillar_tag) VALUES
  ('P1 · Foundation',       'https://udbwrapkshfjkctylbmm.supabase.co/storage/v1/object/public/Branding/pillar-1-foundation.jpg',       'p1'),
  ('P2 · Identity',         'https://udbwrapkshfjkctylbmm.supabase.co/storage/v1/object/public/Branding/pillar-2-identity.jpg',         'p2'),
  ('P3 · Mental Toughness', 'https://udbwrapkshfjkctylbmm.supabase.co/storage/v1/object/public/Branding/pillar-3-mental-toughness.jpg', 'p3'),
  ('P4 · Strategy',         'https://udbwrapkshfjkctylbmm.supabase.co/storage/v1/object/public/Branding/pillar-4-strategy.jpg',         'p4'),
  ('P5 · Accountability',   'https://udbwrapkshfjkctylbmm.supabase.co/storage/v1/object/public/Branding/pillar-5-accountability.jpg',   'p5'),
  ('P6 · Execution',        'https://udbwrapkshfjkctylbmm.supabase.co/storage/v1/object/public/Branding/pillar-6-execution.jpg',        'p6');
