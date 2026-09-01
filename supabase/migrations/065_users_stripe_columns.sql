-- Migration 065: Stripe subscription linkage on public.users.
-- SPRINT I Phase 1 (Stripe, TEST MODE). Adds the two identifiers the Stripe
-- checkout + webhook need to map a Stripe customer / subscription back to our
-- user row and drive tier / tier_status / tier_expires_at. Purely additive —
-- no existing column and none of the legacy Vendasta linkage is touched
-- (strangler pattern; Stripe runs alongside Vendasta until proven).
--
-- RLS: plain columns on public.users; they inherit the table's existing
-- policies (own-row read; service-role adminClient writes from the webhook).
-- No new policy required.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text;

-- One Stripe customer maps to exactly one user; enforce it (partial so the
-- NULL majority stays unconstrained).
CREATE UNIQUE INDEX IF NOT EXISTS users_stripe_customer_id_key
  ON public.users (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

-- The webhook resolves the user by subscription id on every event.
CREATE INDEX IF NOT EXISTS idx_users_stripe_subscription_id
  ON public.users (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

COMMENT ON COLUMN public.users.stripe_customer_id IS
  'SPRINT I Phase 1 — Stripe customer id (cus_…). Set on first checkout; reused for upgrades. TEST mode in this phase.';
COMMENT ON COLUMN public.users.stripe_subscription_id IS
  'SPRINT I Phase 1 — active Stripe subscription id (sub_…). The webhook keys tier updates on this. TEST mode in this phase.';
