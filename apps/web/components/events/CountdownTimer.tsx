'use client'

import { useEffect, useState } from 'react'

interface CountdownTimerProps {
  /** ISO timestamp of the event start. */
  targetIso: string
  /** Treat the event as "live" while now is within this many minutes
   *  before targetIso → switch to a "LIVE NOW" pulsing pill. Default 0. */
  liveWindowBeforeMinutes?: number
  /** How long after targetIso the event remains live. Default 120 min. */
  liveWindowAfterMinutes?: number
}

interface RemainingPieces {
  days: number
  hours: number
  minutes: number
  seconds: number
  totalMs: number
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function diff(targetIso: string): RemainingPieces {
  const targetMs = new Date(targetIso).getTime()
  const totalMs = targetMs - Date.now()
  const totalSeconds = Math.max(0, Math.floor(totalMs / 1000))
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return { days, hours, minutes, seconds, totalMs }
}

/**
 * Live HH:MM:SS countdown to an event start, with a "LIVE NOW" state
 * once the start is within `liveWindowBeforeMinutes` and until
 * `liveWindowAfterMinutes` past the start.
 *
 * Renders nothing on the server / before mount to avoid a hydration
 * mismatch (Date.now() is non-deterministic across the SSR/client boundary).
 */
export function CountdownTimer({
  targetIso,
  liveWindowBeforeMinutes = 0,
  liveWindowAfterMinutes = 120,
}: CountdownTimerProps) {
  const [mounted, setMounted] = useState(false)
  const [pieces, setPieces] = useState<RemainingPieces>({ days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 })

  useEffect(() => {
    setMounted(true)
    const tick = () => setPieces(diff(targetIso))
    tick()
    const handle = window.setInterval(tick, 1000)
    return () => window.clearInterval(handle)
  }, [targetIso])

  if (!mounted) return null

  const targetMs = new Date(targetIso).getTime()
  const nowMs = Date.now()
  const liveStartMs = targetMs - liveWindowBeforeMinutes * 60_000
  const liveEndMs = targetMs + liveWindowAfterMinutes * 60_000
  const isLive = nowMs >= liveStartMs && nowMs <= liveEndMs

  if (isLive) {
    return (
      <span
        role="status"
        aria-live="polite"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 14px',
          background: 'rgba(201,48,42,0.18)',
          border: '1px solid rgba(201,48,42,0.55)',
          color: '#FFFFFF',
          fontFamily: '"Barlow Condensed", sans-serif',
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#C9302A',
            boxShadow: '0 0 0 0 rgba(201,48,42,0.6)',
            animation: 'events-live-pulse 1.4s ease-in-out infinite',
          }}
        />
        Live Now
      </span>
    )
  }

  const { days, hours, minutes, seconds } = pieces

  return (
    <span
      aria-live="polite"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 14px',
        background: 'rgba(0,0,0,0.45)',
        border: '1px solid rgba(255,255,255,0.18)',
        color: '#FFFFFF',
        fontFamily: '"Barlow Condensed", sans-serif',
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
      }}
    >
      <span style={{ color: 'rgba(255,255,255,0.6)' }}>Starts in</span>
      <span style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '0.12em' }}>
        {days > 0 ? `${days}D` : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`}
      </span>
    </span>
  )
}
