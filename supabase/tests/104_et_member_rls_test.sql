-- Cross-user RLS proof for categories, disclosure, audit, export, and delete.
-- The runner has applied migrations 103 and 104. Not production.
-- A and B are pro. C is community. D is an admin session. E lapses after writing.

INSERT INTO auth.users (id)
VALUES
  ('00000000-0000-0000-0000-00000000aa01'),
  ('00000000-0000-0000-0000-00000000bb01'),
  ('00000000-0000-0000-0000-00000000cc01'),
  ('00000000-0000-0000-0000-00000000dd01'),
  ('00000000-0000-0000-0000-00000000ee01'),
  ('00000000-0000-0000-0000-00000000ff01'),
  ('00000000-0000-0000-0000-00000000ab01'),
  ('00000000-0000-0000-0000-00000000ac01');

INSERT INTO public.users (id, email, role, tier, tier_status, tier_expires_at, comp_promo_code_id)
VALUES
  ('00000000-0000-0000-0000-00000000aa01', 'member-a@example.com', 'member', 'pro', 'active', NULL, NULL),
  ('00000000-0000-0000-0000-00000000bb01', 'member-b@example.com', 'member', 'pro', 'active', NULL, NULL),
  ('00000000-0000-0000-0000-00000000cc01', 'member-c@example.com', 'member', 'community', 'active', NULL, NULL),
  ('00000000-0000-0000-0000-00000000dd01', 'member-d@example.com', 'admin', 'pro', 'expired', now() - interval '30 days', NULL),
  ('00000000-0000-0000-0000-00000000ee01', 'member-e@example.com', 'member', 'pro', 'active', NULL, NULL),
  ('00000000-0000-0000-0000-00000000ff01', 'member-f@example.com', 'member', 'pro', 'comp', now() - interval '100 days', NULL),
  ('00000000-0000-0000-0000-00000000ab01', 'member-g@example.com', 'member', 'pro', 'active', NULL, NULL),
  ('00000000-0000-0000-0000-00000000ac01', 'member-h@example.com', 'member', 'pro', 'active', NULL, NULL);

DO $$
DECLARE
  n int;
  pol_qual text;
  pol_check text;
BEGIN
  IF to_regclass('public.et_member_watch_items') IS NOT NULL
     OR to_regclass('private.et_member_lifecycle') IS NOT NULL
     OR to_regclass('private.et_config') IS NOT NULL
     OR to_regprocedure('private.et_member_purge_lapsed()') IS NOT NULL
     OR to_regprocedure('public.et_watch_universe(text)') IS NOT NULL THEN
    RAISE EXCEPTION 'later-phase watch list objects are present';
  END IF;

  SELECT count(*) INTO n
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name IN ('et_member_prefs', 'et_member_audit')
    AND column_name ~* '(quantity|shares|cost|basis|value|amount|account|broker|price_paid)';
  IF n <> 0 THEN
    RAISE EXCEPTION 'quantity-like columns are present';
  END IF;

  IF NOT (
    SELECT c.relrowsecurity
    FROM pg_class c
    JOIN pg_namespace ns ON ns.oid = c.relnamespace
    WHERE ns.nspname = 'public' AND c.relname = 'et_member_prefs'
  ) THEN
    RAISE EXCEPTION 'prefs RLS is off';
  END IF;

  SELECT count(*) INTO n
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'et_member_prefs';
  IF n <> 4 THEN
    RAISE EXCEPTION 'prefs policy count was %', n;
  END IF;

  SELECT count(*) INTO n
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('et_member_prefs', 'et_member_audit')
    AND (
      policyname ILIKE '%admin%'
      OR coalesce(pg_policies.qual, '') ILIKE '%admin%'
      OR coalesce(pg_policies.with_check, '') ILIKE '%admin%'
      OR coalesce(pg_policies.qual, '') ILIKE '%viewer_user_ids%'
      OR coalesce(pg_policies.with_check, '') ILIKE '%viewer_user_ids%'
    );
  IF n <> 0 THEN
    RAISE EXCEPTION 'an admin or view-as policy is present';
  END IF;

  SELECT pg_policies.qual, pg_policies.with_check INTO pol_qual, pol_check
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'et_member_prefs'
    AND cmd = 'INSERT';
  IF pol_check NOT LIKE '%auth.uid()%' OR pol_check NOT LIKE '%et_viewer_is_pro%' THEN
    RAISE EXCEPTION 'insert check was %', pol_check;
  END IF;

  SELECT pg_policies.qual, pg_policies.with_check INTO pol_qual, pol_check
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'et_member_prefs'
    AND cmd = 'DELETE';
  IF pol_qual NOT LIKE '%auth.uid()%' OR coalesce(pol_qual, '') LIKE '%et_viewer_is_pro%' THEN
    RAISE EXCEPTION 'delete policy was %', pol_qual;
  END IF;

  IF has_table_privilege('anon', 'public.et_member_prefs', 'SELECT')
     OR has_table_privilege('anon', 'public.et_member_audit', 'SELECT')
     OR has_table_privilege('authenticated', 'public.et_member_audit', 'INSERT')
     OR has_table_privilege('authenticated', 'public.et_member_audit', 'UPDATE')
     OR has_table_privilege('authenticated', 'public.et_member_audit', 'DELETE')
     OR has_function_privilege('anon', 'public.et_member_export()', 'EXECUTE')
     OR has_function_privilege('authenticated', 'private.et_member_audit_append(text, integer)', 'EXECUTE')
     OR NOT has_function_privilege('authenticated', 'public.et_member_export()', 'EXECUTE')
     OR NOT has_function_privilege('authenticated', 'public.et_member_delete_all()', 'EXECUTE')
     OR NOT has_table_privilege('authenticated', 'public.et_member_audit', 'SELECT') THEN
    RAISE EXCEPTION 'grants do not match the member session';
  END IF;
