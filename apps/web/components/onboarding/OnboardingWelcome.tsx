interface Props {
  onContinue: () => void
}

export function OnboardingWelcome({ onContinue }: Props) {
  return (
    <div style={{ textAlign: 'center' }}>
      {/* Heading */}
      <h1
        style={{
          fontFamily: '"Barlow Condensed", sans-serif',
          fontWeight: 900,
          fontSize: 'clamp(32px, 6vw, 48px)',
          color: '#faf9f7',
          lineHeight: 1.05,
          margin: '0 0 16px',
          letterSpacing: '-0.01em',
        }}
      >
        Welcome to Evolved Pros.
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
        The platform for sales professionals who refuse to plateau.
        Let&apos;s get you set up in 2 minutes.
      </p>

      {/* Value prop card */}
      <div
        style={{
          backgroundColor: 'rgba(201,168,76,0.06)',
          border: '1px solid rgba(201,168,76,0.3)',
          borderRadius: '10px',
          padding: '20px 24px',
          marginBottom: '36px',
          textAlign: 'left',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        {[
          { icon: '📚', text: '6-pillar academy — Foundation through Execution' },
          { icon: '👥', text: 'Community of elite sales peers' },
          { icon: '📊', text: 'Scoreboard & weekly accountability' },
          { icon: '🎙', text: 'Conquer Local podcast' },
        ].map(({ icon, text }) => (
          <div
            key={text}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontFamily: '"Barlow Condensed", sans-serif',
              fontSize: '14px',
              fontWeight: 600,
              letterSpacing: '0.03em',
              color: 'rgba(250,249,247,0.8)',
            }}
          >
            <span style={{ fontSize: '18px', lineHeight: 1 }}>{icon}</span>
            {text}
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={onContinue}
        style={{
          width: '100%',
          padding: '16px 24px',
          backgroundColor: '#C9A84C',
          color: '#0A0F18',
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
        LET&apos;S GO →
      </button>
    </div>
  )
}
