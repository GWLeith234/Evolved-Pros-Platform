-- Migration 024: Rename community→vip, add keynote_access, normalize case
-- Fixes 5/6 QA failures caused by un-applied migrations 022 + 023

-- Step 1: Normalize capitalized tier/role values (was in 022, never applied to prod)
UPDATE public.users SET tier = lower(tier) WHERE tier IS NOT NULL AND tier <> lower(tier);
UPDATE public.users SET role = lower(role) WHERE role IS NOT NULL AND role <> lower(role);

-- Step 2: Rename 'community' tier to 'vip'
UPDATE public.users SET tier = 'vip' WHERE tier = 'community';

-- Step 3: Add keynote_access column (add-on, stacks with any tier)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS keynote_access boolean NOT NULL DEFAULT false;

-- Step 4: Replace tier CHECK constraint to accept the new values
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_tier_check;
ALTER TABLE public.users ADD CONSTRAINT users_tier_check
  CHECK (tier IN ('vip', 'pro') OR tier IS NULL);

-- Step 5: Add event_type_keynote flag to events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS event_type_keynote boolean NOT NULL DEFAULT false;

-- Permissions
GRANT SELECT, UPDATE ON public.users TO authenticated;
