/**
 * Fetch a URL the server did not construct.
 *
 * Callers pass request input or a URL stored from user content (audio to
 * transcribe, a guest photo, a podcast thumbnail). Scheme and literal-address
 * checks live in `publicUrl`. This adds DNS and re-checks every redirect hop
 * so a public host cannot 302 the request onto loopback or link-local metadata.
 */

import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import { blockedAddressReason, normalizeHost, publicUrlBlockReason } from '@/lib/http/publicUrl'

export type HostLookup = (hostname: string) => Promise<readonly string[]>

export const PUBLIC_FETCH_MAX_REDIRECTS = 5
export const PUBLIC_FETCH_TIMEOUT_MS = 15_000

export type PublicFetchReason = 'invalid' | 'blocked' | 'dns' | 'redirect' | 'network'

export type PublicFetchResult =
  | { ok: true; url: string; response: Response }
  | { ok: false; reason: PublicFetchReason }

export interface PublicFetchOptions {
  fetchImpl?: typeof fetch
  lookup?: HostLookup
  timeoutMs?: number
  maxRedirects?: number
  headers?: HeadersInit
  cache?: RequestCache
  method?: string
}

export async function defaultPublicLookup(hostname: string): Promise<readonly string[]> {
  const records = await lookup(hostname, { all: true, verbatim: true })
  return records.map(record => record.address)
}

/** Resolved URL, or null when the target is not a public http(s) address. */
export async function vettedPublicUrl(
  raw: string,
  resolve: HostLookup = defaultPublicLookup,
): Promise<URL | null> {
  if (publicUrlBlockReason(raw)) return null
  const url = new URL(raw)
  const host = normalizeHost(url.hostname)
  if (!isIP(host)) {
    let addresses: readonly string[]
    try {
      addresses = await resolve(host)
    } catch {
      return null
    }
    if (addresses.length === 0) return null
    for (const address of addresses) {
      if (blockedAddressReason(address)) return null
    }
  }
  return url
}

function refusal(raw: string): PublicFetchReason {
  const sync = publicUrlBlockReason(raw)
  if (!sync) return 'dns'
  if (sync === 'invalid url' || sync === 'unsupported scheme') return 'invalid'
  return 'blocked'
}

function isRedirect(status: number): boolean {
  return status >= 300 && status < 400
}

/**
 * `ok` means the final hop was a public address and the connection was made.
 * HTTP status stays on `response` for the caller. A blocked target is never requested.
 */
export async function fetchPublicResource(
  rawUrl: string,
  options: PublicFetchOptions = {},
): Promise<PublicFetchResult> {
  const fetchImpl = options.fetchImpl ?? fetch
  const resolve = options.lookup ?? defaultPublicLookup
  const timeoutMs = options.timeoutMs ?? PUBLIC_FETCH_TIMEOUT_MS
  const maxRedirects = options.maxRedirects ?? PUBLIC_FETCH_MAX_REDIRECTS
  let current = rawUrl

  for (let hop = 0; hop <= maxRedirects; hop++) {
    const url = await vettedPublicUrl(current, resolve)
    if (!url) return { ok: false, reason: refusal(current) }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    let response: Response
    try {
      response = await fetchImpl(url.toString(), {
        method: options.method ?? 'GET',
        signal: controller.signal,
        headers: options.headers,
        redirect: 'manual',
        cache: options.cache,
      })
    } catch {
      return { ok: false, reason: 'network' }
    } finally {
      clearTimeout(timer)
    }

    if (isRedirect(response.status)) {
      const location = response.headers.get('location')
      await response.body?.cancel().catch(() => undefined)
      if (!location || hop === maxRedirects) return { ok: false, reason: 'redirect' }
      try {
        current = new URL(location, url).toString()
      } catch {
        return { ok: false, reason: 'redirect' }
      }
      continue
    }

    return { ok: true, url: url.toString(), response }
  }

  return { ok: false, reason: 'redirect' }
}
