-- Sprint R: Add onboarding_completed flag to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

-- Mark existing members as already onboarded (they pre-date this flow)
UPDATE users SET onboarding_completed = true WHERE tier IS NOT NULL OR role = 'admin';
