-- ── EVENTS PERFORMANCE INDEXES ──────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_events_recording
  ON events(recording_url)
  WHERE recording_url IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_events_upcoming
  ON events(starts_at)
  WHERE is_published = TRUE;
