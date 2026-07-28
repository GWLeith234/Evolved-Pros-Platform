-- 071_episodes_public_read_rls.sql
-- SPRINT K — Episodes data layer (RLS + indexes reconciliation)
--
-- WHY THIS EXISTS
-- The public SEO podcast pages (/podcast, /podcast/[slug], sitemap, RSS) depend
-- on anon being able to SELECT published episodes. That anon-read policy has
-- been live in production for a while (applied by hand in the Supabase SQL
-- editor as `published_episodes_public`) but was NEVER captured in a migration
-- file — migration 029 only created an *authenticated*-only read policy. So a
-- fresh environment built from supabase/migrations/ would silently ship an
-- episodes table that anon cannot read, and the SEO pages would 404 / return
-- zero rows.
--
-- This migration codifies the live contract so the repo reproduces production,
-- using the canonical policy names for the episodes data layer:
--   * "public read published" — SELECT to anon + authenticated, is_published = true
--   * "admin all"             — ALL to authenticated where users.role = 'admin'
-- It also normalises the is_published default and adds the published_at index.
--
-- IDEMPOTENCY CONTRACT
-- This migration is ALREADY APPLIED to production (2026-07-28 03:07 UTC). Every
-- statement below is written to be a safe no-op on re-run in the SQL Editor:
--   * CREATE TABLE / CREATE INDEX / ADD COLUMN use IF NOT EXISTS
--   * every policy is DROP POLICY IF EXISTS ... then CREATE POLICY
--   * the ALTER COLUMN / UPDATE statements converge (no NULLs remain, default
--     and NOT NULL are already set) and re-apply cleanly.
-- Fully idempotent and additive. The old hand-applied policy names
-- (published_episodes_public / admins_manage_episodes) are dropped only AFTER
-- the replacements exist, so anon read is never interrupted. The pre-existing
-- service_role policy is left untouched.

-- The table already exists (029). Guard anyway so this file is safe to run
-- against a brand-new database where earlier migrations created it. The guard
-- MUST include published_at: the index at the bottom orders by it, so a
-- minimal guard table without the column would make CREATE INDEX fail on an
-- otherwise-empty database. (In a normal in-order build 029 already supplies
-- the full column set and this IF NOT EXISTS is a no-op.)
CREATE TABLE IF NOT EXISTS public.episodes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         text NOT NULL UNIQUE,
  title        text NOT NULL,
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Belt-and-suspenders: if an older environment created episodes without
-- published_at (e.g. via a prior minimal guard), add it before the index. Safe
-- no-op where the column already exists (029 / normal builds).
ALTER TABLE public.episodes ADD COLUMN IF NOT EXISTS published_at timestamptz;

-- CAUTION (from the sprint): is_published must never read back as NULL, because
-- the read path filters with .eq('is_published', true) and NULL = true is NULL,
-- not false. Backfill any stray NULLs, pin the default to false, and enforce
-- NOT NULL so no future insert can reintroduce the problem.
UPDATE public.episodes SET is_published = false WHERE is_published IS NULL;
ALTER TABLE public.episodes ALTER COLUMN is_published SET DEFAULT false;
ALTER TABLE public.episodes ALTER COLUMN is_published SET NOT NULL;

-- RLS on — enabling twice is a no-op.
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;

-- ── public read published ──────────────────────────────────────────────────
-- anon AND authenticated may read only published rows. Create the canonical
-- policy first (idempotent via DROP IF EXISTS), then retire the legacy name so
-- there is no window in which no read policy is present.
DROP POLICY IF EXISTS "public read published" ON public.episodes;
CREATE POLICY "public read published" ON public.episodes
  FOR SELECT
  TO anon, authenticated
  USING (is_published = true);
DROP POLICY IF EXISTS "published_episodes_public" ON public.episodes;

-- ── admin all ───────────────────────────────────────────────────────────────
-- authenticated users whose users.role = 'admin' can do anything.
DROP POLICY IF EXISTS "admin all" ON public.episodes;
CREATE POLICY "admin all" ON public.episodes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
  );
DROP POLICY IF EXISTS "admins_manage_episodes" ON public.episodes;
-- Also retire 029's original authenticated-only read + admin policies if they
-- still linger in an older environment (no-op where already replaced above).
DROP POLICY IF EXISTS "published episodes visible to authenticated users" ON public.episodes;
DROP POLICY IF EXISTS "admins can do anything" ON public.episodes;

-- ── indexes ──────────────────────────────────────────────────────────────────
-- slug: the UNIQUE constraint (episodes_slug_key) already provides a btree
-- index on slug, which serves the getEpisodeBySlug() lookups — no separate
-- index needed. published_at DESC: add a dedicated index for the ordered
-- index/sitemap/RSS queries (the existing episodes_published_idx is composite
-- on (is_published, published_at DESC); this standalone one matches the sprint
-- spec and covers ORDER BY published_at DESC directly).
CREATE INDEX IF NOT EXISTS episodes_published_at_idx
  ON public.episodes (published_at DESC);
