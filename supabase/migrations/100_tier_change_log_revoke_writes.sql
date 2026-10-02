-- 100: revoke write privileges on public.tier_change_log from anon and authenticated.
--
-- The public anon key could previously TRUNCATE, INSERT, and DELETE the tier
-- audit log. SELECT is unchanged. service_role and the SECURITY DEFINER
-- audit trigger (private.insert_tier_change_log) still write.
--
-- public.downgrade_expired_paid_members() (099) is also SECURITY DEFINER.
-- It inserts into tier_change_log only when the 097 trigger
-- users_audit_privilege_change is absent. That insert runs as the function
-- owner, so this REVOKE does not block it. When the trigger is present, the
-- trigger writes the row instead.
--
-- REVOKE is idempotent: running this again is a no-op once those privileges
-- are already gone.

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER ON public.tier_change_log FROM anon, authenticated;
