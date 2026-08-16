'use client'

/**
 * Code-split the globe off the LIVE critical path. Pins come from the server
 * (base catalogue + admin extras).
 */
import nextDynamic from 'next/dynamic'
import type { SpeakingPin } from '@/lib/live/speaking-pins'

const Globe = nextDynamic(
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
          fontFamily: '"Barlow Condensed", sans-serif',
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

export function LiveGlobeLazy({ pins }: { pins: SpeakingPin[] }) {
  return <Globe pins={pins} />
}
