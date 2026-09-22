-- Seat cap + waitlist (SPRINT L)
--
-- The Evolved Pros 99 sells 99 seats. Nothing in the schema could express that,
-- so seat 100 would have been sold silently: Stripe happily bills an unlimited
-- number of subscriptions against one price.
--
-- seat_cap lives on products, not prices, because the cap is a property of the
-- room, not of how you pay to be in it. If an annual price is added later it
-- draws from the same 99.
--
-- Idempotent throughout.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS seat_cap INTEGER;

ALTER TABLE products
  DROP CONSTRAINT IF EXISTS products_seat_cap_positive;
ALTER TABLE products
  ADD CONSTRAINT products_seat_cap_positive
  CHECK (seat_cap IS NULL OR seat_cap > 0);

COMMENT ON COLUMN products.seat_cap IS
  'Maximum concurrent ACTIVE subscriptions for this product. NULL = unlimited. Counted against live Stripe subscriptions, never against all-time sales: a cancelled seat returns to the pool.';

-- The 99 is the only capped product today. Matched on tier rather than slug so
-- this still lands if the row was renamed when Professional was retired.
UPDATE products SET seat_cap = 99 WHERE tier = 'pro' AND kind = 'membership';
UPDATE products SET seat_cap = NULL WHERE tier IN ('community', 'vip');

-- ── Waitlist ───────────────────────────────────────────────────────────────
-- Somebody who tried to buy a sold-out seat is the most qualified lead the
-- platform will ever see. Turning them away without taking a name is the
-- actual bug; a 409 with nothing recorded is a lost sale.
--
-- Rows are keyed by user, not email: only a signed-in member can reach
-- checkout, so we always have one, and a user_id survives an email change.

CREATE TABLE IF NOT EXISTS seat_waitlist (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  -- CASCADE: a deleted account has no claim on a seat.
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- Denormalized so the list is legible after a profile edit, and so admin can
  -- work it without joining users.
  email        TEXT NOT NULL,
  full_name    TEXT,
  -- 'waiting'  -> in line
  -- 'offered'  -> a seat opened and they were told
  -- 'seated'   -> they took it
  -- 'declined' -> they passed, or the offer lapsed
  status       TEXT NOT NULL DEFAULT 'waiting'
                 CHECK (status IN ('waiting', 'offered', 'seated', 'declined')),
  -- Which surface put them here: 'checkout' (hit the cap at the door) or
  -- 'webhook' (won the race, then lost the reconcile). Tells us whether the
  -- overflow path is actually firing in production.
  source       TEXT NOT NULL DEFAULT 'checkout'
                 CHECK (source IN ('checkout', 'webhook', 'admin')),
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One live place in line per person per product. A member who clicks twice
-- keeps their original position rather than jumping to the back, and repeat
-- attempts upsert instead of stacking duplicates.
CREATE UNIQUE INDEX IF NOT EXISTS uq_seat_waitlist_open
  ON seat_waitlist (product_id, user_id)
  WHERE status IN ('waiting', 'offered');

-- Admin reads the queue in arrival order.
CREATE INDEX IF NOT EXISTS idx_seat_waitlist_queue
  ON seat_waitlist (product_id, status, created_at);

-- Service-role only. Every write goes through adminClient from a route that
-- has already authenticated the member; there is no member-facing read path,
-- so RLS is on with no policies at all (same shape as campaign_sends, 077).
ALTER TABLE seat_waitlist ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE seat_waitlist IS
  'People who tried to buy a sold-out seat. Service-role only; no RLS policies. One open row per (product, user) via a partial unique index.';
COMMENT ON COLUMN seat_waitlist.source IS
  'checkout = refused at the door; webhook = won the checkout race then lost reconciliation; admin = added by hand.';
