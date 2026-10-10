-- 108_et_brief_vip_and_pro.sql
-- EvPros Today full brief opens to VIP and The Evolved Pros 99.
--
-- Migration 103 set public.et_viewer_entitlement().is_pro and
-- public.et_viewer_is_pro() to (effective tier = 'pro'). Migration 104's
-- insert and update policies call et_viewer_is_pro(), so replacing that
-- predicate opens the brief to VIP without renaming the function.
--
-- The json key stays is_pro. It now means the caller may read the full
-- brief: effective tier in ('vip', 'pro'). Community stays false.
-- The DB tier enum is unchanged (community | vip | pro).
--
-- Not applied to the hosted project by this change. Apply before deploy.
-- Do not run this file against production from an agent.

CREATE OR REPLACE FUNCTION public.et_viewer_entitlement()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'effective_tier', t,
    'is_pro', t IN ('vip', 'pro')
  )
  FROM (SELECT private.et_effective_tier() AS t) s;
$$;

COMMENT ON FUNCTION public.et_viewer_entitlement() IS
  'Caller only. jsonb keys effective_tier (community, vip, or pro) and is_pro (true for vip and pro: the EvPros Today full brief). No arguments.';

CREATE OR REPLACE FUNCTION public.et_viewer_is_pro()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT private.et_effective_tier() IN ('vip', 'pro');
$$;

COMMENT ON FUNCTION public.et_viewer_is_pro() IS
  'Caller only. True when the effective tier is vip or pro (EvPros Today full brief). The name is historical. No arguments.';

REVOKE ALL ON FUNCTION public.et_viewer_entitlement() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.et_viewer_is_pro() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.et_viewer_entitlement() TO authenticated;
GRANT EXECUTE ON FUNCTION public.et_viewer_is_pro() TO authenticated;