END $$;

DO $$
BEGIN
  PERFORM set_config('request.jwt.claim.role', 'authenticated', false);
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000aa01', false);
  PERFORM set_config('request.jwt.claims', '', false);
  EXECUTE 'SET ROLE authenticated';
  INSERT INTO public.et_member_prefs (
    user_id, categories, category_order, onboarded_at,
    disclosure_version, disclosure_ack_at, created_at, updated_at
  ) VALUES (
    '00000000-0000-0000-0000-00000000aa01',
    ARRAY['ai', 'markets'],
    ARRAY['markets', 'ai'],
    '2026-09-26 15:00:00+00',
    'member-a-marker',
    '2026-09-26 15:01:00+00',
    '2020-01-01 00:00:00+00',
    '2020-01-01 00:00:00+00'
  );
  EXECUTE 'RESET ROLE';

  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000bb01', false);
  EXECUTE 'SET ROLE authenticated';
  INSERT INTO public.et_member_prefs (
    user_id, categories, category_order, disclosure_version, disclosure_ack_at
  ) VALUES (
    '00000000-0000-0000-0000-00000000bb01',
    ARRAY['ads'],
    ARRAY['ads'],
    'member-b-marker',
    '2026-09-26 16:00:00+00'
  );
  EXECUTE 'RESET ROLE';
END $$;

DO $$
DECLARE
  n int;
  got text;
BEGIN
  SELECT count(*) INTO n FROM public.et_member_audit
  WHERE user_id = '00000000-0000-0000-0000-00000000aa01' AND action = 'onboard';
  IF n <> 1 THEN
    RAISE EXCEPTION 'onboard audit count was %', n;
  END IF;

  SELECT item_count::text INTO got FROM public.et_member_audit
  WHERE user_id = '00000000-0000-0000-0000-00000000aa01' AND action = 'onboard';
  IF got IS DISTINCT FROM '2' THEN
    RAISE EXCEPTION 'onboard item_count was %', got;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.et_member_audit
    WHERE action = 'onboard'
      AND (
        coalesce(item_count::text, '') LIKE '%member-a-marker%'
        OR coalesce(action, '') LIKE '%ai%'
      )
  ) THEN
    RAISE EXCEPTION 'audit stored a category or acknowledgement token';
  END IF;
END $$;

-- B cannot read, write, or delete A's row.
DO $$
DECLARE
  n int;
  marker text;
