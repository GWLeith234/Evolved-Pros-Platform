'use client'

import { useEffect, useState } from 'react'
import { useReducedMotion } from '@/hooks/useReducedMotion'

interface ConfettiBlastProps {
  active: boolean
  colors: string[]
  count?: number
  onComplete?: () => void
}

export function ConfettiBlast({ active, colors, count = 30, onComplete }: ConfettiBlastProps) {
  const [show, setShow] = useState(false)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (!active) { setShow(false); return }
    if (reduced) {
      // Honor prefers-reduced-motion: skip the visual entirely but keep the
      // promise contract so callers don't deadlock waiting for onComplete.
      onComplete?.()
      return
    }
    setShow(true)
    const t = setTimeout(() => {
      setShow(false)
      onComplete?.()
    }, 2000)
    return () => clearTimeout(t)
  }, [active, onComplete, reduced])

  if (!show) return null

  return (
    <div
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex: 300 }}
      aria-hidden="true"
    >
      {Array.from({ length: count }, (_, i) => {
        const c = colors[i % colors.length]
        return (
          <div
            key={i}
            className="absolute rounded-sm"
            style={{
              left: `${(i * (100 / count)) + (i % 3) * 2}%`,
              top: '-12px',
              width: '8px',
              height: '8px',
              backgroundColor: c,
              animation: `confettiBlastFall 2s ${i * 0.06}s ease-in both`,
            }}
          />
        )
      })}
      <style>{`
        @keyframes confettiBlastFall {
          from { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          to   { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
