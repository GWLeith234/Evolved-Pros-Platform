-- Local proof for public.et_viewer_entitlement and public.et_viewer_is_pro.
-- The runner has applied the fixture and migration 103. Not production.

INSERT INTO public.users (id, email, role, tier, tier_status, tier_expires_at, comp_promo_code_id)
VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'pro-active@example.com', 'member', 'pro', 'active', NULL, NULL),
  ('00000000-0000-0000-0000-0000000000a2', 'vip-active@example.com', 'member', 'vip', 'active', NULL, NULL),
  ('00000000-0000-0000-0000-0000000000a3', 'community@example.com', 'member', 'community', 'active', NULL, NULL),
  ('00000000-0000-0000-0000-0000000000a4', 'pro-cancel-open@example.com', 'member', 'pro', 'cancelled', now() + interval '30 days', NULL),
  ('00000000-0000-0000-0000-0000000000a5', 'pro-cancel-closed@example.com', 'member', 'pro', 'cancelled', now() - interval '2 days', NULL),
  ('00000000-0000-0000-0000-0000000000a6', 'pro-period-ended@example.com', 'member', 'pro', 'active', now() - interval '1 day', NULL),
  ('00000000-0000-0000-0000-0000000000a7', 'pro-past-due@example.com', 'member', 'pro', 'past_due', now() - interval '3 days', NULL),
  ('00000000-0000-0000-0000-0000000000a8', 'pro-comp-status@example.com', 'member', 'pro', 'comp', now() - interval '100 days', NULL),
  ('00000000-0000-0000-0000-0000000000a9', 'vip-comp-flag@example.com', 'member', 'vip', 'active', now() - interval '100 days', '00000000-0000-0000-0000-000000000099'),
  ('00000000-0000-0000-0000-0000000000aa', 'admin-pro@example.com', 'admin', 'pro', 'expired', now() - interval '10 days', NULL),
  ('00000000-0000-0000-0000-0000000000ab', 'admin-community@example.com', 'admin', 'community', 'active', now() - interval '10 days', NULL),
  ('00000000-0000-0000-0000-0000000000ac', 'pro-trial-ended@example.com', 'member', 'pro', 'trial', now() - interval '1 day', NULL),
  ('00000000-0000-0000-0000-0000000000ad', 'pro-expired-status@example.com', 'member', 'pro', 'expired', now() + interval '30 days', NULL),
  ('00000000-0000-0000-0000-0000000000ae', 'vip-cancel-open@example.com', 'member', 'vip', 'cancelled', now() + interval '10 days', NULL),
  ('00000000-0000-0000-0000-0000000000af', 'pro-future@example.com', 'member', 'pro', 'active', now() + interval '10 days', NULL),
  ('00000000-0000-0000-0000-0000000000b0', 'pro-comp-expired-status@example.com', 'member', 'pro', 'expired', now() - interval '20 days', '00000000-0000-0000-0000-000000000098'),
  ('00000000-0000-0000-0000-0000000000b1', 'pro-cancel-nodate@example.com', 'member', 'pro', 'cancelled', NULL, NULL),
  ('00000000-0000-0000-0000-0000000000b2', 'vip-period-ended@example.com', 'member', 'vip', 'active', now() - interval '1 day', NULL);

INSERT INTO auth.users (id)
VALUES ('00000000-0000-0000-0000-0000000000b3');

CREATE TEMP TABLE et_expected (
  id uuid PRIMARY KEY,
  effective_tier text NOT NULL,
  is_pro boolean NOT NULL
);

