/**
 * Evolved Pros Fit move catalog.
 *
 * Runtime source is this fixture list so /fit, Home, and /admin/fit ship
 * without waiting on a live migration. SQL for a thin fit_moves table is
 * documented in supabase/migrations/092_fit_moves.sql.
 *
 * Codes are FO55-### (letter O). Status: published | pilot | draft.
 */

export const FO55_CODE_RE = /^FO55-\d{3}$/

export type FitMoveStatus = 'published' | 'pilot' | 'draft'
export type FitMoveLocation = 'Hotel' | 'Studio'

export interface FitMove {
  id: string
  code: string
  slug: string
  title: string
  focus: string
  location: FitMoveLocation
  status: FitMoveStatus
  featured: boolean
  hipMod: boolean
  hipModNote: string | null
  reps: string
  durationLabel: string
  durationMinutes: number
  publishedAt: string | null
  requiredTier: 'vip'
}

export const FIT_SAMPLE_CODE = 'FO55-035'
export const FIT_SAMPLE_SLUG = 'wall-supported-rdl'

export const FIT_MOVES: readonly FitMove[] = [
  {
    id: 'fo55-035',
    code: 'FO55-035',
    slug: FIT_SAMPLE_SLUG,
    title: 'Wall-supported RDL',
    focus: 'Hinge, balance',
    location: 'Hotel',
    status: 'published',
    featured: true,
    hipMod: true,
    hipModNote: 'Soft hinge, no deep chase',
    reps: '3 reps',
    durationLabel: '~2 min',
    durationMinutes: 2,
    publishedAt: '2026-09-04',
    requiredTier: 'vip',
  },
  {
    id: 'fo55-012',
    code: 'FO55-012',
    slug: 'chair-sit-to-stand-tempo-3',
    title: 'Chair sit to stand, tempo 3',
    focus: 'Legs, power',
    location: 'Studio',
    status: 'published',
    featured: false,
    hipMod: false,
    hipModNote: null,
    reps: '6 reps',
    durationLabel: '~3 min',
    durationMinutes: 3,
    publishedAt: '2026-08-28',
    requiredTier: 'vip',
  },
  {
    id: 'fo55-008',
    code: 'FO55-008',
    slug: 'wall-sit-short-hold',
    title: 'Wall sit, short hold',
    focus: 'Legs, endurance',
    location: 'Hotel',
    status: 'published',
    featured: false,
    hipMod: false,
    hipModNote: null,
    reps: '20 sec',
    durationLabel: '~2 min',
    durationMinutes: 2,
    publishedAt: '2026-08-22',
    requiredTier: 'vip',
  },
  {
    id: 'fo55-019',
    code: 'FO55-019',
    slug: 'heel-elevated-squat',
    title: 'Heel-elevated squat',
    focus: 'Legs, mobility',
    location: 'Studio',
    status: 'published',
    featured: false,
    hipMod: true,
    hipModNote: 'Stay tall, skip the bounce',
    reps: '5 reps',
    durationLabel: '~3 min',
    durationMinutes: 3,
    publishedAt: '2026-08-18',
    requiredTier: 'vip',
  },
  {
    id: 'fo55-027',
    code: 'FO55-027',
    slug: 'standing-row-band',
    title: 'Standing row, band',
    focus: 'Back, posture',
    location: 'Hotel',
    status: 'published',
    featured: false,
    hipMod: false,
    hipModNote: null,
    reps: '8 reps',
    durationLabel: '~2 min',
    durationMinutes: 2,
    publishedAt: '2026-08-14',
    requiredTier: 'vip',
  },
  {
    id: 'fo55-033',
    code: 'FO55-033',
    slug: 'farmer-carry-short-lane',
    title: 'Farmer carry, short lane',
    focus: 'Grip, gait',
    location: 'Hotel',
    status: 'published',
    featured: false,
    hipMod: false,
    hipModNote: null,
    reps: '2 lengths',
    durationLabel: '~2 min',
    durationMinutes: 2,
    publishedAt: '2026-08-11',
    requiredTier: 'vip',
  },
  {
    id: 'fo55-038',
    code: 'FO55-038',
    slug: 'split-stance-hinge',
    title: 'Split stance hinge',
    focus: 'Hinge, stability',
    location: 'Studio',
    status: 'published',
    featured: false,
    hipMod: true,
    hipModNote: 'Short range, keep the hip quiet',
    reps: '4 each',
    durationLabel: '~3 min',
    durationMinutes: 3,
    publishedAt: '2026-08-09',
    requiredTier: 'vip',
  },
  {
    id: 'fo55-041',
    code: 'FO55-041',
    slug: 'calf-raise-support',
    title: 'Calf raise, support',
    focus: 'Ankle, balance',
    location: 'Hotel',
    status: 'published',
    featured: false,
    hipMod: false,
    hipModNote: null,
    reps: '8 reps',
    durationLabel: '~2 min',
    durationMinutes: 2,
    publishedAt: '2026-08-06',
    requiredTier: 'vip',
  },
  {
    id: 'fo55-047',
    code: 'FO55-047',
    slug: 'open-book-rotation',
    title: 'Open-book rotation',
    focus: 'Thoracic, breath',
    location: 'Studio',
    status: 'published',
    featured: false,
    hipMod: false,
    hipModNote: null,
    reps: '4 each',
    durationLabel: '~3 min',
    durationMinutes: 3,
    publishedAt: '2026-08-03',
    requiredTier: 'vip',
  },
  {
    id: 'fo55-051',
    code: 'FO55-051',
    slug: 'glute-bridge-rib-down',
    title: 'Glute bridge, rib down',
    focus: 'Hips, posterior',
    location: 'Hotel',
    status: 'published',
    featured: false,
    hipMod: true,
    hipModNote: 'Small lift, no lumbar chase',
    reps: '6 reps',
    durationLabel: '~2 min',
    durationMinutes: 2,
    publishedAt: '2026-07-30',
    requiredTier: 'vip',
  },
  {
    id: 'fo55-003',
    code: 'FO55-003',
    slug: 'march-in-place-tall',
    title: 'March in place, tall',
    focus: 'Gait, posture',
    location: 'Hotel',
    status: 'published',
    featured: false,
    hipMod: false,
    hipModNote: null,
    reps: '20 steps',
    durationLabel: '~2 min',
    durationMinutes: 2,
    publishedAt: '2026-07-24',
    requiredTier: 'vip',
  },
  {
    id: 'fo55-016',
    code: 'FO55-016',
    slug: 'supported-dead-bug',
    title: 'Supported dead bug',
    focus: 'Core, control',
    location: 'Studio',
    status: 'published',
    featured: false,
    hipMod: false,
    hipModNote: null,
    reps: '4 each',
    durationLabel: '~3 min',
    durationMinutes: 3,
    publishedAt: '2026-07-20',
    requiredTier: 'vip',
  },
  {
    id: 'fo55-021',
    code: 'FO55-021',
    slug: 'banded-lateral-step',
    title: 'Banded lateral step',
    focus: 'Hips, stability',
    location: 'Studio',
    status: 'pilot',
    featured: true,
    hipMod: true,
    hipModNote: 'Short step, keep the knee stacked',
    reps: '6 each',
    durationLabel: '~3 min',
    durationMinutes: 3,
    publishedAt: '2026-08-21',
    requiredTier: 'vip',
  },
  {
    id: 'fo55-044',
    code: 'FO55-044',
    slug: 'suitcase-carry-hallway-length',
    title: 'Suitcase carry, hallway length',
    focus: 'Grip, trunk',
    location: 'Hotel',
    status: 'pilot',
    featured: false,
    hipMod: false,
    hipModNote: null,
    reps: '2 lengths',
    durationLabel: '~2 min',
    durationMinutes: 2,
    publishedAt: null,
    requiredTier: 'vip',
  },
  {
    id: 'fo55-029',
    code: 'FO55-029',
    slug: 'step-up-low-box',
    title: 'Step-up, low box',
    focus: 'Legs, balance',
    location: 'Studio',
    status: 'pilot',
    featured: false,
    hipMod: false,
    hipModNote: null,
    reps: '4 each',
    durationLabel: '~3 min',
    durationMinutes: 3,
    publishedAt: null,
    requiredTier: 'vip',
  },
  {
    id: 'fo55-052',
    code: 'FO55-052',
    slug: 'pallof-press-tall',
    title: 'Pallof press, tall',
    focus: 'Trunk, anti-rotate',
    location: 'Studio',
    status: 'pilot',
    featured: false,
    hipMod: false,
    hipModNote: null,
    reps: '6 each',
    durationLabel: '~2 min',
    durationMinutes: 2,
    publishedAt: null,
    requiredTier: 'vip',
  },
  {
    id: 'fo55-058',
    code: 'FO55-058',
    slug: 'floor-transfer-two-ways',
    title: 'Floor transfer, two ways',
    focus: 'Mobility, confidence',
    location: 'Studio',
    status: 'draft',
    featured: false,
    hipMod: true,
    hipModNote: 'Use the chair path first',
    reps: '2 each',
    durationLabel: '~4 min',
    durationMinutes: 4,
    publishedAt: null,
    requiredTier: 'vip',
  },
  {
    id: 'fo55-061',
    code: 'FO55-061',
    slug: 'half-kneeling-chop',
    title: 'Half-kneeling chop',
    focus: 'Trunk, hips',
    location: 'Studio',
    status: 'draft',
    featured: false,
    hipMod: false,
    hipModNote: null,
    reps: '4 each',
    durationLabel: '~3 min',
    durationMinutes: 3,
    publishedAt: null,
    requiredTier: 'vip',
  },
  {
    id: 'fo55-066',
    code: 'FO55-066',
    slug: 'suitcase-hold-doorway',
    title: 'Suitcase hold, doorway',
    focus: 'Grip, posture',
    location: 'Hotel',
    status: 'draft',
    featured: false,
    hipMod: false,
    hipModNote: null,
    reps: '20 sec',
    durationLabel: '~2 min',
    durationMinutes: 2,
    publishedAt: null,
    requiredTier: 'vip',
  },
]

