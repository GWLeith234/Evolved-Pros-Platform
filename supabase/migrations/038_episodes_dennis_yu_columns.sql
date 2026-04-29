/* Episodes schema delta for Dennis Yu and going-forward podcast operations.
   Locked decisions: YouTube video, Transistor audio source-of-truth,
   pillar tagging, members-only flag. April 28, 2026. */

ALTER TABLE public.episodes
  ADD COLUMN IF NOT EXISTS transistor_episode_id TEXT,
  ADD COLUMN IF NOT EXISTS pillars TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS is_members_only BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS show_notes TEXT;

/* Unique constraint on transistor_episode_id (allows multiple NULLs) */
CREATE UNIQUE INDEX IF NOT EXISTS idx_episodes_transistor_unique
  ON public.episodes (transistor_episode_id)
  WHERE transistor_episode_id IS NOT NULL;

/* Constrain pillars to the canonical EVOLVED architecture values.
   Match the existing media-stories pillar enum exactly. */
ALTER TABLE public.episodes
  DROP CONSTRAINT IF EXISTS episodes_pillars_check;

ALTER TABLE public.episodes
  ADD CONSTRAINT episodes_pillars_check
  CHECK (
    pillars <@ ARRAY['foundation','identity','mental-toughness','strategy','accountability','execution']::text[]
  );
