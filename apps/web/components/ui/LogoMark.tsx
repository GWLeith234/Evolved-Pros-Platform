interface LogoMarkProps {
  /** 'light' = white text for dark backgrounds (TopNav default)
   *  'dark'  = navy text for light backgrounds (login page) */
  variant?: 'light' | 'dark'
  height?: number
}

export function LogoMark({ variant = 'light', height = 36 }: LogoMarkProps) {
  const textColor = variant === 'dark' ? '#1B2A4A' : '#ffffff'
  const fontSize = Math.round(height * 0.583)   // ~21px at h=36, ~35px at h=60
  const micSize = Math.round(height * 0.778)    // ~28px at h=36, ~47px at h=60

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: Math.round(height * 0.194), height }}>
      <span style={{
        fontFamily: '"Barlow Condensed", sans-serif',
        fontWeight: 900,
        fontSize,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: textColor,
        lineHeight: 1,
      }}>EVOLVED</span>

      {/* Red mic circle */}
      <svg
        width={micSize}
        height={micSize}
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <circle cx="14" cy="14" r="14" fill="#C0272D"/>
        {/* Mic body */}
        <rect x="11" y="6" width="6" height="10" rx="3" fill="white"/>
        {/* Mic stand arc */}
        <path d="M8 14c0 3.314 2.686 6 6 6s6-2.686 6-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
        {/* Mic stem */}
        <line x1="14" y1="20" x2="14" y2="23" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        {/* Base */}
        <line x1="11" y1="23" x2="17" y2="23" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>

      <span style={{
        fontFamily: '"Barlow Condensed", sans-serif',
        fontWeight: 900,
        fontSize,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: textColor,
        lineHeight: 1,
      }}>PROS</span>
    </div>
  )
}
