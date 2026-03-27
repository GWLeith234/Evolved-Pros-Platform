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
  requiredTier: 'community' | 'pro' | null
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

export function formatEventDate(iso: string) {
  const d = new Date(iso)
  return {
    day:   d.getDate(),
    month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    time:  d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }),
    full:  d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
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
