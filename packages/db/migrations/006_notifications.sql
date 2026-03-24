-- Email preferences on users
ALTER TABLE users ADD COLUMN IF NOT EXISTS
  notification_preferences JSONB NOT NULL DEFAULT '{
    "community_reply": "digest",
    "community_mention": "immediate",
    "event_reminder": "immediate",
    "course_unlock": "immediate",
    "system_billing": "immediate"
  }'::jsonb;

-- Index for unread count queries
CREATE INDEX IF NOT EXISTS idx_notif_created ON notifications(user_id, created_at DESC);
