-- SPRINT V-CHECKOUT — add Account Group ID column for Sales Orders API flow.
--
-- The existing public.users.vendasta_account_id was populated by the legacy
-- storefront webhook (Business App account ID). The new Sales Orders API flow
-- creates an Account Group via POST /platform/salesAccounts and stores its
-- AGID here so subsequent orders can be billed against the same group without
-- re-creating it.
--
-- Numbered 047 because 044 (goals_target_date_snapshots) is already taken;
-- the sprint spec said 044 but didn't know about the collision.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS vendasta_account_group_id TEXT;

CREATE INDEX IF NOT EXISTS idx_users_vendasta_account_group_id
  ON public.users (vendasta_account_group_id)
  WHERE vendasta_account_group_id IS NOT NULL;