INSERT INTO et_expected (id, effective_tier, is_pro)
VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'pro', true),
  ('00000000-0000-0000-0000-0000000000a2', 'vip', false),
  ('00000000-0000-0000-0000-0000000000a3', 'community', false),
  ('00000000-0000-0000-0000-0000000000a4', 'pro', true),
  ('00000000-0000-0000-0000-0000000000a5', 'community', false),
  ('00000000-0000-0000-0000-0000000000a6', 'community', false),
  ('00000000-0000-0000-0000-0000000000a7', 'pro', true),
  ('00000000-0000-0000-0000-0000000000a8', 'pro', true),
  ('00000000-0000-0000-0000-0000000000a9', 'vip', false),
  ('00000000-0000-0000-0000-0000000000aa', 'pro', true),
  ('00000000-0000-0000-0000-0000000000ab', 'community', false),
  ('00000000-0000-0000-0000-0000000000ac', 'community', false),
  ('00000000-0000-0000-0000-0000000000ad', 'community', false),
  ('00000000-0000-0000-0000-0000000000ae', 'vip', false),
  ('00000000-0000-0000-0000-0000000000af', 'pro', true),
  ('00000000-0000-0000-0000-0000000000b0', 'pro', true),
  ('00000000-0000-0000-0000-0000000000b1', 'community', false),
  ('00000000-0000-0000-0000-0000000000b2', 'community', false),
  ('00000000-0000-0000-0000-0000000000b3', 'community', false);

DO $$
DECLARE
  rec record;
  payload jsonb;
  flag boolean;
  keys text[];
BEGIN
  IF (
    SELECT count(*)
    FROM pg_proc
    WHERE proname = 'et_viewer_entitlement'
      AND pg_get_function_identity_arguments(oid) <> ''
  ) <> 0 OR (
    SELECT count(*)
    FROM pg_proc
    WHERE proname = 'et_viewer_is_pro'
      AND pg_get_function_identity_arguments(oid) <> ''
  ) <> 0 THEN
    RAISE EXCEPTION 'entitlement functions must take no arguments';
  END IF;

  IF position('viewer_user_ids' IN pg_get_functiondef('private.et_effective_tier()'::regprocedure)) > 0
     OR position('auth.jwt' IN pg_get_functiondef('private.et_effective_tier()'::regprocedure)) > 0
     OR position('auth.uid' IN pg_get_functiondef('private.et_effective_tier()'::regprocedure)) = 0 THEN
    RAISE EXCEPTION 'effective tier must use auth.uid() and not the view-as helper';
  END IF;

  IF has_function_privilege('anon', 'public.et_viewer_entitlement()', 'EXECUTE')
     OR has_function_privilege('anon', 'public.et_viewer_is_pro()', 'EXECUTE')
     OR has_function_privilege('authenticated', 'private.et_effective_tier()', 'EXECUTE') THEN
    RAISE EXCEPTION 'execute grants are wider than the member session';
  END IF;

  IF NOT has_function_privilege('authenticated', 'public.et_viewer_entitlement()', 'EXECUTE')
     OR NOT has_function_privilege('authenticated', 'public.et_viewer_is_pro()', 'EXECUTE') THEN
    RAISE EXCEPTION 'authenticated cannot call the pro gate';
  END IF;

  PERFORM set_config('request.jwt.claim.role', 'authenticated', false);

  FOR rec IN SELECT id, effective_tier, is_pro FROM et_expected ORDER BY id LOOP
    PERFORM set_config('request.jwt.claim.sub', rec.id::text, false);
    PERFORM set_config(
      'request.jwt.claims',
      json_build_object('sub', rec.id::text, 'role', 'authenticated', 'email', 'pro-active@example.com')::text,
      false
    );

    EXECUTE 'SET ROLE authenticated';
    payload := public.et_viewer_entitlement();
    flag := public.et_viewer_is_pro();
    EXECUTE 'RESET ROLE';

    SELECT coalesce(array_agg(k ORDER BY k), ARRAY[]::text[])
      INTO keys
    FROM jsonb_object_keys(payload) AS k;

    IF keys <> ARRAY['effective_tier', 'is_pro']::text[] THEN
      RAISE EXCEPTION 'entitlement keys for % were %', rec.id, keys;
    END IF;

    IF jsonb_typeof(payload -> 'effective_tier') IS DISTINCT FROM 'string'
       OR jsonb_typeof(payload -> 'is_pro') IS DISTINCT FROM 'boolean' THEN
      RAISE EXCEPTION 'entitlement types for % were %', rec.id, payload;
    END IF;

    IF payload ->> 'effective_tier' IS DISTINCT FROM rec.effective_tier
       OR (payload -> 'is_pro')::boolean IS DISTINCT FROM rec.is_pro
       OR flag IS DISTINCT FROM rec.is_pro
       OR ((payload -> 'is_pro')::boolean IS DISTINCT FROM (payload ->> 'effective_tier' = 'pro')) THEN
      RAISE EXCEPTION 'entitlement for % was % is_pro %, expected % %',
        rec.id, payload, flag, rec.effective_tier, rec.is_pro;
    END IF;
  END LOOP;
