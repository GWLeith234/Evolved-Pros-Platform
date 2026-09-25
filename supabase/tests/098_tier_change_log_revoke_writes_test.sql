-- pgTAP for migration 098. The runner loads the 096 fixture, applies 096 and
-- 097, grants the pre-fix anon/authenticated writes, applies 098 twice, then
-- runs this file. Local Postgres only.

CREATE EXTENSION IF NOT EXISTS pgtap;

BEGIN;

SELECT plan(23);

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

SELECT * FROM finish();

ROLLBACK;
