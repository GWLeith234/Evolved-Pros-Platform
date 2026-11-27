-- Recompute events.registration_count from event_rsvps.
--
-- NOT APPLIED. Nothing in the app or the test suite runs this file.
-- Do not apply it until George says yes. Do not db push.
--
-- POST and DELETE /api/events/[eventId]/register used to read
-- registration_count and write that number plus or minus one. Two
-- overlapping requests both wrote the same number, so the stored count
-- drifted away from the rows in event_rsvps. event_rsvps has PRIMARY KEY
-- (user_id, event_id), so a second row for the same member cannot exist.
-- The route calls this only after an insert or delete returns a row.
--
-- The function locks the event row, counts committed RSVPs, and stores
-- that count. The floor is 0. service_role only. A member session cannot
-- call it.

CREATE OR REPLACE FUNCTION public.set_event_registration_count(p_event_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $function$
DECLARE
  new_count integer;
BEGIN
  PERFORM 1
  FROM public.events
  WHERE id = p_event_id
  FOR UPDATE;

  SELECT count(*)::integer
    INTO new_count
  FROM public.event_rsvps
  WHERE event_id = p_event_id;

  new_count := GREATEST(COALESCE(new_count, 0), 0);

  UPDATE public.events
  SET registration_count = new_count
  WHERE id = p_event_id;

  RETURN new_count;
END;
$function$;

REVOKE ALL ON FUNCTION public.set_event_registration_count(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_event_registration_count(uuid) TO service_role;
ALTER FUNCTION public.set_event_registration_count(uuid) SET search_path TO public;
