// Editorial header for /events. Mirrors CommunityPageHeader's structure
// (eyebrow + display heading) — events are visual, so no tagline.
// All colors come from existing globals tokens (--text-tertiary,
// --text-primary, --border-color), so it themes automatically.
export function EventsPageHeader() {
  return (
    <header
      style={{
        padding: '80px 24px 32px',
        borderBottom: '1px solid var(--border-color)',
      }}
    >
      <p
        style={{
          margin: 0,
          fontFamily: '"Barlow Condensed", sans-serif',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.32em',
          textTransform: 'uppercase',
          color: 'var(--text-tertiary)',
        }}
      >
        Evolved Pros
      </p>
      <h1
        style={{
          margin: '8px 0 0',
          fontFamily: '"Bebas Neue", sans-serif',
          fontSize: 'clamp(64px, 9vw, 88px)',
          lineHeight: 0.95,
          letterSpacing: '0.02em',
          color: 'var(--text-primary)',
          textTransform: 'uppercase',
        }}
      >
        Events
      </h1>
    </header>
  )
}
