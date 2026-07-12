const FB = 'Barlow, sans-serif'
const FBC = 'Barlow Condensed, sans-serif'
const FBN = 'Bebas Neue, sans-serif'
const FP = 'Playfair Display, Georgia, serif'

export function LiveMasthead() {
  return (
    <header
      className="live-section-pad"
      style={{
        margin: '0 auto',
        paddingTop: 32,
        paddingBottom: 20,
        borderBottom: '1px solid var(--border-soft2)',
        fontFamily: FB,
      }}
    >
      <p
        style={{
          margin: 0,
          fontFamily: FBC,
          fontWeight: 700,
          fontSize: 11,
          letterSpacing: '0.42em',
          textTransform: 'uppercase',
          color: 'rgba(201,168,76,0.85)',
        }}
      >
        Evolved Pros
      </p>
      <h1
        className="live-masthead-title"
        style={{
          margin: '6px 0 8px',
          fontFamily: FBN,
          letterSpacing: '0.06em',
          color: 'var(--text-strong)',
          textTransform: 'uppercase',
          lineHeight: 1,
        }}
      >
        Live
      </h1>
      <p
        style={{
          margin: 0,
          fontFamily: FP,
          fontStyle: 'italic',
          fontSize: 16,
          lineHeight: 1.5,
          color: 'var(--text-2)',
          maxWidth: 720,
        }}
      >
        Keynotes, panels, and workshops &mdash; from the field, from the trenches, and on stages around the world.
      </p>
    </header>
  )
}
