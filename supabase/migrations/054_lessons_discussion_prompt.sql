/* SPRINT C: lesson-specific discussion prompts.
   Adds a text discussion_prompt column to public.lessons. Nullable on
   purpose — the lesson page falls back to the legacy sitewide generic
   prompt when the field is blank. Additive + idempotent; safe on prod. */

ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS discussion_prompt text;

COMMENT ON COLUMN public.lessons.discussion_prompt IS
  'Per-lesson discussion prompt shown in the lesson Discussion section; null = generic fallback prompt';

NOTIFY pgrst, 'reload schema';
