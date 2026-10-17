/**
 * Admin Unsplash search key.
 *
 * A missing or blank UNSPLASH_ACCESS_KEY used to return `{ photos: [] }` /
 * `{ results: [] }` with HTTP 200. The picker then looked like a search that
 * found nothing. Fail closed instead: callers answer 503 with a stable
 * message and this log names the env var on the server only.
 *
 * A real key is trimmed. Unsplash rejects surrounding whitespace, and a
 * whitespace-only value is the same hole as an unset key.
 */

export const UNSPLASH_UNAVAILABLE = 'Stock photo search is unavailable.'

export function unsplashAccessKey(): string | null {
  const key = process.env.UNSPLASH_ACCESS_KEY
  if (typeof key !== 'string' || key.trim() === '') {
    console.error('[unsplash] UNSPLASH_ACCESS_KEY is not set')
    return null
  }
  return key.trim()
}