BEGIN
  PERFORM set_config('request.jwt.claim.role', 'authenticated', false);
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000bb01', false);
  EXECUTE 'SET ROLE authenticated';

  IF current_user IS DISTINCT FROM 'authenticated' THEN
    RAISE EXCEPTION 'cross-user session was %', current_user;
  END IF;

  SELECT count(*) INTO n FROM public.et_member_prefs;
  IF n <> 1 THEN
    RAISE EXCEPTION 'B saw % prefs rows', n;
  END IF;

  SELECT count(*) INTO n
  FROM public.et_member_prefs
  WHERE user_id = '00000000-0000-0000-0000-00000000aa01'
     OR disclosure_version = 'member-a-marker';
  IF n <> 0 THEN
    RAISE EXCEPTION 'B selected A prefs';
  END IF;

  SELECT count(*) INTO n FROM public.et_member_audit WHERE action = 'onboard';
  IF n <> 1 THEN
    RAISE EXCEPTION 'B saw % onboard audit rows', n;
  END IF;

  UPDATE public.et_member_prefs
     SET categories = ARRAY['ads'], category_order = ARRAY['ads']
   WHERE user_id = '00000000-0000-0000-0000-00000000aa01';
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 0 THEN
    RAISE EXCEPTION 'B updated % of A rows', n;
  END IF;

  DELETE FROM public.et_member_prefs
   WHERE user_id = '00000000-0000-0000-0000-00000000aa01';
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 0 THEN
    RAISE EXCEPTION 'B deleted % of A rows', n;
  END IF;

  BEGIN
    INSERT INTO public.et_member_prefs (user_id, categories, category_order)
    VALUES (
      '00000000-0000-0000-0000-00000000aa01',
      ARRAY['ads'],
      ARRAY['ads']
    );
    RAISE EXCEPTION 'B inserted a row for A';
  EXCEPTION
    WHEN insufficient_privilege THEN
      NULL;
  END;

  EXECUTE 'RESET ROLE';

  SELECT disclosure_version INTO marker
  FROM public.et_member_prefs
  WHERE user_id = '00000000-0000-0000-0000-00000000aa01';
  IF marker IS DISTINCT FROM 'member-a-marker' THEN
    RAISE EXCEPTION 'A marker changed to %', marker;
  END IF;
END $$;

-- C is not pro, so C cannot insert. C also sees no other rows.
DO $$
DECLARE
  n int;
BEGIN
  PERFORM set_config('request.jwt.claim.role', 'authenticated', false);
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000cc01', false);
  EXECUTE 'SET ROLE authenticated';

  SELECT count(*) INTO n FROM public.et_member_prefs;
  IF n <> 0 THEN
    RAISE EXCEPTION 'C saw % prefs rows', n;
  END IF;

  BEGIN
    INSERT INTO public.et_member_prefs (user_id, categories, category_order)
    VALUES (
      '00000000-0000-0000-0000-00000000cc01',
      ARRAY['ai'],
      ARRAY['ai']
    );
    RAISE EXCEPTION 'community insert was allowed';
  EXCEPTION
    WHEN insufficient_privilege THEN
      NULL;
  END;

  BEGIN
    PERFORM public.et_member_export();
    RAISE EXCEPTION 'community export was allowed';
  EXCEPTION
    WHEN insufficient_privilege THEN
      IF SQLERRM IS DISTINCT FROM 'not_pro' THEN
        RAISE EXCEPTION 'community export error was %', SQLERRM;
      END IF;
  END;

  EXECUTE 'RESET ROLE';
END $$;

DO $$
BEGIN
  BEGIN
    EXECUTE 'SET ROLE anon';
    PERFORM 1 FROM public.et_member_prefs;
    EXECUTE 'RESET ROLE';
    RAISE EXCEPTION 'anon selected prefs';
  EXCEPTION
    WHEN insufficient_privilege THEN
      EXECUTE 'RESET ROLE';
  END;
END $$;

