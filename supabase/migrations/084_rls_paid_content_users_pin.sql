-- 084: QA sweep 2026-09-04 S1/S2 — paid curriculum, users PII, event URLs,
-- and community pin control.
--
-- Additive. Does not rewrite 001. Written against repo policies through 083;
-- production may have drifted. Apply, then dump pg_policies on staging before
-- treating this as fully verified.
--
-- 1) Lessons: authenticated keeps published-row SELECT for catalog columns
--    (title, duration, thumbnail). Paid body columns are revoked so PostgREST
--    cannot return transcript / description / Mux ids / takeaways.
-- 2) Events: revoke zoom_url / recording_url from anon + authenticated.
--    App routes that already gate with hasTierAccess must read those columns
--    through service_role after the gate.
-- 3) users: replace the wide authenticated SELECT with own-row + admin.
--    public.member_directory exposes safe directory columns (security definer
--    view; invoker RLS on users would hide everyone else).
-- 4) posts: only admin (or service_role) may set is_pinned / post_type=announce.

-- ── helpers (unexposed schema) ─────────────────────────────────────────────
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO postgres, service_role, authenticated;

CREATE OR REPLACE FUNCTION private.viewer_user_ids()
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT COALESCE(array_agg(u.id), ARRAY[]::uuid[])
  FROM public.users u
  WHERE u.id = auth.uid()
     OR (u.email IS NOT NULL AND u.email = auth.jwt() ->> 'email');
$$;

CREATE OR REPLACE FUNCTION private.viewer_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.role = 'admin'
      AND (
        u.id = auth.uid()
        OR (u.email IS NOT NULL AND u.email = auth.jwt() ->> 'email')
      )
  );
$$;

REVOKE ALL ON FUNCTION private.viewer_user_ids() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.viewer_is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.viewer_user_ids() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.viewer_is_admin() TO authenticated, service_role;

-- ── 1. lessons: hide paid body from PostgREST ──────────────────────────────
DO $$
DECLARE
  col text;
BEGIN
  FOREACH col IN ARRAY ARRAY[
    'transcript',
    'description',
    'mux_playback_id',
    'mux_asset_id',
    'embed_url',
    'discussion_prompt',
    'key_takeaways',
    'content_blocks'
  ]
  LOOP
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'lessons'
        AND column_name = col
    ) THEN
      EXECUTE format(
        'REVOKE SELECT (%I) ON public.lessons FROM PUBLIC, anon, authenticated',
        col
      );
    END IF;
  END LOOP;
END
$$;

-- service_role keeps table privileges (bypasses RLS; used after app-layer
-- hasTierAccess). mux-token must stay fail-closed in the route.

-- ── 2. events: hide join / recording URLs ──────────────────────────────────
DO $$
DECLARE
  col text;
BEGIN
  FOREACH col IN ARRAY ARRAY['zoom_url', 'recording_url']
  LOOP
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'events'
        AND column_name = col
    ) THEN
      EXECUTE format(
        'REVOKE SELECT (%I) ON public.events FROM PUBLIC, anon, authenticated',
        col
      );
    END IF;
  END LOOP;
END
$$;

-- ── 3. users: own-row + admin; directory view for safe columns ─────────────
DROP POLICY IF EXISTS "users_select_authenticated" ON public.users;

DROP POLICY IF EXISTS "users_select_own" ON public.users;
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT
  TO authenticated
  USING (id = ANY (private.viewer_user_ids()));

DROP POLICY IF EXISTS "users_select_admin" ON public.users;
CREATE POLICY "users_select_admin" ON public.users
  FOR SELECT
  TO authenticated
  USING (private.viewer_is_admin());

CREATE OR REPLACE VIEW public.member_directory
WITH (security_invoker = false, security_barrier = true) AS
SELECT
  id,
  display_name,
  full_name,
  avatar_url,
  banner_url,
  bio,
  company,
  role_title,
  location,
  tier,
  points,
  current_pillar,
  created_at,
  linkedin_url,
  twitter_handle,
  website_url,
  goal_90day,
  goal_visible
FROM public.users;

REVOKE ALL ON public.member_directory FROM PUBLIC, anon;
GRANT SELECT ON public.member_directory TO authenticated, service_role;

COMMENT ON VIEW public.member_directory IS
  'Safe member columns for directory/community embeds. Email, Stripe, Vendasta, role, and access_status stay on public.users behind own-row + admin RLS.';

-- ── 4. posts: only admin / service_role may pin or announce ────────────────
CREATE OR REPLACE FUNCTION private.posts_guard_pin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  -- adminClient (service_role) is how admin UI and /api/posts write today.
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF (COALESCE(NEW.is_pinned, false) = true
        OR NEW.post_type = 'announce')
       AND NOT private.viewer_is_admin() THEN
      NEW.is_pinned := false;
      IF NEW.post_type = 'announce' THEN
        NEW.post_type := 'update';
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF (NEW.is_pinned IS DISTINCT FROM OLD.is_pinned
        OR (NEW.post_type IS DISTINCT FROM OLD.post_type
            AND (NEW.post_type = 'announce' OR OLD.post_type = 'announce')))
       AND NOT private.viewer_is_admin() THEN
      RAISE EXCEPTION 'only admins can pin or announce posts'
        USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS posts_guard_pin ON public.posts;
CREATE TRIGGER posts_guard_pin
  BEFORE INSERT OR UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION private.posts_guard_pin();

DROP POLICY IF EXISTS "posts_insert_own" ON public.posts;
CREATE POLICY "posts_insert_own" ON public.posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = author_id
    AND COALESCE(is_pinned, false) = false
    AND (post_type IS NULL OR post_type <> 'announce')
  );

DROP POLICY IF EXISTS "posts_update_own" ON public.posts;
CREATE POLICY "posts_update_own" ON public.posts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (
    auth.uid() = author_id
    AND COALESCE(is_pinned, false) = false
    AND (post_type IS NULL OR post_type <> 'announce')
  );

DROP POLICY IF EXISTS "posts_admin_all" ON public.posts;
CREATE POLICY "posts_admin_all" ON public.posts
  FOR ALL
  TO authenticated
  USING (private.viewer_is_admin())
  WITH CHECK (private.viewer_is_admin());

NOTIFY pgrst, 'reload schema';
