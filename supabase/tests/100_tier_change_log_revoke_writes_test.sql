-- pgTAP for migration 100. The runner loads the 096 fixture, applies 096,
-- 097, and 099, grants the pre-fix anon/authenticated writes, applies 100
-- twice, then runs this file. Local Postgres only.

CREATE EXTENSION IF NOT EXISTS pgtap;

BEGIN;

SELECT plan(30);

SELECT is(
  has_table_privilege('anon', 'public.tier_change_log', 'INSERT'),
  false,
  'anon has no INSERT'
);
SELECT is(
  has_table_privilege('anon', 'public.tier_change_log', 'UPDATE'),
  false,
  'anon has no UPDATE'
);
SELECT is(
  has_table_privilege('anon', 'public.tier_change_log', 'DELETE'),
  false,
  'anon has no DELETE'
);
SELECT is(
  has_table_privilege('anon', 'public.tier_change_log', 'TRUNCATE'),
  false,
  'anon has no TRUNCATE'
);
SELECT is(
  has_table_privilege('anon', 'public.tier_change_log', 'TRIGGER'),
  false,
  'anon has no TRIGGER'
);

SELECT is(
  has_table_privilege('authenticated', 'public.tier_change_log', 'INSERT'),
  false,
  'authenticated has no INSERT'
);
SELECT is(
  has_table_privilege('authenticated', 'public.tier_change_log', 'UPDATE'),
  false,
  'authenticated has no UPDATE'
);
SELECT is(
  has_table_privilege('authenticated', 'public.tier_change_log', 'DELETE'),
  false,
  'authenticated has no DELETE'
);
SELECT is(
  has_table_privilege('authenticated', 'public.tier_change_log', 'TRUNCATE'),
  false,
  'authenticated has no TRUNCATE'
);
SELECT is(
  has_table_privilege('authenticated', 'public.tier_change_log', 'TRIGGER'),
  false,
  'authenticated has no TRIGGER'
);

SELECT is(
  has_table_privilege('anon', 'public.tier_change_log', 'SELECT'),
  true,
  'anon SELECT is unchanged'
);
SELECT is(
  has_table_privilege('authenticated', 'public.tier_change_log', 'SELECT'),
  true,
  'authenticated SELECT is unchanged'
);

SELECT is(
  has_table_privilege('service_role', 'public.tier_change_log', 'INSERT'),
  true,
  'service_role still has INSERT'
);
SELECT is(
  has_table_privilege('service_role', 'public.tier_change_log', 'UPDATE'),
  true,
  'service_role still has UPDATE'
);
SELECT is(
  has_table_privilege('service_role', 'public.tier_change_log', 'DELETE'),
  true,
  'service_role still has DELETE'
);
SELECT is(
  has_table_privilege('service_role', 'public.tier_change_log', 'TRUNCATE'),
  true,
  'service_role still has TRUNCATE'
);
SELECT is(
  has_table_privilege('service_role', 'public.tier_change_log', 'TRIGGER'),
  true,
  'service_role still has TRIGGER'
);

SET LOCAL ROLE anon;
SELECT throws_ok(
  $$TRUNCATE public.tier_change_log$$,
  '42501',
  'permission denied for table tier_change_log',
  'anon cannot TRUNCATE the audit log'
);
RESET ROLE;

SET LOCAL ROLE authenticated;
SELECT throws_ok(
  $$INSERT INTO public.tier_change_log (user_id, new_tier, direction)
    VALUES ('00000000-0000-0000-0000-000000000001', 'pro', 'forged')$$,
  '42501',
  'permission denied for table tier_change_log',
  'authenticated cannot INSERT into the audit log'
);
RESET ROLE;

SET LOCAL ROLE service_role;
SELECT lives_ok(
  $$INSERT INTO public.tier_change_log (user_id, old_tier, new_tier, direction)
    VALUES (
      '00000000-0000-0000-0000-000000000002',
      'pro',
      'pro',
      'service_role_direct'
    )$$,
  'service_role can still INSERT'
);
RESET ROLE;

SELECT is(
  (SELECT count(*)::int
     FROM public.tier_change_log
    WHERE direction = 'service_role_direct'),
  1,
  'service_role insert persisted'
);

SET LOCAL ROLE service_role;
SELECT lives_ok(
  $$UPDATE public.users
       SET tier = 'vip'
     WHERE id = '00000000-0000-0000-0000-000000000002'$$,
  'service_role tier change still runs after the revoke'
);
RESET ROLE;

SELECT is(
  (SELECT new_tier
     FROM public.tier_change_log
    WHERE user_id = '00000000-0000-0000-0000-000000000002'
      AND direction = 'tier'),
  'vip',
  'SECURITY DEFINER audit trigger still writes'
);

-- Isolate both 099 write paths from service_role's table grant. The function
-- and private.insert_tier_change_log are SECURITY DEFINER, so they insert as
-- the function owner after this revoke.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER ON public.tier_change_log FROM service_role;

INSERT INTO public.users (id, email, display_name, role, tier, tier_status, tier_expires_at)
VALUES (
  '00000000-0000-0000-0000-0000000000c1',
  'expire-trigger@example.com',
  'Trigger Path',
  'member',
  'vip',
  'active',
  now() - interval '1 day'
);

SET LOCAL ROLE service_role;
SELECT throws_ok(
  $$INSERT INTO public.tier_change_log (user_id, old_tier, new_tier, direction)
    VALUES (
      '00000000-0000-0000-0000-0000000000c1',
      'vip',
      'community',
      'forged'
    )$$,
  '42501',
  'permission denied for table tier_change_log',
  'service_role table INSERT is revoked for the definer proof'
);
SELECT lives_ok(
  $$SELECT * FROM public.downgrade_expired_paid_members()$$,
  '099 downgrade runs after 100 while the 097 trigger exists'
);
RESET ROLE;

SELECT is(
  (SELECT count(*)::int
     FROM public.tier_change_log
    WHERE user_id = '00000000-0000-0000-0000-0000000000c1'),
  1,
  '097 trigger writes one downgrade audit row'
);
SELECT is(
  (SELECT direction || '|' || new_tier || '|' || COALESCE(actor_role, '')
     FROM public.tier_change_log
    WHERE user_id = '00000000-0000-0000-0000-0000000000c1'),
  'tier,tier_status|community|postgres',
  'downgrade audit row came from the 097 trigger'
);

DROP TRIGGER users_audit_privilege_change ON public.users;

INSERT INTO public.users (id, email, display_name, role, tier, tier_status, tier_expires_at)
VALUES (
  '00000000-0000-0000-0000-0000000000c2',
  'expire-fallback@example.com',
  'Fallback Path',
  'member',
  'pro',
  'active',
  now() - interval '1 day'
);

SET LOCAL ROLE service_role;
SELECT lives_ok(
  $$SELECT * FROM public.downgrade_expired_paid_members()$$,
  '099 direct insert runs when the 097 trigger is absent'
);
RESET ROLE;

SELECT is(
  (SELECT count(*)::int
     FROM public.tier_change_log
    WHERE user_id = '00000000-0000-0000-0000-0000000000c2'),
  1,
  '099 writes one audit row when the 097 trigger is absent'
);
SELECT is(
  (SELECT old_tier || '|' || new_tier || '|' || direction || '|' || COALESCE(actor_role, '')
     FROM public.tier_change_log
    WHERE user_id = '00000000-0000-0000-0000-0000000000c2'),
  'pro|community|tier,tier_status|',
  '099 SECURITY DEFINER insert still writes after the revoke'
);

SELECT * FROM finish();

ROLLBACK;
