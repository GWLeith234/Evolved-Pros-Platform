import { PRODUCT_MILESTONES } from '@/lib/live/product-milestones'
import { LiveSectionHeader } from './LiveSectionHeader'

const FB = 'Barlow, sans-serif'
const FBC = 'Barlow Condensed, sans-serif'
const FBN = 'Bebas Neue, sans-serif'

/**
 * Compact product / platform milestones — kept off the speaking calendar.
 */
export function LiveProductMilestones() {
  if (!PRODUCT_MILESTONES.length) return null

  return (
    <section className="live-section-pad" style={{ margin: '56px auto 0' }}>
      <LiveSectionHeader
        eyebrow="Milestones"
        title="Product launches"
        kicker="Platform and media moments — not stage dates."
      />
      <ul
        style={{
          listStyle: 'none',
          margin: '20px 0 0',
          padding: 0,
          border: '1px solid var(--border-soft2)',
        }}
      >
        {PRODUCT_MILESTONES.map((m, i) => {
          const external = m.linkUrl?.startsWith('http')
          const inner = (
            <>
              <span
                style={{
                  fontFamily: FBN,
                  fontSize: 18,
                  letterSpacing: '0.04em',
                  color: '#C9A84C',
                  whiteSpace: 'nowrap',
                }}
              >
                {m.date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}{' '}
                {m.date.getDate()}, {m.date.getFullYear()}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    display: 'block',
                    fontFamily: FBC,
                    fontWeight: 700,
                    fontSize: 15,
                    letterSpacing: '0.04em',
                    color: 'var(--text-strong)',
                  }}
                >
                  {m.title}
                </span>
                {m.detail && (
                  <span
                    style={{
                      display: 'block',
                      marginTop: 4,
                      fontFamily: FB,
                      fontSize: 13,
                      lineHeight: 1.45,
                      color: 'var(--text-2)',
                    }}
                  >
                    {m.detail}
                  </span>
                )}
              </span>
              {m.linkUrl && (
                <span
                  style={{
                    fontFamily: FBC,
                    fontWeight: 700,
                    fontSize: 11,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: '#C9A84C',
                    flexShrink: 0,
                  }}
                >
                  {m.linkLabel ?? 'Open'} →
                </span>
              )}
            </>
          )

          const rowStyle = {
            display: 'flex',
            alignItems: 'flex-start',
            gap: 16,
            padding: '16px 18px',
            borderTop: i === 0 ? 'none' : '1px solid var(--border-soft)',
            background: i % 2 === 0 ? 'var(--bg-surface)' : 'transparent',
            textDecoration: 'none' as const,
            color: 'inherit',
          }

          return (
            <li key={`${m.title}-${m.date.toISOString()}`}>
              {m.linkUrl ? (
                <a
                  href={m.linkUrl}
                  target={external ? '_blank' : undefined}
                  rel={external ? 'noopener noreferrer' : undefined}
                  style={rowStyle}
                >
                  {inner}
                </a>
              ) : (
                <div style={rowStyle}>{inner}</div>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
