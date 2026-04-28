'use client'

import { useEffect, useState } from 'react'

interface CelebrationOverlayProps {
  streak: number
  onDismiss: () => void
}

// 32 confetti pieces with deterministic-ish positions so SSR is consistent
const CONFETTI = Array.from({ length: 32 }, (_, i) => ({
  id: i,
  left: ((i * 37 + 11) % 100),       // 0–99 %
  delay: ((i * 43) % 600),            // 0–599 ms
  duration: 900 + ((i * 71) % 600),   // 900–1499 ms
  size: 5 + ((i * 13) % 7),           // 5–11 px
  color: i % 3 === 0 ? '#C9A84C' : i % 3 === 1 ? '#0ABFA3' : 'rgba(255,255,255,0.7)',
  rotate: (i * 47) % 360,
}))

export function CelebrationOverlay({ streak, onDismiss }: CelebrationOverlayProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => { setVisible(false); onDismiss() }, 3000)
    return () => clearTimeout(t)
  }, [onDismiss])

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
      style={{ backgroundColor: 'rgba(10,15,24,0.92)' }}
      onClick={() => { setVisible(false); onDismiss() }}
    >
      {/* Confetti */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {CONFETTI.map(c => (
          <div
            key={c.id}
            className="absolute rounded-sm"
            style={{
              left: `${c.left}%`,
              top: '-12px',
              width: `${c.size}px`,
              height: `${c.size * 1.6}px`,
              backgroundColor: c.color,
              transform: `rotate(${c.rotate}deg)`,
              animation: `confettiFall ${c.duration}ms ${c.delay}ms ease-in both`,
            }}
          />
        ))}
      </div>

      {/* Center card */}
      <div
        className="relative flex flex-col items-center text-center px-10 py-10 rounded-2xl"
        style={{
          backgroundColor: '#111926',
          border: '1px solid rgba(201,168,76,0.3)',
          boxShadow: '0 0 80px rgba(201,168,76,0.15)',
          maxWidth: '320px',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Glow ring */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
          style={{ backgroundColor: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.35)' }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </div>

        <p
          className="font-condensed font-bold uppercase tracking-[0.18em] mb-2"
          style={{ fontSize: '11px', color: 'rgba(201,168,76,0.6)' }}
        >
          Day Complete
        </p>

        <p
          className="font-condensed font-bold uppercase tracking-[0.06em] leading-tight mb-4"
          style={{ fontSize: '28px', color: '#C9A84C' }}
        >
          Compound Day<br />Complete
        </p>

        {streak > 0 && (
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-full"
            style={{ backgroundColor: 'rgba(10,191,163,0.1)', border: '1px solid rgba(10,191,163,0.25)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#0ABFA3" stroke="none">
              <path d="M13.5 0.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5 0.67z" />
            </svg>
            <span className="font-condensed font-bold" style={{ fontSize: '13px', color: '#0ABFA3' }}>
              {streak} day streak
            </span>
          </div>
        )}

        <p
          className="font-body mt-5"
          style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}
        >
          Tap anywhere to dismiss
        </p>
      </div>

      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(0) rotate(var(--r, 0deg)) scale(1); opacity: 1; }
          80%  { opacity: 0.8; }
          100% { transform: translateY(100vh) rotate(calc(var(--r, 0deg) + 360deg)) scale(0.6); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
