/* 078_courses_required_tier.sql */
/* SPRINT TIER-1 — Gate the Academy, open everything else.                 */
/*                                                                        */
/* THE MODEL (approved)                                                   */
/*   community (free) — Pillar 1 (Foundation) only, plus the full pillar  */
/*                      assessment with real scores across all six.       */
/*   vip            — Pillars 1-3 (Foundation, Identity, Mental          */
/*                      Toughness): "the inner game".                     */
/*   pro            — all six pillars (adds Strategy, Accountability,    */
/*                      Execution): "the outer game".                     */
/*                                                                        */
/* This REPLACES the legacy gating. Two existing community-tier members   */
/* lose Pillars 2-4; that is a deliberate product decision — there is NO  */
/* grandfathering clause here on purpose.                                 */
/*                                                                        */
/* FAIL-CLOSED DEFAULT                                                    */
/* The column default is 'pro', not 'community'. A course created later   */
/* (admin UI, seed script, restore) is therefore locked to the highest    */
/* tier until someone deliberately opens it. The previous default was     */
/* 'community', which would have silently published any new pillar to    */
/* the entire free tier.                                                  */
/*                                                                        */
/* ROBUST MATCHING                                                        */
/* The seed matches on courses.pillar_number — an integer column with a   */
/* UNIQUE constraint — never on display titles. Titles have already       */
/* drifted in production (pillar 4 is titled "Strategy" but slugged      */
/* "strategic-approach"), so a title match would mis-seed silently.       */
/*                                                                        */
/* MIGRATION NUMBERING                                                    */
/* 075 is reserved (open PR #43); 077 is claimed by the parallel EM-1     */
/* sprint. This file owns 078.                                            */
/*                                                                        */
/* EXECUTION NOTE                                                         */
/* Idempotent — safe to re-run. Run each statement INDIVIDUALLY: this     */
/* environment only returns the last result set of a multi-statement      */
/* batch, which would hide a failure in an earlier statement.             */
/*                                                                        */
/* Tier values are always lowercase: 'community', never 'Community'.      */

/* Step 1 of 5: the column. NOT NULL DEFAULT 'pro' (fail-closed).         */
/* No-op where the column already exists — step 2 fixes its default.      */
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS required_tier TEXT NOT NULL DEFAULT 'pro';

/* Step 2 of 5: force the fail-closed default even on a pre-existing      */
/* column (production currently defaults to 'community').                 */
ALTER TABLE public.courses
  ALTER COLUMN required_tier SET DEFAULT 'pro';

/* Step 3 of 5: the tier vocabulary. Dropped and recreated rather than    */
/* ADD IF NOT EXISTS (Postgres has no such form for constraints), so a    */
/* re-run converges on exactly this definition.                           */
ALTER TABLE public.courses
  DROP CONSTRAINT IF EXISTS courses_required_tier_check;

ALTER TABLE public.courses
  ADD CONSTRAINT courses_required_tier_check
  CHECK (required_tier IN ('community', 'vip', 'pro'));

/* Step 4 of 5: seed the mapping. Matched on pillar_number (see above).   */
UPDATE public.courses SET required_tier = 'community' WHERE pillar_number = 1;
UPDATE public.courses SET required_tier = 'vip'       WHERE pillar_number IN (2, 3);
UPDATE public.courses SET required_tier = 'pro'       WHERE pillar_number IN (4, 5, 6);

/* Step 5 of 5: sanity assertion.                                         */
/* A silent mis-seed here mis-gates the entire product — every Academy    */
/* page, lesson route and Mux token decision reads this column. Fail the  */
/* migration loudly rather than ship a storefront that gives away the     */
/* curriculum (or locks Foundation away from the free tier).              */
/* Scoped to the six pillar courses; any non-pillar row is ignored.       */
DO $$
DECLARE
  n_community INT;
  n_vip       INT;
  n_pro       INT;
BEGIN
  SELECT
    COUNT(*) FILTER (WHERE required_tier = 'community'),
    COUNT(*) FILTER (WHERE required_tier = 'vip'),
    COUNT(*) FILTER (WHERE required_tier = 'pro')
  INTO n_community, n_vip, n_pro
  FROM public.courses
  WHERE pillar_number BETWEEN 1 AND 6;

  IF n_community <> 1 OR n_vip <> 2 OR n_pro <> 3 THEN
    RAISE EXCEPTION
      'Migration 078 tier seed failed: expected 1 community / 2 vip / 3 pro across pillars 1-6, got % community / % vip / % pro. Academy gating would be wrong — investigate courses.pillar_number before retrying.',
      n_community, n_vip, n_pro;
  END IF;
END
$$;
