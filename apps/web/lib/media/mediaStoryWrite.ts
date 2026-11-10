/**
 * Postgres check_violation (23514) from media_stories_require_hero.
 * The admin routes turn that into a 422 instead of a raw 500.
 * Other provider failures keep status 500 and a stable message; the
 * PostgREST text stays in the redacted server log.
 */

import { logProviderError } from '@/lib/http/clientError'

export const PG_CHECK_VIOLATION = '23514'

export const HERO_DB_REJECTED =
  'Publishing needs an owned Branding hero image.'

export function mediaStoryWriteFailure(error: {
  code?: string | null
  message?: string | null
  details?: string | null
  hint?: string | null
}): { status: number; error: string } {
  if (error.code === PG_CHECK_VIOLATION) {
    return { status: 422, error: HERO_DB_REJECTED }
  }
  logProviderError('[media story write]', error)
  return { status: 500, error: 'Save failed' }
}
