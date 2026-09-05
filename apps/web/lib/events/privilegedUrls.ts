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

export const EVENT_CATALOG_COLUMNS =
  'id, title, description, event_type, starts_at, ends_at, required_tier, registration_count, is_published, image_url, city' as const

export const EVENT_PRIVILEGED_COLUMNS =
  `${EVENT_CATALOG_COLUMNS}, zoom_url, recording_url` as const
