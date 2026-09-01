-- EVENTS-SPRINT-0 foundation migration.
-- Adds: events.pillar, events.format, events.attending_count, event_rsvps
-- (new RSVP table). Enforces "at most one is_featured at a time" via a
-- unique partial index. Existing event_registrations / events.registration_count
-- / events.is_featured / events.event_type are left in place — the new UI
-- writes to the new tables/columns; old code paths keep working.

-- ─── events.pillar ────────────────────────────────────────────────────────
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS pillar integer
    CHECK (pillar IS NULL OR pillar BETWEEN 1 AND 6);

CREATE INDEX IF NOT EXISTS events_pillar_idx
  ON public.events(pillar)
  WHERE pillar IS NOT NULL;

-- ─── events.format ────────────────────────────────────────────────────────
-- A column named `event_type` already exists with free-form text values; this
-- adds a parallel `format` column scoped to the four shipped formats so the
-- new UI can branch reliably. Backfill of existing rows from event_type can
-- happen in a later sprint once the mapping is decided.
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS format text NOT NULL DEFAULT 'live'
    CHECK (format IN ('live','in-person','podcast','replay'));

-- ─── events.is_featured (column already exists; add uniqueness guard) ─────
-- The column itself is pre-existing. The unique partial index enforces "at
-- most one featured event at a time" so the future hero admin UI can flip
-- without race-double-features.
-- NOTE FOR OPERATOR: if more than one row currently has is_featured=true,
-- this CREATE INDEX will fail. Inspect with:
--   SELECT id, title FROM public.events WHERE is_featured = true;
-- and unfeature extras before re-running.
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS events_one_featured_idx
  ON public.events ((1)) WHERE is_featured = true;

-- ─── events.attending_count (denormalized cache for new RSVP flow) ────────
-- Coexists with the legacy events.registration_count, which the existing
-- /api/events/[eventId]/register route maintains. New flow uses
-- attending_count, kept in sync via trigger on event_rsvps below.
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS attending_count integer NOT NULL DEFAULT 0;

-- ─── event_rsvps (new table — coexists with legacy event_registrations) ───
CREATE TABLE IF NOT EXISTS public.event_rsvps (
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, event_id)
);
CREATE INDEX IF NOT EXISTS event_rsvps_event_id_idx
  ON public.event_rsvps(event_id);
CREATE INDEX IF NOT EXISTS event_rsvps_user_id_idx
  ON public.event_rsvps(user_id);

ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "event_rsvps_select_all" ON public.event_rsvps;
CREATE POLICY "event_rsvps_select_all" ON public.event_rsvps
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "event_rsvps_insert_own" ON public.event_rsvps;
CREATE POLICY "event_rsvps_insert_own" ON public.event_rsvps
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT id FROM public.users WHERE email = (auth.jwt() ->> 'email')));

DROP POLICY IF EXISTS "event_rsvps_delete_own" ON public.event_rsvps;
CREATE POLICY "event_rsvps_delete_own" ON public.event_rsvps
  FOR DELETE TO authenticated
  USING (user_id = (SELECT id FROM public.users WHERE email = (auth.jwt() ->> 'email')));

-- ─── Trigger: keep events.attending_count in sync ─────────────────────────
CREATE OR REPLACE FUNCTION public.sync_event_attending_count()
  RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.events
      SET attending_count = attending_count + 1
      WHERE id = NEW.event_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.events
      SET attending_count = GREATEST(attending_count - 1, 0)
      WHERE id = OLD.event_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS event_rsvps_count_trigger ON public.event_rsvps;
CREATE TRIGGER event_rsvps_count_trigger
  AFTER INSERT OR DELETE ON public.event_rsvps
  FOR EACH ROW EXECUTE FUNCTION public.sync_event_attending_count();

-- ─── Backfill attending_count from any pre-existing event_rsvps rows ──────
UPDATE public.events e
  SET attending_count = COALESCE(
    (SELECT count(*) FROM public.event_rsvps r WHERE r.event_id = e.id),
    0
  );
