import Image from 'next/image'

const ICON_URL =
  'https://udbwrapkshfjkctylbmm.supabase.co/storage/v1/object/public/Branding/ep_podcast_icon_transparent.png'

interface LogoMarkProps {
  /** 'light' = white text for dark backgrounds (TopNav default)
   *  'dark'  = navy text for light backgrounds (login page) */
  variant?: 'light' | 'dark'
  height?: number
}

export function LogoMark({ variant = 'light', height = 36 }: LogoMarkProps) {
  const textColor = variant === 'dark' ? '#1B2A4A' : '#ffffff'
  const fontSize  = Math.round(height * 0.55)
  const gap       = Math.round(height * 0.3)

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap,
        height,
        maxWidth: '100%',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Podcast icon — borderRadius 50% clips black background corners */}
      <div
        style={{
          width: height,
          height: height,
          borderRadius: '50%',
          overflow: 'hidden',
          flexShrink: 0,
          position: 'relative',
        }}
      >
        <Image
          src={ICON_URL}
          alt=""
          width={height}
          height={height}
          priority
          style={{ display: 'block', width: height, height: height }}
        />
      </div>

      <span
        style={{
          fontFamily: 'var(--font-logo), Montserrat, sans-serif',
          fontWeight: 800,
          fontSize,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: textColor,
          lineHeight: 1,
          whiteSpace: 'nowrap',
        }}
      >
        EVOLVED PROS
      </span>
    </div>
  )
}
