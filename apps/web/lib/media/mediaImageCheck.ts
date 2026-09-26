/**
 * Post-publish check for live media stories. A story fails when its hero
 * does not answer as an image, or when the public page's og:image is the
 * default logo (the silent fallback in storyMeta).
 */

import { DEFAULT_OG_IMAGE } from '@/lib/seo/canonical'
import { heroImageReachable } from './heroReachable'

export const DEFAULT_LOGO_FILE = 'logo_horizontal_navy.png'

export type StoryImageRow = {
  slug: string
  title: string
  pillar: string | null
  featured_image_url: string | null
}

export type ImageCheckFailure = {
  slug: string
  title: string
  reason: string
  url: string | null
}

export type ImageCheckResult = {
  ok: boolean
  checked: number
  failures: ImageCheckFailure[]
}

export type ThursdayProve = {
  name: string
  storiesMust: {
    featuredImage: {
      method: 'HEAD'
      status: 200
      contentTypePrefix: 'image/'
    }
    ogImage: {
      mustNotEqual: typeof DEFAULT_OG_IMAGE
    }
    excludeStoryType: 'redirect'
  }
}

const PAGE_TIMEOUT_MS = 10_000
const CHECK_CONCURRENCY = 5

export function storyPageUrl(origin: string, story: Pick<StoryImageRow, 'pillar' | 'slug'>): string {
  const base = new URL(origin)
  const pillar = story.pillar?.trim() || 'general'
  const path = `/media/${encodeURIComponent(pillar)}/${encodeURIComponent(story.slug)}`
  const url = new URL(path, base)
  if (url.origin !== base.origin) {
    throw new Error('story page URL left the app origin')
  }
  return url.toString()
}

export function ogImageIsDefaultLogo(ogImage: string | null | undefined): boolean {
  if (!ogImage?.trim()) return false
  const trimmed = ogImage.trim()
  if (trimmed === DEFAULT_OG_IMAGE) return true
  try {
    const url = new URL(trimmed, 'https://www.evolvedpros.com')
    const file = url.pathname.split('/').filter(Boolean).pop() ?? ''
    return file === DEFAULT_LOGO_FILE
  } catch {
    return trimmed.endsWith(DEFAULT_LOGO_FILE)
  }
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

/** First og:image content. Ignores og:image:width and og:image:alt. */
export function readOgImage(html: string): string | null {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? []
  for (const tag of tags) {
    if (!/\b(?:property|name)\s*=\s*["']og:image["']/i.test(tag)) continue
    const content = /\bcontent\s*=\s*["']([^"']*)["']/i.exec(tag)
    if (content?.[1]) return decodeHtml(content[1])
  }
  return null
}

async function readPage(url: string, fetchImpl: typeof fetch): Promise<{ status: number; html: string }> {
  try {
    const response = await fetchImpl(url, {
      method: 'GET',
      redirect: 'follow',
      cache: 'no-store',
      signal: AbortSignal.timeout(PAGE_TIMEOUT_MS),
    })
    const html = response.ok ? await response.text() : ''
    return { status: response.status, html }
  } catch {
    return { status: 0, html: '' }
  }
}

export async function checkOneStory(
  story: StoryImageRow,
  pageUrl: string,
  fetchImpl: typeof fetch = fetch,
): Promise<ImageCheckFailure[]> {
  const failures: ImageCheckFailure[] = []
  const imageUrl = story.featured_image_url?.trim() || null
  if (!imageUrl) {
    failures.push({
      slug: story.slug,
      title: story.title,
      reason: 'featured image is missing',
      url: null,
    })
  } else {
    const reach = await heroImageReachable(imageUrl, fetchImpl)
    if (!reach.ok) {
      failures.push({
        slug: story.slug,
        title: story.title,
        reason: reach.status === 200
          ? 'featured image is not an image (HTTP 200)'
          : `featured image does not load (HTTP ${reach.status})`,
        url: imageUrl,
      })
    }
  }

  const page = await readPage(pageUrl, fetchImpl)
  if (page.status !== 200) {
    failures.push({
      slug: story.slug,
      title: story.title,
      reason: `story page does not load (HTTP ${page.status})`,
      url: pageUrl,
    })
    return failures
  }
  const ogImage = readOgImage(page.html)
  if (!ogImage) {
    failures.push({
      slug: story.slug,
      title: story.title,
      reason: 'og:image is missing',
      url: pageUrl,
    })
  } else if (ogImageIsDefaultLogo(ogImage)) {
    failures.push({
      slug: story.slug,
      title: story.title,
      reason: 'og:image is the default logo',
      url: ogImage,
    })
  }
  return failures
}

async function mapPool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length)
  let next = 0
  async function worker() {
    while (next < items.length) {
      const index = next
      next += 1
      results[index] = await fn(items[index]!)
    }
  }
  const workers = Math.min(limit, items.length)
  await Promise.all(Array.from({ length: workers }, () => worker()))
  return results
}

export async function checkPublishedStoryImages(input: {
  stories: StoryImageRow[]
  origin: string
  fetchImpl?: typeof fetch
}): Promise<ImageCheckResult> {
  const fetchImpl = input.fetchImpl ?? fetch
  const groups = await mapPool(input.stories, CHECK_CONCURRENCY, (story) => (
    checkOneStory(story, storyPageUrl(input.origin, story), fetchImpl)
  ))
  const failures = groups.flat()
  return {
    ok: failures.length === 0,
    checked: input.stories.length,
    failures,
  }
}

/** Thursday pack proof. Same two facts the cron fails on. */
export function storyProofFailures(
  story: {
    imageStatus: number | null
    imageContentType: string | null
    ogImage: string | null
  },
  spec: ThursdayProve,
): string[] {
  const failures: string[] = []
  const image = spec.storiesMust.featuredImage
  const mime = story.imageContentType?.split(';')[0]?.trim().toLowerCase() ?? ''
  if (story.imageStatus !== image.status || !mime.startsWith(image.contentTypePrefix)) {
    failures.push('image')
  }
  const og = story.ogImage?.trim() ?? ''
  if (!og || og === spec.storiesMust.ogImage.mustNotEqual || ogImageIsDefaultLogo(og)) {
    failures.push('og:image')
  }
  return failures
}
