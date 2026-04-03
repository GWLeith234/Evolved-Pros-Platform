// Font loaded via --font-logo CSS variable in app/layout.tsx (Bebas_Neue weight 400)
// Using var(--font-logo) here avoids next/font/google in a component that is
// consumed by Client Components (TopNav), which can cause hydration mismatches.

const ICON_URL =
  'https://udbwrapkshfjkctylbmm.supabase.co/storage/v1/object/public/Branding/ep_podcast_icon_transparent.png'

interface LogoMarkProps {
  /** 'light' = white text for dark backgrounds (TopNav)
   *  'dark'  = navy text for light backgrounds (login page) */
  variant?: 'light' | 'dark'
  height?: number
}

export function LogoMark({ variant = 'light', height = 36 }: LogoMarkProps) {
  const textColor = variant === 'dark' ? '#1B2A4A' : '#ffffff'
  const fontSize  = Math.round(height * 0.88)

  const letterStyle: React.CSSProperties = {
    fontFamily: 'var(--font-logo), "Bebas Neue", sans-serif',
    fontSize,
    letterSpacing: '0.05em',
    color: textColor,
    lineHeight: 1,
    display: 'inline-block',
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        maxWidth: '100%',
        overflow: 'hidden',
      }}
    >
      {/* "EVOLVED PR" */}
      <span style={letterStyle}>EVOLVED PR</span>

      {/* Icon replaces the O in PROS — plain img so overflow:hidden clips reliably */}
      <div
        style={{
          width: Math.round(fontSize * 1.12),
          height: Math.round(fontSize * 1.12),
          borderRadius: '50%',
          overflow: 'hidden',
          flexShrink: 0,
          marginLeft: 1,
          marginRight: 1,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={ICON_URL}
          alt=""
          width={Math.round(fontSize * 1.12)}
          height={Math.round(fontSize * 1.12)}
          style={{ display: 'block', width: Math.round(fontSize * 1.12), height: Math.round(fontSize * 1.12) }}
        />
      </div>

      {/* "S" */}
      <span style={letterStyle}>S</span>
    </div>
  )
}
