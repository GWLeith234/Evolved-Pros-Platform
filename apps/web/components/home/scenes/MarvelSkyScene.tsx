// WELCOME-BANNER-V3: ported from design-reference/.../marvel-scenes.jsx (465 lines).
// Six time-of-day scenes — pure SVG, on-brand strict palette (NAVY/RED/GOLD/CREAM).
// Atmosphere only — no characters or symbols. Each scene is its own composition.
// Source colors locked here (not pulled from --pillar-* tokens) because the
// scenes are intentional cinema, not theme-aware UI surfaces.

const NAVY_DEEP = '#0A0F18'
const NAVY      = '#1B2A4A'
const NAVY_MID  = '#2C3F66'
const RED       = '#ef0e30'
const RED_DEEP  = '#9B1623'
const GOLD      = '#C9A84C'
const GOLD_LT   = '#E6C977'
const CREAM     = '#F5F0E8'

export type MarvelScenePeriod =
  | 'early-morning'
  | 'mid-morning'
  | 'midday'
  | 'early-evening'
  | 'evening'
  | 'night'

// Reusable defs — halftone, glow gradients, scrim
function CommonDefs() {
  return (
    <defs>
      <pattern id="halftone-fine" x="0" y="0" width="3" height="3" patternUnits="userSpaceOnUse">
        <circle cx="1.5" cy="1.5" r="0.5" fill="rgba(0,0,0,0.45)" />
      </pattern>
      <pattern id="halftone-mid" x="0" y="0" width="5" height="5" patternUnits="userSpaceOnUse">
        <circle cx="2.5" cy="2.5" r="1" fill="rgba(0,0,0,0.5)" />
      </pattern>
      <pattern id="halftone-bold" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
        <circle cx="4" cy="4" r="1.6" fill="rgba(0,0,0,0.6)" />
      </pattern>
      <pattern id="halftone-gold" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="0.8" fill={GOLD} opacity="0.5" />
      </pattern>
      <pattern id="halftone-red" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="0.7" fill={RED} opacity="0.7" />
      </pattern>

      <radialGradient id="glow-gold" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor={GOLD_LT} stopOpacity="0.85" />
        <stop offset="40%" stopColor={GOLD} stopOpacity="0.4" />
        <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
      </radialGradient>
      <radialGradient id="glow-red" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor={RED} stopOpacity="0.7" />
        <stop offset="100%" stopColor={RED} stopOpacity="0" />
      </radialGradient>
      <radialGradient id="glow-cream" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor={CREAM} stopOpacity="0.85" />
        <stop offset="100%" stopColor={CREAM} stopOpacity="0" />
      </radialGradient>

      <linearGradient id="scrim-left" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor={NAVY_DEEP} stopOpacity="0.9" />
        <stop offset="55%" stopColor={NAVY_DEEP} stopOpacity="0.4" />
        <stop offset="100%" stopColor={NAVY_DEEP} stopOpacity="0.1" />
      </linearGradient>
    </defs>
  )
}

// Scene 1 — Early Morning · "Kirby cosmic dawn"
function EarlyMorning() {
  const rays: { x2: number; y2: number; w: number }[] = []
  const cx = 50
  const cy = 95
  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * 180 - 180
    const a = (angle * Math.PI) / 180
    const len = 90 + (i % 3) * 10
    const x2 = cx + Math.cos(a) * len
    const y2 = cy + Math.sin(a) * len
    rays.push({ x2, y2, w: i % 2 ? 0.8 : 1.4 })
  }

  return (
    <svg
      viewBox="0 0 100 60"
      preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    >
      <CommonDefs />
      <defs>
        <linearGradient id="em-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={NAVY_DEEP} />
          <stop offset="55%" stopColor={NAVY} />
          <stop offset="85%" stopColor="#5a3f3a" />
          <stop offset="100%" stopColor={GOLD} />
        </linearGradient>
      </defs>
      <rect width="100" height="60" fill="url(#em-sky)" />

      <g opacity="0.55">
        {rays.map((r, i) => (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={r.x2}
            y2={r.y2}
            stroke={GOLD_LT}
            strokeWidth={r.w}
            strokeLinecap="round"
          />
        ))}
      </g>

      <circle cx="50" cy="58" r="14" fill="url(#glow-gold)" />
      <circle cx="50" cy="58" r="5" fill={GOLD_LT} />

      <rect x="0" y="48" width="100" height="12" fill="url(#halftone-gold)" opacity="0.6" />

      <path
        d="M0 52 L8 52 L9 49 L13 49 L13 51 L18 51 L18 47 L22 47 L22 50 L28 50 L28 46 L31 46 L31 51 L38 51 L40 48 L42 48 L43 51 L52 51 L52 47 L56 47 L57 50 L62 50 L62 45 L66 45 L67 50 L74 50 L75 47 L79 47 L79 51 L86 51 L86 48 L91 48 L91 51 L100 51 L100 60 L0 60 Z"
        fill={NAVY_DEEP}
      />

      <rect width="100" height="60" fill="url(#scrim-left)" />
    </svg>
  )
}

