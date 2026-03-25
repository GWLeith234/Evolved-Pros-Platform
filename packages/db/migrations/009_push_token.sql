-- Sprint 8: Mobile app — push notification token
ALTER TABLE users ADD COLUMN IF NOT EXISTS push_token TEXT;
