'use client'

/**
 * Sprint 4C — code-split the WebGL/canvas globe off the LIVE critical path.
 */
import nextDynamic from 'next/dynamic'

export const LiveGlobeLazy = nextDynamic(
  () => import('@/components/live/LiveGlobe').then(m => m.LiveGlobe),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          minHeight: 320,
          background: 'var(--bg-elevated, #111926)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-condensed), sans-serif',
          fontSize: 12,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--text-tertiary)',
        }}
        aria-hidden
      >
        Loading map…
      </div>
    ),
  },
)
