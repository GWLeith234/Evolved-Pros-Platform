import Image from 'next/image'
import { Bebas_Neue } from 'next/font/google'

const bebasNeue = Bebas_Neue({ weight: '400', subsets: ['latin'] })

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
    fontSize,
    letterSpacing: '0.05em',
    color: textColor,
    lineHeight: 1,
    // Bebas Neue trailing letter-spacing on last char shifts the icon slightly —
    // pull the span right-edge back flush with the glyph.
    display: 'inline-block',
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1px',
        maxWidth: '100%',
        overflow: 'hidden',
      }}
    >
      {/* "EVOLVED PR" */}
      <span className={bebasNeue.className} style={letterStyle}>
        EVOLVED PR
      </span>

      {/* Icon replaces the O in PROS */}
      <div
        style={{
          width: fontSize,
          height: fontSize,
          borderRadius: '50%',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <Image
          src={ICON_URL}
          alt=""
          width={fontSize}
          height={fontSize}
          priority
          style={{ display: 'block', width: fontSize, height: fontSize }}
        />
      </div>

      {/* "S" */}
      <span className={bebasNeue.className} style={letterStyle}>
        S
      </span>
    </div>
  )
}
