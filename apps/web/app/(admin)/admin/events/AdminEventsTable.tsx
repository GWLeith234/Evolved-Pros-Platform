'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { EVENT_TYPE_LABELS } from '@/lib/events/types'
import type { EventType } from '@/lib/events/types'

interface AdminEvent {
  id: string
  title: string
  event_type: string
  starts_at: string
  is_published: boolean
  registration_count: number
  required_tier: string | null
}

interface AdminEventsTableProps {
  events: AdminEvent[]
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

export function AdminEventsTable({ events: initialEvents }: AdminEventsTableProps) {
  const [events, setEvents] = useState(initialEvents)
  const [toggling, setToggling] = useState<string | null>(null)
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => { setNow(new Date()) }, [])

  async function togglePublish(eventId: string, currentlyPublished: boolean) {
    setToggling(eventId)
    try {
      const res = await fetch(`/api/admin/events/${eventId}/publish`, { method: 'PATCH' })
      if (!res.ok) return
      setEvents(prev =>
        prev.map(e => e.id === eventId ? { ...e, is_published: !currentlyPublished } : e)
      )
    } finally {
      setToggling(null)
    }
  }

  return (
    <div className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(27,60,90,0.12)' }}>
      <table className="w-full">
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(27,60,90,0.1)', backgroundColor: 'rgba(27,60,90,0.03)' }}>
            <th className="px-5 py-3 text-left font-condensed font-bold uppercase tracking-[0.18em] text-[9px] text-[#7a8a96]">Title</th>
            <th className="px-5 py-3 text-left font-condensed font-bold uppercase tracking-[0.18em] text-[9px] text-[#7a8a96]">Date</th>
            <th className="px-5 py-3 text-left font-condensed font-bold uppercase tracking-[0.18em] text-[9px] text-[#7a8a96]">Type</th>
            <th className="px-5 py-3 text-left font-condensed font-bold uppercase tracking-[0.18em] text-[9px] text-[#7a8a96]">Tier</th>
            <th className="px-5 py-3 text-right font-condensed font-bold uppercase tracking-[0.18em] text-[9px] text-[#7a8a96]">Registered</th>
            <th className="px-5 py-3 text-center font-condensed font-bold uppercase tracking-[0.18em] text-[9px] text-[#7a8a96]">Status</th>
            <th className="px-5 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {events.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-5 py-10 text-center font-condensed text-[12px] text-[#7a8a96]">
                No events yet. Create your first event.
              </td>
            </tr>
          ) : (
            events.map((event, i) => {
              const isPast = now ? new Date(event.starts_at) < now : false
              const isToggling = toggling === event.id
              return (
                <tr
                  key={event.id}
                  style={{
                    borderBottom: i === events.length - 1 ? 'none' : '1px solid rgba(27,60,90,0.06)',
                    backgroundColor: 'white',
                  }}
                >
                  <td className="px-5 py-3">
                    <p className="font-body font-semibold text-[13px] text-[#1b3c5a] truncate max-w-[260px]">{event.title}</p>
                  </td>
                  <td className="px-5 py-3">
                    <p className="font-condensed text-[12px] text-[#1b3c5a]">{formatDate(event.starts_at)}</p>
                    {isPast && <p className="font-condensed text-[10px] text-[#7a8a96]">Past</p>}
                  </td>
                  <td className="px-5 py-3">
                    <span className="font-condensed text-[11px] text-[#1b3c5a]">
                      {EVENT_TYPE_LABELS[event.event_type as EventType]}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="font-condensed text-[11px] text-[#1b3c5a] capitalize">
                      {event.required_tier ?? 'Any'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className="font-condensed font-bold text-[13px] text-[#1b3c5a]">{event.registration_count}</span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span
                      className="font-condensed font-bold uppercase text-[9px] rounded px-2 py-0.5"
                      style={{
                        color: event.is_published ? '#1b3c5a' : '#7a8a96',
                        backgroundColor: event.is_published ? 'rgba(27,60,90,0.06)' : 'rgba(122,138,150,0.08)',
                        border: event.is_published ? '1px solid rgba(27,60,90,0.15)' : '1px solid rgba(122,138,150,0.2)',
                      }}
                    >
                      {event.is_published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => togglePublish(event.id, event.is_published)}
                        disabled={isToggling}
                        className="font-condensed font-semibold uppercase tracking-wide text-[10px] transition-colors disabled:opacity-50"
                        style={{ color: event.is_published ? '#ef0e30' : '#68a2b9' }}
                      >
                        {isToggling ? '...' : event.is_published ? 'Unpublish' : 'Publish'}
                      </button>
                      <Link
                        href={`/admin/events/${event.id}/edit`}
                        className="font-condensed font-semibold uppercase tracking-wide text-[10px] text-[#68a2b9] hover:text-[#1b3c5a] transition-colors"
                      >
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
