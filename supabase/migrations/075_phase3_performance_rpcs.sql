-- Phase 3 performance: aggregate post meta, atomic reply counts, message index,
-- and service-role RPCs for reaction toggle + reply create.
-- Mirrors to packages/db/migrations when that tree is used for deploys.

-- ─── Messages cursor pagination index ──────────────────────────────────────
CREATE INDEX IF NOT EXISTS messages_conversation_created_id_idx
  ON public.messages (conversation_id, created_at DESC, id DESC);

-- ─── Keep posts.reply_count in sync (was read-modify-write in the API) ─────
CREATE OR REPLACE FUNCTION public.sync_post_reply_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts
      SET reply_count = COALESCE(reply_count, 0) + 1
      WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts
      SET reply_count = GREATEST(COALESCE(reply_count, 0) - 1, 0)
      WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS post_replies_count_trigger ON public.replies;
CREATE TRIGGER post_replies_count_trigger
  AFTER INSERT OR DELETE ON public.replies
  FOR EACH ROW EXECUTE FUNCTION public.sync_post_reply_count();

UPDATE public.posts p
SET reply_count = COALESCE(
  (SELECT count(*)::int FROM public.replies r WHERE r.post_id = p.id),
  0
);

-- ─── Harden increment_points (idempotent create) ───────────────────────────
CREATE OR REPLACE FUNCTION public.increment_points(user_id uuid, amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.users
    SET points = COALESCE(points, 0) + COALESCE
    WHERE id = user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_points(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_points(uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_points(uuid, integer) TO authenticated;

-- ─── Aggregated reaction + reply counts for a page of posts ────────────────
CREATE OR REPLACE FUNCTION public.get_post_meta_counts(p_post_ids uuid[])
RETURNS TABLE (
  post_id uuid,
  reaction_count integer,
  reply_count integer,
  reactions jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    p.id AS post_id,
    COALESCE(p.reaction_count, 0)::integer AS reaction_count,
    COALESCE(p.reply_count, 0)::integer AS reply_count,
    COALESCE((
      SELECT jsonb_object_agg(sub.reaction_type, sub.cnt)
      FROM (
        SELECT r.reaction_type, count(*)::int AS cnt
        FROM public.post_reactions r
        WHERE r.post_id = p.id
        GROUP BY r.reaction_type
      ) sub
    ), '{}'::jsonb) AS reactions
  FROM public.posts p
  WHERE p.id = ANY (p_post_ids);
$$;

REVOKE ALL ON FUNCTION public.get_post_meta_counts(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_post_meta_counts(uuid[]) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_post_meta_counts(uuid[]) TO authenticated;

-- ─── Toggle / set / remove a canonical post_reactions row ──────────────────
-- Called only via service-role adminClient with a resolved public.users.id.
-- p_mode: 'set' (upsert, never toggle-off), 'toggle' (same-type removes),
--         'remove' (delete whatever is there).
CREATE OR REPLACE FUNCTION public.toggle_post_reaction(
  p_user_id uuid,
  p_post_id uuid,
  p_reaction_type text,
  p_mode text DEFAULT 'toggle'
)
RETURNS TABLE (
  action text,
  my_reaction text,
  reaction_count integer,
  reactions jsonb,
  post_author_id uuid,
  points_awarded boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_existing text;
  v_author uuid;
  v_action text;
  v_my text;
  v_awarded boolean := false;
BEGIN
  IF p_mode NOT IN ('set', 'toggle', 'remove') THEN
    RAISE EXCEPTION 'invalid_mode';
  END IF;
  IF p_mode <> 'remove' AND (p_reaction_type IS NULL OR p_reaction_type NOT IN ('fire','hundred','clap','heart','mind')) THEN
    RAISE EXCEPTION 'invalid_reaction_type';
  END IF;

  SELECT author_id INTO v_author FROM public.posts WHERE id = p_post_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'post_not_found';
  END IF;

  SELECT reaction_type INTO v_existing
  FROM public.post_reactions
  WHERE user_id = p_user_id AND post_id = p_post_id;

  IF p_mode = 'remove' OR (p_mode = 'toggle' AND v_existing IS NOT NULL AND v_existing = p_reaction_type) THEN
    DELETE FROM public.post_reactions
    WHERE user_id = p_user_id AND post_id = p_post_id;
    v_action := 'removed';
    v_my := NULL;
  ELSIF v_existing IS NULL THEN
    INSERT INTO public.post_reactions (user_id, post_id, reaction_type)
    VALUES (p_user_id, p_post_id, p_reaction_type);
    v_action := 'added';
    v_my := p_reaction_type;
    IF v_author IS DISTINCT FROM p_user_id THEN
      UPDATE public.users
        SET points = COALESCE(points, 0) + 2
        WHERE id = v_author;
      v_awarded := true;
    END IF;
  ELSIF v_existing <> p_reaction_type THEN
    UPDATE public.post_reactions
      SET reaction_type = p_reaction_type
      WHERE user_id = p_user_id AND post_id = p_post_id;
    v_action := 'changed';
    v_my := p_reaction_type;
  ELSE
    -- p_mode = 'set' and same type already present — no-op keep
    v_action := 'kept';
    v_my := p_reaction_type;
  END IF;

  RETURN QUERY
  SELECT
    v_action,
    v_my,
    COALESCE((SELECT reaction_count FROM public.posts WHERE id = p_post_id), 0)::integer,
    COALESCE((
      SELECT jsonb_object_agg(sub.reaction_type, sub.cnt)
      FROM (
        SELECT r.reaction_type, count(*)::int AS cnt
        FROM public.post_reactions r
        WHERE r.post_id = p_post_id
        GROUP BY r.reaction_type
      ) sub
    ), '{}'::jsonb),
    v_author,
    v_awarded;
END;
$$;

REVOKE ALL ON FUNCTION public.toggle_post_reaction(uuid, uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.toggle_post_reaction(uuid, uuid, text, text) TO service_role;

-- ─── Create reply + award points atomically (reply_count via trigger) ──────
CREATE OR REPLACE FUNCTION public.create_post_reply(
  p_user_id uuid,
  p_post_id uuid,
  p_body text
)
RETURNS TABLE (
  reply_id uuid,
  post_id uuid,
  body text,
  created_at timestamptz,
  author_id uuid,
  author_display_name text,
  author_full_name text,
  author_avatar_url text,
  post_author_id uuid,
  channel_slug text,
  reply_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_body text := btrim(p_body);
  v_post_author uuid;
  v_channel text;
  v_reply public.replies%ROWTYPE;
  v_user public.users%ROWTYPE;
BEGIN
  IF v_body IS NULL OR length(v_body) < 1 THEN
    RAISE EXCEPTION 'empty_body';
  END IF;
  IF length(v_body) > 2000 THEN
    RAISE EXCEPTION 'body_too_long';
  END IF;

  SELECT p.author_id, c.slug
    INTO v_post_author, v_channel
  FROM public.posts p
  LEFT JOIN public.channels c ON c.id = p.channel_id
  WHERE p.id = p_post_id;

  IF v_post_author IS NULL THEN
    RAISE EXCEPTION 'post_not_found';
  END IF;

  SELECT * INTO v_user FROM public.users WHERE id = p_user_id;
  IF v_user.id IS NULL THEN
    RAISE EXCEPTION 'user_not_found';
  END IF;

  INSERT INTO public.replies (post_id, author_id, body)
  VALUES (p_post_id, p_user_id, v_body)
  RETURNING * INTO v_reply;

  UPDATE public.users
    SET points = COALESCE(points, 0) + 5
    WHERE id = p_user_id;

  RETURN QUERY
  SELECT
    v_reply.id,
    v_reply.post_id,
    v_reply.body,
    v_reply.created_at,
    v_user.id,
    v_user.display_name,
    v_user.full_name,
    v_user.avatar_url,
    v_post_author,
    COALESCE(v_channel, 'general'),
    COALESCE((SELECT reply_count FROM public.posts WHERE id = p_post_id), 0)::integer;
END;
$$;

REVOKE ALL ON FUNCTION public.create_post_reply(uuid, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_post_reply(uuid, uuid, text) TO service_role;
