-- Pipeline stage overrides
CREATE TABLE IF NOT EXISTS pipeline_stage_overrides (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stage      TEXT NOT NULL CHECK (stage IN ('awareness','engaged','upgrade_ready','closed')),
  note       TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id)
);

-- Index for engagement queries
CREATE INDEX IF NOT EXISTS idx_posts_author_created
  ON posts(author_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_progress_user_updated
  ON lesson_progress(user_id, updated_at DESC);
