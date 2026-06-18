const FB = 'Barlow, sans-serif'
const FBC = 'Barlow Condensed, sans-serif'
const FBN = 'Bebas Neue, sans-serif'

export function LiveFinalCTA() {
  return (
    <section style={{ maxWidth: 1280, margin: '72px auto 80px', padding: '0 24px' }}>
      <div
        style={{
          background: 'linear-gradient(135deg, #1A2332 0%, #0D1B2A 100%)',
          border: '1px solid rgba(201,168,76,0.3)',
          padding: '56px 48px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Gold corner accents */}
        <span style={{ position: 'absolute', top: 0, left: 0, width: 80, height: 3, background: '#C9A84C' }} />
        <span style={{ position: 'absolute', top: 0, left: 0, width: 3, height: 80, background: '#C9A84C' }} />
        <span style={{ position: 'absolute', bottom: 0, right: 0, width: 80, height: 3, background: '#C9A84C' }} />
        <span style={{ position: 'absolute', bottom: 0, right: 0, width: 3, height: 80, background: '#C9A84C' }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 320 }}>
            <p
              style={{
                margin: 0,
                fontFamily: FBC,
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: '0.42em',
                textTransform: 'uppercase',
                color: '#C9A84C',
              }}
            >
              Now Booking
            </p>
            <h3
              style={{
                margin: '6px 0 14px',
                fontFamily: FBN,
                fontSize: 'clamp(56px, 7vw, 96px)',
                lineHeight: 0.95,
                letterSpacing: '0.02em',
                color: '#fff',
                textTransform: 'uppercase',
              }}
            >
              2026 <span style={{ color: '#C9A84C' }}>·</span> 2027
            </h3>
            <p
              style={{
                margin: 0,
                fontFamily: FB,
                fontSize: 16,
                lineHeight: 1.55,
                color: 'rgba(255,255,255,0.72)',
                maxWidth: 540,
              }}
            >
              Tell us about the room, the audience, and what you need them to walk out with. We&apos;ll come back within 48 hours.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 240 }}>
            <a
              href="mailto:george@evolvex360.com?subject=Booking%20request"
              style={{
                padding: '16px 32px',
                background: '#ef0e30',
                color: '#fff',
                border: '1px solid #ef0e30',
                fontFamily: FBC,
                fontWeight: 800,
                fontSize: 13,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                textDecoration: 'none',
                textAlign: 'center',
              }}
            >
              Request a date
            </a>
            <a
              href="https://udbwrapkshfjkctylbmm.supabase.co/storage/v1/object/public/Branding/Media%20Kit%202026.pdf"
              download="George-Leith-Media-Kit-2026.pdf"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '16px 32px',
                background: 'transparent',
                color: '#C9A84C',
                border: '1px solid rgba(201,168,76,0.5)',
                fontFamily: FBC,
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                textDecoration: 'none',
                textAlign: 'center',
              }}
            >
              Download speaker kit
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