// Scene 2 — Mid Morning · "Stark HUD blueprint"
function MidMorning() {
  return (
    <svg
      viewBox="0 0 100 60"
      preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    >
      <CommonDefs />
      <defs>
        <linearGradient id="mm-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={NAVY_DEEP} />
          <stop offset="100%" stopColor={NAVY_MID} />
        </linearGradient>
      </defs>
      <rect width="100" height="60" fill="url(#mm-sky)" />

      <g stroke={GOLD} strokeWidth="0.1" opacity="0.18">
        {Array.from({ length: 20 }).map((_, i) => (
          <line key={`v${i}`} x1={i * 5} y1="0" x2={i * 5} y2="60" />
        ))}
        {Array.from({ length: 12 }).map((_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 5} x2="100" y2={i * 5} />
        ))}
      </g>

      <g transform="translate(72 18)" stroke={GOLD} fill="none" opacity="0.55">
        <circle r="14" strokeWidth="0.3" />
        <circle r="10" strokeWidth="0.5" strokeDasharray="2 1" />
        <circle r="6" strokeWidth="0.3" />
        <circle r="2.5" fill={GOLD} opacity="0.5" />
        <line x1="-16" y1="0" x2="-12" y2="0" strokeWidth="0.3" />
        <line x1="12" y1="0" x2="16" y2="0" strokeWidth="0.3" />
        <line x1="0" y1="-16" x2="0" y2="-12" strokeWidth="0.3" />
        <line x1="0" y1="12" x2="0" y2="16" strokeWidth="0.3" />
      </g>

      <g stroke={GOLD_LT} fill="none" strokeWidth="0.3" opacity="0.85">
        <path d="M2 50 L2 38 L8 38 L8 32 L12 32 L12 50" />
        <path d="M14 50 L14 28 L22 28 L22 22 L26 22 L26 50" />
        <path d="M28 50 L28 35 L34 35 L34 30 L38 30 L38 50" />
        <path d="M40 50 L40 18 L46 18 L46 14 L50 14 L50 18 L52 18 L52 50" />
        <path d="M54 50 L54 30 L60 30 L60 24 L66 24 L66 50" />
        <path d="M68 50 L68 38 L74 38 L74 50" />
        <path d="M76 50 L76 26 L82 26 L82 20 L86 20 L86 50" />
        <path d="M88 50 L88 32 L94 32 L94 50" />
        <line x1="0" y1="50" x2="100" y2="50" strokeWidth="0.25" />
      </g>

      <path d="M0 50 L100 50 L100 60 L0 60 Z" fill={NAVY_DEEP} />
      <rect x="0" y="50" width="100" height="10" fill="url(#halftone-fine)" opacity="0.4" />

      <g stroke={GOLD} strokeWidth="0.3" opacity="0.4">
        <path d="M3 3 L8 3 M3 3 L3 8" />
        <path d="M97 3 L92 3 M97 3 L97 8" />
      </g>

      <rect width="100" height="60" fill="url(#scrim-left)" />
    </svg>
  )
}

// Scene 3 — Midday · "Cosmic mandala"
function Midday() {
  const petals = 16
  return (
    <svg
      viewBox="0 0 100 60"
      preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    >
      <CommonDefs />
      <defs>
        <radialGradient id="md-sky" cx="50%" cy="50%" r="80%">
          <stop offset="0%" stopColor="#23355c" />
          <stop offset="60%" stopColor={NAVY} />
          <stop offset="100%" stopColor={NAVY_DEEP} />
        </radialGradient>
      </defs>
      <rect width="100" height="60" fill="url(#md-sky)" />

      <circle cx="65" cy="30" r="32" fill="url(#glow-gold)" opacity="0.5" />

      <g transform="translate(65 30)" stroke={GOLD} fill="none" opacity="0.7">
        <circle r="22" strokeWidth="0.2" strokeDasharray="0.6 0.4" />
        <circle r="17" strokeWidth="0.3" />
        <circle r="12" strokeWidth="0.25" strokeDasharray="1 0.6" />
        <circle r="7" strokeWidth="0.4" />
      </g>

      <g transform="translate(65 30)" stroke={GOLD} fill="none" opacity="0.55" strokeWidth="0.2">
        {Array.from({ length: petals }).map((_, i) => {
          const a = (i / petals) * 360
          return (
            <g key={i} transform={`rotate(${a})`}>
              <path d="M0 -22 L2 -14 L0 -7 L-2 -14 Z" />
              <line x1="0" y1="-22" x2="0" y2="-26" />
            </g>
          )
        })}
      </g>

      <circle cx="65" cy="30" r="3" fill={GOLD_LT} />
      <circle cx="65" cy="30" r="1.4" fill={CREAM} />

      <rect width="100" height="60" fill="url(#halftone-gold)" opacity="0.18" />

      <line x1="0" y1="55" x2="100" y2="55" stroke={GOLD} strokeWidth="0.15" opacity="0.4" />

      <rect width="100" height="60" fill="url(#scrim-left)" />
    </svg>
  )
}

