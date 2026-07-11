-- 055_seed_carson_heady_episode.sql
-- Seed the latest podcast episode: Carson Heady.
-- Idempotent: no-ops if an episode with this slug already exists, so it is
-- safe to run more than once.

-- guest_image_url is referenced by the podcast page query but is not created by
-- any in-repo migration (schema drift). Add it defensively so this seed also
-- works against a freshly-migrated database.
ALTER TABLE public.episodes ADD COLUMN IF NOT EXISTS guest_image_url text;

INSERT INTO public.episodes (
  episode_number, title, slug, description,
  guest_name, guest_title, guest_company,
  guest_image_url, thumbnail_url, youtube_url,
  pillar, is_published, published_at
)
SELECT
  (SELECT COALESCE(MAX(episode_number), 0) + 1 FROM public.episodes),
  'Salesman on Fire: From Burnout to Purpose-Driven Leadership with Carson Heady',
  'salesman-on-fire-carson-heady',
  'Carson Heady — author of six books including the Birth of a Salesman series and The Show Must Go On, a Director at Microsoft, the world''s #1 social seller, and host of the Salesman on Fire podcast — joins the show for the road from burnout to purpose-driven leadership: rebuilding identity after hitting the wall, leading with purpose, and turning sales into a mission instead of a grind.',
  'Carson Heady',
  'Director @ Microsoft · #1 Social Seller',
  'Host, Salesman on Fire',
  -- Headshot intentionally left NULL: the supplied LinkedIn URL
  -- (media.licdn.com) is blocked by the site CSP img-src allowlist and is a
  -- signed URL that expires, so it cannot render on the live site. Backfill
  -- once the image is hosted on an allowed origin (Supabase `Branding` bucket
  -- -> https://<project>.supabase.co/storage/v1/object/public/Branding/...):
  --   UPDATE public.episodes
  --     SET guest_image_url = '<supabase-url>', thumbnail_url = '<supabase-url>'
  --   WHERE slug = 'salesman-on-fire-carson-heady';
  NULL,
  NULL,
  'https://youtu.be/V3S05gWEpK0',
  'execution',
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.episodes WHERE slug = 'salesman-on-fire-carson-heady'
);
