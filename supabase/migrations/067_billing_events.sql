-- Migration 067: billing_events — Stripe webhook idempotency ledger.
-- SPRINT I Phase 1 hardening (per the Stripe integration plan). Stripe retries
-- webhook deliveries; this table dedupes them so an event is applied at most
-- once. The webhook checks stripe_event_id before processing and records it
-- after a successful apply.
--
-- RLS: enabled with NO policies — only the service-role webhook (which
-- bypasses RLS) ever touches this table. No client access.

CREATE TABLE IF NOT EXISTS public.billing_events (
  stripe_event_id text PRIMARY KEY,
  type            text,
  processed_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.billing_events IS
  'SPRINT I Phase 1 — Stripe webhook idempotency ledger. One row per applied Stripe event id; the webhook skips events already present. Service-role only.';
