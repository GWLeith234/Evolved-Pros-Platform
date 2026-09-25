-- Local proof for public.downgrade_expired_paid_members.
-- The runner has already applied migrations 097 and 099. Not production.

INSERT INTO public.users (id, email, display_name, role, tier, tier_status, tier_expires_at, comp_promo_code_id)
VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'active-past@example.com', 'Test Account', 'member', 'vip', 'active', now() - interval '1 day', NULL),
  ('00000000-0000-0000-0000-0000000000a2', 'cancelled-past@example.com', 'Cancelled', 'member', 'pro', 'cancelled', now() - interval '2 days', NULL),
  ('00000000-0000-0000-0000-0000000000a3', 'comp-past@example.com', 'Comp Member', 'member', 'pro', 'comp', now() - interval '100 days', NULL),
  ('00000000-0000-0000-0000-0000000000a4', 'comp-flag@example.com', 'Comp Flag', 'member', 'vip', 'active', now() - interval '100 days', '00000000-0000-0000-0000-000000000099'),
  ('00000000-0000-0000-0000-0000000000a5', 'future@example.com', 'Future', 'member', 'vip', 'active', now() + interval '30 days', NULL),
  ('00000000-0000-0000-0000-0000000000a6', 'admin-past@example.com', 'Admin', 'admin', 'pro', 'active', now() - interval '10 days', NULL),
  ('00000000-0000-0000-0000-0000000000a7', 'past-due@example.com', 'Past Due', 'member', 'vip', 'past_due', now() - interval '3 days', NULL),
  ('00000000-0000-0000-0000-0000000000a8', 'trial-past@example.com', 'Trial', 'member', 'pro', 'trial', now() - interval '1 day', NULL),
  ('00000000-0000-0000-0000-0000000000a9', 'already-expired@example.com', 'Expired Paid', 'member', 'vip', 'expired', now() - interval '5 days', NULL);

SELECT public.downgrade_expired_paid_members();

DO $$
DECLARE
  n int;
  dir text;
