export type CourseWithProgress = {
  id: string
  pillarNumber: number
  slug: string
  title: string
  description: string | null
  requiredTier: 'community' | 'vip' | 'pro'
  isPublished: boolean
  sortOrder: number
  totalLessons: number | null
  completedLessons: number
  progressPct: number
  lastActivityAt: string | null
  hasAccess: boolean
}

export type LessonWithProgress = {
  id: string
  courseId: string
  slug: string
  title: string
  description: string | null
  muxPlaybackId: string | null
  durationSeconds: number | null
  sortOrder: number
  isPublished: boolean
  completedAt: string | null
  watchTimeSeconds: number
  isLocked: boolean
  moduleNumber: number | null
  /** Cached from HeyGen (see scripts/backfill-lesson-thumbnails.ts). Null
   *  until backfilled, or if the lesson's HeyGen video was deleted. */
  thumbnailUrl: string | null
}

// Pillar thumbnail gradients
export const PILLAR_GRADIENTS: Record<number, string> = {
  1: 'linear-gradient(135deg, #112535 0%, #1b3c5a 100%)',
  2: 'linear-gradient(135deg, #1a2a50 0%, #2d4a8a 100%)',
  3: 'linear-gradient(135deg, #251525 0%, #4a2d6a 100%)',
  4: 'linear-gradient(135deg, #0d2010 0%, #1a4a28 100%)',
  5: 'linear-gradient(135deg, #251510 0%, #4a2d1a 100%)',
  6: 'linear-gradient(135deg, #151225 0%, #2d2a4a 100%)',
}

export const PILLAR_NAMES: Record<number, string> = {
  1: 'Foundation',
  2: 'Identity',
  3: 'Mental Toughness',
  4: 'Strategy',
  5: 'Accountability',
  6: 'Execution',
}

export function formatDurationSeconds(seconds: number | null): string {
  if (!seconds) return ''
  const m = Math.round(seconds / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  const rem = m % 60
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`
}

/** M:SS for the thumbnail duration badge — distinct from formatDurationSeconds's "12m"/"1h 5m". */
export function formatDurationMMSS(seconds: number | null): string | null {
  if (!seconds || seconds <= 0) return null
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}
