-- pgTAP for migration 096. The runner loads the vulnerable fixture, applies
-- the migration, then runs this file. Local Postgres only.

CREATE EXTENSION IF NOT EXISTS pgtap;

BEGIN;

SELECT plan(22);

DO $$
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  PERFORM set_config(
    'request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated","email":"member@example.com"}',
    true
  );
END $$;
SET LOCAL ROLE authenticated;

SELECT lives_ok(
  $$UPDATE public.users
      SET display_name = 'Ada Lovelace', bio = 'mathematician'
    WHERE id = '00000000-0000-0000-0000-000000000001'$$,
  'member can update display_name and bio'
);

SELECT is(
  (SELECT display_name FROM public.users WHERE id = '00000000-0000-0000-0000-000000000001'),
  'Ada Lovelace',
  'display_name persisted'
);

SELECT is(
  (SELECT bio FROM public.users WHERE id = '00000000-0000-0000-0000-000000000001'),
  'mathematician',
  'bio persisted'
);

SELECT is(
  (SELECT tier FROM public.users WHERE id = '00000000-0000-0000-0000-000000000001'),
  'community',
  'display update left tier alone'
);

SELECT throws_ok(
  $$UPDATE public.users SET tier = 'pro' WHERE id = '00000000-0000-0000-0000-000000000001'$$,
  '42501',
  'permission denied for table users',
  'member cannot set tier'
);

SELECT throws_ok(
  $$UPDATE public.users SET role = 'admin' WHERE id = '00000000-0000-0000-0000-000000000001'$$,
  '42501',
  'permission denied for table users',
  'member cannot set role'
);

SELECT throws_ok(
  $$UPDATE public.users SET tier_status = 'active' WHERE id = '00000000-0000-0000-0000-000000000001'$$,
  '42501',
  'permission denied for table users',
  'member cannot set tier_status'
);

SELECT throws_ok(
  $$UPDATE public.users SET stripe_customer_id = 'cus_self' WHERE id = '00000000-0000-0000-0000-000000000001'$$,
  '42501',
  'permission denied for table users',
  'member cannot set stripe_customer_id'
);

SELECT throws_ok(
  $$UPDATE public.users SET stripe_subscription_id = 'sub_self' WHERE id = '00000000-0000-0000-0000-000000000001'$$,
  '42501',
  'permission denied for table users',
  'member cannot set stripe_subscription_id'
);

SELECT throws_ok(
  $$UPDATE public.users SET keynote_access = true WHERE id = '00000000-0000-0000-0000-000000000001'$$,
  '42501',
  'permission denied for table users',
  'member cannot set keynote_access'
);

SELECT throws_ok(
  $$UPDATE public.users SET access_status = 'suspended' WHERE id = '00000000-0000-0000-0000-000000000001'$$,
  '42501',
  'permission denied for table users',
  'member cannot set access_status'
);

SELECT throws_ok(
  $$UPDATE public.users SET points = 9999 WHERE id = '00000000-0000-0000-0000-000000000001'$$,
  '42501',
  'permission denied for table users',
  'member cannot set points'
);

SELECT lives_ok(
  $$UPDATE public.users SET push_token = 'ExponentPushToken[test]' WHERE id = '00000000-0000-0000-0000-000000000001'$$,
  'member can update push_token'
);

SELECT is(
  (SELECT push_token FROM public.users WHERE id = '00000000-0000-0000-0000-000000000001'),
  'ExponentPushToken[test]',
  'push_token persisted'
);

SELECT lives_ok(
  $$UPDATE public.users SET display_name = 'hacked' WHERE id = '00000000-0000-0000-0000-000000000002'$$,
  'member update of another row is an RLS no-op, not an error'
);

RESET ROLE;

SELECT is(
  (SELECT display_name FROM public.users WHERE id = '00000000-0000-0000-0000-000000000002'),
  'Admin',
  'member did not change the admin display_name'
);

SET LOCAL ROLE service_role;

SELECT lives_ok(
  $$UPDATE public.users
      SET tier = 'pro',
          tier_status = 'active',
          role = 'guest',
          stripe_customer_id = 'cus_test',
          stripe_subscription_id = 'sub_test'
    WHERE id = '00000000-0000-0000-0000-000000000001'$$,
  'service_role can update tier, role, and stripe ids'
);

SELECT is(
  (SELECT tier || '/' || role || '/' || stripe_customer_id || '/' || stripe_subscription_id
     FROM public.users WHERE id = '00000000-0000-0000-0000-000000000001'),
  'pro/guest/cus_test/sub_test',
  'service_role write persisted'
);

RESET ROLE;

-- Backstop: a later GRANT UPDATE ON TABLE (migration 024) must not reopen
-- privileged columns for members, and must still allow an admin JWT.
GRANT UPDATE ON TABLE public.users TO authenticated;

DO $$
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  PERFORM set_config(
    'request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated","email":"member@example.com"}',
    true
  );
END $$;
SET LOCAL ROLE authenticated;

SELECT throws_ok(
  $$UPDATE public.users SET tier = 'vip' WHERE id = '00000000-0000-0000-0000-000000000001'$$,
  '42501',
  'cannot change privileged column users.tier',
  'table-level UPDATE re-grant still rejects a member tier change'
);

RESET ROLE;

SELECT is(
  (SELECT tier FROM public.users WHERE id = '00000000-0000-0000-0000-000000000001'),
  'pro',
  'rejected member tier write did not stick'
);

DO $$
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000002', true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  PERFORM set_config(
    'request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-000000000002","role":"authenticated","email":"admin@example.com"}',
    true
  );
END $$;
SET LOCAL ROLE authenticated;

SELECT lives_ok(
  $$UPDATE public.users SET tier = 'vip' WHERE id = '00000000-0000-0000-0000-000000000002'$$,
  'admin JWT can still change own tier after a table-level re-grant'
);

RESET ROLE;

SELECT is(
  (SELECT tier FROM public.users WHERE id = '00000000-0000-0000-0000-000000000002'),
  'vip',
  'admin tier write persisted'
);

SELECT * FROM finish();

ROLLBACK;
