'use client'

import Link from 'next/link'
import { formatEventDate, formatDuration, EVENT_TYPE_LABELS, EVENT_TYPE_STYLES } from '@/lib/events/types'
import type { EventItem } from '@/lib/events/types'

interface RecordingsListProps {
  events: EventItem[]
}

export function RecordingsList({ events }: RecordingsListProps) {
  const recordings = events.filter(e => e.recordingUrl)

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ backgroundColor: 'white', border: '1px solid rgba(27,60,90,0.12)' }}
    >
      <div
        className="px-6 py-3"
        style={{ borderBottom: '1px solid rgba(27,60,90,0.08)' }}
      >
        <h2 className="font-condensed font-bold uppercase tracking-wide text-[13px] text-[#1b3c5a]">
          Recordings
        </h2>
      </div>

      {recordings.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="font-condensed text-xs uppercase tracking-widest text-[#7a8a96]">
            No recordings available yet.
          </p>
        </div>
      ) : (
        <div className="px-6">
          {recordings.map((event, i) => {
            const { day, month, time } = formatEventDate(event.startsAt)
            const duration = formatDuration(event.startsAt, event.endsAt)
            const typeStyle = EVENT_TYPE_STYLES[event.eventType]
            const typeLabel = EVENT_TYPE_LABELS[event.eventType]

            return (
              <div
                key={event.id}
                className="flex items-center gap-4 py-4"
                style={{ borderBottom: i === recordings.length - 1 ? 'none' : '1px solid rgba(27,60,90,0.08)' }}
              >
                {/* Date block */}
                <div className="flex-shrink-0 w-14 text-center">
                  <p
                    className="font-display font-black leading-none"
                    style={{ fontSize: '26px', color: '#7a8a96' }}
                  >
                    {day}
                  </p>
                  <p className="font-condensed font-bold uppercase text-[10px]" style={{ color: '#ef0e30' }}>
                    {month}
                  </p>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link href={`/events/${event.id}`} className="group">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="font-body font-semibold text-[14px] text-[#1b3c5a] group-hover:text-[#68a2b9] transition-colors truncate">
                        {event.title}
                      </span>
                      <span
                        className="font-condensed font-bold uppercase text-[9px] rounded px-2 py-0.5 flex-shrink-0"
                        style={{ color: typeStyle.color, backgroundColor: typeStyle.bg, border: `1px solid ${typeStyle.border}` }}
                      >
                        {typeLabel}
                      </span>
                    </div>
                  </Link>
                  <p className="font-condensed font-medium text-[11px] text-[#7a8a96]">
                    {time} · {duration}
                    {event.registrationCount > 0 && ` · ${event.registrationCount} attendees`}
                  </p>
                </div>

                {/* Watch button */}
                <a
                  href={event.recordingUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-condensed font-semibold uppercase tracking-wide text-xs rounded px-4 py-2 transition-all flex-shrink-0"
                  style={{ color: '#1b3c5a', border: '1px solid rgba(27,60,90,0.3)', backgroundColor: 'transparent' }}
                >
                  Watch →
                </a>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
