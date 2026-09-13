-- Evolved Pros Fit move library (thin schema).
--
-- Runtime UI ships from apps/web/lib/fit/moves.ts fixtures so /fit, Home,
-- and /admin/fit work before this migration is applied. Apply this when
-- George/CoS wants persistence + Mux playback ids.
--
-- Product locks:
--   * VIP $49 gate (required_tier default 'vip')
--   * FO55-### codes (letter O, not zero)
--   * HIP MOD is a boolean + note, not a free-text status
--   * No LIVE claim in this table

CREATE TABLE IF NOT EXISTS public.fit_moves (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code              text NOT NULL UNIQUE,
  slug              text NOT NULL UNIQUE,
  title             text NOT NULL,
  focus             text NOT NULL,
  location          text NOT NULL CHECK (location IN ('Hotel', 'Studio')),
  status            text NOT NULL DEFAULT 'draft'
                      CHECK (status IN ('published', 'pilot', 'draft')),
  featured          boolean NOT NULL DEFAULT false,
  hip_mod           boolean NOT NULL DEFAULT false,
  hip_mod_note      text,
  reps              text NOT NULL,
  duration_minutes  integer NOT NULL DEFAULT 2 CHECK (duration_minutes > 0),
  duration_label    text NOT NULL,
  mux_playback_id   text,
  thumbnail_url     text,
  required_tier     text NOT NULL DEFAULT 'vip'
                      CHECK (required_tier IN ('vip', 'pro')),
  published_at      date,
  sort_order        integer NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fit_moves_fo55_code CHECK (code ~ '^FO55-[0-9]{3}$')
);

CREATE INDEX IF NOT EXISTS fit_moves_status_idx ON public.fit_moves (status, featured DESC, published_at DESC);

ALTER TABLE public.fit_moves ENABLE ROW LEVEL SECURITY;

-- Public / Community: published rows are visible as tease metadata only.
-- Playback ids stay null in the fixture era; VIP playback is a later ASK.
DROP POLICY IF EXISTS fit_moves_public_read ON public.fit_moves;
CREATE POLICY fit_moves_public_read
  ON public.fit_moves
  FOR SELECT
  USING (status = 'published');

-- Writes stay service-role / admin-only (no authenticated write policy).

COMMENT ON TABLE public.fit_moves IS
  'Evolved Pros Fit instructional guides. VIP $49. FO55 letter-O codes. Fixture-backed until this migration is applied.';
