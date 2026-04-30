'use client'

import { useEffect, useState } from 'react'
import { useReducedMotion } from '@/hooks/useReducedMotion'

interface StreakCelebrationProps {
  streak: number
  onDismiss: () => void
}

const MILESTONES: Record<number, { color: string; message: string }> = {
  7:  { color: '#C9A84C', message: '7 days. You\u2019re building something real.' },
  30: { color: '#0ABFA3', message: '30 days. Most people quit by now. You didn\u2019t.' },
  90: { color: '#C9302A', message: '90 days. This is who you are now.' },
}

function makeConfetti(color: string) {
  return Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: ((i * 41 + 7) % 100),
    delay: (i * 100) % 2000,
    duration: 2200 + ((i * 67) % 800),
    size: 5 + ((i * 11) % 6),
    color: i % 2 === 0 ? color : 'rgba(255,255,255,0.7)',
    rotate: (i * 53) % 360,
  }))
}

export function StreakCelebration({ streak, onDismiss }: StreakCelebrationProps) {
  const [visible, setVisible] = useState(false)
  const milestone = MILESTONES[streak]
  const reduced = useReducedMotion()

  useEffect(() => {
    if (!milestone) return
    const key = `streak_celebrated_${streak}`
    if (typeof window !== 'undefined' && localStorage.getItem(key)) return
    setVisible(true)
  }, [streak, milestone])

  if (!visible || !milestone) return null

  const { color, message } = milestone
  const confetti = makeConfetti(color)

  function handleDismiss() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`streak_celebrated_${streak}`, '1')
    }
    setVisible(false)
    onDismiss()
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
      onClick={handleDismiss}
    >
      {/* Confetti — skipped under prefers-reduced-motion */}
      {!reduced && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          {confetti.map(c => (
            <div
              key={c.id}
              className="absolute rounded-sm"
              style={{
                left: `${c.left}%`,
                top: '-12px',
                width: `${c.size}px`,
                height: `${c.size * 1.8}px`,
                backgroundColor: c.color,
                transform: `rotate(${c.rotate}deg)`,
                animation: `streakFall ${c.duration}ms ${c.delay}ms ease-in both`,
              }}
            />
          ))}
        </div>
      )}

      {/* Card */}
      <div
        className="relative flex flex-col items-center text-center px-10 py-12 rounded-2xl"
        style={{
          backgroundColor: '#111926',
          border: `1px solid ${color}40`,
          boxShadow: `0 0 80px ${color}20`,
          maxWidth: '380px',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Badge */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
          style={{ backgroundColor: `${color}18`, border: `2px solid ${color}` }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill={color} stroke="none">
            <path d="M13.5 0.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5 0.67z" />
          </svg>
        </div>

        {/* Big number */}
        <p
          style={{
            fontFamily: '"Bebas Neue", "Barlow Condensed", sans-serif',
            fontSize: '72px',
            fontWeight: 900,
            color,
            lineHeight: 0.9,
            margin: '0 0 8px',
          }}
        >
          {streak}
        </p>

        <p
          className="font-condensed font-bold uppercase tracking-[0.2em] mb-6"
          style={{ fontSize: '10px', color: `${color}99` }}
        >
          Day Streak
        </p>

        {/* Message */}
        <p
          className="font-body mb-8"
          style={{ fontSize: '16px', color: 'rgba(250,249,247,0.7)', lineHeight: 1.5, maxWidth: '280px' }}
        >
          {message}
        </p>

        {/* CTA */}
        <button
          type="button"
          onClick={handleDismiss}
          className="font-condensed font-bold uppercase tracking-[0.14em] text-[13px] px-8 py-3 rounded transition-opacity hover:opacity-90"
          style={{ backgroundColor: color, color: '#fff' }}
        >
          Keep Going &rarr;
        </button>
      </div>

      <style>{`
        @keyframes streakFall {
          from { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          to   { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