END $$;

-- Community member, seeded after a pro row, must not inherit that pro row.
DO $$
DECLARE
  payload jsonb;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a3', false);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', false);
  EXECUTE 'SET ROLE authenticated';
  payload := public.et_viewer_entitlement();
  EXECUTE 'RESET ROLE';

  IF payload ->> 'effective_tier' IS DISTINCT FROM 'community' OR (payload -> 'is_pro')::boolean THEN
    RAISE EXCEPTION 'community caller saw %', payload;
  END IF;

  EXECUTE 'SET ROLE authenticated';
  IF (
    SELECT count(*)
    FROM public.users
    WHERE id = '00000000-0000-0000-0000-0000000000a1'
  ) <> 0 THEN
    EXECUTE 'RESET ROLE';
    RAISE EXCEPTION 'member select policy leaked another users row';
  END IF;
  EXECUTE 'RESET ROLE';
END $$;

-- Email claim of a pro member must not change a community caller's tier.
DO $$
DECLARE
  payload jsonb;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a3', false);
  PERFORM set_config(
    'request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-0000000000a3","email":"pro-active@example.com","role":"authenticated"}',
    false
  );
  EXECUTE 'SET ROLE authenticated';
  payload := public.et_viewer_entitlement();
  EXECUTE 'RESET ROLE';
  IF (payload -> 'is_pro')::boolean THEN
    RAISE EXCEPTION 'email claim switched the caller to pro: %', payload;
  END IF;
END $$;

DO $$
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '', false);
  PERFORM set_config('request.jwt.claims', '', false);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', false);
  BEGIN
    EXECUTE 'SET ROLE authenticated';
    PERFORM public.et_viewer_entitlement();
    EXECUTE 'RESET ROLE';
    RAISE EXCEPTION 'null session returned a tier';
  EXCEPTION
    WHEN insufficient_privilege THEN
      EXECUTE 'RESET ROLE';
      IF SQLERRM IS DISTINCT FROM 'not_authenticated' THEN
        RAISE EXCEPTION 'null session error was %', SQLERRM;
      END IF;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    EXECUTE 'SET ROLE anon';
    PERFORM public.et_viewer_entitlement();
    EXECUTE 'RESET ROLE';
    RAISE EXCEPTION 'anon called et_viewer_entitlement';
  EXCEPTION
    WHEN insufficient_privilege THEN
      EXECUTE 'RESET ROLE';
  END;
END $$;

-- Internal key professional is pro, and a closed period still drops it.
DO $$
DECLARE
  payload jsonb;
BEGIN
  ALTER TABLE public.users DROP CONSTRAINT users_tier_check;

  INSERT INTO public.users (id, email, role, tier, tier_status, tier_expires_at)
  VALUES
    ('00000000-0000-0000-0000-0000000000c1', 'key-open@example.com', 'member', 'professional', 'active', NULL),
    ('00000000-0000-0000-0000-0000000000c2', 'key-closed@example.com', 'member', 'professional', 'active', now() - interval '1 day');

  PERFORM set_config('request.jwt.claim.role', 'authenticated', false);

  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000c1', false);
  EXECUTE 'SET ROLE authenticated';
  payload := public.et_viewer_entitlement();
  EXECUTE 'RESET ROLE';
  IF payload ->> 'effective_tier' IS DISTINCT FROM 'pro' OR NOT (payload -> 'is_pro')::boolean THEN
    RAISE EXCEPTION 'open internal key returned %', payload;
  END IF;

  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000c2', false);
  EXECUTE 'SET ROLE authenticated';
  payload := public.et_viewer_entitlement();
  EXECUTE 'RESET ROLE';
  IF payload ->> 'effective_tier' IS DISTINCT FROM 'community' OR (payload -> 'is_pro')::boolean THEN
    RAISE EXCEPTION 'closed internal key returned %', payload;
  END IF;

  DELETE FROM public.users
  WHERE id IN (
    '00000000-0000-0000-0000-0000000000c1',
    '00000000-0000-0000-0000-0000000000c2'
  );

  ALTER TABLE public.users
    ADD CONSTRAINT users_tier_check CHECK (tier IN ('community', 'vip', 'pro'));