BEGIN
  IF (SELECT tier FROM public.users WHERE id = '00000000-0000-0000-0000-0000000000a1') IS DISTINCT FROM 'community'
     OR (SELECT tier_status FROM public.users WHERE id = '00000000-0000-0000-0000-0000000000a1') IS DISTINCT FROM 'expired' THEN
    RAISE EXCEPTION 'active past-period member was not downgraded';
  END IF;

  IF (SELECT tier FROM public.users WHERE id = '00000000-0000-0000-0000-0000000000a2') IS DISTINCT FROM 'community'
     OR (SELECT tier_status FROM public.users WHERE id = '00000000-0000-0000-0000-0000000000a2') IS DISTINCT FROM 'cancelled' THEN
    RAISE EXCEPTION 'cancelled past-period member was not downgraded to community';
  END IF;

  IF (SELECT tier FROM public.users WHERE id = '00000000-0000-0000-0000-0000000000a3') IS DISTINCT FROM 'pro'
     OR (SELECT tier_status FROM public.users WHERE id = '00000000-0000-0000-0000-0000000000a3') IS DISTINCT FROM 'comp' THEN
    RAISE EXCEPTION 'comp member was downgraded';
  END IF;

  IF (SELECT tier FROM public.users WHERE id = '00000000-0000-0000-0000-0000000000a4') IS DISTINCT FROM 'vip' THEN
    RAISE EXCEPTION 'comp_promo_code_id member was downgraded';
  END IF;

  IF (SELECT tier FROM public.users WHERE id = '00000000-0000-0000-0000-0000000000a5') IS DISTINCT FROM 'vip' THEN
    RAISE EXCEPTION 'future period member was downgraded';
  END IF;

  IF (SELECT tier FROM public.users WHERE id = '00000000-0000-0000-0000-0000000000a6') IS DISTINCT FROM 'pro'
     OR (SELECT role FROM public.users WHERE id = '00000000-0000-0000-0000-0000000000a6') IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'admin was downgraded';
  END IF;

  IF (SELECT tier FROM public.users WHERE id = '00000000-0000-0000-0000-0000000000a7') IS DISTINCT FROM 'vip'
     OR (SELECT tier_status FROM public.users WHERE id = '00000000-0000-0000-0000-0000000000a7') IS DISTINCT FROM 'past_due' THEN
    RAISE EXCEPTION 'past_due member was downgraded';
  END IF;

  IF (SELECT tier FROM public.users WHERE id = '00000000-0000-0000-0000-0000000000a8') IS DISTINCT FROM 'community'
     OR (SELECT tier_status FROM public.users WHERE id = '00000000-0000-0000-0000-0000000000a8') IS DISTINCT FROM 'expired' THEN
    RAISE EXCEPTION 'trial past-period member was not downgraded';
  END IF;

  IF (SELECT tier FROM public.users WHERE id = '00000000-0000-0000-0000-0000000000a9') IS DISTINCT FROM 'community'
     OR (SELECT tier_status FROM public.users WHERE id = '00000000-0000-0000-0000-0000000000a9') IS DISTINCT FROM 'expired' THEN
    RAISE EXCEPTION 'already-expired paid tier was not downgraded';
  END IF;

  SELECT count(*) INTO n FROM public.tier_change_log WHERE user_id = '00000000-0000-0000-0000-0000000000a1';
  IF n <> 1 THEN
    RAISE EXCEPTION 'active downgrade wrote % audit rows, expected 1', n;
  END IF;
  SELECT direction INTO dir FROM public.tier_change_log WHERE user_id = '00000000-0000-0000-0000-0000000000a1';
  IF dir IS DISTINCT FROM 'tier,tier_status' THEN
    RAISE EXCEPTION 'active downgrade direction was %', dir;
  END IF;

  SELECT count(*) INTO n FROM public.tier_change_log WHERE user_id = '00000000-0000-0000-0000-0000000000a2';
  IF n <> 1 THEN
    RAISE EXCEPTION 'cancelled downgrade wrote % audit rows, expected 1', n;
  END IF;
  SELECT direction INTO dir FROM public.tier_change_log WHERE user_id = '00000000-0000-0000-0000-0000000000a2';
  IF dir IS DISTINCT FROM 'tier' THEN
    RAISE EXCEPTION 'cancelled downgrade direction was %', dir;
  END IF;

  SELECT count(*) INTO n FROM public.tier_change_log
   WHERE user_id IN (
     '00000000-0000-0000-0000-0000000000a3',
     '00000000-0000-0000-0000-0000000000a4',
     '00000000-0000-0000-0000-0000000000a5',
     '00000000-0000-0000-0000-0000000000a6',
     '00000000-0000-0000-0000-0000000000a7'
   );
  IF n <> 0 THEN
    RAISE EXCEPTION 'comp, future, admin, or past_due wrote % audit rows', n;
  END IF;
END $$;

-- Second call is a no-op: no extra audit rows.
SELECT public.downgrade_expired_paid_members();

DO $$
DECLARE
  n int;
BEGIN
  SELECT count(*) INTO n FROM public.tier_change_log WHERE user_id = '00000000-0000-0000-0000-0000000000a1';
  IF n <> 1 THEN
    RAISE EXCEPTION 'second downgrade pass wrote another audit row (% total)', n;
  END IF;
END $$;

-- Without the 097 trigger the function itself writes exactly one row.
INSERT INTO public.users (id, email, display_name, role, tier, tier_status, tier_expires_at)
VALUES ('00000000-0000-0000-0000-0000000000b1', 'no-trigger@example.com', 'No Trigger', 'member', 'vip', 'active', now() - interval '1 day');

DROP TRIGGER users_audit_privilege_change ON public.users;

SELECT public.downgrade_expired_paid_members();

DO $$
DECLARE
  n int;
BEGIN
  IF (SELECT tier FROM public.users WHERE id = '00000000-0000-0000-0000-0000000000b1') IS DISTINCT FROM 'community' THEN
    RAISE EXCEPTION 'fallback path did not downgrade';
  END IF;
  SELECT count(*) INTO n FROM public.tier_change_log WHERE user_id = '00000000-0000-0000-0000-0000000000b1';
  IF n <> 1 THEN
    RAISE EXCEPTION 'fallback path wrote % audit rows, expected 1', n;
  END IF;
END $$;

DO $$
BEGIN
  BEGIN
    EXECUTE 'SET ROLE authenticated';
    PERFORM 1 FROM public.downgrade_expired_paid_members();
    EXECUTE 'RESET ROLE';
    RAISE EXCEPTION 'authenticated was able to run the downgrade';
  EXCEPTION
    WHEN insufficient_privilege THEN
      EXECUTE 'RESET ROLE';
  END;
END $$;
