/**
 * House-ad ingest against `ad_events` (migration 082).
 * The table is not on every live database yet. A missing relation is a no-op,
 * not a 500. Any other write error still fails the request.
 */

let loggedMissingTable = false

export function resetAdEventsMissingLog(): void {
  loggedMissingTable = false
}

/** True the first time the table is missing in this process. */
export function takeAdEventsMissingLog(): boolean {
  if (loggedMissingTable) return false
  loggedMissingTable = true
  return true
}

/**
 * Postgres 42P01 (undefined_table) and PostgREST PGRST205 (relation not in
 * the schema cache) are how a missing `ad_events` shows up through supabase-js.
 */
export function isMissingAdEventsTable(
  error: { code?: string | null; message?: string | null } | null | undefined,
): boolean {
  if (!error) return false
  const code = error.code ?? ''
  if (code === '42P01' || code === 'PGRST205') return true
  const message = error.message ?? ''
  return /ad_events/i.test(message) && /does not exist|schema cache|undefined_table/i.test(message)
}

export type AdEventWriteOutcome =
  | { status: 201; body: { ok: true } }
  | { status: 204; body: null }
  | { status: 500; body: { error: 'Failed to record event' } }

export function adEventWriteOutcome(
  error: { code?: string | null; message?: string | null } | null,
): AdEventWriteOutcome {
  if (!error) return { status: 201, body: { ok: true } }
  if (isMissingAdEventsTable(error)) {
    if (takeAdEventsMissingLog()) {
      console.warn(
        '[POST /api/ads/events] ad_events table is missing; skipping writes until migration 082 is applied',
      )
    }
    return { status: 204, body: null }
  }
  return { status: 500, body: { error: 'Failed to record event' } }
}