EXCEPTION
  WHEN OTHERS THEN
    EXECUTE 'RESET ROLE';
    ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_tier_check;
    ALTER TABLE public.users
      ADD CONSTRAINT users_tier_check CHECK (tier IN ('community', 'vip', 'pro'));
    RAISE;
END $$;

-- canceled and unpaid are not stored today. The gate still folds them.
DO $$
DECLARE
  payload jsonb;
BEGIN
  ALTER TABLE public.users DROP CONSTRAINT users_tier_status_check;

  INSERT INTO public.users (id, email, role, tier, tier_status, tier_expires_at)
  VALUES
    ('00000000-0000-0000-0000-0000000000c3', 'canceled-open@example.com', 'member', 'pro', 'canceled', now() + interval '5 days'),
    ('00000000-0000-0000-0000-0000000000c4', 'canceled-closed@example.com', 'member', 'pro', 'canceled', now() - interval '5 days'),
    ('00000000-0000-0000-0000-0000000000c5', 'unpaid@example.com', 'member', 'pro', 'unpaid', now() + interval '5 days');

  PERFORM set_config('request.jwt.claim.role', 'authenticated', false);

  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000c3', false);
  EXECUTE 'SET ROLE authenticated';
  payload := public.et_viewer_entitlement();
  EXECUTE 'RESET ROLE';
  IF payload ->> 'effective_tier' IS DISTINCT FROM 'pro' THEN
    RAISE EXCEPTION 'open canceled returned %', payload;
  END IF;

  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000c4', false);
  EXECUTE 'SET ROLE authenticated';
  payload := public.et_viewer_entitlement();
  EXECUTE 'RESET ROLE';
  IF payload ->> 'effective_tier' IS DISTINCT FROM 'community' THEN
    RAISE EXCEPTION 'closed canceled returned %', payload;
  END IF;

  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000c5', false);
  EXECUTE 'SET ROLE authenticated';
  payload := public.et_viewer_entitlement();
  EXECUTE 'RESET ROLE';
  IF payload ->> 'effective_tier' IS DISTINCT FROM 'community' THEN
    RAISE EXCEPTION 'unpaid returned %', payload;
  END IF;

  DELETE FROM public.users
  WHERE id IN (
    '00000000-0000-0000-0000-0000000000c3',
    '00000000-0000-0000-0000-0000000000c4',
    '00000000-0000-0000-0000-0000000000c5'
  );

  ALTER TABLE public.users
    ADD CONSTRAINT users_tier_status_check CHECK (
      tier_status IS NULL
      OR tier_status IN ('active', 'trial', 'cancelled', 'expired', 'comp', 'past_due')
    );
EXCEPTION
  WHEN OTHERS THEN
    EXECUTE 'RESET ROLE';
    DELETE FROM public.users
    WHERE id IN (
      '00000000-0000-0000-0000-0000000000c3',
      '00000000-0000-0000-0000-0000000000c4',
      '00000000-0000-0000-0000-0000000000c5'
    );
    ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_tier_status_check;
    ALTER TABLE public.users
      ADD CONSTRAINT users_tier_status_check CHECK (
        tier_status IS NULL
        OR tier_status IN ('active', 'trial', 'cancelled', 'expired', 'comp', 'past_due')
      );
    RAISE;
END $$;
