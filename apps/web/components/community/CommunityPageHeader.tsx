// Editorial header for /community. Purely presentational — no props.
// Reads colors from --community-header-* tokens so it themes automatically.
export function CommunityPageHeader() {
  return (
    <header style={{ padding: '32px 24px' }}>
      <p
        style={{
          margin: 0,
          fontFamily: '"Barlow Condensed", sans-serif',
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: 'var(--community-header-eyebrow)',
        }}
      >
        Evolved Pros
      </p>
      <h1
        className="ep-type-display"
        style={{
          margin: '8px 0 0',
          color: 'var(--community-header-title)',
          overflowWrap: 'break-word',
          wordBreak: 'break-word',
        }}
      >
        Community
      </h1>
      <p
        style={{
          margin: '8px 0 0',
          maxWidth: 520,
          fontFamily: '"Playfair Display", serif',
          fontStyle: 'italic',
          fontSize: 'var(--type-body-size, 16px)',
          lineHeight: 1.4,
          color: 'var(--community-header-tagline)',
        }}
      >
        Where high-performing sales professionals share wins, ask hard questions, and hold each other accountable.
      </p>
    </header>
  )
}
