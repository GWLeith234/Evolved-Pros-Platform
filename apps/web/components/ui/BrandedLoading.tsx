// Shared branded full-screen loading state used by route segment
// loading.tsx files. Theme-aware "Evolution" loader: the horizontal
// EVOLVED PROS wordmark (navy on light, white on dark) breathing over a
// slim indeterminate red progress bar — subtle, fast, modern. Renders as a server component; the light/dark logo swap is done
// purely in CSS (html.light-mode) so there's no theme flash or client JS.
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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        <div
          style={{ animation: 'brand-loading-pulse 1.5s ease-in-out infinite', willChange: 'transform, opacity' }}
        >
          {/* Dark nav → white wordmark; light nav → navy wordmark. Only one is
              shown at a time via the ep-loader-logo--{dark,light} CSS toggle. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo_horizontal_dark.png"
            alt=""
            aria-hidden="true"
            width={200}
            height={40}
            className="ep-loader-logo--dark"
            style={{ width: 200, height: 'auto', objectFit: 'contain' }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo_horizontal_navy.png"
            alt=""
            aria-hidden="true"
            width={200}
            height={40}
            className="ep-loader-logo--light"
            style={{ width: 200, height: 'auto', objectFit: 'contain' }}
          />
        </div>

        {/* Slim indeterminate progress bar with a sweeping brand-red segment. */}
        <div className="ep-loader-track" aria-hidden="true" />
      </div>
    </div>
  )
}