-- Bad keys, duplicates, and a half acknowledgement are rejected.
DO $$
BEGIN
  PERFORM set_config('request.jwt.claim.role', 'authenticated', false);
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000aa01', false);
  EXECUTE 'SET ROLE authenticated';

  BEGIN
    UPDATE public.et_member_prefs
       SET categories = ARRAY['marketing'], category_order = ARRAY['marketing']
     WHERE user_id = auth.uid();
    RAISE EXCEPTION 'hidden category key was stored';
  EXCEPTION
    WHEN check_violation THEN
      NULL;
  END;

  BEGIN
    UPDATE public.et_member_prefs
       SET categories = ARRAY['ai', 'ai'], category_order = ARRAY['ai', 'ai']
     WHERE user_id = auth.uid();
    RAISE EXCEPTION 'duplicate category was stored';
  EXCEPTION
    WHEN check_violation THEN
      NULL;
  END;

  BEGIN
    UPDATE public.et_member_prefs
       SET disclosure_version = 'member-a-marker', disclosure_ack_at = NULL
     WHERE user_id = auth.uid();
    RAISE EXCEPTION 'acknowledgement time was cleared alone';
  EXCEPTION
    WHEN check_violation THEN
      NULL;
  END;

  BEGIN
    UPDATE public.et_member_prefs
       SET user_id = '00000000-0000-0000-0000-00000000bb01'
     WHERE user_id = auth.uid();
    RAISE EXCEPTION 'user_id change was allowed';
  EXCEPTION
    WHEN insufficient_privilege THEN
      IF SQLERRM IS DISTINCT FROM 'user_id is immutable' THEN
        RAISE EXCEPTION 'user_id change error was %', SQLERRM;
      END IF;
  END;

  UPDATE public.et_member_prefs
     SET categories = ARRAY['ai', 'markets', 'tech'],
         category_order = ARRAY['tech', 'ai', 'markets']
   WHERE user_id = auth.uid();

  EXECUTE 'RESET ROLE';
END $$;

DO $$
DECLARE
  created_at timestamptz;
  updated_at timestamptz;
  n int;
BEGIN
  SELECT p.created_at, p.updated_at
    INTO created_at, updated_at
  FROM public.et_member_prefs p
  WHERE p.user_id = '00000000-0000-0000-0000-00000000aa01';

  IF created_at IS DISTINCT FROM '2020-01-01 00:00:00+00' OR updated_at <= created_at THEN
    RAISE EXCEPTION 'timestamps were created % updated %', created_at, updated_at;
  END IF;

  SELECT count(*) INTO n FROM public.et_member_audit
  WHERE user_id = '00000000-0000-0000-0000-00000000aa01' AND action = 'prefs_update';
  IF n <> 1 THEN
    RAISE EXCEPTION 'prefs_update count was %', n;
  END IF;
END $$;

-- Export is the caller only. A's payload has no B marker. Audit has no marker.
DO $$
DECLARE
  payload jsonb;
  actions text[];
BEGIN
  PERFORM set_config('request.jwt.claim.role', 'authenticated', false);
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000aa01', false);
  EXECUTE 'SET ROLE authenticated';
  payload := public.et_member_export();
  EXECUTE 'RESET ROLE';

  IF payload -> 'prefs' ->> 'user_id' IS DISTINCT FROM '00000000-0000-0000-0000-00000000aa01'
     OR payload -> 'prefs' ->> 'disclosure_version' IS DISTINCT FROM 'member-a-marker'
     OR payload::text LIKE '%member-b-marker%'
     OR (payload -> 'audit')::text LIKE '%member-a-marker%'
     OR (payload -> 'audit')::text LIKE '%markets%' THEN
    RAISE EXCEPTION 'A export leaked or dropped data: %', payload;
  END IF;

  SELECT coalesce(array_agg(e ->> 'action' ORDER BY e ->> 'id'), ARRAY[]::text[])
    INTO actions
  FROM jsonb_array_elements(payload -> 'audit') AS e;

  IF NOT ('onboard' = ANY (actions) AND 'prefs_update' = ANY (actions) AND 'export' = ANY (actions)) THEN
    RAISE EXCEPTION 'A export actions were %', actions;
  END IF;

  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000bb01', false);
  EXECUTE 'SET ROLE authenticated';
  payload := public.et_member_export();
  EXECUTE 'RESET ROLE';

  IF payload::text LIKE '%member-a-marker%'
     OR payload -> 'prefs' ->> 'disclosure_version' IS DISTINCT FROM 'member-b-marker'
     OR payload -> 'prefs' ->> 'user_id' IS DISTINCT FROM '00000000-0000-0000-0000-00000000bb01' THEN
    RAISE EXCEPTION 'B export was %', payload;
  END IF;
END $$;

-- Pro with no prefs row can still export. prefs is null. The audit count is 0.
DO $$
DECLARE
  payload jsonb;
BEGIN
  PERFORM set_config('request.jwt.claim.role', 'authenticated', false);
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000ac01', false);
  EXECUTE 'SET ROLE authenticated';
  payload := public.et_member_export();
  EXECUTE 'RESET ROLE';

  IF payload -> 'prefs' IS DISTINCT FROM 'null'::jsonb
     OR jsonb_array_length(payload -> 'audit') IS DISTINCT FROM 1
     OR payload -> 'audit' -> 0 ->> 'action' IS DISTINCT FROM 'export'
     OR payload -> 'audit' -> 0 ->> 'item_count' IS DISTINCT FROM '0' THEN
    RAISE EXCEPTION 'empty export was %', payload;
  END IF;
