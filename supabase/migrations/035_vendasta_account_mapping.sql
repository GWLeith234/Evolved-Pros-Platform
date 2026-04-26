-- Migration 035: Vendasta automation-triggered webhook model
-- Replaces the prior event-sourced HMAC model. See SPRINT VENDASTA-WEBHOOK-REFACTOR.

-- 1. Account-mapping columns on public.users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS vendasta_account_id              text,
  ADD COLUMN IF NOT EXISTS vendasta_sku                     text,
  ADD COLUMN IF NOT EXISTS vendasta_subscription_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS vendasta_last_event_at           timestamptz,
  ADD COLUMN IF NOT EXISTS first_name                       text,
  ADD COLUMN IF NOT EXISTS last_name                        text;

-- Unique constraint on vendasta_account_id (allows multiple NULLs in Postgres)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_vendasta_account_id_key'
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_vendasta_account_id_key UNIQUE (vendasta_account_id);
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_users_vendasta_account_id
  ON public.users(vendasta_account_id)
  WHERE vendasta_account_id IS NOT NULL;

-- 2. Restore 'community' to the tier check constraint (mig 024 had collapsed it to vip).
--    The new automation flow writes tier='community' for community SKUs.
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_tier_check;
ALTER TABLE public.users ADD CONSTRAINT users_tier_check
  CHECK (tier IN ('community', 'vip', 'pro') OR tier IS NULL);

-- 3. vendasta_webhooks table — additive: ensure shape required by new handler.
--    Some environments already have a legacy version of this table created out-of-tree
--    (with columns event_type, vendasta_contact_id, etc.). Keep those, add what we need.
CREATE TABLE IF NOT EXISTS public.vendasta_webhooks (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    text,
  payload     jsonb       NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vendasta_webhooks
  ADD COLUMN IF NOT EXISTS event_id    text,
  ADD COLUMN IF NOT EXISTS payload     jsonb,
  ADD COLUMN IF NOT EXISTS received_at timestamptz NOT NULL DEFAULT now();

-- Legacy columns (event_type, status) were NOT NULL in the out-of-tree shape
-- but the new automation flow doesn't populate them. Make them nullable so
-- INSERT { event_id, payload, received_at } succeeds.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='vendasta_webhooks' AND column_name='event_type') THEN
    ALTER TABLE public.vendasta_webhooks ALTER COLUMN event_type DROP NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='vendasta_webhooks' AND column_name='status') THEN
    ALTER TABLE public.vendasta_webhooks ALTER COLUMN status DROP NOT NULL;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'vendasta_webhooks_event_id_key'
  ) THEN
    ALTER TABLE public.vendasta_webhooks
      ADD CONSTRAINT vendasta_webhooks_event_id_key UNIQUE (event_id);
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_vendasta_webhooks_received_at
  ON public.vendasta_webhooks(received_at DESC);
