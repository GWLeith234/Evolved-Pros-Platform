-- 099: downgrade paid members whose period has ended.
--
-- 098 is reserved for the in-flight tier_change_log REVOKE migration.
-- Do not renumber this file onto 098.
--
-- Why this exists
-- GET /api/cron/expire-tiers used to set tier_status = 'expired' only when
-- tier_status was already 'active'. It never changed users.tier, and it never
-- touched a cancellation (tier_status = 'cancelled'), which is how Stripe
-- records cancel-at-period-end. customer.subscription.deleted is the only
-- writer that set tier = 'community', and only when stripe_subscription_id
-- still matched. After the paid period, the stored tier stayed vip/pro.
--
-- Rule (George): cancel anytime, keep the paid tier until tier_expires_at,
-- then drop to community. No refunds or prorates. Comps and admins are not
-- downgraded. past_due is left alone so Stripe can finish dunning;
-- subscription.deleted still drops that member.
--
-- Audit: migration 097's AFTER UPDATE trigger users_audit_privilege_change
-- writes exactly one tier_change_log row when tier or tier_status changes.
-- This function does not insert when that trigger is present. If 097 has not
-- been applied, it inserts one row itself so the downgrade is still audited.
--
-- Not scheduled here. The existing daily GitHub cron calls
-- /api/cron/expire-tiers, which calls this function. Applying this file does
-- not update any row; a person runs the function.

CREATE OR REPLACE FUNCTION public.downgrade_expired_paid_members()
RETURNS TABLE (user_id uuid, old_tier text, new_tier text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  rec record;
  new_status text;
  has_trigger boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'users_audit_privilege_change'
      AND tgrelid = 'public.users'::regclass
      AND NOT tgisinternal
  ) INTO has_trigger;

  FOR rec IN
    SELECT u.id, u.tier, u.tier_status
    FROM public.users u
    WHERE lower(u.tier) IN ('vip', 'pro')
      AND u.tier_expires_at IS NOT NULL
      AND u.tier_expires_at < now()
      AND lower(coalesce(u.role, '')) <> 'admin'
      AND lower(coalesce(u.tier_status, '')) <> 'comp'
      AND u.comp_promo_code_id IS NULL
      AND lower(coalesce(u.tier_status, '')) IN ('active', 'trial', 'cancelled', 'canceled', 'expired')
    FOR UPDATE
  LOOP
    new_status := CASE
      WHEN lower(coalesce(rec.tier_status, '')) IN ('cancelled', 'canceled') THEN 'cancelled'
      ELSE 'expired'
    END;

    UPDATE public.users
    SET tier = 'community',
        tier_status = new_status
    WHERE id = rec.id;

    -- audit: trigger users_audit_privilege_change, else one insert
    IF NOT has_trigger THEN
      INSERT INTO public.tier_change_log (user_id, old_tier, new_tier, direction)
      VALUES (
        rec.id,
        rec.tier,
        'community',
        CASE
          WHEN new_status IS DISTINCT FROM rec.tier_status THEN 'tier,tier_status'
          ELSE 'tier'
        END
      );
    END IF;

    user_id := rec.id;
    old_tier := rec.tier;
    new_tier := 'community';
    RETURN NEXT;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.downgrade_expired_paid_members() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.downgrade_expired_paid_members() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.downgrade_expired_paid_members() TO service_role;

COMMENT ON FUNCTION public.downgrade_expired_paid_members() IS
  'Sets tier=community for paid members past tier_expires_at. Skips comps, admins, and past_due. One tier_change_log row via the 097 trigger, or one direct insert when that trigger is absent.';
