const FB = 'var(--font-barlow)'
const FBC = 'var(--font-barlow-condensed)'
const FBN = 'var(--font-bebas)'

export function PodcastMasthead() {
  return (
    <header
      style={{
        position: 'relative',
        zIndex: 1,
        maxWidth: 1280,
        margin: '0 auto',
        padding: '32px 24px 24px',
        borderBottom: '1px solid var(--podcast-border-soft2)',
        fontFamily: FB,
      }}
    >
      <p
        style={{
          margin: 0,
          fontFamily: FBC,
          fontWeight: 700,
          fontSize: 12,
          letterSpacing: '0.42em',
          textTransform: 'uppercase',
          color: 'rgba(201,168,76,0.85)',
        }}
      >
        The Evolved Pros
      </p>
      <h1
        style={{
          margin: '6px 0 8px',
          fontFamily: FBN,
          fontSize: 'clamp(40px, 11vw, 64px)',
          letterSpacing: '0.04em',
          color: 'var(--podcast-text-strong)',
          textTransform: 'uppercase',
          lineHeight: 1,
        }}
      >
        The podcast
      </h1>
      <p
        style={{
          margin: 0,
          fontFamily: FB,
          fontSize: 16,
          lineHeight: 1.5,
          color: 'var(--podcast-text-2)',
          maxWidth: 640,
        }}
      >
        Real conversations with the pros who are crushing it. From the field, from the trenches, and in real life.
      </p>
    </header>
  )
}
