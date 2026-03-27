-- Add in-app notification preference keys to the notification_preferences JSONB column.
-- The column already exists (added in packages/db/migrations/006_notifications.sql).
-- This migration merges new in-app toggle defaults into any existing rows.

UPDATE users
SET notification_preferences = notification_preferences || '{
  "new_replies": true,
  "new_likes": true,
  "new_members": false,
  "event_reminders": true,
  "weekly_digest": true
}'::jsonb
WHERE notification_preferences IS NOT NULL
  AND NOT (notification_preferences ? 'new_replies');

-- For rows using the old default (no prior preferences set), set the full default.
UPDATE users
SET notification_preferences = '{
  "community_reply": "digest",
  "community_mention": "immediate",
  "event_reminder": "immediate",
  "course_unlock": "immediate",
  "system_billing": "immediate",
  "new_replies": true,
  "new_likes": true,
  "new_members": false,
  "event_reminders": true,
  "weekly_digest": true
}'::jsonb
WHERE notification_preferences IS NULL;