export function isFo55Code(code: string): boolean {
  return FO55_CODE_RE.test(code)
}

export function publishedFitMoves(moves: readonly FitMove[] = FIT_MOVES): FitMove[] {
  return moves.filter(m => m.status === 'published')
}

export function teaseFitMoves(moves: readonly FitMove[] = FIT_MOVES): FitMove[] {
  const published = publishedFitMoves(moves)
  const featured = published.filter(m => m.featured)
  return featured.length > 0 ? [...featured, ...published.filter(m => !m.featured)] : published
}

export function rotateFitMove(moves: readonly FitMove[], index: number): FitMove | null {
  const pool = teaseFitMoves(moves)
  if (pool.length === 0) return null
  const i = ((index % pool.length) + pool.length) % pool.length
  return pool[i] ?? null
}

export function featuredFitMove(moves: readonly FitMove[] = FIT_MOVES): FitMove {
  return moves.find(m => m.code === FIT_SAMPLE_CODE) ?? teaseFitMoves(moves)[0] ?? moves[0]
}

export function fitMoveByCode(code: string, moves: readonly FitMove[] = FIT_MOVES): FitMove | null {
  return moves.find(m => m.code === code) ?? null
}

export function fitMoveBySlug(slug: string, moves: readonly FitMove[] = FIT_MOVES): FitMove | null {
  return moves.find(m => m.slug === slug) ?? null
}

