-- Index for lesson slug lookups
CREATE INDEX IF NOT EXISTS idx_lessons_slug ON lessons(course_id, slug);

-- Index for progress lookups
CREATE INDEX IF NOT EXISTS idx_progress_lesson ON lesson_progress(lesson_id);

-- Mux webhook log table
CREATE TABLE IF NOT EXISTS mux_webhooks (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type   TEXT NOT NULL,
  asset_id     TEXT,
  playback_id  TEXT,
  payload      JSONB NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
