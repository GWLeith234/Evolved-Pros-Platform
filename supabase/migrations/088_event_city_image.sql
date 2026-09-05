-- S5: store city → stock-image on the event record.
-- City is admin-entered only. Do not invent cities from titles.
-- Las Vegas is already in the locked April 28 launch copy.

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS city text;

GRANT SELECT (city) ON public.events TO anon, authenticated;

UPDATE public.events
SET
  city = 'Las Vegas',
  image_url = COALESCE(
    NULLIF(image_url, ''),
    'https://images.unsplash.com/photo-1605833556294-ea5c7a74f57d?auto=format&fit=crop&w=1400&q=80'
  )
WHERE title = 'Evolved Pros launches April 28 in Las Vegas with special guest Dennis Yu'
  AND city IS NULL;

UPDATE public.events
SET image_url = '/events/city-fallback.svg'
WHERE image_url IS NULL;

NOTIFY pgrst, 'reload schema';