// Scene 4 — Early Evening · "Cinematic golden hour"
function EarlyEvening() {
  return (
    <svg
      viewBox="0 0 100 60"
      preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    >
      <CommonDefs />
      <defs>
        <linearGradient id="ee-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={NAVY_DEEP} />
          <stop offset="35%" stopColor={NAVY} />
          <stop offset="70%" stopColor={RED_DEEP} />
          <stop offset="100%" stopColor={GOLD} />
        </linearGradient>
        <linearGradient id="ee-haze" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={CREAM} stopOpacity="0" />
          <stop offset="100%" stopColor={GOLD} stopOpacity="0.35" />
        </linearGradient>
      </defs>
      <rect width="100" height="60" fill="url(#ee-sky)" />

      <ellipse cx="68" cy="48" rx="48" ry="20" fill="url(#glow-gold)" opacity="0.95" />
      <circle cx="68" cy="48" r="5.5" fill={GOLD_LT} />

      <rect x="0" y="40" width="100" height="20" fill="url(#ee-haze)" opacity="0.6" />

      <path
        d="M0 47 L6 47 L6 44 L11 44 L11 47 L16 47 L16 42 L21 42 L21 47 L28 47 L28 41 L34 41 L34 47 L41 47 L41 43 L46 43 L46 47 L100 47 L100 60 L0 60 Z"
        fill={RED_DEEP}
        opacity="0.85"
      />

      <path
        d="M0 51 L4 51 L4 46 L8 46 L8 51 L14 51 L14 48 L19 48 L19 44 L23 44 L23 51 L30 51 L30 47 L35 47 L35 51 L42 51 L43 49 L46 49 L47 51 L54 51 L54 45 L58 45 L58 51 L66 51 L67 48 L70 48 L71 51 L78 51 L78 46 L82 46 L82 51 L88 51 L88 49 L92 49 L92 51 L100 51 L100 60 L0 60 Z"
        fill={NAVY_DEEP}
      />

      <g stroke={NAVY_DEEP} strokeWidth="0.25" fill="none" opacity="0.7">
        <path d="M22 22 q1 -1.5 2 0 q1 -1.5 2 0" />
        <path d="M30 18 q0.7 -1 1.5 0 q0.7 -1 1.5 0" />
        <path d="M38 24 q0.6 -0.8 1.2 0 q0.6 -0.8 1.2 0" />
      </g>

      <rect x="0" y="50" width="100" height="10" fill="url(#halftone-mid)" opacity="0.25" />

      <rect width="100" height="60" fill="url(#scrim-left)" />
    </svg>
  )
}

// Scene 5 — Evening · "Bold red split horizon"
function Evening() {
  return (
    <svg
      viewBox="0 0 100 60"
      preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    >
      <CommonDefs />
      <defs>
        <linearGradient id="ev-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={NAVY_DEEP} />
          <stop offset="40%" stopColor="#3a1525" />
          <stop offset="80%" stopColor={RED_DEEP} />
          <stop offset="100%" stopColor={RED} />
        </linearGradient>
      </defs>
      <rect width="100" height="60" fill="url(#ev-sky)" />

      <g stroke={CREAM} strokeWidth="0.12" opacity="0.18">
        {Array.from({ length: 18 }).map((_, i) => {
          const y = i * 3.2 + 2
          return <line key={i} x1="0" y1={y} x2={30 + i * 3} y2={y - 5} />
        })}
      </g>

      <rect x="0" y="0" width="100" height="60" fill="url(#halftone-red)" opacity="0.25" />

      <g transform="translate(72 18)">
        <circle r="6.5" fill="url(#glow-cream)" opacity="0.6" />
        <circle r="3.6" fill={CREAM} />
        <circle r="3.4" cx="-1" cy="-0.8" fill="#3a1525" opacity="0.55" />
      </g>

      <g fill={NAVY_DEEP} opacity="0.45">
        <ellipse cx="22" cy="30" rx="14" ry="0.9" />
        <ellipse cx="55" cy="36" rx="20" ry="1.2" />
        <ellipse cx="85" cy="28" rx="10" ry="0.7" />
      </g>

      <path
        d="M0 50 L5 50 L5 44 L10 44 L10 50 L16 50 L16 41 L20 41 L20 38 L24 38 L24 50 L31 50 L31 46 L35 46 L35 50 L42 50 L42 38 L46 38 L46 34 L50 34 L50 38 L54 38 L54 50 L62 50 L62 42 L66 42 L66 50 L74 50 L74 46 L78 46 L78 40 L82 40 L82 50 L90 50 L90 44 L95 44 L95 50 L100 50 L100 60 L0 60 Z"
        fill={NAVY_DEEP}
      />
      <rect x="0" y="50" width="100" height="10" fill="url(#halftone-bold)" opacity="0.35" />

      <rect width="100" height="60" fill="url(#scrim-left)" />
    </svg>
  )
}

