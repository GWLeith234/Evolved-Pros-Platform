CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── USERS ────────────────────────────────────────────────────────────
CREATE TABLE users (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendasta_contact_id  TEXT UNIQUE,
  email                TEXT UNIQUE NOT NULL,
  full_name            TEXT,
  display_name         TEXT,
  avatar_url           TEXT,
  bio                  TEXT,
  role_title           TEXT,
  location             TEXT,
  role                 TEXT NOT NULL DEFAULT 'member'
                         CHECK (role IN ('member', 'admin')),
  tier                 TEXT CHECK (tier IN ('community', 'pro')),
  tier_status          TEXT DEFAULT 'active'
                         CHECK (tier_status IN ('active', 'trial', 'cancelled', 'expired')),
  tier_expires_at      TIMESTAMPTZ,
  onboarded_at         TIMESTAMPTZ,
  points               INTEGER NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── CHANNELS ─────────────────────────────────────────────────────────
CREATE TABLE channels (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug           TEXT UNIQUE NOT NULL,
  name           TEXT NOT NULL,
  description    TEXT,
  pillar_number  INTEGER,
  required_tier  TEXT CHECK (required_tier IN ('community', 'pro')),
  sort_order     INTEGER DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── POSTS ────────────────────────────────────────────────────────────
CREATE TABLE posts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel_id  UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  body        TEXT NOT NULL,
  pillar_tag  TEXT CHECK (pillar_tag IN ('p1','p2','p3','p4','p5','p6')),
  is_pinned   BOOLEAN NOT NULL DEFAULT FALSE,
  like_count  INTEGER NOT NULL DEFAULT 0,
  reply_count INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── REPLIES ──────────────────────────────────────────────────────────
CREATE TABLE replies (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id    UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── POST LIKES ───────────────────────────────────────────────────────
CREATE TABLE post_likes (
  post_id    UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

-- ── EVENTS ───────────────────────────────────────────────────────────
CREATE TABLE events (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title              TEXT NOT NULL,
  description        TEXT,
  event_type         TEXT NOT NULL CHECK (event_type IN ('live','virtual','inperson')),
  starts_at          TIMESTAMPTZ NOT NULL,
  ends_at            TIMESTAMPTZ,
  zoom_url           TEXT,
  recording_url      TEXT,
  required_tier      TEXT CHECK (required_tier IN ('community','pro')),
  registration_count INTEGER NOT NULL DEFAULT 0,
  is_published       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── EVENT REGISTRATIONS ──────────────────────────────────────────────
CREATE TABLE event_registrations (
  event_id      UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (event_id, user_id)
);

-- ── COURSES ──────────────────────────────────────────────────────────
CREATE TABLE courses (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pillar_number  INTEGER UNIQUE NOT NULL,
  slug           TEXT UNIQUE NOT NULL,
  title          TEXT NOT NULL,
  description    TEXT,
  required_tier  TEXT NOT NULL DEFAULT 'community'
                   CHECK (required_tier IN ('community','pro')),
  is_published   BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order     INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── LESSONS ──────────────────────────────────────────────────────────
CREATE TABLE lessons (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id        UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  slug             TEXT NOT NULL,
  title            TEXT NOT NULL,
  description      TEXT,
  mux_asset_id     TEXT,
  mux_playback_id  TEXT,
  duration_seconds INTEGER,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  is_published     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (course_id, slug)
);

-- ── LESSON PROGRESS ──────────────────────────────────────────────────
CREATE TABLE lesson_progress (
  user_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id            UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completed_at         TIMESTAMPTZ,
  watch_time_seconds   INTEGER NOT NULL DEFAULT 0,
  notes                TEXT,
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, lesson_id)
);

-- ── NOTIFICATIONS ────────────────────────────────────────────────────
CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL CHECK (type IN (
               'community_reply','community_mention',
               'event_reminder','course_unlock',
               'system_billing','system_general')),
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  action_url TEXT,
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── VENDASTA WEBHOOK LOG ─────────────────────────────────────────────
CREATE TABLE vendasta_webhooks (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type           TEXT NOT NULL,
  vendasta_order_id    TEXT,
  vendasta_contact_id  TEXT,
  product_sku          TEXT,
  payload              JSONB NOT NULL,
  processed_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status               TEXT NOT NULL CHECK (status IN ('success','error')),
  error_message        TEXT
);

-- ── INDEXES ──────────────────────────────────────────────────────────
CREATE INDEX idx_posts_channel   ON posts(channel_id);
CREATE INDEX idx_posts_created   ON posts(created_at DESC);
CREATE INDEX idx_replies_post    ON replies(post_id);
CREATE INDEX idx_notif_user      ON notifications(user_id);
CREATE INDEX idx_notif_unread    ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_progress_user   ON lesson_progress(user_id);
CREATE INDEX idx_events_starts   ON events(starts_at);

-- ── UPDATED_AT TRIGGER ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER posts_updated_at BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── ROW LEVEL SECURITY ───────────────────────────────────────────────
ALTER TABLE users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels            ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts               ENABLE ROW LEVEL SECURITY;
ALTER TABLE replies             ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE events              ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses             ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons             ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress     ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications       ENABLE ROW LEVEL SECURITY;

-- Users
CREATE POLICY "users_select_authenticated" ON users
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Channels
CREATE POLICY "channels_select_authenticated" ON channels
  FOR SELECT USING (auth.role() = 'authenticated');

-- Posts
CREATE POLICY "posts_select_authenticated" ON posts
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "posts_insert_own" ON posts
  FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "posts_update_own" ON posts
  FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "posts_delete_own" ON posts
  FOR DELETE USING (auth.uid() = author_id);

-- Replies
CREATE POLICY "replies_select_authenticated" ON replies
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "replies_insert_own" ON replies
  FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Post Likes
CREATE POLICY "likes_select_authenticated" ON post_likes
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "likes_insert_own" ON post_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "likes_delete_own" ON post_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Events
CREATE POLICY "events_select_authenticated" ON events
  FOR SELECT USING (auth.role() = 'authenticated' AND is_published = TRUE);

-- Event Registrations
CREATE POLICY "regs_select_own" ON event_registrations
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "regs_insert_own" ON event_registrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "regs_delete_own" ON event_registrations
  FOR DELETE USING (auth.uid() = user_id);

-- Courses + Lessons (tier enforcement in app layer)
CREATE POLICY "courses_select_authenticated" ON courses
  FOR SELECT USING (auth.role() = 'authenticated' AND is_published = TRUE);
CREATE POLICY "lessons_select_authenticated" ON lessons
  FOR SELECT USING (auth.role() = 'authenticated' AND is_published = TRUE);

-- Lesson Progress
CREATE POLICY "progress_select_own" ON lesson_progress
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "progress_insert_own" ON lesson_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "progress_update_own" ON lesson_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- Notifications
CREATE POLICY "notif_select_own" ON notifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notif_update_own" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- ── SEED DATA ────────────────────────────────────────────────────────
INSERT INTO channels (slug, name, pillar_number, sort_order) VALUES
  ('general',             'General Feed',          NULL, 0),
  ('p1-foundation',       'P1 — Foundation',          1, 1),
  ('p2-identity',         'P2 — Identity',            2, 2),
  ('p3-mental-toughness', 'P3 — Mental Toughness',    3, 3),
  ('p4-strategy',         'P4 — Strategy',            4, 4),
  ('p5-accountability',   'P5 — Accountability',      5, 5),
  ('p6-execution',        'P6 — Execution',           6, 6);

INSERT INTO courses (pillar_number, slug, title, description, required_tier, sort_order, is_published) VALUES
  (1,'p1-foundation',      'Spiritual Foundation','Self-worth before achievement.',          'community',1,TRUE),
  (2,'p2-identity',        'Identity',            'Who you decide to be.',                   'community',2,TRUE),
  (3,'p3-mental-toughness','Mental Toughness',    'Reps that build resilience.',             'community',3,TRUE),
  (4,'p4-strategy',        'Strategic Approach',  'Strategy, not activities.',               'community',4,TRUE),
  (5,'p5-accountability',  'Accountability',      '4DX + OKRs. Lead measures. Scoreboard.', 'pro',      5,TRUE),
  (6,'p6-execution',       'Execution',           'Decisions into outcomes.',                'pro',      6,TRUE);
