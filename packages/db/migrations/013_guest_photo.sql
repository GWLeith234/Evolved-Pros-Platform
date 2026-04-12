-- Sprint POD-1: Ensure guest_image_url column exists on episodes table
-- The column may already exist from manual DB setup; IF NOT EXISTS handles idempotency.

ALTER TABLE episodes ADD COLUMN IF NOT EXISTS guest_image_url TEXT;
