import { hasTierAccess } from '@/lib/tier'

type EventUrlRow = {
  zoom_url?: string | null
  recording_url?: string | null
  required_tier?: string | null
}

/**
 * Join / recording URLs are revoked from authenticated PostgREST (084).
 * Server routes may still read them via service_role, then this helper
 * decides what the caller is allowed to see.
 */
export function privilegedEventUrls(
  row: EventUrlRow,
  opts: { userTier: string | null | undefined; isRegistered: boolean; isAdmin?: boolean },
): { zoomUrl: string | null; recordingUrl: string | null } {
  const access = Boolean(opts.isAdmin) || hasTierAccess(opts.userTier, row.required_tier)
  if (!access) return { zoomUrl: null, recordingUrl: null }
  return {
    zoomUrl: opts.isRegistered || opts.isAdmin ? row.zoom_url ?? null : null,
    recordingUrl: row.recording_url ?? null,
  }
}

/**
 * Catalog columns that exist before migration 088. `city` is optional:
 * `eventSelectColumns` / `eventPrivilegedColumns` append it only when the
 * live schema has the column, so event reads work before 088 and still
 * return city after it lands. Do not put `city` back on this constant.
 */
export const EVENT_CATALOG_COLUMNS =
  'id, title, description, event_type, starts_at, ends_at, required_tier, registration_count, is_published, image_url' as const

export const EVENT_PRIVILEGED_COLUMNS =
  `${EVENT_CATALOG_COLUMNS}, zoom_url, recording_url` as const

export const EVENT_PRIVILEGED_COLUMNS_WITH_CITY =
  `${EVENT_CATALOG_COLUMNS}, city, zoom_url, recording_url` as const

/** PostgREST / Postgres errors for a missing `events.city` column (088 not applied). */
export function isMissingCityColumnError(
  error: { code?: string | null; message?: string | null } | null | undefined,
): boolean {
  if (!error) return false
  const code = error.code ?? ''
  const message = error.message ?? ''
  if (code === '42703' || code === 'PGRST204') {
    return message.length === 0 || /city/i.test(message)
  }
  return /column\s+[\w."]*city[\w."]*\s+does not exist/i.test(message)
}

/** Drop any `city` token, then append it when the live schema has the column. */
export function eventColumns(columns: string, includeCity: boolean): string {
  const parts = columns
    .split(',')
    .map(part => part.trim())
    .filter(part => part.length > 0 && part !== 'city')
  if (includeCity) parts.push('city')
  return parts.join(', ')
}

/** City from a row that may have been selected without the column. */
export function eventCityFromRow(row: { city?: string | null } | null | undefined): string | null {
  return row?.city ?? null
}
