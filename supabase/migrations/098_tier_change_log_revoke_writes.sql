-- 098: revoke write privileges on public.tier_change_log from anon and authenticated.
--
-- The public anon key could previously TRUNCATE, INSERT, and DELETE the tier
-- audit log. SELECT is unchanged. service_role and the SECURITY DEFINER
-- audit trigger (private.insert_tier_change_log) still write.
--
-- REVOKE is idempotent: running this again is a no-op once those privileges
-- are already gone.

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER ON public.tier_change_log FROM anon, authenticated;
