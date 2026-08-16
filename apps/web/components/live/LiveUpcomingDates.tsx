import { getUpcomingSpeakingDates } from '@/lib/live/upcoming-dates'
import { LiveSectionHeader } from './LiveSectionHeader'

const FB = 'Barlow, sans-serif'
const FBC = 'Barlow Condensed, sans-serif'
const FBN = 'Bebas Neue, sans-serif'
const FP = 'Playfair Display, Georgia, serif'

const BOOKING_HREF =
  'mailto:george@evolvex360.com?subject=Keynote%20Speaking%20Inquiry'

/**
 * Where upcoming stage dates live. Past product-launch fluff was removed —
 * this section is speaking-only, with an empty state when nothing is locked.
 */
export async function LiveUpcomingDates() {
  const dates = await getUpcomingSpeakingDates()

  return (
    <section className="live-section-pad" style={{ margin: '64px auto 0' }}>
      <LiveSectionHeader
        eyebrow="Where He's Headed"
        title="Upcoming speaking events"
        kicker={
          dates.length
            ? 'Confirmed dates and holds — city and country on every row.'
            : 'This is where confirmed dates and holds land — city and country on every row.'
        }
      />

      {dates.length === 0 ? (
        <div
          style={{
            marginTop: 24,
            border: '1px solid var(--border-soft2)',
            borderLeft: '3px solid #C9A84C',
            background: 'var(--bg-surface)',
            padding: '28px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            alignItems: 'flex-start',
          }}
        >
          <p
            style={{
              margin: 0,
              fontFamily: FP,
              fontWeight: 700,
              fontSize: 22,
              lineHeight: 1.25,
              color: 'var(--text-strong)',
            }}
          >
            No confirmed stage dates listed yet.
          </p>
          <p
            style={{
              margin: 0,
              fontFamily: FB,
              fontSize: 15,
              lineHeight: 1.55,
              color: 'var(--text-2)',
              maxWidth: 560,
            }}
          >
            When a keynote, panel, or workshop is locked, it shows up here with the
            city. Past stages live on the map below — cities only, no long write-ups.
          </p>
          <a
            href={BOOKING_HREF}
            className="ep-pressable ep-touch-target"
            style={{
              marginTop: 4,
              padding: '12px 22px',
              minHeight: 44,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#ef0e30',
              color: '#fff',
              border: '1px solid #ef0e30',
              fontFamily: FBC,
              fontWeight: 800,
              fontSize: 12,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              textDecoration: 'none',
            }}
          >
            Inquire about booking
          </a>
        </div>
      ) : (
        <div style={{ marginTop: 24, border: '1px solid var(--border-soft2)' }}>
          {dates.map((d, i) => (
            <div
              key={`${d.event}-${d.date.toISOString()}`}
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
                  {d.date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}{' '}
                  {d.date.getDate()}
                </p>
                <p
                  style={{
                    margin: '4px 0 0',
                    fontFamily: FBC,
                    fontWeight: 600,
                    fontSize: 11,
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
                    fontSize: 11,
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
                      fontSize: 15,
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
                    background:
                      d.tag === 'CONFIRMED' ? 'rgba(10,191,163,0.12)' : 'rgba(201,168,76,0.12)',
                    border: `1px solid ${
                      d.tag === 'CONFIRMED' ? 'rgba(10,191,163,0.45)' : 'rgba(201,168,76,0.45)'
                    }`,
                    fontFamily: FBC,
                    fontWeight: 800,
                    fontSize: 10,
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
      )}
    </section>
  )
}
