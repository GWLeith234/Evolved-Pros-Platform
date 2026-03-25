-- Sprint 9: Seed real course descriptions and founding events
-- Run once against production Supabase.
-- Safe: uses UPDATE WHERE pillar_number = N (no data loss).

-- ── Course descriptions ────────────────────────────────────────────────────

UPDATE courses SET
  description = 'The non-negotiable base. Before strategy, before performance — this is where it starts.'
WHERE pillar_number = 1;

UPDATE courses SET
  description = 'Who you decide to be before the results arrive. The second pillar. No performance without this.'
WHERE pillar_number = 2;

UPDATE courses SET
  description = 'Pressure reveals character. This pillar builds the architecture that holds under load.'
WHERE pillar_number = 3;

UPDATE courses SET
  description = 'Not activities. Not goals. Strategy — the actual game you are playing and why.'
WHERE pillar_number = 4;

UPDATE courses SET
  description = 'The 4DX framework applied. Scoreboards, lead measures, and the weekly cadence.'
WHERE pillar_number = 5;

UPDATE courses SET
  description = 'The gap between knowing and doing. This pillar closes it permanently.'
WHERE pillar_number = 6;

-- ── Events schema additions (if not already present) ──────────────────────

ALTER TABLE events ADD COLUMN IF NOT EXISTS zoom_url         TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;

-- ── Founding events ────────────────────────────────────────────────────────
-- Uses ON CONFLICT DO NOTHING to be idempotent if run more than once.

INSERT INTO events (title, description, type, starts_at, duration_minutes, zoom_url, is_published)
VALUES
  (
    'Podcast Launch — Episode 1',
    'The Evolved Pros podcast drops. First episode: The Architecture.',
    'virtual',
    '2026-04-20 12:00:00+00',
    60,
    NULL,
    TRUE
  ),
  (
    'Live Session — Accountability (4DX + OKRs)',
    'Bring your scoreboard. 90 minutes on the 4 Disciplines of Execution applied to your business.',
    'live',
    '2026-05-01 18:00:00+00',
    90,
    'https://zoom.us/j/placeholder',
    TRUE
  ),
  (
    'Community + Academy Official Launch',
    'Founding member kickoff livestream. Two hours. The whole architecture.',
    'live',
    '2026-05-15 18:00:00+00',
    120,
    'https://zoom.us/j/placeholder',
    TRUE
  )
ON CONFLICT DO NOTHING;
