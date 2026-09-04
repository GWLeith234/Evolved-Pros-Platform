/**
 * Canonical EVOLVED PROS horizontal wordmark with red microphone disc.
 * Uses the high-res PNG lockups so every surface (nav, login, loading,
 * onboarding) renders the same brand mark.
 *
 *  - variant="light" → white wordmark for dark backgrounds
 *  - variant="dark"  → navy wordmark for light / parchment backgrounds
 */
interface LogoMarkProps {
  variant?: 'light' | 'dark'
  height?: number
  className?: string
  alt?: string
}

const SRC: Record<'light' | 'dark', string> = {
  light: '/logo_horizontal_dark.png',
  dark: '/logo_horizontal_navy.png',
}

export function LogoMark({
  variant = 'light',
  height = 36,
  className,
  alt = 'Evolved Pros',
}: LogoMarkProps) {
  // Intrinsic asset is 5:1. Reserve both axes so a late PNG decode cannot
  // shove JOIN FREE onto the next row (mobile homepage CLS).
  const width = Math.round(height * 5)

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={SRC[variant]}
      alt={alt}
      width={width}
      height={height}
      className={className}
      style={{
        height,
        width,
        display: 'block',
        objectFit: 'contain',
      }}
    />
  )
}
