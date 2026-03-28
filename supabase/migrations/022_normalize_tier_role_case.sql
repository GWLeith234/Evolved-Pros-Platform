-- Normalize tier and role to lowercase to fix case-mismatch bugs.
-- Safe to run multiple times (idempotent).
UPDATE public.users
SET tier = lower(tier)
WHERE tier IS NOT NULL
  AND tier <> lower(tier);

UPDATE public.users
SET role = lower(role)
WHERE role IS NOT NULL
  AND role <> lower(role);