export function fitLibraryStats(moves: readonly FitMove[] = FIT_MOVES): {
  published: number
  pilot: number
  draft: number
  total: number
} {
  let published = 0
  let pilot = 0
  let draft = 0
  for (const m of moves) {
    if (m.status === 'published') published += 1
    else if (m.status === 'pilot') pilot += 1
    else draft += 1
  }
  return { published, pilot, draft, total: moves.length }
}

const FIT_ADMIN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const

export function formatFitAdminDate(iso: string | null): string {
  if (!iso) return 'Not published'
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return 'Not published'
  const month = FIT_ADMIN_MONTHS[m - 1]
  if (!month) return 'Not published'
  return `${d} ${month} ${y}`
}

/** Gold home tease meta: FO55-035 Hip hinge · 3 reps · ~2 min */
export function fitTeaseMeta(move: FitMove): string {
  const focusWord = move.focus.toLowerCase().includes('hinge')
    ? 'Hip hinge'
    : (move.focus.split(',')[0]?.trim() ?? move.focus)
  return `${move.code} ${[focusWord, move.reps, move.durationLabel].join(' \u00b7 ')}`
}

export function fitMoveCopyStrings(moves: readonly FitMove[] = FIT_MOVES): string[] {
  return moves.flatMap(m => [
    m.code,
    m.title,
    m.focus,
    m.location,
    m.reps,
    m.durationLabel,
    m.hipModNote ?? '',
  ])
}
