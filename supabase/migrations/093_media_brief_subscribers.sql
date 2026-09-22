-- Email brief capture (SPRINT M)
--
-- Media had no <form> and no <input> anywhere: the "Email brief" rail entry and
-- the "GET THE BRIEF" button both href'd /podcast. This is the list they should
-- always have been writing to.
--
-- Separate from crm_prospects on purpose. A prospect is someone sales is
-- working; a brief subscriber is a reader who asked for a newsletter. Mixing
-- them means a newsletter signup silently enters a sales sequence, which is the
-- kind of thing CASL complaints are made of. The two are joined by email when
-- anyone actually needs them joined.
--
-- Idempotent throughout.

CREATE TABLE IF NOT EXISTS media_brief_subscribers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Stored already normalized (trimmed + lowercased by normalizeBriefEmail).
  -- The CHECK keeps that true for hand-written inserts too, which is what lets
  -- the plain UNIQUE below stand in for a lower(email) expression index —
  -- PostgREST's on_conflict can only name columns, not expressions.
  email         TEXT NOT NULL UNIQUE CHECK (email = lower(email)),
  -- Which surface captured it: 'media-rail', 'media-article', … Kept so we can
  -- tell which placement earns its space without a separate analytics join.
  source        TEXT NOT NULL DEFAULT 'media',
  -- The page they were on when they subscribed. Evidence of express consent
  -- (CASL) — what were they reading when they asked for this.
  source_path   TEXT,
  status        TEXT NOT NULL DEFAULT 'subscribed'
                  CHECK (status IN ('subscribed', 'unsubscribed')),
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Re-submitting a known address is a resubscribe, not a duplicate: the UNIQUE
-- on email makes that an upsert. See the ON CONFLICT in the API route.

CREATE INDEX IF NOT EXISTS idx_media_brief_subscribers_status
  ON media_brief_subscribers (status);

-- Service-role only. The capture route writes through adminClient and there is
-- no member-facing read path, so RLS is on with no policies at all — the same
-- shape as campaign_sends (migration 077).
ALTER TABLE media_brief_subscribers ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE media_brief_subscribers IS
  'Evolved Pros Media email brief list. Service-role only; no RLS policies. Distinct from crm_prospects: a newsletter signup is not a sales prospect.';
COMMENT ON COLUMN media_brief_subscribers.source IS
  'Capture surface (media-rail, media-article, …). Which placement earns its space.';
COMMENT ON COLUMN media_brief_subscribers.source_path IS
  'Path the visitor was on when they subscribed. CASL evidence of express consent.';
