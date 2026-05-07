import Image from 'next/image'

// Shared branded full-screen loading state used by route segment
// loading.tsx files. Dark surface, pulsing logo mark, "EVOLVED PROS"
// wordmark — kills the white-flash transitions.
export function BrandedLoading() {
  return (
    <div
      role="status"
      aria-label="Loading"
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0A0F18',
        minHeight: '100%',
        width: '100%',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
        <Image
          src="/logo_nav_dark.png"
          alt=""
          aria-hidden="true"
          width={120}
          height={120}
          style={{
            width: 120,
            height: 'auto',
            objectFit: 'contain',
            animation: 'brand-loading-pulse 1.5s ease-in-out infinite',
            willChange: 'transform, opacity',
          }}
        />
        <p
          style={{
            margin: 0,
            fontFamily: '"Barlow Condensed", sans-serif',
            fontWeight: 700,
            fontSize: 11,
            letterSpacing: '0.4em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.55)',
          }}
        >
          Evolved Pros
        </p>
      </div>
    </div>
  )
}
