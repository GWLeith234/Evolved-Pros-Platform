import { LIVE_TESTIMONIALS } from '@/lib/live/testimonials'
import { LiveSectionHeader } from './LiveSectionHeader'

const FB = 'Barlow, sans-serif'
const FBC = 'Barlow Condensed, sans-serif'
const FP = 'Playfair Display, Georgia, serif'

export function LiveTestimonials() {
  return (
    <section style={{ maxWidth: 1280, margin: '72px auto 0', padding: '0 24px' }}>
      <LiveSectionHeader eyebrow="From the Hosts" title="What organizers say" />
      <div
        style={{
          marginTop: 24,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 24,
        }}
      >
        {LIVE_TESTIMONIALS.map((t, i) => (
          <div
            key={`${t.author}-${i}`}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-soft2)',
              borderTop: '3px solid #C9A84C',
              padding: '32px 28px 28px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <p
              style={{
                margin: 0,
                fontFamily: FP,
                fontWeight: 400,
                fontSize: 56,
                lineHeight: 0.6,
                color: '#C9A84C',
                opacity: 0.6,
              }}
            >
              &ldquo;
            </p>
            <p
              style={{
                margin: '8px 0 0',
                fontFamily: FP,
                fontStyle: 'italic',
                fontSize: 18,
                lineHeight: 1.45,
                color: 'var(--text-1)',
                flex: 1,
              }}
            >
              {t.quote}
            </p>
            <div style={{ marginTop: 22, paddingTop: 16, borderTop: '1px solid var(--border-soft)' }}>
              <p style={{ margin: 0, fontFamily: FB, fontSize: 14, fontWeight: 600, color: 'var(--text-strong)' }}>
                {t.author}
              </p>
              <p style={{ margin: '2px 0 0', fontFamily: FB, fontSize: 12, color: 'var(--text-3)' }}>{t.role}</p>
              <p
                style={{
                  margin: '8px 0 0',
                  fontFamily: FBC,
                  fontWeight: 700,
                  fontSize: 9,
                  letterSpacing: '0.28em',
                  textTransform: 'uppercase',
                  color: '#C9A84C',
                }}
              >
                {t.event}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
