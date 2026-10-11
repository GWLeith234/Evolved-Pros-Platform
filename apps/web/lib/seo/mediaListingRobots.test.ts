import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { MEDIA_PILLAR_HUB_PATHS } from './publicRoutes'
import { publicPageMetadata } from './canonical'
import { EMPTY_MEDIA_LISTING_ROBOTS, mediaListingRobots } from './mediaListingRobots'

const require = createRequire(import.meta.url)
const { resolveRobots } = require('next/dist/lib/metadata/resolvers/resolve-basics') as {
  resolveRobots: (
    robots: { index?: boolean; follow?: boolean; googleBot?: unknown } | undefined,
  ) => { basic: string | null; googleBot: string | null } | null
}

const here = dirname(fileURLToPath(import.meta.url))

function read(rel: string): string {
  return readFileSync(resolve(here, rel), 'utf8')
}

/**
 * Rendered listing sizes from the 2026-10-07 Googlebot crawl of
 * platform.evolvedpros.com (www after the public redirect). Story-link
 * counts for story landings; careers is published jobs (the page renders
 * none). Community, academy, and events are not story listings.
 */
const LIVE_RENDERED_COUNTS = {
  '/media/ai-trends': 0,
  '/media/leadership': 0,
  '/media/wellness': 0,
  '/media/careers': 0,
  '/media/general': 0,
  '/media/foundation': 11,
  '/media/identity': 11,
  '/media/mental-toughness': 13,
  '/media/strategy': 25,
  '/media/accountability': 6,
  '/media/execution': 8,
  '/media/evolved-architecture': 24,
} as const

function metaFor(path: string, publishedCount: number) {
  return publicPageMetadata(path, {
    title: 'Listing',
    description: 'Listing description',
    ...mediaListingRobots(publishedCount),
  })
}

function robotsMetaContent(robots: unknown): string | null {
  if (!robots || typeof robots !== 'object') return null
  return resolveRobots(robots as { index?: boolean; follow?: boolean })?.basic ?? null
}

describe('mediaListingRobots', () => {
  it('emits noindex, follow when the rendered collection is empty', () => {
    expect(mediaListingRobots(0)).toEqual({ robots: EMPTY_MEDIA_LISTING_ROBOTS })
    expect(EMPTY_MEDIA_LISTING_ROBOTS).toEqual({ index: false, follow: true })

    const resolved = resolveRobots(mediaListingRobots(0).robots)
    expect(resolved).toEqual({ basic: 'noindex, follow', googleBot: null })
  })

  it('omits robots when at least one published item is rendered', () => {
    expect(mediaListingRobots(1)).toEqual({})
    expect(mediaListingRobots(24)).toEqual({})
    expect(resolveRobots(undefined)).toBeNull()
  })

  it('keeps the www canonical when an empty listing is noindex, follow', () => {
    for (const path of [
      '/media/ai-trends',
      '/media/leadership',
      '/media/wellness',
      '/media/careers',
      '/media/general',
    ]) {
      const meta = metaFor(path, 0)
      expect(meta.robots).toEqual({ index: false, follow: true })
      expect(robotsMetaContent(meta.robots)).toBe('noindex, follow')
      expect(resolveRobots(EMPTY_MEDIA_LISTING_ROBOTS)?.googleBot).toBeNull()
      expect(meta.alternates?.canonical).toBe(`https://www.evolvedpros.com${path}`)
      expect(meta.openGraph?.url).toBe(`https://www.evolvedpros.com${path}`)
    }
  })

  it('matches the live crawl: empty landings noindex, populated story listings do not', () => {
    for (const [path, count] of Object.entries(LIVE_RENDERED_COUNTS)) {
      const meta = metaFor(path, count)
      if (count === 0) {
        expect(robotsMetaContent(meta.robots), path).toBe('noindex, follow')
      } else {
        expect(meta.robots, path).toBeUndefined()
        expect(robotsMetaContent(meta.robots), path).toBeNull()
      }
      expect(meta.alternates?.canonical).toBe(`https://www.evolvedpros.com${path}`)
    }

    for (const path of MEDIA_PILLAR_HUB_PATHS) {
      expect(LIVE_RENDERED_COUNTS[path]).toBeGreaterThan(0)
      expect(metaFor(path, LIVE_RENDERED_COUNTS[path]).robots).toBeUndefined()
    }
  })
})

describe('media listing robots wiring', () => {
  const storyMagazines = [
    'ai-trends',
    'leadership',
    'wellness',
    'evolved-architecture',
  ] as const

  it('passes the rendered story array length into the rule on story landings', () => {
    for (const slug of storyMagazines) {
      const page = read(`../../app/(public)/media/${slug}/page.tsx`)
      expect(page, slug).toContain('mediaListingRobots(articles.length)')
      expect(page, slug).toContain('const articles = await fetchArticles()')
      expect(page, slug).toContain('MediaSectionMagazine')
      expect(page, slug).not.toContain('noindex')
      expect(page, slug).not.toContain('export const metadata')
    }
  })

  it('counts the same articles MediaSectionLanding renders, including general and the hubs', () => {
    const pillar = read('../../app/(public)/media/[pillar]/page.tsx')
    expect(pillar).toContain('mediaListingRobots(articles.length)')
    expect(pillar).toContain('const articles = await fetchArticles(params.pillar)')
    expect(pillar).toContain('listPublicMediaStories')
    expect(pillar).toContain('MediaSectionLanding')
    expect(pillar).toContain('mediaPillarCollectionDescription(label)')
    expect(pillar).not.toContain('noindex')
    expect(pillar).not.toContain("pillar === 'general' ? mediaListingRobots")
  })

  it('counts published jobs on /media/careers, which does not render media_stories', () => {
    const careers = read('../../app/(public)/media/careers/page.tsx')
    expect(careers).toContain('mediaListingRobots(jobs.length)')
    expect(careers).toContain(".from('job_listings')")
    expect(careers).toContain(".eq('status', 'published')")
    expect(careers).toContain('const jobs = await fetchPublishedJobs()')
    expect(careers).not.toContain('media_stories')
    expect(careers).not.toContain('noindex')
    expect(careers).not.toContain('LdJson')
  })

  it('leaves /media and the non-story landings indexable with their JSON-LD untouched', () => {
    const untouched = [
      ['../../app/(public)/media/(hub)/page.tsx', 'mediaIndexCollectionSchemas()'],
      ['../../app/(public)/media/community/page.tsx', 'collectionItemsFromNames(posts.map(post => post.body))'],
      ['../../app/(public)/media/academy/page.tsx', 'allCourses.map(course => course.title)'],
      ['../../app/(public)/media/events/page.tsx', '[...upcomingEvents, ...pastEvents].map(event => event.title)'],
      ['../../lib/seo/mediaCollectionJsonLd.ts', 'export function mediaSectionCollectionSchemas'],
      ['../../components/media/MediaSectionMagazine.tsx', 'magazineStoryItems(articles)'],
      ['../../components/media/MediaSectionLanding.tsx', 'sectionLandingStoryItems(articles)'],
      ['../../app/sitemap.ts', 'toMediaCategoryLandingSitemapEntries'],
    ] as const

    for (const [rel, marker] of untouched) {
      const src = read(rel)
      expect(src, rel).toContain(marker)
      expect(src, rel).not.toContain('mediaListingRobots')
      expect(src, rel).not.toContain('noindex')
    }
  })
})
