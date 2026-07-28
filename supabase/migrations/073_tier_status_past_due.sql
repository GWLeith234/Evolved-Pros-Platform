-- 073_tier_status_past_due.sql
-- SPRINT I — Real schema change: allow tier_status = 'past_due'.
--
-- WHY THIS EXISTS
-- The Stripe webhook sets users.tier_status = 'past_due' on dunning:
--   * app/api/stripe/webhook/route.ts:164 (customer.subscription.updated, when
--     the subscription is past_due / unpaid / incomplete)
--   * app/api/stripe/webhook/route.ts:217 (invoice.payment_failed grace flag)
-- But the live CHECK constraint (widened in 070) does NOT list 'past_due':
--   users_tier_status_check CHECK (tier_status = ANY (ARRAY[
--     'active','trial','cancelled','expired','comp']))
-- so that UPDATE throws, the webhook returns 5xx, and Stripe retries forever.
-- This migration widens the constraint to admit 'past_due'.
--
-- IDEMPOTENCY CONTRACT
-- DROP CONSTRAINT IF EXISTS then re-ADD the named constraint with the full
-- allowed set. Re-running is a safe no-op: it drops the current definition and
-- recreates the identical one. No existing allowed value is removed — the only
-- change versus 070 is the addition of 'past_due'.
--
-- Safe to apply: every existing row already holds one of the previously-allowed
-- values, all of which remain permitted, so the ADD CONSTRAINT validates
-- without error.

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_tier_status_check;
ALTER TABLE public.users
  ADD CONSTRAINT users_tier_status_check
  CHECK (tier_status = ANY (ARRAY[
    'active'::text,
    'trial'::text,
    'cancelled'::text,
    'expired'::text,
    'comp'::text,
    'past_due'::text
  ]));
