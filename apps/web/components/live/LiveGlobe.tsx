'use client'

import { useEffect, useMemo, useRef } from 'react'
import { SPEAKING_PINS, SPEAKING_STATS, type SpeakingPin } from '@/lib/live/speaking-pins'

const FBC = 'Barlow Condensed, sans-serif'
const FBN = 'Bebas Neue, sans-serif'

// SVG viewBox
const VB = 800
const CX = VB / 2
const CY = VB / 2
const R = VB * 0.42
const ROTATION_DEG_PER_SEC = 12

interface ProjectedPin {
  pin: SpeakingPin
  baseX: number   // x at lon0 = 0 (precomputed once)
  baseY: number   // y at lon0 = 0
  baseZ: number   // visibility component at lon0 = 0
  // Spherical coords for runtime rotation
  cosPhi: number
  sinPhi: number
  lonRad: number
}

// Orthographic projection: sphere centered at origin, viewer at +Z.
// Returns sphere-space {x, y, z}. Visible iff z >= 0.
function project(latDeg: number, lonDeg: number, lon0Deg: number) {
  const phi = (latDeg * Math.PI) / 180
  const lam = ((lonDeg - lon0Deg) * Math.PI) / 180
  const cosPhi = Math.cos(phi)
  const sinPhi = Math.sin(phi)
  return {
    x: cosPhi * Math.sin(lam),
    y: sinPhi,
    z: cosPhi * Math.cos(lam),
  }
}

export function LiveGlobe() {
  // Per-pin precomputed sphere data — never changes between renders.
  const pinData = useMemo<ProjectedPin[]>(() => {
    return SPEAKING_PINS.map(pin => {
      const phi = (pin.lat * Math.PI) / 180
      return {
        pin,
        baseX: 0, baseY: 0, baseZ: 0,
        cosPhi: Math.cos(phi),
        sinPhi: Math.sin(phi),
        lonRad: (pin.lon * Math.PI) / 180,
      }
    })
  }, [])

  // Refs for direct DOM mutation (no React re-renders per frame)
  const rafRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number>(0)
  const lon0Ref = useRef<number>(-30)
  const pinRefs = useRef<Array<SVGCircleElement | null>>([])

  useEffect(() => {
    const tick = (t: number) => {
      const dt = lastTimeRef.current === 0 ? 0 : (t - lastTimeRef.current) / 1000
      lastTimeRef.current = t
      lon0Ref.current = (lon0Ref.current + dt * ROTATION_DEG_PER_SEC) % 360
      const lon0Rad = (lon0Ref.current * Math.PI) / 180

      for (let i = 0; i < pinData.length; i++) {
        const el = pinRefs.current[i]
        if (!el) continue
        const d = pinData[i]
        const lam = d.lonRad - lon0Rad
        const cosLam = Math.cos(lam)
        const sinLam = Math.sin(lam)
        const z = d.cosPhi * cosLam
        if (z >= 0) {
          const x = CX + d.cosPhi * sinLam * R
          const y = CY - d.sinPhi * R
          el.setAttribute('cx', String(x))
          el.setAttribute('cy', String(y))
          el.setAttribute('opacity', '1')
        } else {
          el.setAttribute('opacity', '0')
        }
      }

      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [pinData])

  // Initial-frame projection so SSR / first paint shows pins in place.
  const initialPositions = useMemo(() => {
    return SPEAKING_PINS.map(pin => {
      const p = project(pin.lat, pin.lon, -30)
      return {
        x: CX + p.x * R,
        y: CY - p.y * R,
        visible: p.z >= 0,
      }
    })
  }, [])

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: 620,
        overflow: 'hidden',
        background: 'radial-gradient(ellipse at 50% 40%, #14223a 0%, #0A0F18 70%, #050810 100%)',
      }}
      role="img"
      aria-label={`Map showing ${SPEAKING_STATS.talks}+ stages George has spoken at across ${SPEAKING_STATS.countries} countries.`}
    >
      <svg
        viewBox={`0 0 ${VB} ${VB}`}
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(92%, 760px)',
          height: 'auto',
          display: 'block',
        }}
      >
        <defs>
          <radialGradient id="liveSphereGrad" cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#1f3257" />
            <stop offset="55%" stopColor="#11203a" />
            <stop offset="100%" stopColor="#070b14" />
          </radialGradient>
          <radialGradient id="liveAtmoGrad" cx="50%" cy="50%" r="55%">
            <stop offset="80%" stopColor="rgba(96,165,250,0)" />
            <stop offset="92%" stopColor="rgba(96,165,250,0.18)" />
            <stop offset="100%" stopColor="rgba(96,165,250,0)" />
          </radialGradient>
          <radialGradient id="liveSpecGrad" cx="32%" cy="28%" r="45%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
        </defs>

        {/* Atmosphere halo */}
        <circle cx={CX} cy={CY} r={R * 1.08} fill="url(#liveAtmoGrad)" />

        {/* Sphere base */}
        <circle cx={CX} cy={CY} r={R} fill="url(#liveSphereGrad)" />

        {/* Specular highlight */}
        <circle cx={CX} cy={CY} r={R} fill="url(#liveSpecGrad)" pointerEvents="none" />

        {/* Pins — refs let RAF mutate cx/cy/opacity directly without React re-renders */}
        <g>
          {SPEAKING_PINS.map((pin, i) => (
            <circle
              key={`${pin.city}-${pin.country}-${i}`}
              ref={(el: SVGCircleElement | null) => {
                pinRefs.current[i] = el
              }}
              cx={initialPositions[i].x}
              cy={initialPositions[i].y}
              r={3.2}
              fill="#C9A84C"
              stroke="rgba(10,15,24,0.9)"
              strokeWidth={0.8}
              opacity={initialPositions[i].visible ? 1 : 0}
            />
          ))}
        </g>
      </svg>

      {/* Legend / count (bottom-right) */}
      <div
        style={{
          position: 'absolute',
          bottom: 24,
          right: 24,
          textAlign: 'right',
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: FBN,
            fontSize: 48,
            lineHeight: 1,
            letterSpacing: '0.04em',
            color: '#E8B547',
          }}
        >
          {SPEAKING_PINS.length}
        </p>
        <p
          style={{
            margin: '2px 0 0',
            fontFamily: FBC,
            fontWeight: 700,
            fontSize: 10,
            letterSpacing: '0.32em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.55)',
          }}
        >
          Stages · {SPEAKING_STATS.countries} countries
        </p>
      </div>
    </div>
  )
}
