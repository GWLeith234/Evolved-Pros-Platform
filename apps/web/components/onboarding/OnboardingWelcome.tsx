interface Props {
  displayName: string
  onContinue: () => void
}

export function OnboardingWelcome({ displayName, onContinue }: Props) {
  const firstName = displayName?.split(' ')[0] || ''

  return (
    <div style={{ textAlign: 'center' }}>
      {/* Horizontal EVOLVED PROS wordmark with red mic (dark surface → white mark) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo_horizontal_dark.png"
        alt="Evolved Pros"
        style={{ height: 36, width: 'auto', marginBottom: 28, opacity: 0.95 }}
      />

      {/* Heading */}
      <h1
        style={{
          fontFamily: '"Barlow Condensed", sans-serif',
          fontWeight: 900,
          fontSize: 'clamp(28px, 6vw, 42px)',
          color: '#C9A84C',
          lineHeight: 1.1,
          margin: '0 0 16px',
          letterSpacing: '-0.01em',
        }}
      >
        Welcome to Evolved Pros{firstName ? `, ${firstName}` : ''}.
      </h1>

      {/* Subtext */}
      <p
        style={{
          fontFamily: 'Barlow, sans-serif',
          fontSize: '16px',
          color: 'rgba(250,249,247,0.55)',
          lineHeight: 1.6,
          margin: '0 0 32px',
          maxWidth: '420px',
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        Three quick steps, then straight into Foundation — your first course.
      </p>

      {/* Value prop — shorter for speed-to-first-lesson */}
      <div
        style={{
          backgroundColor: 'rgba(201,168,76,0.06)',
          border: '1px solid rgba(201,168,76,0.3)',
          borderRadius: '10px',
          padding: '16px 20px',
          marginBottom: '28px',
          textAlign: 'left',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {[
          { n: '1', text: 'Name + photo (optional)' },
          { n: '2', text: 'Pick your growth focus' },
          { n: '3', text: 'Start Foundation lesson 1' },
        ].map(({ n, text }) => (
          <div
            key={n}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontFamily: '"Barlow Condensed", sans-serif',
              fontSize: '14px',
              fontWeight: 600,
              letterSpacing: '0.03em',
              color: 'rgba(250,249,247,0.85)',
            }}
          >
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: 'rgba(201,168,76,0.2)',
                color: '#C9A84C',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 800,
                flexShrink: 0,
              }}
            >
              {n}
            </span>
            {text}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onContinue}
        style={{
          width: '100%',
          padding: '16px 24px',
          backgroundColor: '#C9302A',
          color: '#ffffff',
          fontFamily: '"Barlow Condensed", sans-serif',
          fontWeight: 900,
          fontSize: '15px',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.9' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
      >
        Start in under 2 minutes →
      </button>
    </div>
  )
}
