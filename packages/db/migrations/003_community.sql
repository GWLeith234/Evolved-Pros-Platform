-- ── POST BOOKMARKS ───────────────────────────────────────────────────
CREATE TABLE post_bookmarks (
  post_id    UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

ALTER TABLE post_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bookmarks select own" ON post_bookmarks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Bookmarks insert own" ON post_bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Bookmarks delete own" ON post_bookmarks
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_bookmarks_user ON post_bookmarks(user_id);