// Scene 6 — Night · "Cosmic reverie"
function Night() {
  // Deterministic stars (seed-stable across SSR + client)
  const stars: { x: number; y: number; r: number; o: number }[] = []
  let seed = 11
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }
  for (let i = 0; i < 60; i++) {
    stars.push({ x: rand() * 100, y: rand() * 45, r: rand() * 0.5 + 0.1, o: rand() * 0.7 + 0.3 })
  }
  const constellation = [
    { x: 18, y: 14 },
    { x: 26, y: 8 },
    { x: 34, y: 16 },
    { x: 40, y: 10 },
    { x: 48, y: 18 },
    { x: 56, y: 12 },
  ]

  return (
    <svg
      viewBox="0 0 100 60"
      preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    >
      <CommonDefs />
      <defs>
        <radialGradient id="nb-1" cx="20%" cy="40%" r="40%">
          <stop offset="0%" stopColor={RED} stopOpacity="0.25" />
          <stop offset="100%" stopColor={RED} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="nb-2" cx="80%" cy="25%" r="35%">
          <stop offset="0%" stopColor={GOLD} stopOpacity="0.2" />
          <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="nt-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#03070F" />
          <stop offset="60%" stopColor={NAVY_DEEP} />
          <stop offset="100%" stopColor={NAVY} />
        </linearGradient>
      </defs>
      <rect width="100" height="60" fill="url(#nt-sky)" />

      <rect width="100" height="60" fill="url(#nb-1)" />
      <rect width="100" height="60" fill="url(#nb-2)" />

      {stars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={CREAM} opacity={s.o}>
          <animate
            attributeName="opacity"
            values={`${s.o};${s.o * 0.3};${s.o}`}
            dur={`${2 + (i % 4)}s`}
            repeatCount="indefinite"
          />
        </circle>
      ))}

      <g stroke={GOLD} strokeWidth="0.12" opacity="0.6" fill="none">
        <path d={`M${constellation.map(p => `${p.x} ${p.y}`).join(' L')}`} />
      </g>
      {constellation.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="0.9" fill={GOLD_LT} />
          <circle cx={p.x} cy={p.y} r="2" fill={GOLD} opacity="0.2" />
        </g>
      ))}

      <g transform="translate(80 16)">
        <circle r="4.5" fill="url(#glow-cream)" opacity="0.55" />
        <circle r="2.4" fill={CREAM} opacity="0.95" />
      </g>

      <rect width="100" height="60" fill="url(#halftone-fine)" opacity="0.15" />

      <g fill={GOLD} opacity="0.6">
        {[6, 14, 23, 31, 40, 49, 58, 67, 76, 85, 94].map((x, i) => (
          <circle key={i} cx={x} cy={49 + (i % 2) * 0.5} r="0.18" />
        ))}
      </g>
      <path
        d="M0 50 L3 50 L3 48 L6 48 L6 50 L11 50 L11 47 L14 47 L14 50 L19 50 L19 49 L22 49 L22 50 L28 50 L28 47 L31 47 L31 50 L38 50 L38 48 L41 48 L41 50 L48 50 L48 47 L51 47 L51 50 L58 50 L58 49 L61 49 L61 50 L68 50 L68 48 L71 48 L71 50 L78 50 L78 47 L81 47 L81 50 L88 50 L88 49 L91 49 L91 50 L100 50 L100 60 L0 60 Z"
        fill={NAVY_DEEP}
      />

      <rect width="100" height="60" fill="url(#scrim-left)" />
    </svg>
  )
}

const SCENES: Record<MarvelScenePeriod, () => JSX.Element> = {
  'early-morning': EarlyMorning,
  'mid-morning':   MidMorning,
  'midday':        Midday,
  'early-evening': EarlyEvening,
  'evening':       Evening,
  'night':         Night,
}

export function MarvelSkyScene({ period }: { period: MarvelScenePeriod }) {
  const Comp = SCENES[period] ?? Evening
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: NAVY_DEEP }}>
      <Comp />
      {/* Bottom shade for chip readability */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: '55%',
          background: 'linear-gradient(180deg, transparent 0%, rgba(10,15,24,0.72) 100%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}
