import {
  SEE_EVENTS_HREF,
  SEE_EVENTS_LABEL,
  SEE_EVENTS_TOOLTIP,
} from '@/lib/live/s4-cta'
import { getUpcomingSpeakingDates, type UpcomingDate } from '@/lib/live/upcoming-dates'
import { sanitizeSpeakingLinkUrl } from '@/lib/live/upcoming-dates-shared'
import { Tooltip } from '@/components/ui/Tooltip'
import { InquireBookingButton } from './InquireBookingButton'
import { LiveSectionHeader } from './LiveSectionHeader'

const FB = 'Barlow, sans-serif'
const FBC = 'Barlow Condensed, sans-serif'
const FBN = 'Bebas Neue, sans-serif'
const FP = 'Playfair Display, Georgia, serif'

function DateRow({ d, index }: { d: UpcomingDate; index: number }) {
  return (
    <div
      className="live-upcoming-row"
      style={{
        padding: '24px',
        borderTop: index === 0 ? 'none' : '1px solid var(--border-soft)',
        background: index % 2 === 0 ? 'var(--bg-surface)' : 'transparent',
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
            color: 'var(--brand-gold)',
          }}
        >
          {d.date.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }).toUpperCase()}{' '}
          {d.date.getUTCDate()}
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
          {d.date.getUTCFullYear()}
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
            color: 'var(--brand-gold)',
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
        {(() => {
          const safeHref = sanitizeSpeakingLinkUrl(d.linkUrl)
          if (!safeHref) return null
          return (
          <a
            href={safeHref}
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
              color: 'var(--brand-gold)',
              textDecoration: 'none',
              borderBottom: '1px solid rgba(201,168,76,0.4)',
              paddingBottom: 2,
            }}
          >
            {d.linkLabel ?? 'Details'} →
          </a>
          )
        })()}
      </div>
      <div style={{ justifySelf: 'end' }}>
        <span
          style={{
            padding: '4px 10px',
            background: d.tag === 'CONFIRMED' ? 'rgba(10,191,163,0.12)' : 'rgba(201,168,76,0.12)',
            border: `1px solid ${
              d.tag === 'CONFIRMED' ? 'rgba(10,191,163,0.45)' : 'rgba(201,168,76,0.45)'
            }`,
            fontFamily: FBC,
            fontWeight: 800,
            fontSize: 10,
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: d.tag === 'CONFIRMED' ? 'var(--brand-teal)' : 'var(--brand-gold)',
          }}
        >
          {d.tag}
        </span>
      </div>
    </div>
  )
}

function DateList({ rows }: { rows: UpcomingDate[] }) {
  return (
    <div style={{ border: '1px solid var(--border-soft2)' }}>
      {rows.map((d, i) => (
        <DateRow key={d.id ?? `${d.event}-${d.date.toISOString()}`} d={d} index={i} />
      ))}
    </div>
  )
}

/**
 * Speaking-only upcoming calendar. Confirmed and holds are separate blocks
 * when both exist; product launches live in LiveProductMilestones.
 */
export async function LiveUpcomingDates() {
  const dates = await getUpcomingSpeakingDates()
  const confirmed = dates.filter(d => d.tag === 'CONFIRMED')
  const holds = dates.filter(d => d.tag === 'HOLD')

  return (
    <section className="live-section-pad" style={{ margin: '64px auto 0' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <LiveSectionHeader
          eyebrow="Where He's Headed"
          title="Upcoming speaking events"
          kicker={
            dates.length
              ? 'Confirmed dates first — holds underneath when we have them.'
              : 'This is where confirmed dates and holds land — city and country on every row.'
          }
        />
        <Tooltip content={SEE_EVENTS_TOOLTIP}>
          <a
            href={SEE_EVENTS_HREF}
            className="ep-pressable ep-touch-target"
            style={{
              fontFamily: FBC,
              fontWeight: 800,
              fontSize: 12,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--brand-gold)',
              textDecoration: 'none',
              minHeight: 44,
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            {SEE_EVENTS_LABEL}
          </a>
        </Tooltip>
      </div>

      {dates.length === 0 ? (
        <div
          style={{
            marginTop: 24,
            border: '1px solid var(--border-soft2)',
            borderLeft: '3px solid var(--brand-gold)',
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
            When a keynote, panel, or workshop is locked, it shows up here with the city.
            Past stages live on the map below — cities only, no long write-ups.
          </p>
          <InquireBookingButton
            className="ep-pressable ep-touch-target"
            style={{
              marginTop: 4,
              padding: '12px 22px',
              minHeight: 44,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--brand-red-hot)',
              color: 'var(--white)',
              border: '1px solid var(--brand-red-hot)',
              fontFamily: FBC,
              fontWeight: 800,
              fontSize: 12,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
            }}
          />
        </div>
      ) : (
        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 28 }}>
          {confirmed.length > 0 && <DateList rows={confirmed} />}

          {confirmed.length === 0 && holds.length > 0 && (
            <p
              style={{
                margin: 0,
                fontFamily: FB,
                fontSize: 14,
                color: 'var(--text-2)',
              }}
            >
              No confirmed dates yet — holds below.
            </p>
          )}

          {holds.length > 0 && (
            <div>
              <p
                style={{
                  margin: '0 0 12px',
                  fontFamily: FBC,
                  fontWeight: 800,
                  fontSize: 12,
                  letterSpacing: '0.28em',
                  textTransform: 'uppercase',
                  color: 'var(--brand-gold)',
                }}
              >
                On hold
              </p>
              <p
                style={{
                  margin: '0 0 14px',
                  fontFamily: FP,
                  fontStyle: 'italic',
                  fontSize: 15,
                  color: 'var(--text-2)',
                  maxWidth: 480,
                }}
              >
                Penciled dates — city locked, final confirmation pending.
              </p>
              <DateList rows={holds} />
            </div>
          )}
        </div>
      )}
    </section>
  )
}
