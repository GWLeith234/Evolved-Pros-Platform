-- Sprint P2-FIX: Correct tier gate values + pillar 4 title
--
-- Access model:
--   Community (free) → all pillars locked
--   VIP ($79/mo)     → pillars 1-3 unlocked, 4-6 locked
--   Pro ($249/mo)    → all 6 unlocked

-- ── Step 1: Widen CHECK constraints to allow 'vip' tier ──────────────

-- users.tier — allow 'vip' for VIP members
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_tier_check;
ALTER TABLE users ADD CONSTRAINT users_tier_check
  CHECK (tier IN ('community', 'vip', 'pro'));

-- courses.required_tier — allow 'vip' as a required tier
ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_required_tier_check;
ALTER TABLE courses ADD CONSTRAINT courses_required_tier_check
  CHECK (required_tier IN ('community', 'vip', 'pro'));

-- ── Step 2: Update course tier requirements ──────────────────────────

-- Pillars 1-3: require VIP
UPDATE courses SET required_tier = 'vip' WHERE pillar_number IN (1, 2, 3);

-- Pillars 4-6: require Pro
UPDATE courses SET required_tier = 'pro' WHERE pillar_number IN (4, 5, 6);

-- ── Step 3: Fix pillar 4 title ───────────────────────────────────────

UPDATE courses SET title = 'Strategy' WHERE pillar_number = 4 AND title ILIKE '%strategic%';

-- ── Verify ───────────────────────────────────────────────────────────
-- SELECT pillar_number, title, required_tier FROM courses ORDER BY pillar_number;
