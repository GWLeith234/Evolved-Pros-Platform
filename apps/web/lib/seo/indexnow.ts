import { CANONICAL_ORIGIN } from './canonical'

/**
 * IndexNow (Bing, Yandex, Seznam, Naver…) — tell search engines a public URL
 * changed. Key comes from INDEXNOW_KEY; when unset every helper is a no-op.
 * The key file is served at /<key>.txt by app/api/indexnow-key/[key] via the
 * afterFiles rewrite in next.config.mjs.
 */
export const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow'
export const INDEXNOW_HOST = new URL(CANONICAL_ORIGIN).host

// IndexNow spec: 8–128 chars of a-z, A-Z, 0-9 and '-'.
const KEY_PATTERN = /^[A-Za-z0-9-]{8,128}$/

export function readIndexNowKey(env: Record<string, string | undefined> = process.env): string | null {
  const key = env.INDEXNOW_KEY?.trim()
  return key && KEY_PATTERN.test(key) ? key : null
}

/** Body for the key-file route: the key when `requested` matches it, else null (→ 404). */
export function indexNowKeyFileBody(
  requested: string,
  env: Record<string, string | undefined> = process.env,
): string | null {
  const key = readIndexNowKey(env)
  if (!key) return null
  const name = requested.endsWith('.txt') ? requested.slice(0, -4) : requested
  return name === key ? key : null
}

export function buildIndexNowPayload(key: string, urls: string[]) {
  const urlList = Array.from(new Set(urls)).filter(u => {
    try {
      return new URL(u).host === INDEXNOW_HOST
    } catch {
      return false
    }
  })
  return {
    host: INDEXNOW_HOST,
    key,
    keyLocation: `${CANONICAL_ORIGIN}/${key}.txt`,
    urlList,
  }
}

export function canonicalPublicUrl(path: string): string {
  return new URL(path, CANONICAL_ORIGIN).toString()
}

export function mediaStoryPublicUrl(story: { pillar?: string | null; slug: string }): string {
  const pillar = story.pillar?.trim() || 'general'
  return canonicalPublicUrl(`/media/${encodeURIComponent(pillar)}/${encodeURIComponent(story.slug)}`)
}

export function podcastEpisodePublicUrl(slug: string): string {
  return canonicalPublicUrl(`/podcast/${encodeURIComponent(slug)}`)
}

type PingDeps = {
  env?: Record<string, string | undefined>
  fetchImpl?: typeof fetch
  log?: Pick<Console, 'info' | 'warn'>
}

/**
 * Ping IndexNow. Never throws; resolves to the HTTP status, or null when
 * skipped (no key / no on-host URLs) or the request failed.
 */
export async function pingIndexNow(urls: string[], deps: PingDeps = {}): Promise<number | null> {
  const log = deps.log ?? console
  try {
    const key = readIndexNowKey(deps.env)
    if (!key) return null
    const payload = buildIndexNowPayload(key, urls)
    if (payload.urlList.length === 0) return null
    const res = await (deps.fetchImpl ?? fetch)(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8_000),
    })
    log.info(`[indexnow] ${res.status} for ${payload.urlList.length} url(s): ${payload.urlList.join(', ')}`)
    return res.status
  } catch (err) {
    log.warn(`[indexnow] ping failed: ${err instanceof Error ? err.message : String(err)}`)
    return null
  }
}

/** Fire-and-forget wrapper for publish paths. */
export function queueIndexNowPing(urls: string[], deps: PingDeps = {}): void {
  void pingIndexNow(urls, deps)
}
