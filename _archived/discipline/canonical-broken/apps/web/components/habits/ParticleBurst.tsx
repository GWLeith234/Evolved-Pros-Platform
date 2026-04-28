'use client'

import { useEffect, useState } from 'react'

interface Particle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  color: string
  size: number
}

interface ParticleBurstProps {
  active: boolean
  originX: number
  originY: number
}

const COLORS = ['#C9A84C', '#C9A84C', '#0ABFA3', '#C9A84C', '#0ABFA3', '#C9A84C']
const COUNT = 14

export function ParticleBurst({ active, originX, originY }: ParticleBurstProps) {
  const [particles, setParticles] = useState<Particle[]>([])
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!active) return

    const ps: Particle[] = Array.from({ length: COUNT }, (_, i) => {
      const angle = (i / COUNT) * Math.PI * 2
      const speed = 2 + Math.random() * 3
      return {
        id: i,
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2, // bias upward
        color: COLORS[i % COLORS.length],
        size: 3 + Math.random() * 4,
      }
    })

    setParticles(ps)
    setVisible(true)

    const timeout = setTimeout(() => {
      setVisible(false)
      setParticles([])
    }, 650)

    return () => clearTimeout(timeout)
  }, [active, originX, originY])

  if (!visible || particles.length === 0) return null

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[100]"
      aria-hidden="true"
    >
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            transform: 'translate(-50%, -50%)',
            animation: `particleFly 600ms ease-out forwards`,
            animationDelay: `${p.id * 10}ms`,
            // Inline custom properties for the keyframe
            ['--vx' as string]: `${p.vx * 30}px`,
            ['--vy' as string]: `${p.vy * 30}px`,
          }}
        />
      ))}
      <style>{`
        @keyframes particleFly {
          0%   { opacity: 1; transform: translate(-50%, -50%) translate(0, 0) scale(1); }
          80%  { opacity: 0.8; }
          100% { opacity: 0; transform: translate(-50%, -50%) translate(var(--vx), var(--vy)) scale(0.3); }
        }
      `}</style>
    </div>
  )
}
