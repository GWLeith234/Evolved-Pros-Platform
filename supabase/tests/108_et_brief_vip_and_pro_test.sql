-- Local proof that migration 108 opens the EvPros Today brief to VIP and
-- The Evolved Pros 99. The runner has applied the fixture, migration 103,
-- then migration 108. Not production.

INSERT INTO public.users (id, email, role, tier, tier_status, tier_expires_at, comp_promo_code_id)
VALUES
  ('00000000-0000-0000-0000-0000000000c1', 'brief-pro@example.com', 'member', 'pro', 'active', NULL, NULL),
  ('00000000-0000-0000-0000-0000000000c2', 'brief-vip@example.com', 'member', 'vip', 'active', NULL, NULL),
  ('00000000-0000-0000-0000-0000000000c3', 'brief-community@example.com', 'member', 'community', 'active', NULL, NULL),
  ('00000000-0000-0000-0000-0000000000c4', 'brief-vip-ended@example.com', 'member', 'vip', 'active', now() - interval '1 day', NULL);

DO $$
DECLARE
  def text;
BEGIN
  def := pg_get_functiondef('public.et_viewer_is_pro()'::regprocedure);
  IF position('vip' IN def) = 0 OR position('pro' IN def) = 0 THEN
    RAISE EXCEPTION 'et_viewer_is_pro must name vip and pro, saw %', def;
  END IF;
  IF position('= ''pro''' IN def) > 0 AND position('IN (''vip'', ''pro'')' IN def) = 0 THEN
    RAISE EXCEPTION 'et_viewer_is_pro still uses the 103 pro-only predicate';
  END IF;
END $$;

DO $$
DECLARE
  rec record;
  payload jsonb;
  flag boolean;
BEGIN
  PERFORM set_config('request.jwt.claim.role', 'authenticated', false);

  FOR rec IN
    SELECT *
    FROM (VALUES
      ('00000000-0000-0000-0000-0000000000c1'::uuid, 'pro', true),
      ('00000000-0000-0000-0000-0000000000c2'::uuid, 'vip', true),
      ('00000000-0000-0000-0000-0000000000c3'::uuid, 'community', false),
      ('00000000-0000-0000-0000-0000000000c4'::uuid, 'community', false)
    ) AS expected(id, effective_tier, is_pro)
  LOOP
    PERFORM set_config('request.jwt.claim.sub', rec.id::text, false);
    PERFORM set_config(
      'request.jwt.claims',
      json_build_object('sub', rec.id::text, 'role', 'authenticated')::text,
      false
    );
    EXECUTE 'SET ROLE authenticated';
    payload := public.et_viewer_entitlement();
    flag := public.et_viewer_is_pro();
    EXECUTE 'RESET ROLE';

    IF payload ->> 'effective_tier' IS DISTINCT FROM rec.effective_tier
       OR (payload -> 'is_pro')::boolean IS DISTINCT FROM rec.is_pro
       OR flag IS DISTINCT FROM rec.is_pro THEN
      RAISE EXCEPTION 'brief gate for % was % flag %, expected % %',
        rec.id, payload, flag, rec.effective_tier, rec.is_pro;
    END IF;
  END LOOP;
END $$;
