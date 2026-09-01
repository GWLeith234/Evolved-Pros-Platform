/**
 * Shared types + pure helpers for /live upcoming speaking dates.
 * Safe for client and server — no `server-only` imports.
 */

export const LIVE_UPCOMING_SETTING_KEY = 'live_upcoming_speaking'

/** Calendar zone for “is this date still upcoming?” (tour / Canada audience). */
export const SPEAKING_CALENDAR_TZ = 'America/Chicago'

export interface UpcomingDate {
  date: Date
  city: string
  country: string
  event: string
  tag: 'CONFIRMED' | 'HOLD'
  detail?: string
  linkLabel?: string
  linkUrl?: string
  id?: string
}

/** Wire format stored in platform_settings (dates as YYYY-MM-DD). */
export interface UpcomingDateStored {
  id: string
  date: string
  city: string
  country: string
  event: string
  tag: 'CONFIRMED' | 'HOLD'
  detail?: string
  linkLabel?: string
  linkUrl?: string
}

/** Today's calendar date as YYYY-MM-DD in the speaking calendar zone. */
export function todayYmd(now = new Date(), timeZone = SPEAKING_CALENDAR_TZ): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

/**
 * Strict calendar YYYY-MM-DD → Date at UTC noon (stable across TZ for display).
 * Rejects invalid calendars (e.g. 2026-02-31) and non-ISO shapes.
 */
export function parseIsoDate(raw: string): Date | null {
  const normalized = normalizeIsoDate(raw)
  if (!normalized) return null
  const [y, mo, day] = normalized.split('-').map(Number)
  return new Date(Date.UTC(y, mo - 1, day, 12, 0, 0))
}

/** Returns normalized YYYY-MM-DD or null. */
export function normalizeIsoDate(raw: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(raw ?? '').trim())
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2])
  const day = Number(m[3])
  const d = new Date(Date.UTC(y, mo - 1, day, 12, 0, 0))
  if (
    Number.isNaN(d.getTime()) ||
    d.getUTCFullYear() !== y ||
    d.getUTCMonth() !== mo - 1 ||
    d.getUTCDate() !== day
  ) {
    return null
  }
  return `${m[1]}-${m[2]}-${m[3]}`
}

/**
 * Allow http(s) absolute URLs or same-origin paths starting with `/`
 * (not `//`). Rejects javascript:/data:/etc.
 */
export function sanitizeSpeakingLinkUrl(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined
  const trimmed = raw.trim()
  if (!trimmed) return undefined

  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    // Relative path — strip control chars; keep path-only style
    if (/[\u0000-\u001f\u007f]/.test(trimmed)) return undefined
    return trimmed
  }

  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    return undefined
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return undefined
  return url.toString()
}

export function startOfToday(): Date {
  const ymd = todayYmd()
  const parsed = parseIsoDate(ymd)
  return parsed ?? new Date()
}

function cryptoRandomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `spk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export function newSpeakingDateId(): string {
  return cryptoRandomId()
}

export function fromStored(row: UpcomingDateStored): UpcomingDate | null {
  const date = parseIsoDate(row.date)
  if (!date) return null
  if (!row.event?.trim() || !row.city?.trim()) return null
  const tag = row.tag === 'HOLD' ? 'HOLD' : 'CONFIRMED'
  return {
    id: row.id,
    date,
    city: row.city.trim(),
    country: (row.country ?? '').trim(),
    event: row.event.trim(),
    tag,
    detail: row.detail?.trim() || undefined,
    linkLabel: row.linkLabel?.trim() || undefined,
    linkUrl: sanitizeSpeakingLinkUrl(row.linkUrl),
  }
}

export function parseUpcomingSpeakingJson(raw: string): UpcomingDateStored[] {
  if (!raw?.trim()) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    const out: UpcomingDateStored[] = []
    for (const item of parsed) {
      if (!item || typeof item !== 'object') continue
      const r = item as Partial<UpcomingDateStored>
      const id = typeof r.id === 'string' && r.id ? r.id : cryptoRandomId()
      const date = typeof r.date === 'string' ? normalizeIsoDate(r.date) : null
      const city = typeof r.city === 'string' ? r.city : ''
      const event = typeof r.event === 'string' ? r.event : ''
      if (!date || !city || !event) continue
      out.push({
        id,
        date,
        city,
        country: typeof r.country === 'string' ? r.country : '',
        event,
        tag: r.tag === 'HOLD' ? 'HOLD' : 'CONFIRMED',
        detail: typeof r.detail === 'string' ? r.detail : undefined,
        linkLabel: typeof r.linkLabel === 'string' ? r.linkLabel : undefined,
        linkUrl: sanitizeSpeakingLinkUrl(r.linkUrl),
      })
    }
    return out
  } catch {
    return []
  }
}

export function validateStoredRow(
  row: Partial<UpcomingDateStored>,
): { ok: true; value: UpcomingDateStored } | { ok: false; error: string } {
  const event = String(row.event ?? '').trim()
  const city = String(row.city ?? '').trim()
  const dateRaw = String(row.date ?? '').trim()
  const date = normalizeIsoDate(dateRaw)
  if (!event) return { ok: false, error: 'Event title is required' }
  if (!city) return { ok: false, error: 'City is required' }
  if (!date) return { ok: false, error: 'Valid date (YYYY-MM-DD) is required' }

  const linkRaw = String(row.linkUrl ?? '').trim()
  const linkUrl = linkRaw ? sanitizeSpeakingLinkUrl(linkRaw) : undefined
  if (linkRaw && !linkUrl) {
    return { ok: false, error: 'Link must be http(s) or a path starting with /' }
  }

  const tag = row.tag === 'HOLD' ? 'HOLD' : 'CONFIRMED'
  const id = String(row.id ?? '').trim() || newSpeakingDateId()
  return {
    ok: true,
    value: {
      id,
      date,
      city,
      country: String(row.country ?? '').trim(),
      event,
      tag,
      detail: String(row.detail ?? '').trim() || undefined,
      linkLabel: String(row.linkLabel ?? '').trim() || undefined,
      linkUrl,
    },
  }
}

export function filterUpcoming(
  rows: UpcomingDateStored[],
  today = todayYmd(),
): UpcomingDate[] {
  return rows
    .map(fromStored)
    .filter((d): d is UpcomingDate => d !== null)
    .filter(d => {
      const ymd = normalizeIsoDate(
        `${d.date.getUTCFullYear()}-${String(d.date.getUTCMonth() + 1).padStart(2, '0')}-${String(d.date.getUTCDate()).padStart(2, '0')}`,
      )
      return ymd !== null && ymd >= today
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime())
}

/** True when the calendar date is before today in the speaking zone. */
export function isPastSpeakingDate(iso: string, today = todayYmd()): boolean {
  const ymd = normalizeIsoDate(iso)
  if (!ymd) return false
  return ymd < today
}
