import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MediaMastheadLockup } from '@/components/media/Masthead'
import { FitMastheadLockup } from '@/components/fit/FitMasthead'
import { PodcastMastheadLockup } from '@/components/podcast/PodcastMasthead'

const here = dirname(fileURLToPath(import.meta.url))
const webRoot = resolve(here, '../..')

function read(rel: string): string {
  return readFileSync(resolve(webRoot, rel), 'utf8')
}

/**
 * Ancestor `loading.tsx` files. A route-group sibling such as
 * `podcast/(index)/loading.tsx` is not an ancestor of `podcast/[slug]`.
 */
function ancestorLoaders(pageRel: string): string[] {
  const parts = pageRel.split('/')
  parts.pop()
  const found: string[] = []
  while (parts.length > 0) {
    const candidate = resolve(webRoot, ...parts, 'loading.tsx')
    if (existsSync(candidate)) found.push(candidate.slice(webRoot.length + 1))
    parts.pop()
  }
  return found
}

const REAL_404_PAGES = [
  'app/(public)/media/[pillar]/[slug]/page.tsx',
  'app/(public)/media/[pillar]/page.tsx',
  'app/(public)/podcast/[slug]/page.tsx',
  'app/(public)/media/preview/[slug]/page.tsx',
  'app/(public)/media/preview/[slug]/card/page.tsx',
]

describe('real HTTP 404 for missing media and podcast routes', () => {
  it('calls notFound() from generateMetadata and has no ancestor loading shell', () => {
    expect(existsSync(resolve(webRoot, 'app/loading.tsx'))).toBe(false)
    expect(existsSync(resolve(webRoot, 'app/(public)/loading.tsx'))).toBe(false)
    expect(existsSync(resolve(webRoot, 'app/(public)/media/loading.tsx'))).toBe(false)
    expect(existsSync(resolve(webRoot, 'app/(public)/media/preview/loading.tsx'))).toBe(false)
    expect(existsSync(resolve(webRoot, 'app/(public)/podcast/loading.tsx'))).toBe(false)

    for (const rel of REAL_404_PAGES) {
      const src = read(rel)
      const metaStart = src.indexOf('export async function generateMetadata')
      const pageStart = src.indexOf('export default')
      expect(metaStart, rel).toBeGreaterThan(-1)
      expect(pageStart, rel).toBeGreaterThan(metaStart)
      const meta = src.slice(metaStart, pageStart)
      expect(meta, rel).toContain('notFound()')
      expect(meta, rel).not.toMatch(/return\s+\{\s*\}/)
      expect(meta, rel).not.toContain("title: 'Not found'")
      expect(ancestorLoaders(rel), rel).toEqual([])
    }
  })

  it('keeps preview noindex on the allowed document and the response headers', () => {
    const preview = read('app/(public)/media/preview/[slug]/page.tsx')
    const card = read('app/(public)/media/preview/[slug]/card/page.tsx')
    const layout = read('app/(public)/media/preview/layout.tsx')
    const nextConfig = read('next.config.mjs')
    expect(preview).toContain('robots: PREVIEW_ROBOTS')
    expect(card).toContain('robots: PREVIEW_ROBOTS')
    expect(layout).toContain('PREVIEW_ROBOTS')
    expect(nextConfig).toContain("source: '/media/preview/:path*'")
    expect(nextConfig).toContain("value: 'noindex, nofollow'")
  })

  it('keeps the branded loader on routes that are not those 404 pages', () => {
    for (const rel of [
      'app/(public)/(home)/loading.tsx',
      'app/(public)/media/(hub)/loading.tsx',
      'app/(public)/podcast/(index)/loading.tsx',
      'app/(public)/pricing/loading.tsx',
      'app/(member)/loading.tsx',
      'app/live/loading.tsx',
    ]) {
      expect(existsSync(resolve(webRoot, rel)), rel).toBe(true)
    }
    expect(read('app/(public)/(home)/loading.tsx')).toContain('BrandedLoading')
    expect(read('app/(member)/loading.tsx')).toContain('Skeleton')
  })
})

describe('single H1', () => {
  it('renders the media wordmark as a div unless the page asks for the home H1', () => {
    const plain = renderToStaticMarkup(<MediaMastheadLockup />)
    const home = renderToStaticMarkup(<MediaMastheadLockup heading />)
    expect(plain).toContain('<div class="ep-media-masthead-wordmark">')
    expect(plain).not.toContain('<h1')
    expect(home).toContain('<h1 class="ep-media-masthead-wordmark">')
    expect(read('components/media/Masthead.tsx')).toContain('<MediaMastheadWordmark />')
    expect(read('components/media/MediaMastheadWordmark.tsx')).toContain("pathname === '/media'")
  })

  it('keeps the podcast and home-tease wordmarks off the page H1', () => {
    const podcast = renderToStaticMarkup(<PodcastMastheadLockup />)
    const podcastHome = renderToStaticMarkup(<PodcastMastheadLockup heading />)
    expect(podcast).toContain('<div class="ep-podcast-masthead-wordmark">')
    expect(podcast).not.toContain('<h1')
    expect(podcastHome).toContain('<h1 class="ep-podcast-masthead-wordmark">')

    const tease = renderToStaticMarkup(<FitMastheadLockup compact />)
    const fit = renderToStaticMarkup(<FitMastheadLockup />)
    expect(tease).toContain('ep-fit-masthead-wordmark--compact')
    expect(tease).not.toContain('<h1')
    expect(fit).toContain('<h1 class="ep-fit-masthead-wordmark">')
  })
})
