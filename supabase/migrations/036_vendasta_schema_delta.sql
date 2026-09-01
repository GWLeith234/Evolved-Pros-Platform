/* Migration 036: Vendasta schema delta
   Codifies the small set of operations that were applied directly via Supabase
   SQL Editor on Apr 25 2026 but were NOT covered by migration 035.

   035 (already in HEAD) covers: vendasta_* + first_name/last_name columns on
   users, unique constraint + index on vendasta_account_id, the 3-tier
   tier_check (community/vip/pro), the vendasta_webhooks table shape
   (id, event_id, payload, received_at), unique constraint on event_id,
   received_at index, and DROP NOT NULL on legacy event_type/status.

   This delta adds only what 035 missed. All operations are idempotent.
   DO NOT run 035 against prod again — its contents are already applied via
   tonight's SQL Editor session. migration_history reconciliation is a
   separate housekeeping pass. */

/* 1. Drop NOT NULL on legacy vendasta_webhooks columns the new handler
      doesn't supply. 035 handled event_type and status; this catches the
      remaining two (vendasta_contact_id, product_sku) seen in some
      out-of-tree environments. */
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='vendasta_webhooks'
             AND column_name='vendasta_contact_id' AND is_nullable='NO') THEN
    ALTER TABLE public.vendasta_webhooks ALTER COLUMN vendasta_contact_id DROP NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='vendasta_webhooks'
             AND column_name='product_sku' AND is_nullable='NO') THEN
    ALTER TABLE public.vendasta_webhooks ALTER COLUMN product_sku DROP NOT NULL;
  END IF;
END $$;

/* 2. Force PostgREST schema cache reload — required after column shape
      changes so the REST layer picks up the new nullable columns without a
      restart. */
NOTIFY pgrst, 'reload schema';
