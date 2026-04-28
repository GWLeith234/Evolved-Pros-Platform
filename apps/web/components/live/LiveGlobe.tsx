'use client'

import { useEffect, useMemo, useRef } from 'react'
import { SPEAKING_PINS, SPEAKING_STATS, type SpeakingPin } from '@/lib/live/speaking-pins'
import { COASTLINES } from '@/lib/live/globe-coastlines'

const FBC = 'Barlow Condensed, sans-serif'
const FBN = 'Bebas Neue, sans-serif'

// SVG viewBox
const VB = 800
const CX = VB / 2
const CY = VB / 2
const R = VB * 0.42
const ROTATION_DEG_PER_SEC = 12

// Pin appearance per featured-state
const PIN_CORE_R = 3.2
const PIN_CORE_R_FEATURED = 4.5
const PIN_HALO_R = 14
const PIN_HALO_R_FEATURED = 18
const PIN_HALO_OPACITY = 0.55
const PIN_HALO_OPACITY_FEATURED = 0.85
const COAST_STROKE = 'rgba(96,165,250,0.55)'
const COAST_STROKE_WIDTH = 1.1

interface PinSphereData {
  pin: SpeakingPin
  cosPhi: number
  sinPhi: number
  lonRad: number
}

interface CoastlineSphereData {
  // Per-point precomputed sphere data, so per-frame we only do
  // (lon - lon0) trig and one screen-space mapping.
  points: ReadonlyArray<{ cosPhi: number; sinPhi: number; lonRad: number }>
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

// Build an SVG path d-string for one polyline. Where consecutive points
// straddle the visible/hidden boundary (z crosses 0), we drop the segment
// and start a new sub-path with M instead of drawing across the back of
// the globe. Simpler than rim-arc clipping; produces stroke-only outlines.
function buildPathD(points: ReadonlyArray<{ cosPhi: number; sinPhi: number; lonRad: number }>, lon0Rad: number): string {
  let d = ''
  let inSubpath = false
  for (let i = 0; i < points.length; i++) {
    const p = points[i]
    const lam = p.lonRad - lon0Rad
    const cosLam = Math.cos(lam)
    const sinLam = Math.sin(lam)
    const z = p.cosPhi * cosLam
    if (z >= 0) {
      const x = CX + p.cosPhi * sinLam * R
      const y = CY - p.sinPhi * R
      if (!inSubpath) {
        d += `M${x.toFixed(1)} ${y.toFixed(1)}`
        inSubpath = true
      } else {
        d += `L${x.toFixed(1)} ${y.toFixed(1)}`
      }
    } else {
      inSubpath = false
    }
  }
  return d
}

export function LiveGlobe() {
  // Per-pin precomputed sphere data — never changes between renders.
  const pinData = useMemo<PinSphereData[]>(() => {
    return SPEAKING_PINS.map(pin => {
      const phi = (pin.lat * Math.PI) / 180
      return {
        pin,
        cosPhi: Math.cos(phi),
        sinPhi: Math.sin(phi),
        lonRad: (pin.lon * Math.PI) / 180,
      }
    })
  }, [])

  // Per-coastline precomputed sphere data.
  const coastlineData = useMemo<CoastlineSphereData[]>(() => {
    return COASTLINES.map(line => ({
      points: line.map(([lat, lon]) => {
        const phi = (lat * Math.PI) / 180
        return {
          cosPhi: Math.cos(phi),
          sinPhi: Math.sin(phi),
          lonRad: (lon * Math.PI) / 180,
        }
      }),
    }))
  }, [])

  // Refs for direct DOM mutation (no React re-renders per frame)
  const rafRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number>(0)
  const lon0Ref = useRef<number>(-30)
  const pinCoreRefs = useRef<Array<SVGCircleElement | null>>([])
  const pinHaloRefs = useRef<Array<SVGCircleElement | null>>([])
  const coastPathRefs = useRef<Array<SVGPathElement | null>>([])

  useEffect(() => {
    const tick = (t: number) => {
      const dt = lastTimeRef.current === 0 ? 0 : (t - lastTimeRef.current) / 1000
      lastTimeRef.current = t
      lon0Ref.current = (lon0Ref.current + dt * ROTATION_DEG_PER_SEC) % 360
      const lon0Rad = (lon0Ref.current * Math.PI) / 180

      // Pins — update both core and halo positions/opacity
      for (let i = 0; i < pinData.length; i++) {
        const core = pinCoreRefs.current[i]
        const halo = pinHaloRefs.current[i]
        if (!core && !halo) continue
        const d = pinData[i]
        const lam = d.lonRad - lon0Rad
        const cosLam = Math.cos(lam)
        const sinLam = Math.sin(lam)
        const z = d.cosPhi * cosLam
        if (z >= 0) {
          const x = CX + d.cosPhi * sinLam * R
          const y = CY - d.sinPhi * R
          if (core) {
            core.setAttribute('cx', String(x))
            core.setAttribute('cy', String(y))
            core.setAttribute('opacity', '1')
          }
          if (halo) {
            halo.setAttribute('cx', String(x))
            halo.setAttribute('cy', String(y))
            halo.setAttribute(
              'opacity',
              String(d.pin.featured ? PIN_HALO_OPACITY_FEATURED : PIN_HALO_OPACITY),
            )
          }
        } else {
          if (core) core.setAttribute('opacity', '0')
          if (halo) halo.setAttribute('opacity', '0')
        }
      }

      // Coastlines — rebuild d-string per frame and write via setAttribute
      for (let i = 0; i < coastlineData.length; i++) {
        const path = coastPathRefs.current[i]
        if (!path) continue
        path.setAttribute('d', buildPathD(coastlineData[i].points, lon0Rad))
      }

      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [pinData, coastlineData])

  // Initial-frame projection so SSR / first paint shows pins in place.
  const initialPinPositions = useMemo(() => {
    return SPEAKING_PINS.map(pin => {
      const p = project(pin.lat, pin.lon, -30)
      return {
        x: CX + p.x * R,
        y: CY - p.y * R,
        visible: p.z >= 0,
      }
    })
  }, [])

  // Initial coastline d-strings for first paint (lon0 = -30).
  const initialCoastlinePaths = useMemo(() => {
    const lon0Rad = (-30 * Math.PI) / 180
    return coastlineData.map(c => buildPathD(c.points, lon0Rad))
  }, [coastlineData])

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
          <radialGradient id="livePinGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(232,181,71,1)" />
            <stop offset="40%" stopColor="rgba(232,181,71,0.6)" />
            <stop offset="100%" stopColor="rgba(232,181,71,0)" />
          </radialGradient>
          <radialGradient id="livePinGlowRed" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,120,140,1)" />
            <stop offset="35%" stopColor="rgba(239,14,48,0.85)" />
            <stop offset="100%" stopColor="rgba(239,14,48,0)" />
          </radialGradient>
        </defs>

        {/* Atmosphere halo */}
        <circle cx={CX} cy={CY} r={R * 1.08} fill="url(#liveAtmoGrad)" />

        {/* Sphere base */}
        <circle cx={CX} cy={CY} r={R} fill="url(#liveSphereGrad)" />

        {/* Coastlines — d attribute mutated per frame via RAF */}
        <g pointerEvents="none">
          {coastlineData.map((_c, i) => (
            <path
              key={`coast-${i}`}
              ref={(el: SVGPathElement | null) => {
                coastPathRefs.current[i] = el
              }}
              d={initialCoastlinePaths[i]}
              fill="none"
              stroke={COAST_STROKE}
              strokeWidth={COAST_STROKE_WIDTH}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}
        </g>

        {/* Specular highlight — drawn over coastlines, under pins */}
        <circle cx={CX} cy={CY} r={R} fill="url(#liveSpecGrad)" pointerEvents="none" />

        {/* Pin halos — separate group so they sit beneath cores */}
        <g pointerEvents="none">
          {SPEAKING_PINS.map((pin, i) => (
            <circle
              key={`halo-${pin.city}-${pin.country}-${i}`}
              ref={(el: SVGCircleElement | null) => {
                pinHaloRefs.current[i] = el
              }}
              cx={initialPinPositions[i].x}
              cy={initialPinPositions[i].y}
              r={pin.featured ? PIN_HALO_R_FEATURED : PIN_HALO_R}
              fill={pin.featured ? 'url(#livePinGlowRed)' : 'url(#livePinGlow)'}
              opacity={
                initialPinPositions[i].visible
                  ? pin.featured
                    ? PIN_HALO_OPACITY_FEATURED
                    : PIN_HALO_OPACITY
                  : 0
              }
            />
          ))}
        </g>

        {/* Pin cores */}
        <g>
          {SPEAKING_PINS.map((pin, i) => (
            <circle
              key={`core-${pin.city}-${pin.country}-${i}`}
              ref={(el: SVGCircleElement | null) => {
                pinCoreRefs.current[i] = el
              }}
              cx={initialPinPositions[i].x}
              cy={initialPinPositions[i].y}
              r={pin.featured ? PIN_CORE_R_FEATURED : PIN_CORE_R}
              fill={pin.featured ? '#ef0e30' : '#C9A84C'}
              stroke="rgba(10,15,24,0.9)"
              strokeWidth={0.8}
              opacity={initialPinPositions[i].visible ? 1 : 0}
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
