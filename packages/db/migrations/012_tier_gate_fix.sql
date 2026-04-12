-- Sprint P2-FIX: Correct tier gate values + pillar 4 title
--
-- Access model:
--   Community (free) → all pillars locked
--   VIP ($79/mo)     → pillars 1-3 unlocked, 4-6 locked
--   Pro ($249/mo)    → all 6 unlocked

-- Pillars 1-3: require VIP
UPDATE courses SET required_tier = 'vip' WHERE pillar_number IN (1, 2, 3);

-- Pillars 4-6: require Pro
UPDATE courses SET required_tier = 'pro' WHERE pillar_number IN (4, 5, 6);

-- Fix pillar 4 title: "Strategic Approach" → "Strategy"
UPDATE courses SET title = 'Strategy' WHERE pillar_number = 4 AND title ILIKE '%strategic%';
