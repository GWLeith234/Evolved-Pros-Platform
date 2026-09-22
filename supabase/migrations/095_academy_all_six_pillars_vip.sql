-- Academy re-tier: all six pillars are VIP (SPRINT L)
--
-- The canonical tier model makes the Academy a VIP entitlement in full. The
-- tiers now separate on the ROOM (mastermind cadence, the member network, the
-- LIVE discount), not on the coursework:
--
--                    Free      VIP $99   The 99 $849
--   Academy          teaser    full      full
--
-- Before this, Foundation was open to free accounts and pillars 4-6 were
-- gated behind pro. Two consequences:
--
--   1. Pillars 4, 5 and 6 open to VIP, who could not reach them before.
--   2. Foundation closes to the free tier beyond lesson 1. The free tier keeps
--      the overview of all six pillars and the first Foundation lesson; that
--      one-lesson teaser is enforced in code (lib/entitlements.ts,
--      canPlayLesson) because it is lesson-level and this column is not.
--
-- Checked before writing: zero lesson_progress rows exist for any
-- community-tier account, so no free member is stranded mid-course.
--
-- courses.required_tier stays the runtime source of truth and an admin can
-- still re-open a pillar per row without a deploy.
--
-- ROLLBACK (restores the previous model exactly):
--   UPDATE courses SET required_tier = 'community' WHERE pillar_number = 1;
--   UPDATE courses SET required_tier = 'vip'       WHERE pillar_number IN (2,3);
--   UPDATE courses SET required_tier = 'pro'       WHERE pillar_number IN (4,5,6);

UPDATE courses
SET required_tier = 'vip'
WHERE pillar_number BETWEEN 1 AND 6
  AND required_tier IS DISTINCT FROM 'vip';

COMMENT ON COLUMN courses.required_tier IS
  'Minimum tier that opens this course, compared by rank in lib/tier.ts. SPRINT L: all six pillars are vip. The free tier gets the Academy teaser (overview + Foundation lesson 1), which is lesson-level and enforced in lib/entitlements.ts.';