END $$;

-- Comp whose period date is in the past can still write.
DO $$
BEGIN
  PERFORM set_config('request.jwt.claim.role', 'authenticated', false);
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000ff01', false);
  EXECUTE 'SET ROLE authenticated';
  INSERT INTO public.et_member_prefs (user_id, categories, category_order)
  VALUES (
    '00000000-0000-0000-0000-00000000ff01',
    ARRAY['crypto', 'saas'],
    ARRAY['saas', 'crypto']
  );
  EXECUTE 'RESET ROLE';
END $$;

-- Admin keeps pro, can read another member on public.users, and sees 0 other prefs.
CREATE OR REPLACE FUNCTION private.test_viewer_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND lower(u.role) = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION private.test_viewer_is_admin() TO authenticated;

CREATE POLICY users_select_admin ON public.users
  FOR SELECT
  TO authenticated
  USING (private.test_viewer_is_admin());

DO $$
DECLARE
  n int;
  payload jsonb;
  seen uuid;
BEGIN
  PERFORM set_config('request.jwt.claim.role', 'authenticated', false);
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000dd01', false);
  EXECUTE 'SET ROLE authenticated';

  IF current_user IS DISTINCT FROM 'authenticated' THEN
    RAISE EXCEPTION 'admin session role was %', current_user;
  END IF;

  payload := public.et_viewer_entitlement();
  IF payload ->> 'effective_tier' IS DISTINCT FROM 'pro' OR NOT (payload -> 'is_pro')::boolean THEN
    RAISE EXCEPTION 'admin entitlement was %', payload;
  END IF;

  SELECT count(*) INTO n
  FROM public.users
  WHERE id = '00000000-0000-0000-0000-00000000aa01';
  IF n <> 1 THEN
    RAISE EXCEPTION 'admin could not read another member profile';
  END IF;

  INSERT INTO public.et_member_prefs (user_id, categories, category_order)
  VALUES (
    '00000000-0000-0000-0000-00000000dd01',
    ARRAY['ai'],
    ARRAY['ai']
  );

  SELECT count(*) INTO n FROM public.et_member_prefs;
  IF n <> 1 THEN
    RAISE EXCEPTION 'admin saw % prefs rows', n;
  END IF;

  SELECT user_id INTO seen FROM public.et_member_prefs;
  IF seen IS DISTINCT FROM '00000000-0000-0000-0000-00000000dd01' THEN
    RAISE EXCEPTION 'admin prefs row was %', seen;
  END IF;

  SELECT count(*) INTO n
  FROM public.et_member_prefs
  WHERE disclosure_version IN ('member-a-marker', 'member-b-marker')
     OR user_id <> auth.uid();
  IF n <> 0 THEN
    RAISE EXCEPTION 'admin saw another member prefs';
  END IF;

  payload := public.et_member_export();
  IF payload::text LIKE '%member-a-marker%'
     OR payload::text LIKE '%member-b-marker%'
     OR payload -> 'prefs' ->> 'user_id' IS DISTINCT FROM '00000000-0000-0000-0000-00000000dd01' THEN
    RAISE EXCEPTION 'admin export leaked another member: %', payload;
  END IF;

  BEGIN
    INSERT INTO public.et_member_prefs (user_id, categories, category_order)
    VALUES (
      '00000000-0000-0000-0000-00000000aa01',
      ARRAY['ai'],
      ARRAY['ai']
    );
    RAISE EXCEPTION 'admin inserted another member prefs';
  EXCEPTION
    WHEN insufficient_privilege THEN
      NULL;
  END;

  EXECUTE 'RESET ROLE';
END $$;

-- service_role is the bypass path. The admin session above is not that role.
DO $$
DECLARE
  n int;
BEGIN
  EXECUTE 'SET ROLE service_role';
  SELECT count(*) INTO n
  FROM public.et_member_prefs
  WHERE user_id IN (
    '00000000-0000-0000-0000-00000000aa01',
    '00000000-0000-0000-0000-00000000bb01'
  );
  EXECUTE 'RESET ROLE';
  IF n <> 2 THEN
    RAISE EXCEPTION 'service_role saw % of the two member rows', n;
  END IF;
