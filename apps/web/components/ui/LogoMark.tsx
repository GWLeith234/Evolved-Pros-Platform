interface LogoMarkProps {
  /** 'light' = white text for dark backgrounds (TopNav)
   *  'dark'  = navy text for light backgrounds (login page) */
  variant?: 'light' | 'dark'
  height?: number
}

export function LogoMark({ variant = 'light', height: _height = 36 }: LogoMarkProps) {
  const textColor = variant === 'dark' ? '#1B2A4A' : '#ffffff'

  const letterStyle: React.CSSProperties = {
    fontFamily: '"Barlow Condensed", sans-serif',
    fontWeight: 900,
    fontSize: 15,
    letterSpacing: '0.05em',
    color: textColor,
    lineHeight: 1,
    display: 'inline-block',
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      {/* "EVOLVED PR" */}
      <span style={letterStyle}>EVOLVED PR</span>

      {/* Red circle mic icon — exactly 15px × 15px to match cap height */}
      <div
        className="mx-[1px]"
        style={{
          width: 15,
          height: 15,
          borderRadius: '50%',
          backgroundColor: '#C9302A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <svg width="9" height="11" viewBox="0 0 9 11" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          {/* Vintage mic body */}
          <rect x="2" y="0.5" width="5" height="6" rx="2.5" fill="white" />
          {/* Mic grille lines */}
          <line x1="2.5" y1="2" x2="6.5" y2="2" stroke="#C9302A" strokeWidth="0.6" />
          <line x1="2.5" y1="3.5" x2="6.5" y2="3.5" stroke="#C9302A" strokeWidth="0.6" />
          <line x1="2.5" y1="5" x2="6.5" y2="5" stroke="#C9302A" strokeWidth="0.6" />
          {/* Mic stand arc */}
          <path d="M1 6.5 Q4.5 9 8 6.5" stroke="white" strokeWidth="0.8" fill="none" />
          {/* Stand base */}
          <line x1="4.5" y1="9" x2="4.5" y2="10.5" stroke="white" strokeWidth="0.8" />
          <line x1="3" y1="10.5" x2="6" y2="10.5" stroke="white" strokeWidth="0.8" />
        </svg>
      </div>

      {/* "S" */}
      <span style={letterStyle}>S</span>
    </div>
  )
}
