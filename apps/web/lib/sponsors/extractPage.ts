/**
 * Fetch a public sponsor page and read its title / social meta.
 * The URL comes from the admin partner form, so the fetch refuses
 * non-public targets and re-checks every redirect hop.
 */

import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import { blockedAddressReason, normalizeHost, publicUrlBlockReason } from '@/lib/http/publicUrl'

export const SPONSOR_FETCH_TIMEOUT_MS = 5_000
export const SPONSOR_FETCH_MAX_BYTES = 200_000
export const SPONSOR_FETCH_MAX_REDIRECTS = 5

export interface SponsorPageMeta {
  url: string
  title: string | null
  description: string | null
  image: string | null
  themeColor: string | null
  siteName: string | null
}

export type HostLookup = (hostname: string) => Promise<readonly string[]>

export interface ScrapeDeps {
  fetchImpl?: typeof fetch
  lookup?: HostLookup
}

async function defaultLookup(hostname: string): Promise<readonly string[]> {
  const records = await lookup(hostname, { all: true, verbatim: true })
  return records.map(record => record.address)
}

/** Resolved URL, or null when the target is not a public http(s) address. */
export async function vettedPublicUrl(
  raw: string,
  resolve: HostLookup = defaultLookup,
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

export async function readResponseText(response: Response, maxBytes: number): Promise<string> {
  const reader = response.body?.getReader()
  if (!reader) {
    const text = await response.text()
    return text.length > maxBytes ? text.slice(0, maxBytes) : text
  }

  const decoder = new TextDecoder()
  let total = 0
  let out = ''
  while (total < maxBytes) {
    const { done, value } = await reader.read()
    if (done) break
    if (!value || value.byteLength === 0) continue
    const room = maxBytes - total
    const slice = value.byteLength > room ? value.subarray(0, room) : value
    total += slice.byteLength
    out += decoder.decode(slice, { stream: true })
    if (total >= maxBytes) {
      await reader.cancel()
      break
    }
  }
  out += decoder.decode()
  return out
}

function metaFromAttrs(html: string, key: string, value: string): string | null {
  const re1 = new RegExp(
    `<meta[^>]+${key}=["']${value}["'][^>]+content=["']([^"']*)["']`,
    'i',
  )
  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']*)["'][^>]+${key}=["']${value}["']`,
    'i',
  )
  const match = html.match(re1) ?? html.match(re2)
  return match ? decodeEntities(match[1].trim()) : null
}

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i)
  return match ? decodeEntities(match[1].trim()) : null
}

function resolveUrl(href: string | null, base: string): string | null {
  if (!href) return null
  try {
    return new URL(href, base).toString()
  } catch {
    return null
  }
}

function isRedirect(status: number): boolean {
  return status >= 300 && status < 400
}

async function fetchPublic(
  rawUrl: string,
  deps: Required<Pick<ScrapeDeps, 'fetchImpl' | 'lookup'>>,
): Promise<{ url: string; html: string } | null> {
  let current = rawUrl
  for (let hop = 0; hop <= SPONSOR_FETCH_MAX_REDIRECTS; hop++) {
    const url = await vettedPublicUrl(current, deps.lookup)
    if (!url) return null

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), SPONSOR_FETCH_TIMEOUT_MS)
    let response: Response
    try {
      response = await deps.fetchImpl(url.toString(), {
        signal: controller.signal,
        headers: {
          'User-Agent': 'EvolvedProsBot/1.0 (+sponsor-extract)',
          Accept: 'text/html,application/xhtml+xml',
        },
        redirect: 'manual',
        cache: 'no-store',
      })
    } catch {
      return null
    } finally {
      clearTimeout(timer)
    }

    if (isRedirect(response.status)) {
      const location = response.headers.get('location')
      await response.body?.cancel().catch(() => undefined)
      if (!location || hop === SPONSOR_FETCH_MAX_REDIRECTS) return null
      try {
        current = new URL(location, url).toString()
      } catch {
        return null
      }
      continue
    }

    if (!response.ok) return null
    const html = await readResponseText(response, SPONSOR_FETCH_MAX_BYTES)
    return { url: url.toString(), html }
  }
  return null
}

export async function scrapeSponsorPage(
  rawUrl: string,
  deps: ScrapeDeps = {},
): Promise<SponsorPageMeta | null> {
  const fetched = await fetchPublic(rawUrl, {
    fetchImpl: deps.fetchImpl ?? fetch,
    lookup: deps.lookup ?? defaultLookup,
  })
  if (!fetched) return null

  const { url, html } = fetched
  const ogTitle = metaFromAttrs(html, 'property', 'og:title')
  const ogDesc = metaFromAttrs(html, 'property', 'og:description')
  const ogImage = metaFromAttrs(html, 'property', 'og:image')
  const ogSiteName = metaFromAttrs(html, 'property', 'og:site_name')
  const themeColor = metaFromAttrs(html, 'name', 'theme-color')
  const twitterImg = metaFromAttrs(html, 'name', 'twitter:image')
  const metaDesc = metaFromAttrs(html, 'name', 'description')
  const titleTag = extractTitle(html)
  const image = resolveUrl(ogImage ?? twitterImg, url)
  const safeImage = image && !publicUrlBlockReason(image) ? image : null

  return {
    url,
    title: ogTitle ?? titleTag,
    description: ogDesc ?? metaDesc,
    image: safeImage,
    themeColor,
    siteName: ogSiteName,
  }
}
