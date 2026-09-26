/**
 * Postgres check_violation (23514) from media_stories_require_hero.
 * The admin routes turn that into a 422 instead of a raw 500.
 */

export const PG_CHECK_VIOLATION = '23514'

export const HERO_DB_REJECTED =
  'Publishing needs an owned Branding hero image.'

export function mediaStoryWriteFailure(error: {
  code?: string | null
  message?: string | null
}): { status: number; error: string } {
  if (error.code === PG_CHECK_VIOLATION) {
    return { status: 422, error: HERO_DB_REJECTED }
  }
  return { status: 500, error: error.message || 'Save failed' }
}
