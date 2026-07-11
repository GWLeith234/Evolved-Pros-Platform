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
        You&apos;re now part of an elite community of sales professionals.
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
          { icon: '\u{1F4DA}', text: '6-pillar academy \u2014 Foundation through Execution' },
          { icon: '\u{1F465}', text: 'Community of elite sales peers' },
          { icon: '\u{1F4CA}', text: 'Scoreboard & weekly accountability' },
          { icon: '\u{1F399}\uFE0F', text: 'The Evolved Pros Podcast' },
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
          backgroundColor: '#0ABFA3',
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
        LET&apos;S GET STARTED &rarr;
      </button>
    </div>
  )
}
