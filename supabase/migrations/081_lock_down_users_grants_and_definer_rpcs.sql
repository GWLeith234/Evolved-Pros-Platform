-- Close the remaining public.users GRANT surface for anon, and stop
-- SECURITY DEFINER RPCs that mutate data from being callable with the
-- browser-shipped key.
--
-- Context (S1): users_select_for_joins (SELECT USING true to {public}) is
-- already gone in production. Anon still held table-level GRANT SELECT/
-- INSERT/UPDATE/DELETE on public.users. RLS blocked those writes, but a
-- later policy mistake would have reopened the table.
--
-- increment_points(user_id, amount) and increment_discussion_like(post_id)
-- have no auth.uid() check — any role that can EXECUTE can add points to
-- anyone or inflate likes. They now execute as service_role only; app
-- routes call them through adminClient after their own auth gate.
--
-- increment_poll_vote uses auth.uid() internally, so authenticated keeps
-- EXECUTE. Anon is revoked.
--
-- Trigger functions (bump_promo_redemption_count, log_tier_change,
-- sync_*) are left granted to authenticated so row triggers keep firing.
-- Do not revoke those here.

-- ── public.users grants ────────────────────────────────────────────────────
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.users FROM anon;
REVOKE SELECT ON public.users FROM anon;

-- ── increment_points ───────────────────────────────────────────────────────
REVOKE ALL ON FUNCTION public.increment_points(uuid, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_points(uuid, integer) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_points(uuid, integer) TO service_role;
ALTER FUNCTION public.increment_points(uuid, integer) SET search_path TO public;

-- ── increment_discussion_like ──────────────────────────────────────────────
REVOKE ALL ON FUNCTION public.increment_discussion_like(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_discussion_like(uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_discussion_like(uuid) TO service_role;
ALTER FUNCTION public.increment_discussion_like(uuid) SET search_path TO public;

-- ── increment_poll_vote (needs auth.uid() — keep authenticated) ────────────
REVOKE ALL ON FUNCTION public.increment_poll_vote(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_poll_vote(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.increment_poll_vote(uuid) TO authenticated, service_role;
ALTER FUNCTION public.increment_poll_vote(uuid) SET search_path TO public;
