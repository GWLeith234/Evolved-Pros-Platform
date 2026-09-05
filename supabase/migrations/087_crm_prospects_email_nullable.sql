-- 087: SMS-only Conversations AI leads (AI George).
-- crm_prospects.email was NOT NULL from 060. Conversations AI often has a
-- phone and no email. Allow NULL so those rows persist. The 076 unique index
-- on lower(email) already treats NULLs as distinct, so SMS-only rows do not
-- collide with each other.

ALTER TABLE public.crm_prospects
  ALTER COLUMN email DROP NOT NULL;

COMMENT ON COLUMN public.crm_prospects.email IS
  'Optional. AI George SMS-only leads may have phone and no email. Unique on lower(email); NULLs do not collide.';
