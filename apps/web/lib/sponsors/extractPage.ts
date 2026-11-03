/**
 * Fetch a public sponsor page and read its title / social meta.
 * The URL comes from the admin partner form, so the fetch refuses
 * non-public targets and re-checks every redirect hop.
 */

import {
  defaultPublicLookup,
  fetchPublicResource,
  vettedPublicUrl,
  type HostLookup,
} from '@/lib/http/publicFetch'
import { publicUrlBlockReason } from '@/lib/http/publicUrl'

export type { HostLookup }
export { vettedPublicUrl }

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

export interface ScrapeDeps {
  fetchImpl?: typeof fetch
  lookup?: HostLookup
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

async function fetchPublic(
  rawUrl: string,
  deps: Required<Pick<ScrapeDeps, 'fetchImpl' | 'lookup'>>,
): Promise<{ url: string; html: string } | null> {
  const fetched = await fetchPublicResource(rawUrl, {
    fetchImpl: deps.fetchImpl,
    lookup: deps.lookup,
    timeoutMs: SPONSOR_FETCH_TIMEOUT_MS,
    maxRedirects: SPONSOR_FETCH_MAX_REDIRECTS,
    headers: {
      'User-Agent': 'EvolvedProsBot/1.0 (+sponsor-extract)',
      Accept: 'text/html,application/xhtml+xml',
    },
    cache: 'no-store',
  })
  if (!fetched.ok) return null
  if (!fetched.response.ok) {
    await fetched.response.body?.cancel().catch(() => undefined)
    return null
  }
  const html = await readResponseText(fetched.response, SPONSOR_FETCH_MAX_BYTES)
  return { url: fetched.url, html }
}

export async function scrapeSponsorPage(
  rawUrl: string,
  deps: ScrapeDeps = {},
): Promise<SponsorPageMeta | null> {
  const fetched = await fetchPublic(rawUrl, {
    fetchImpl: deps.fetchImpl ?? fetch,
    lookup: deps.lookup ?? defaultPublicLookup,
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