END $$;

-- A lapsed member keeps the row for select and delete, and cannot update or export.
DO $$
DECLARE
  n int;
  deleted jsonb;
BEGIN
  PERFORM set_config('request.jwt.claim.role', 'authenticated', false);
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000ee01', false);
  EXECUTE 'SET ROLE authenticated';
  INSERT INTO public.et_member_prefs (
    user_id, categories, category_order, disclosure_version, disclosure_ack_at
  ) VALUES (
    '00000000-0000-0000-0000-00000000ee01',
    ARRAY['saas'],
    ARRAY['saas'],
    'member-e-marker',
    '2026-09-26 17:00:00+00'
  );
  EXECUTE 'RESET ROLE';

  UPDATE public.users
     SET tier_status = 'expired',
         tier_expires_at = now() - interval '1 day'
   WHERE id = '00000000-0000-0000-0000-00000000ee01';

  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000ee01', false);
  EXECUTE 'SET ROLE authenticated';

  SELECT count(*) INTO n
  FROM public.et_member_prefs
  WHERE disclosure_version = 'member-e-marker';
  IF n <> 1 THEN
    RAISE EXCEPTION 'lapsed member could not read their row';
  END IF;

  BEGIN
    UPDATE public.et_member_prefs
       SET categories = ARRAY['ads'], category_order = ARRAY['ads']
     WHERE user_id = auth.uid();
    RAISE EXCEPTION 'lapsed member updated prefs';
  EXCEPTION
    WHEN insufficient_privilege THEN
      NULL;
  END;

  BEGIN
    PERFORM public.et_member_export();
    RAISE EXCEPTION 'lapsed member exported';
  EXCEPTION
    WHEN insufficient_privilege THEN
      IF SQLERRM IS DISTINCT FROM 'not_pro' THEN
        RAISE EXCEPTION 'lapsed export error was %', SQLERRM;
      END IF;
  END;

  deleted := public.et_member_delete_all();
  EXECUTE 'RESET ROLE';

  IF deleted ->> 'deleted_prefs' IS DISTINCT FROM '1' THEN
    RAISE EXCEPTION 'lapsed delete returned %', deleted;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.et_member_prefs
    WHERE user_id = '00000000-0000-0000-0000-00000000ee01'
  ) THEN
    RAISE EXCEPTION 'lapsed prefs row remained';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.et_member_audit
    WHERE user_id = '00000000-0000-0000-0000-00000000ee01'
      AND action = 'delete_all'
      AND item_count = 1
  ) THEN
    RAISE EXCEPTION 'delete_all audit row missing';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.et_member_prefs
    WHERE user_id = '00000000-0000-0000-0000-00000000bb01'
  ) IS NOT TRUE THEN
    RAISE EXCEPTION 'delete_all removed another member';
  END IF;
END $$;

-- Account deletion cascades prefs and audit. The delete RPC does not do that.
DO $$
DECLARE
  n int;
BEGIN
  PERFORM set_config('request.jwt.claim.role', 'authenticated', false);
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000ab01', false);
  EXECUTE 'SET ROLE authenticated';
  INSERT INTO public.et_member_prefs (user_id, categories, category_order)
  VALUES (
    '00000000-0000-0000-0000-00000000ab01',
    ARRAY['tech'],
    ARRAY['tech']
  );
  EXECUTE 'RESET ROLE';

  DELETE FROM auth.users WHERE id = '00000000-0000-0000-0000-00000000ab01';

  SELECT count(*) INTO n FROM public.et_member_prefs
  WHERE user_id = '00000000-0000-0000-0000-00000000ab01';
  IF n <> 0 THEN
    RAISE EXCEPTION 'prefs survived account delete';
  END IF;

  SELECT count(*) INTO n FROM public.et_member_audit
  WHERE user_id = '00000000-0000-0000-0000-00000000ab01';
  IF n <> 0 THEN
    RAISE EXCEPTION 'audit survived account delete';
  END IF;
END $$;

DO $$
BEGIN
  BEGIN
    PERFORM private.et_member_prefs_audit();
    RAISE EXCEPTION 'trigger function was callable directly';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM NOT LIKE '%trigger%' THEN
        RAISE EXCEPTION 'direct trigger call error was %', SQLERRM;
      END IF;
  END;
END $$;
