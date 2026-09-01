/* SPRINT: HeyGen transcript import.
   Adds a jsonb transcript column to public.lessons storing an array of
   timestamped segments scraped from the lesson's HeyGen project:

     [{ "timestamp": "0:52", "seconds": 52, "text": "..." }, ...]

   Nullable on purpose — lessons without a transcript fall back to the
   "Transcript coming soon" UI. Additive + idempotent; safe on prod. */

ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS transcript jsonb;

COMMENT ON COLUMN public.lessons.transcript IS
  'Timestamped transcript segments [{timestamp, seconds, text}] imported from HeyGen; null = no transcript yet';

/* PostgREST schema cache reload so the REST layer sees the new column
   without a restart (same pattern as 036). */
NOTIFY pgrst, 'reload schema';
