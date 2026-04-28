/* Migration 037 - Podcast redesign schema additions
   Adds pillar/pinned columns to episodes and a user_episode_progress
   table for per-user watch state. Non-destructive; idempotent.
   Applied to production via Supabase SQL Editor on Apr 27, 2026
   (project udbwrapkshfjkctylbmm) before this file landed in git. */

ALTER TABLE public.episodes
  ADD COLUMN IF NOT EXISTS pillar text
    CHECK (pillar IN ('foundation','identity','mental-toughness','strategy','accountability','execution')),
  ADD COLUMN IF NOT EXISTS pinned boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.user_episode_progress (
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  episode_id uuid NOT NULL REFERENCES public.episodes(id) ON DELETE CASCADE,
  progress   numeric(3,2) NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 1),
  watched_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, episode_id)
);

ALTER TABLE public.user_episode_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users read own progress" ON public.user_episode_progress;
CREATE POLICY "users read own progress" ON public.user_episode_progress
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "users write own progress" ON public.user_episode_progress;
CREATE POLICY "users write own progress" ON public.user_episode_progress
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "users update own progress" ON public.user_episode_progress;
CREATE POLICY "users update own progress" ON public.user_episode_progress
  FOR UPDATE TO authenticated USING (user_id = auth.uid());
