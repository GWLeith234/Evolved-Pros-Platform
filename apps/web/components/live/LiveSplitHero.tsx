import { SPEAKING_STATS } from '@/lib/live/speaking-pins'

const FB = 'Barlow, sans-serif'
const FBC = 'Barlow Condensed, sans-serif'
const FBN = 'Bebas Neue, sans-serif'
const FP = 'Playfair Display, Georgia, serif'

const STATS = [
  { k: 'stages worldwide', v: `${SPEAKING_STATS.talks}+` },
  { k: 'countries',        v: String(SPEAKING_STATS.countries) },
  { k: 'mentees coached',  v: SPEAKING_STATS.mentees },
]

export function LiveSplitHero({ photo = '/live/george-stage-blue-jacket.jpg' }: { photo?: string }) {
  return (
    <section
      style={{
        position: 'relative',
        maxWidth: 1280,
        margin: '0 auto',
        padding: '32px 24px 0',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '6fr 6fr',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-soft2)',
          borderTop: '3px solid #C9A84C',
          minHeight: 520,
          overflow: 'hidden',
        }}
      >
        {/* LEFT — copy */}
        <div
          style={{
            padding: '44px 44px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-elevated) 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef0e30' }} />
            <span
              style={{
                fontFamily: FBC,
                fontWeight: 700,
                fontSize: 11,
                letterSpacing: '0.32em',
                textTransform: 'uppercase',
                color: '#ef0e30',
              }}
            >
              Evolved Pros Live
            </span>
          </div>

          <h2
            style={{
              margin: 0,
              fontFamily: FP,
              fontWeight: 700,
              fontSize: 'clamp(34px, 4vw, 52px)',
              lineHeight: 1.05,
              letterSpacing: '-0.015em',
              color: 'var(--text-strong)',
              textWrap: 'pretty',
            }}
          >
            Bring the <span style={{ color: '#C9A84C' }}>EVOLVED</span> system to your stage.
          </h2>

          <p
            style={{
              margin: '18px 0 0',
              fontFamily: FB,
              fontSize: 17,
              lineHeight: 1.55,
              color: 'var(--text-2)',
              maxWidth: 540,
            }}
          >
            High-energy keynotes, workshops, and mastermind formats for sales conferences, SKOs, and revenue leadership summits. Powered by the EVOLVED Architecture™.
          </p>

          {/* Stats row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 0,
              marginTop: 32,
              borderTop: '1px solid var(--border-soft)',
              borderBottom: '1px solid var(--border-soft)',
            }}
          >
            {STATS.map((x, i) => (
              <div
                key={x.k}
                style={{
                  padding: '16px 14px',
                  borderLeft: i === 0 ? 'none' : '1px solid var(--border-soft)',
                }}
              >
                <p style={{ margin: 0, fontFamily: FBN, fontSize: 36, lineHeight: 1, letterSpacing: '0.04em', color: '#C9A84C' }}>{x.v}</p>
                <p
                  style={{
                    margin: '4px 0 0',
                    fontFamily: FBC,
                    fontWeight: 700,
                    fontSize: 10,
                    letterSpacing: '0.28em',
                    textTransform: 'uppercase',
                    color: 'var(--text-3)',
                  }}
                >
                  {x.k}
                </p>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
            <a
              href="mailto:george@evolvedpros.com?subject=Booking%20inquiry"
              style={{
                padding: '14px 28px',
                background: '#ef0e30',
                color: '#fff',
                border: '1px solid #ef0e30',
                fontFamily: FBC,
                fontWeight: 800,
                fontSize: 13,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                cursor: 'pointer',
                display: 'inline-block',
              }}
            >
              Inquire about booking
            </a>
          </div>
        </div>

        {/* RIGHT — photo */}
        <div style={{ position: 'relative', minHeight: 520, background: '#0A0F18' }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${photo})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center 30%',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(90deg, rgba(10,15,24,0.55) 0%, transparent 25%), linear-gradient(180deg, transparent 60%, rgba(10,15,24,0.55) 100%)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 20,
              right: 20,
              padding: '8px 12px',
              background: 'rgba(10,15,24,0.6)',
              border: '1px solid rgba(255,255,255,0.15)',
              backdropFilter: 'blur(8px)',
              fontFamily: FBC,
              fontWeight: 700,
              fontSize: 10,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.75)',
            }}
          >
            On Stage &middot; 2024
          </div>
        </div>
      </div>
    </section>
  )
}
