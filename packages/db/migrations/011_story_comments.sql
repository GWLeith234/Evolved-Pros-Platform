-- Story comments for media portal
-- Sprint M4: Media Story Comments

CREATE TABLE IF NOT EXISTS story_comments (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id   UUID        NOT NULL REFERENCES media_stories(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  body       TEXT        NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1000),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_story_comments_story ON story_comments(story_id, created_at);

ALTER TABLE story_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can read comments" ON story_comments;
CREATE POLICY "Members can read comments" ON story_comments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Members can insert own comments" ON story_comments;
CREATE POLICY "Members can insert own comments" ON story_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT ON story_comments TO authenticated;

-- Verification
SELECT 1 FROM information_schema.tables WHERE table_name = 'story_comments';
