export type EventType = 'live' | 'virtual' | 'inperson'

export type EventItem = {
  id: string
  title: string
  description: string | null
  eventType: EventType
  startsAt: string
  endsAt: string | null
  zoomUrl: string | null      // only present when user is registered
  recordingUrl: string | null
  imageUrl: string | null
  requiredTier: 'community' | 'vip' | 'pro' | null
  registrationCount: number
  isRegistered: boolean
  hasAccess: boolean
  isPublished: boolean
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  live:     'Live',
  virtual:  'Virtual',
  inperson: 'In Person',
}

export const EVENT_TYPE_STYLES: Record<EventType, { color: string; bg: string; border: string }> = {
  live:     { color: '#ef0e30', bg: 'rgba(239,14,48,0.08)',   border: 'rgba(239,14,48,0.2)' },
  virtual:  { color: '#68a2b9', bg: 'rgba(104,162,185,0.08)', border: 'rgba(104,162,185,0.2)' },
  inperson: { color: '#1b3c5a', bg: 'rgba(27,60,90,0.06)',   border: 'rgba(27,60,90,0.15)' },
}

// Public events.event_type is free-text — admin form has shipped both
// 'Virtual' (capitalised) and 'virtual', and prior copy referenced
// 'in_person' / 'in-person' / 'In-Person' interchangeably. Normalise once.
export type EventTypeBadge = {
  label: string
  background: string
  color: string
  border: string
  pulse: boolean
}
export function eventTypeBadge(rawType: string | null | undefined): EventTypeBadge {
  const t = (rawType ?? '').toLowerCase().replace(/[\s-]+/g, '_')
  if (t === 'live')                       return { label: 'LIVE',      background: '#C9302A',                color: '#FFFFFF', border: '#C9302A',                 pulse: true  }
  if (t === 'virtual')                    return { label: 'VIRTUAL',   background: 'rgba(10,191,163,0.08)',  color: '#0ABFA3', border: 'rgba(10,191,163,0.55)',   pulse: false }
  if (t === 'in_person' || t === 'inperson') return { label: 'IN PERSON', background: 'rgba(201,168,76,0.08)',  color: '#C9A84C', border: 'rgba(201,168,76,0.55)',   pulse: false }
  if (t === 'ama')                        return { label: 'AMA',       background: 'rgba(167,139,250,0.08)', color: '#A78BFA', border: 'rgba(167,139,250,0.55)',  pulse: false }
  if (t === 'vip_only' || t === 'vip')    return { label: 'VIP ONLY',  background: '#C9A84C',                color: '#0A0F18', border: '#C9A84C',                 pulse: false }
  return { label: (rawType ?? 'EVENT').toUpperCase(), background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: 'rgba(255,255,255,0.25)', pulse: false }
}

export function formatEventDate(iso: string) {
  const d = new Date(iso)
  return {
    day:   d.getUTCDate(),
    month: d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }).toUpperCase(),
    time:  d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short', timeZone: 'UTC' }),
    full:  d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }),
  }
}

export function formatDuration(startsAt: string, endsAt: string | null): string {
  if (!endsAt) return 'Duration TBD'
  const diffMs = new Date(endsAt).getTime() - new Date(startsAt).getTime()
  const mins = Math.round(diffMs / 60000)
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  const rem = mins % 60
  return rem > 0 ? `${hrs} hr ${rem} min` : `${hrs} hr`
}

export function generateICS(event: EventItem): string {
  function toICSDate(iso: string): string {
    return iso.replace(/[-:]/g, '').split('.')[0] + 'Z'
  }
  const endIso = event.endsAt ?? new Date(new Date(event.startsAt).getTime() + 60 * 60 * 1000).toISOString()
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Evolved Pros//Events//EN',
    'BEGIN:VEVENT',
    `DTSTART:${toICSDate(event.startsAt)}`,
    `DTEND:${toICSDate(endIso)}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${(event.description ?? '').replace(/\n/g, '\\n')}`,
    event.zoomUrl ? `URL:${event.zoomUrl}` : '',
    `UID:${event.id}@evolvedpros.com`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n')
}
