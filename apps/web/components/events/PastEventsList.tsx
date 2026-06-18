import Link from 'next/link'
import { PILLAR_CONFIG } from '@/lib/pillar-colors'
import { eventTypeBadge } from '@/lib/events/types'
import type { HeroEvent } from './CinematicHero'

interface PastEventsListProps {
  /** Already filtered to past + sorted most-recent-first by the page. */
  events: HeroEvent[]
}

interface DateBadge {
  month: string
  day: string
  year: string
}

// Pin to timeZone: 'UTC' to match UpcomingEventsList / CinematicHero so server
// and client render identical strings (avoids #425/#422 hydration faults). The
// archive surface carries no user-state or countdown, so it renders on the
// server unlike the upcoming list — but the UTC pin is kept for consistency.
function formatDateBadge(iso: string): DateBadge {
  const d = new Date(iso)
  return {
    month: d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }).toUpperCase(),
    day: d.toLocaleDateString('en-US', { day: 'numeric', timeZone: 'UTC' }),
    year: d.toLocaleDateString('en-US', { year: 'numeric', timeZone: 'UTC' }),
  }
}

export function PastEventsList({ events }: PastEventsListProps) {
  // REQUIREMENT 6: hide the archive section entirely when there are no past events.
  if (events.length === 0) return null

  return (
    <section
      aria-label="Past events"
      style={{
        maxWidth: 1200,
        margin: '0 auto 64px',
        padding: '0 24px',
      }}
    >
      <h3
        style={{
          margin: '0 0 16px',
          fontFamily: '"Bebas Neue", sans-serif',
          fontSize: 22,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--text-primary)',
        }}
      >
        Past events
      </h3>

      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 12 }}>
        {events.map(event => {
          const badge = formatDateBadge(event.starts_at)
          const fmt = eventTypeBadge(event.event_type)
          const pillarConf = event.pillar && event.pillar >= 1 && event.pillar <= 6
            ? PILLAR_CONFIG[event.pillar]
            : null

          return (
            <li
              key={event.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '72px 1fr auto',
                gap: 16,
                alignItems: 'center',
                padding: '14px 16px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: 4,
                opacity: 0.92,
              }}
            >
              {/* Date badge */}
              <div
                style={{
                  textAlign: 'center',
                  padding: '8px 6px',
                  background: 'rgba(27,42,74,0.06)',
                  border: '1px solid rgba(27,42,74,0.12)',
                  borderRadius: 4,
                  minWidth: 60,
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontFamily: '"Barlow Condensed", sans-serif',
                    fontWeight: 700,
                    fontSize: 12,
                    letterSpacing: '0.22em',
                    color: 'var(--text-tertiary)',
                  }}
                >
                  {badge.month}
                </p>
                <p
                  style={{
                    margin: '2px 0 0',
                    fontFamily: '"Bebas Neue", sans-serif',
                    fontSize: 22,
                    color: 'var(--text-primary)',
                    lineHeight: 1,
                  }}
                >
                  {badge.day}
                </p>
                <p
                  style={{
                    margin: '4px 0 0',
                    fontFamily: '"Barlow Condensed", sans-serif',
                    fontWeight: 600,
                    fontSize: 12,
                    letterSpacing: '0.14em',
                    color: 'var(--text-tertiary)',
                    textTransform: 'uppercase',
                  }}
                >
                  {badge.year}
                </p>
              </div>

              {/* Body */}
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '2px 8px',
                      fontFamily: '"Barlow Condensed", sans-serif',
                      fontWeight: 700,
                      fontSize: 12,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      background: fmt.background,
                      color: fmt.color,
                      border: `1px solid ${fmt.border}`,
                    }}
                  >
                    {fmt.label}
                  </span>
                  {pillarConf && (
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        fontFamily: '"Barlow Condensed", sans-serif',
                        fontWeight: 700,
                        fontSize: 12,
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        background: `${pillarConf.color}1A`,
                        color: pillarConf.color,
                        border: `1px solid ${pillarConf.color}55`,
                      }}
                    >
                      {pillarConf.label}
                    </span>
                  )}
                </div>
                <Link
                  href={`/events/${event.id}`}
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    margin: '6px 0 4px',
                    fontFamily: '"Barlow", sans-serif',
                    fontSize: 16,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    textDecoration: 'none',
                    overflow: 'hidden',
                  }}
                >
                  {event.title}
                </Link>
              </div>

              {/* CTA — REQUIREMENT 4: surface recording_url when present, hide otherwise. */}
              {event.recording_url ? (
                <a
                  href={event.recording_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '10px 18px',
                    fontFamily: '"Barlow Condensed", sans-serif',
                    fontWeight: 700,
                    fontSize: 12,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    background: 'transparent',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    textDecoration: 'none',
                    minWidth: 90,
                    minHeight: 44,
                  }}
                >
                  ▶ Watch recording
                </a>
              ) : (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '10px 18px',
                    fontFamily: '"Barlow Condensed", sans-serif',
                    fontWeight: 600,
                    fontSize: 12,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: 'var(--text-tertiary)',
                    minWidth: 90,
                  }}
                >
                  Ended
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
