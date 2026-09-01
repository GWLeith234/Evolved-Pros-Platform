-- COMMUNITY-SPRINT-0 foundation migration.
-- Adds: posts.kind, posts.reaction_count, post_reactions (rebuilt per spec),
-- sponsor_placements. Existing post_likes / posts.like_count are left intact
-- so the current /community page keeps working through the transition.

-- ─── posts.kind ────────────────────────────────────────────────────────────
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'update'
    CHECK (kind IN ('update','win','question','poll'));

-- ─── posts.reaction_count (denormalized cache for new UI) ──────────────────
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS reaction_count integer NOT NULL DEFAULT 0;

-- ─── post_reactions: drop the prior (unused) shape and rebuild ─────────────
-- The previous post_reactions table used (id PK, single `reaction` column)
-- and had no consumers in app code (verified via grep). Spec requires a
-- composite PK so each user has at most one reaction per post.
DROP TABLE IF EXISTS public.post_reactions CASCADE;

CREATE TABLE public.post_reactions (
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  reaction_type text NOT NULL CHECK (reaction_type IN ('fire','hundred','clap','heart','mind')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);
CREATE INDEX IF NOT EXISTS post_reactions_post_id_idx ON public.post_reactions(post_id);
CREATE INDEX IF NOT EXISTS post_reactions_user_id_idx ON public.post_reactions(user_id);

ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "post_reactions_select_all" ON public.post_reactions;
CREATE POLICY "post_reactions_select_all" ON public.post_reactions
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "post_reactions_insert_own" ON public.post_reactions;
CREATE POLICY "post_reactions_insert_own" ON public.post_reactions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT id FROM public.users WHERE email = (auth.jwt() ->> 'email')));

DROP POLICY IF EXISTS "post_reactions_delete_own" ON public.post_reactions;
CREATE POLICY "post_reactions_delete_own" ON public.post_reactions
  FOR DELETE TO authenticated
  USING (user_id = (SELECT id FROM public.users WHERE email = (auth.jwt() ->> 'email')));

-- ─── Backfill from post_likes (Pattern B with smarter mapping) ─────────────
-- Maps the existing post_likes.reaction_type vocabulary onto the new 5-emoji
-- spec. thumbs_down has no fit and is excluded; NULL / heart → heart.
INSERT INTO public.post_reactions (user_id, post_id, reaction_type, created_at)
SELECT
  user_id,
  post_id,
  CASE reaction_type
    WHEN 'thumbs_up'   THEN 'fire'
    WHEN 'celebration' THEN 'hundred'
    WHEN 'clap'        THEN 'clap'
    WHEN 'heart'       THEN 'heart'
    ELSE 'heart'
  END,
  created_at
FROM public.post_likes
WHERE reaction_type IS NULL OR reaction_type IN ('heart','thumbs_up','clap','celebration')
ON CONFLICT (user_id, post_id) DO NOTHING;

-- ─── Trigger: keep posts.reaction_count in sync ────────────────────────────
CREATE OR REPLACE FUNCTION public.sync_post_reaction_count() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET reaction_count = reaction_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET reaction_count = GREATEST(reaction_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS post_reactions_count_trigger ON public.post_reactions;
CREATE TRIGGER post_reactions_count_trigger
  AFTER INSERT OR DELETE ON public.post_reactions
  FOR EACH ROW EXECUTE FUNCTION public.sync_post_reaction_count();

-- Backfill reaction_count for migrated rows
UPDATE public.posts p
  SET reaction_count = COALESCE(
    (SELECT count(*) FROM public.post_reactions r WHERE r.post_id = p.id),
    0
  );

-- ─── sponsor_placements (replaces deprecated ad_placements concept) ────────
CREATE TABLE IF NOT EXISTS public.sponsor_placements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_name text NOT NULL,
  slogan text,
  offer_details text,
  call_to_action text NOT NULL,
  cta_url text NOT NULL,
  logo_url text,
  accent_color text NOT NULL DEFAULT '#C9A84C',
  kind text NOT NULL DEFAULT 'inline' CHECK (kind IN ('inline','ribbon','feature')),
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sponsor_placements_active_idx
  ON public.sponsor_placements(is_active, sort_order)
  WHERE is_active = true;

ALTER TABLE public.sponsor_placements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sponsor_select_active" ON public.sponsor_placements;
CREATE POLICY "sponsor_select_active" ON public.sponsor_placements
  FOR SELECT TO authenticated USING (is_active = true);

DROP POLICY IF EXISTS "sponsor_admin_all" ON public.sponsor_placements;
CREATE POLICY "sponsor_admin_all" ON public.sponsor_placements
  FOR ALL TO authenticated
  USING ((SELECT role FROM public.users WHERE email = (auth.jwt() ->> 'email')) = 'admin')
  WITH CHECK ((SELECT role FROM public.users WHERE email = (auth.jwt() ->> 'email')) = 'admin');
