// Shared branded full-screen loading state used by route segment
// loading.tsx files. Dark surface, pulsing horizontal EVOLVED PROS
// logo with red mic, kills the white-flash transitions.
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
        background: 'var(--bg-page, #0A0F18)',
        minHeight: '100%',
        width: '100%',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo_horizontal_dark.png"
          alt=""
          aria-hidden="true"
          width={200}
          height={40}
          style={{
            width: 200,
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
            color: 'var(--text-tertiary, rgba(255,255,255,0.55))',
          }}
        >
          Evolved Pros
        </p>
      </div>
    </div>
  )
}
