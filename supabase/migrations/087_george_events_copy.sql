-- 087 George-locked events copy (Q2oUw).
-- Replaces leftover Conquer Local / wrong NEXT EVENT titles, locks the
-- April 28 Las Vegas launch, moves the EVOLVED book to October 15, and
-- seeds weekly AI Masterminds Fridays (2:00 PM America/Chicago, Pro only).
-- No recurrence engine: each Friday is a dated row so existing banners
-- keep picking the next published start.

-- Kill Conquer Local titles still sitting on published / featured rows.
UPDATE public.events
SET
  title = 'Evolved Pros launches April 28 in Las Vegas with special guest Dennis Yu',
  description = 'Evolved Pros launches April 28 in Las Vegas with special guest Dennis Yu.',
  tagline = 'Las Vegas. Special guest Dennis Yu.',
  is_published = true
WHERE title ILIKE '%conquer local%';

-- Featured launch row (idempotent). Past date is intentional: it is the
-- locked launch record, not a clock. NEXT EVENT prefers the next future lock.
INSERT INTO public.events (
  title,
  description,
  tagline,
  event_type,
  format,
  starts_at,
  ends_at,
  required_tier,
  tier_access,
  is_published,
  is_featured,
  is_draft
)
SELECT
  'Evolved Pros launches April 28 in Las Vegas with special guest Dennis Yu',
  'Evolved Pros launches April 28 in Las Vegas with special guest Dennis Yu.',
  'Las Vegas. Special guest Dennis Yu.',
  'inperson',
  'in-person',
  TIMESTAMPTZ '2026-04-28 14:00:00 America/Chicago',
  TIMESTAMPTZ '2026-04-28 16:00:00 America/Chicago',
  NULL,
  'all',
  true,
  false,
  false
WHERE NOT EXISTS (
  SELECT 1
  FROM public.events
  WHERE title = 'Evolved Pros launches April 28 in Las Vegas with special guest Dennis Yu'
);

-- Book launch: retitle / reschedule the existing July 15 draft, or insert.
UPDATE public.events
SET
  title = 'EVOLVED book launches October 15',
  description = 'The EVOLVED book launches October 15.',
  tagline = 'EVOLVED book. October 15.',
  event_type = 'virtual',
  format = 'live',
  starts_at = TIMESTAMPTZ '2026-10-15 12:00:00 America/Chicago',
  ends_at = TIMESTAMPTZ '2026-10-15 20:00:00 America/Chicago',
  required_tier = 'community',
  is_published = true,
  is_draft = false,
  is_featured = false
WHERE title ILIKE '%book launch%';

INSERT INTO public.events (
  title,
  description,
  tagline,
  event_type,
  format,
  starts_at,
  ends_at,
  required_tier,
  tier_access,
  is_published,
  is_featured,
  is_draft
)
SELECT
  'EVOLVED book launches October 15',
  'The EVOLVED book launches October 15.',
  'EVOLVED book. October 15.',
  'virtual',
  'live',
  TIMESTAMPTZ '2026-10-15 12:00:00 America/Chicago',
  TIMESTAMPTZ '2026-10-15 20:00:00 America/Chicago',
  'community',
  'all',
  true,
  false,
  false
WHERE NOT EXISTS (
  SELECT 1
  FROM public.events
  WHERE title = 'EVOLVED book launches October 15'
);

-- Weekly Masterminds: Oct 2, 2026 through March 26, 2027 (26 Fridays).
INSERT INTO public.events (
  title,
  description,
  tagline,
  event_type,
  format,
  starts_at,
  ends_at,
  required_tier,
  tier_access,
  is_published,
  is_featured,
  is_draft
)
SELECT
  'AI Masterminds for Senior Execs',
  'Starts Oct 2, then every Friday after at 2:00 PM America/Chicago (CST). Professional Tier only.',
  'Every Friday at 2:00 PM America/Chicago. Professional Tier only.',
  'live',
  'live',
  ts,
  ts + INTERVAL '60 minutes',
  'pro',
  'pro',
  true,
  false,
  false
FROM generate_series(
  TIMESTAMPTZ '2026-10-02 14:00:00 America/Chicago',
  TIMESTAMPTZ '2027-03-26 14:00:00 America/Chicago',
  INTERVAL '7 days'
) AS ts
WHERE NOT EXISTS (
  SELECT 1
  FROM public.events e
  WHERE e.title = 'AI Masterminds for Senior Execs'
    AND e.starts_at = ts
);

-- CoS featured lock is the April 28 launch (EP-EVENTS-APR28-BOOK-OCT15).
-- Unique partial index allows only one featured row.
UPDATE public.events SET is_featured = false WHERE is_featured = true;

UPDATE public.events
SET is_featured = true
WHERE id = (
  SELECT id
  FROM public.events
  WHERE title = 'Evolved Pros launches April 28 in Las Vegas with special guest Dennis Yu'
  LIMIT 1
);
