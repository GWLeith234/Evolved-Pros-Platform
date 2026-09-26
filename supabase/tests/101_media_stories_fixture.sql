-- Local fixture for migration 101. Not production.
-- Minimal public.media_stories so the hero trigger can be applied.

CREATE TABLE public.media_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  story_type text NOT NULL DEFAULT 'original',
  is_published boolean,
  featured_image_url text,
  views integer NOT NULL DEFAULT 0,
  published_at timestamptz
);
