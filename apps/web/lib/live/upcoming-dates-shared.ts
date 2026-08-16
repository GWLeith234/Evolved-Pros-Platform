/**
 * Shared types + pure helpers for /live upcoming speaking dates.
 * Safe for client and server — no `server-only` imports.
 */

export const LIVE_UPCOMING_SETTING_KEY = 'live_upcoming_speaking'

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

export function startOfToday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

export function parseIsoDate(raw: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw.trim())
  if (m) {
    const y = Number(m[1])
    const mo = Number(m[2]) - 1
    const day = Number(m[3])
    const d = new Date(y, mo, day)
    return Number.isNaN(d.getTime()) ? null : d
  }
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? null : d
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
    linkUrl: row.linkUrl?.trim() || undefined,
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
      const date = typeof r.date === 'string' ? r.date : ''
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
        linkUrl: typeof r.linkUrl === 'string' ? r.linkUrl : undefined,
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
  const date = String(row.date ?? '').trim()
  if (!event) return { ok: false, error: 'Event title is required' }
  if (!city) return { ok: false, error: 'City is required' }
  if (!date || !parseIsoDate(date)) return { ok: false, error: 'Valid date (YYYY-MM-DD) is required' }
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
      linkUrl: String(row.linkUrl ?? '').trim() || undefined,
    },
  }
}

export function filterUpcoming(
  rows: UpcomingDateStored[],
  now = startOfToday(),
): UpcomingDate[] {
  return rows
    .map(fromStored)
    .filter((d): d is UpcomingDate => d !== null)
    .filter(d => d.date.getTime() >= now.getTime())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
}
