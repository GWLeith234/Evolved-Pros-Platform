/* SPRINT B: real Key Takeaways field.
   Adds a jsonb key_takeaways column to public.lessons storing an array of
   author-written bullet strings (2–4 recommended per lesson):

     ["Takeaway one.", "Takeaway two.", ...]

   jsonb (not text[]) for consistency with content_blocks / transcript and
   supabase-js Json typing. Nullable on purpose — the lesson page falls back
   to the legacy description-derived bullets while content is being entered.
   Additive + idempotent; safe on prod. */

ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS key_takeaways jsonb;

COMMENT ON COLUMN public.lessons.key_takeaways IS
  'Author-written takeaway bullets ["...", "..."]; null = fall back to description-derived bullets';

NOTIFY pgrst, 'reload schema';
