-- pgTAP for migrations 096 and 097. The runner loads the vulnerable fixture,
-- applies both migrations, then runs this file. Local Postgres only.

CREATE EXTENSION IF NOT EXISTS pgtap;

BEGIN;

SELECT plan(45);

SELECT is(
  has_table_privilege('authenticated', 'public.users', 'INSERT'),
  false,
  'authenticated has no INSERT'
);
SELECT is(
  has_table_privilege('authenticated', 'public.users', 'DELETE'),
  false,
  'authenticated has no DELETE'
);
SELECT is(
  has_table_privilege('authenticated', 'public.users', 'TRUNCATE'),
  false,
  'authenticated has no TRUNCATE'
);
SELECT is(
  has_table_privilege('authenticated', 'public.users', 'TRIGGER'),
  false,
  'authenticated has no TRIGGER'
);
SELECT is(
  has_table_privilege('anon', 'public.users', 'TRUNCATE'),
  false,
  'anon has no TRUNCATE'
);
SELECT is(
  has_column_privilege('authenticated', 'public.users', 'role', 'UPDATE'),
  false,
  'no column UPDATE on role'
);
SELECT is(
  has_column_privilege('authenticated', 'public.users', 'tier', 'UPDATE'),
  false,
  'no column UPDATE on tier'
);
SELECT is(
  has_column_privilege('authenticated', 'public.users', 'tier_status', 'UPDATE'),
  false,
  'no column UPDATE on tier_status'
);
SELECT is(
  has_column_privilege('authenticated', 'public.users', 'tier_expires_at', 'UPDATE'),
  false,
  'no column UPDATE on tier_expires_at'
);
SELECT is(
  has_column_privilege('authenticated', 'public.users', 'access_status', 'UPDATE'),
  false,
  'no column UPDATE on access_status'
);
SELECT is(
  has_column_privilege('authenticated', 'public.users', 'comp_promo_code_id', 'UPDATE'),
  false,
  'no column UPDATE on comp_promo_code_id'
);
SELECT is(
  has_column_privilege('authenticated', 'public.users', 'stripe_customer_id', 'UPDATE'),
  false,
  'no column UPDATE on stripe_customer_id'
);
SELECT is(
  has_column_privilege('authenticated', 'public.users', 'stripe_subscription_id', 'UPDATE'),
  false,
  'no column UPDATE on stripe_subscription_id'
);

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

SELECT throws_ok(
  $$UPDATE public.users SET tier_expires_at = now() WHERE id = '00000000-0000-0000-0000-000000000001'$$,
  '42501',
  'permission denied for table users',
  'member cannot set tier_expires_at'
);

SELECT throws_ok(
  $$UPDATE public.users SET comp_promo_code_id = '00000000-0000-0000-0000-000000000099' WHERE id = '00000000-0000-0000-0000-000000000001'$$,
  '42501',
  'permission denied for table users',
  'member cannot set comp_promo_code_id'
);

SELECT throws_ok(
  $$INSERT INTO public.users (id, email, role, tier)
    VALUES ('00000000-0000-0000-0000-000000000003', 'evil@example.com', 'admin', 'pro')$$,
  '42501',
  'permission denied for table users',
  'member cannot INSERT a users row'
);

SELECT throws_ok(
  $$DELETE FROM public.users WHERE id = '00000000-0000-0000-0000-000000000001'$$,
  '42501',
  'permission denied for table users',
  'member cannot DELETE a users row'
);

SELECT throws_ok(
  $$TRUNCATE public.users$$,
  '42501',
  'permission denied for table users',
  'member cannot TRUNCATE users'
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

SELECT is(
  (SELECT count(*)::int FROM public.tier_change_log),
  0,
  'profile edits do not write tier_change_log'
);

DO $$
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000099', true);
  PERFORM set_config('request.jwt.claim.role', 'service_role', true);
  PERFORM set_config(
    'request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-000000000099","role":"service_role"}',
    true
  );
END $$;
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

SELECT is(
  (SELECT actor_role || '|' || COALESCE(actor_uid::text, '') || '|' || direction
        || '|' || old_role || '>' || new_role
        || '|' || old_tier || '>' || new_tier
        || '|' || COALESCE(old_tier_status, '') || '>' || COALESCE(new_tier_status, '')
     FROM public.tier_change_log
    WHERE user_id = '00000000-0000-0000-0000-000000000001'
    ORDER BY changed_at, id
    LIMIT 1),
  'service_role|00000000-0000-0000-0000-000000000099|tier,role|member>guest|community>pro|active>active',
  'tier and role change records current_user and auth.uid()'
);

SET LOCAL ROLE service_role;

SELECT lives_ok(
  $$UPDATE public.users SET tier_status = 'past_due' WHERE id = '00000000-0000-0000-0000-000000000001'$$,
  'service_role can update tier_status'
);

RESET ROLE;

SELECT is(
  (SELECT actor_role || '|' || COALESCE(actor_uid::text, '') || '|' || direction
        || '|' || old_tier_status || '>' || new_tier_status
     FROM public.tier_change_log
    WHERE user_id = '00000000-0000-0000-0000-000000000001'
      AND direction = 'tier_status'),
  'service_role|00000000-0000-0000-0000-000000000099|tier_status|active>past_due',
  'tier_status change records current_user and auth.uid()'
);

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

SELECT is(
  (SELECT actor_role || '|' || COALESCE(actor_uid::text, '') || '|' || direction
        || '|' || old_tier || '>' || new_tier
     FROM public.tier_change_log
    WHERE user_id = '00000000-0000-0000-0000-000000000002'
      AND direction = 'tier'),
  'authenticated|00000000-0000-0000-0000-000000000002|tier|pro>vip',
  'admin tier change records authenticated and auth.uid()'
);

SELECT * FROM finish();

ROLLBACK;
