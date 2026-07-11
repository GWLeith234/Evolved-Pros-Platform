import { UPCOMING_DATES } from '@/lib/live/upcoming-dates'
import { LiveSectionHeader } from './LiveSectionHeader'

const FB = 'Barlow, sans-serif'
const FBC = 'Barlow Condensed, sans-serif'
const FBN = 'Bebas Neue, sans-serif'
const FP = 'Playfair Display, Georgia, serif'

export function LiveUpcomingDates() {
  return (
    <section style={{ maxWidth: 1280, margin: '64px auto 0', padding: '0 24px' }}>
      <LiveSectionHeader
        eyebrow="Where He's Headed"
        title="Upcoming speaking events"
        kicker="Confirmed dates and holds — city and country on every row."
      />
      <div style={{ marginTop: 24, border: '1px solid var(--border-soft2)' }}>
        {UPCOMING_DATES.map((d, i) => (
          <div
            key={`${d.event}-${i}`}
            className="live-upcoming-row"
            style={{
              padding: '24px',
              borderTop: i === 0 ? 'none' : '1px solid var(--border-soft)',
              background: i % 2 === 0 ? 'var(--bg-surface)' : 'transparent',
            }}
          >
            <div>
              <p
                style={{
                  margin: 0,
                  fontFamily: FBN,
                  fontSize: 28,
                  lineHeight: 1,
                  letterSpacing: '0.04em',
                  color: '#C9A84C',
                }}
              >
                {d.date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()} {d.date.getDate()}
              </p>
              <p
                style={{
                  margin: '4px 0 0',
                  fontFamily: FBC,
                  fontWeight: 600,
                  fontSize: 10,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: 'var(--text-3)',
                }}
              >
                {d.date.getFullYear()}
              </p>
            </div>
            <div>
              <p
                style={{
                  margin: 0,
                  fontFamily: FP,
                  fontWeight: 700,
                  fontSize: 20,
                  lineHeight: 1.2,
                  color: 'var(--text-strong)',
                }}
              >
                {d.event}
              </p>
              <p
                style={{
                  margin: '4px 0 0',
                  fontFamily: FBC,
                  fontWeight: 600,
                  fontSize: 10,
                  letterSpacing: '0.28em',
                  textTransform: 'uppercase',
                  color: '#C9A84C',
                }}
              >
                {d.country ? `${d.city} · ${d.country}` : d.city}
              </p>
              {d.detail && (
                <p
                  style={{
                    margin: '12px 0 0',
                    fontFamily: FB,
                    fontSize: 14,
                    lineHeight: 1.55,
                    color: 'var(--text-2)',
                    maxWidth: 620,
                  }}
                >
                  {d.detail}
                </p>
              )}
              {d.linkUrl && (
                <a
                  href={d.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    marginTop: 12,
                    fontFamily: FBC,
                    fontWeight: 700,
                    fontSize: 11,
                    letterSpacing: '0.24em',
                    textTransform: 'uppercase',
                    color: '#C9A84C',
                    textDecoration: 'none',
                    borderBottom: '1px solid rgba(201,168,76,0.4)',
                    paddingBottom: 2,
                  }}
                >
                  {d.linkLabel ?? 'Details'} →
                </a>
              )}
            </div>
            <div style={{ justifySelf: 'end' }}>
              <span
                style={{
                  padding: '4px 10px',
                  background: d.tag === 'CONFIRMED' ? 'rgba(10,191,163,0.12)' : 'rgba(201,168,76,0.12)',
                  border: `1px solid ${d.tag === 'CONFIRMED' ? 'rgba(10,191,163,0.4)' : 'rgba(201,168,76,0.4)'}`,
                  fontFamily: FBC,
                  fontWeight: 800,
                  fontSize: 9,
                  letterSpacing: '0.28em',
                  textTransform: 'uppercase',
                  color: d.tag === 'CONFIRMED' ? '#0ABFA3' : '#C9A84C',
                }}
              >
                {d.tag}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
