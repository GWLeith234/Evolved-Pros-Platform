export type CourseWithProgress = {
  id: string
  pillarNumber: number
  slug: string
  title: string
  description: string | null
  requiredTier: 'community' | 'pro'
  isPublished: boolean
  sortOrder: number
  totalLessons: number
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
}

export type LessonNotes = {
  notes: string
  updatedAt: string
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

export function formatTotalDuration(lessons: { durationSeconds: number | null }[]): string {
  const total = lessons.reduce((sum, l) => sum + (l.durationSeconds ?? 0), 0)
  return formatDurationSeconds(total)
}
