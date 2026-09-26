-- Local proof for public.media_stories_require_hero.
-- The runner has already created the table and applied migration 101.
-- Not production. Does not touch a hosted database.

-- Legacy published rows (Unsplash, or no art) already exist. The trigger must
-- not reject a view-count bump or a copy edit that leaves the image alone.
ALTER TABLE public.media_stories DISABLE TRIGGER media_stories_require_hero;

INSERT INTO public.media_stories (title, slug, story_type, is_published, featured_image_url, views)
VALUES
  ('Legacy unsplash', 'legacy-unsplash', 'original', true, 'https://images.unsplash.com/photo-123', 4),
  ('Legacy no art', 'legacy-no-art', 'original', true, NULL, 2),
  ('Draft waiting', 'draft-waiting', 'original', false, NULL, 0);

ALTER TABLE public.media_stories ENABLE TRIGGER media_stories_require_hero;

UPDATE public.media_stories SET views = views + 1 WHERE slug = 'legacy-no-art';
UPDATE public.media_stories SET views = views + 1, title = 'Legacy no art (read)' WHERE slug = 'legacy-unsplash';
UPDATE public.media_stories SET is_published = true WHERE slug = 'legacy-no-art';

DO $$
BEGIN
  IF (SELECT views FROM public.media_stories WHERE slug = 'legacy-no-art') <> 3 THEN
    RAISE EXCEPTION 'view update on a published row without art did not stick';
  END IF;
  IF (SELECT views FROM public.media_stories WHERE slug = 'legacy-unsplash') <> 5 THEN
    RAISE EXCEPTION 'view update on a published Unsplash row did not stick';
  END IF;
  IF (SELECT title FROM public.media_stories WHERE slug = 'legacy-unsplash') IS DISTINCT FROM 'Legacy no art (read)' THEN
    RAISE EXCEPTION 'copy edit on a legacy published row was rejected';
  END IF;
END $$;

-- Insert published without an image -> check_violation.
DO $$
DECLARE
  caught text := 'no-error';
BEGIN
  BEGIN
    INSERT INTO public.media_stories (title, slug, story_type, is_published, featured_image_url)
    VALUES ('No art', 'publish-no-art', 'original', true, NULL);
  EXCEPTION
    WHEN check_violation THEN
      caught := SQLSTATE;
  END;
  IF caught IS DISTINCT FROM '23514' THEN
    RAISE EXCEPTION 'insert published without image returned %', caught;
  END IF;
  IF EXISTS (SELECT 1 FROM public.media_stories WHERE slug = 'publish-no-art') THEN
    RAISE EXCEPTION 'rejected insert still wrote a row';
  END IF;
END $$;

-- Blank image is the same refusal.
DO $$
DECLARE
  caught text := 'no-error';
BEGIN
  BEGIN
    INSERT INTO public.media_stories (title, slug, story_type, is_published, featured_image_url)
    VALUES ('Blank art', 'publish-blank-art', 'original', true, '   ');
  EXCEPTION
    WHEN check_violation THEN
      caught := SQLSTATE;
  END;
  IF caught IS DISTINCT FROM '23514' THEN
    RAISE EXCEPTION 'insert published with blank image returned %', caught;
  END IF;
END $$;

-- Insert draft without an image -> ok.
INSERT INTO public.media_stories (title, slug, story_type, is_published, featured_image_url)
VALUES ('Draft no art', 'draft-no-art', 'original', false, NULL);

DO $$
BEGIN
  IF (SELECT is_published FROM public.media_stories WHERE slug = 'draft-no-art') IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'draft without an image was not stored';
  END IF;
END $$;

-- Publish with an owned Branding URL -> ok (insert and draft flip).
INSERT INTO public.media_stories (title, slug, story_type, is_published, featured_image_url)
VALUES (
  'Owned hero',
  'publish-owned',
  'original',
  true,
  'https://udbwrapkshfjkctylbmm.supabase.co/storage/v1/object/public/Branding/media-heroes/ai-tool/hero-16x9.png'
);

UPDATE public.media_stories
SET is_published = true,
    featured_image_url = '  https://udbwrapkshfjkctylbmm.supabase.co/storage/v1/object/public/Branding/media-heroes/draft/hero-16x9.png  '
WHERE slug = 'draft-waiting';

DO $$
BEGIN
  IF (SELECT is_published FROM public.media_stories WHERE slug = 'publish-owned') IS NOT TRUE THEN
    RAISE EXCEPTION 'owned hero insert did not publish';
  END IF;
  IF (SELECT is_published FROM public.media_stories WHERE slug = 'draft-waiting') IS NOT TRUE THEN
    RAISE EXCEPTION 'publishing a draft with an owned URL failed';
  END IF;
END $$;

-- Outside hosts and path traversal stay rejected. Redirects stay exempt.
DO $$
DECLARE
  caught text := 'no-error';
BEGIN
  BEGIN
    INSERT INTO public.media_stories (title, slug, story_type, is_published, featured_image_url)
    VALUES ('Unsplash', 'publish-unsplash', 'original', true, 'https://images.unsplash.com/photo-999');
  EXCEPTION
    WHEN check_violation THEN
      caught := SQLSTATE;
  END;
  IF caught IS DISTINCT FROM '23514' THEN
    RAISE EXCEPTION 'insert published Unsplash URL returned %', caught;
  END IF;
END $$;

DO $$
DECLARE
  caught text := 'no-error';
BEGIN
  BEGIN
    UPDATE public.media_stories
    SET featured_image_url = 'https://udbwrapkshfjkctylbmm.supabase.co/storage/v1/object/public/Branding/../secret.png'
    WHERE slug = 'publish-owned';
  EXCEPTION
    WHEN check_violation THEN
      caught := SQLSTATE;
  END;
  IF caught IS DISTINCT FROM '23514' THEN
    RAISE EXCEPTION 'path traversal image update returned %', caught;
  END IF;
END $$;

INSERT INTO public.media_stories (title, slug, story_type, is_published, featured_image_url, views)
VALUES ('Go elsewhere', 'redirect-no-art', 'redirect', true, NULL, 1);

UPDATE public.media_stories SET views = views + 1 WHERE slug = 'redirect-no-art';

DO $$
BEGIN
  IF (SELECT views FROM public.media_stories WHERE slug = 'redirect-no-art') <> 2 THEN
    RAISE EXCEPTION 'redirect story view update failed';
  END IF;
  IF (SELECT is_published FROM public.media_stories WHERE slug = 'redirect-no-art') IS NOT TRUE THEN
    RAISE EXCEPTION 'published redirect without an image was rejected';
  END IF;
END $$;
