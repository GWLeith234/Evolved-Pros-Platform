-- COMMUNITY-SPRINT-1: add posts.pillar (integer 1-6, nullable).
-- Coexists with the legacy posts.pillar_tag (text 'p1'-'p6') during the
-- transition — the new composer writes both, existing reads stay green.

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS pillar integer
    CHECK (pillar IS NULL OR pillar BETWEEN 1 AND 6);

CREATE INDEX IF NOT EXISTS posts_pillar_idx
  ON public.posts(pillar)
  WHERE pillar IS NOT NULL;
