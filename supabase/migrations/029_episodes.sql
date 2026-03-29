-- 029_episodes.sql
-- Episodes table for the Evolved Pros podcast/show

CREATE TABLE IF NOT EXISTS episodes (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_number    integer,
  season            integer DEFAULT 1,
  title             text NOT NULL,
  slug              text NOT NULL UNIQUE,
  description       text,
  guest_name        text,
  guest_title       text,
  guest_company     text,
  mux_playback_id   text,
  youtube_url       text,
  thumbnail_url     text,
  duration_seconds  integer,
  is_published      boolean NOT NULL DEFAULT false,
  published_at      timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS episodes_updated_at ON episodes;
CREATE TRIGGER episodes_updated_at
  BEFORE UPDATE ON episodes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS: members can read published episodes only
ALTER TABLE episodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "published episodes visible to authenticated users"
  ON episodes FOR SELECT
  TO authenticated
  USING (is_published = true);

CREATE POLICY "admins can do anything"
  ON episodes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );
