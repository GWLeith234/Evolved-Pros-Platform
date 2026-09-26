/**
 * A publish is not done when the URL merely looks owned. The image has to
 * answer HEAD 200 with an image content-type, or the story page falls back
 * to the logo for og:image.
 */

import { publishGuardDecision } from './heroPublishGuard'

export function heroLoadError(status: number): string {
  return `Hero image does not load (HTTP ${status})`
}

export function imageMime(header: string | null | undefined): string | null {
  if (!header) return null
  const mime = header.split(';')[0]?.trim().toLowerCase() ?? ''
  return mime.startsWith('image/') ? mime : null
}

export type HeroReach =
  | { ok: true; contentType: string }
  | { ok: false; status: number; error: string }

const HEAD_TIMEOUT_MS = 10_000

export async function heroImageReachable(
  url: string,
  fetchImpl: typeof fetch = fetch,
): Promise<HeroReach> {
  let response: Response
  try {
    response = await fetchImpl(url, {
      method: 'HEAD',
      redirect: 'follow',
      cache: 'no-store',
      signal: AbortSignal.timeout(HEAD_TIMEOUT_MS),
    })
  } catch {
    return { ok: false, status: 0, error: heroLoadError(0) }
  }
  const contentType = imageMime(response.headers.get('content-type'))
  if (response.status !== 200 || !contentType) {
    return { ok: false, status: response.status, error: heroLoadError(response.status) }
  }
  return { ok: true, contentType }
}

/**
 * App-side pre-publish check. The owned-URL guard runs first. HEAD runs only
 * after that passes, so a draft or an Unsplash URL never leaves the server.
 */
export async function publishHeroGate(input: {
  isPublished: boolean
  featuredImageUrl: string | null | undefined
  supabaseUrl?: string | null
  fetchImpl?: typeof fetch
}): Promise<{ allow: true } | { allow: false; error: string }> {
  const decision = publishGuardDecision({
    isPublished: input.isPublished,
    featuredImageUrl: input.featuredImageUrl,
    supabaseUrl: input.supabaseUrl,
  })
  if (!decision.allow || !input.isPublished) return decision
  const url = input.featuredImageUrl?.trim()
  if (!url) return decision
  const reach = await heroImageReachable(url, input.fetchImpl)
  if (!reach.ok) return { allow: false, error: reach.error }
  return { allow: true }
}
