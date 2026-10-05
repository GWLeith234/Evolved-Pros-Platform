import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  MEDIA_PILLAR_HUB_SITEMAP_PRIORITY,
} from './sitemapEntries'
import {
  MEDIA_CATEGORY_LANDING_NEVER,
  type MediaCategoryLandingSignals,
  type MediaCategoryStoryRow,
  mediaCategoryLandingPaths,
  toMediaCategoryLandingSitemapEntries,
} from './mediaCategoryLandings'

const BASE = 'https://www.evolvedpros.com'

const EMPTY: MediaCategoryLandingSignals = {
  stories: [],
  communityPostCount: 0,
  publishedEventTitles: [],
  publishedLessonCount: 0,
  publishedCourseCount: 0,
  publishedJobCount: 0,
}

function story(partial: MediaCategoryStoryRow): MediaCategoryStoryRow {
  return partial
}

/** Signals that match the 2026-10-05 live audit: four landings have content. */
function auditSignals(overrides: Partial<MediaCategoryLandingSignals> = {}): MediaCategoryLandingSignals {
  return {
    stories: [
      story({
        pillar: 'strategy',
        slug: 'close-the-gap',
        section: null,
        tags: [],
        is_published: true,
      }),
    ],
    communityPostCount: 8,
    publishedEventTitles: [
      'Conquer Local Podcast launches',
      'EVOLVED book launches October 15',
    ],
    publishedLessonCount: 1,
    publishedCourseCount: 6,
    publishedJobCount: 0,
    ...overrides,
  }
}

describe('media category landing sitemap entries', () => {
  it('lists the four landings that have published content, and not the empty ones', () => {
    const paths = mediaCategoryLandingPaths(auditSignals())
    expect(paths).toEqual([
      '/media/evolved-architecture',
      '/media/community',
      '/media/academy',
      '/media/events',
    ])

    const entries = toMediaCategoryLandingSitemapEntries(BASE, auditSignals())
    expect(entries.map(entry => entry.url)).toEqual(paths.map(path => `${BASE}${path}`))
    expect(entries.every(entry => !('lastModified' in entry))).toBe(true)
    expect(entries.every(entry => entry.priority === MEDIA_PILLAR_HUB_SITEMAP_PRIORITY)).toBe(true)
    expect(entries.every(entry => entry.changeFrequency === 'weekly')).toBe(true)
    expect(MEDIA_PILLAR_HUB_SITEMAP_PRIORITY).toBe(0.6)

    const once = JSON.stringify(entries)
    const twice = JSON.stringify(toMediaCategoryLandingSitemapEntries(BASE, auditSignals()))
    expect(once).toBe(twice)
  })

  it('emits nothing when every landing is empty', () => {
    expect(mediaCategoryLandingPaths(EMPTY)).toEqual([])
  })

  it('never emits /media/podcast, /media/preview, pillar hubs, or /login', () => {
    const paths = mediaCategoryLandingPaths(auditSignals({
      stories: [
        story({
          pillar: 'preview',
          slug: 'secret-draft',
          section: 'podcast',
          tags: ['preview'],
          is_published: true,
        }),
        story({
          pillar: 'foundation',
          slug: 'first-principles',
          section: 'podcast',
          tags: ['podcast'],
          is_published: true,
        }),
      ],
      publishedJobCount: 3,
    }))
    expect(paths).not.toContain('/media/podcast')
    expect(paths).not.toContain('/media/preview')
    expect(paths.some(path => path.startsWith('/media/preview/'))).toBe(false)
    expect(paths).not.toContain('/media/foundation')
    expect(paths.some(path => path.includes('/login'))).toBe(false)
    expect([...MEDIA_CATEGORY_LANDING_NEVER]).toEqual(['/media/podcast', '/media/preview'])
  })

  it('adds a story-section landing once a listable story matches section or tags', () => {
    const bySection = mediaCategoryLandingPaths(auditSignals({
      stories: [
        story({
          pillar: 'strategy',
          slug: 'agents',
          section: 'ai-trends',
          tags: [],
          is_published: true,
        }),
      ],
    }))
    expect(bySection).toContain('/media/ai-trends')

    const byTag = mediaCategoryLandingPaths(auditSignals({
      stories: [
        story({
          pillar: 'identity',
          slug: 'lead',
          section: null,
          tags: ['leadership'],
          is_published: true,
        }),
      ],
      communityPostCount: 0,
      publishedEventTitles: [],
      publishedLessonCount: 0,
      publishedCourseCount: 0,
    }))
    expect(byTag).toEqual([
      '/media/evolved-architecture',
      '/media/leadership',
    ])

    const wellness = mediaCategoryLandingPaths({
      ...EMPTY,
      stories: [
        story({
          pillar: 'execution',
          slug: 'rest',
          section: 'other',
          tags: ['wellness'],
          is_published: true,
        }),
      ],
    })
    expect(wellness).toEqual([
      '/media/evolved-architecture',
      '/media/wellness',
    ])
  })

  it('does not open a section landing from a denylisted, preview, or unpublished story', () => {
    const paths = mediaCategoryLandingPaths({
      ...EMPTY,
      stories: [
        story({
          pillar: 'execution',
          slug: 'why-elite-sales-teams-swear-by-ritual-not-motivation',
          section: 'ai-trends',
          tags: ['leadership', 'wellness'],
          is_published: true,
        }),
        story({
          pillar: 'strategy',
          slug: 'build-repeatable-sales-strategy-framework',
          section: 'leadership',
          is_published: true,
        }),
        story({
          pillar: 'preview',
          slug: 'secret-draft',
          section: 'wellness',
          is_published: true,
        }),
        story({
          pillar: 'identity',
          slug: 'draft',
          section: 'ai-trends',
          tags: ['ai-trends'],
          is_published: false,
        }),
      ],
    })
    expect(paths).toEqual([])
  })

  it('keeps /media/general out while the landing would still render no story', () => {
    const nullPillar = mediaCategoryLandingPaths({
      ...EMPTY,
      stories: [
        story({
          pillar: null,
          slug: 'original-essay',
          section: null,
          is_published: true,
        }),
        story({
          pillar: '   ',
          slug: 'also-original',
          is_published: true,
        }),
      ],
    })
    expect(nullPillar).not.toContain('/media/general')
    expect(nullPillar).not.toContain('/media/evolved-architecture')

    const filedAsGeneral = mediaCategoryLandingPaths({
      ...EMPTY,
      stories: [
        story({
          pillar: 'general',
          slug: 'original-essay',
          is_published: true,
        }),
      ],
    })
    expect(filedAsGeneral).not.toContain('/media/general')
    expect(filedAsGeneral).toContain('/media/evolved-architecture')
  })

  it('includes careers only when a job is published', () => {
    expect(mediaCategoryLandingPaths(EMPTY)).not.toContain('/media/careers')
    expect(mediaCategoryLandingPaths({ ...EMPTY, publishedJobCount: 1 })).toEqual([
      '/media/careers',
    ])
  })

  it('includes events only when a published event survives the Conquer Local filter', () => {
    expect(mediaCategoryLandingPaths({
      ...EMPTY,
      publishedEventTitles: ['Conquer Local Podcast launches'],
    })).toEqual([])

    expect(mediaCategoryLandingPaths({
      ...EMPTY,
      publishedEventTitles: ['EVOLVED book launches October 15'],
    })).toEqual(['/media/events'])
  })

  it('includes academy when a published lesson or course exists', () => {
    expect(mediaCategoryLandingPaths(EMPTY)).not.toContain('/media/academy')
    expect(mediaCategoryLandingPaths({ ...EMPTY, publishedLessonCount: 1 })).toEqual([
      '/media/academy',
    ])
    expect(mediaCategoryLandingPaths({ ...EMPTY, publishedCourseCount: 1 })).toEqual([
      '/media/academy',
    ])
  })

  it('includes community only when the landing has at least one post', () => {
    expect(mediaCategoryLandingPaths(EMPTY)).not.toContain('/media/community')
    expect(mediaCategoryLandingPaths({ ...EMPTY, communityPostCount: 1 })).toEqual([
      '/media/community',
    ])
  })

  it('includes evolved-architecture only when a listable published story exists', () => {
    expect(mediaCategoryLandingPaths(EMPTY)).not.toContain('/media/evolved-architecture')
    expect(mediaCategoryLandingPaths({
      ...EMPTY,
      stories: [
        story({ pillar: 'strategy', slug: 'close-the-gap', is_published: true }),
      ],
    })).toEqual(['/media/evolved-architecture'])
  })

  it('does not call new Date() for category landing lastmod', () => {
    const src = readFileSync(resolve(__dirname, 'mediaCategoryLandings.ts'), 'utf8')
    expect(src).not.toMatch(/new Date\(\s*\)/)
    const sitemap = readFileSync(resolve(__dirname, '../../app/sitemap.ts'), 'utf8')
    expect(sitemap).toContain('toMediaCategoryLandingSitemapEntries')
    expect(sitemap).not.toContain('/media/academy')
    expect(sitemap).not.toContain('/media/careers')
    expect(sitemap).not.toContain('/media/evolved-architecture')
    expect(sitemap).not.toContain('/media/community')
    expect(sitemap).not.toContain('/media/events')
    expect(sitemap).not.toContain('/media/podcast')
    expect(sitemap).not.toContain("'/media/preview'")
    expect(sitemap).not.toContain('/media/general')
    expect(sitemap).not.toContain('/media/ai-trends')
    expect(sitemap).not.toContain('/media/leadership')
    expect(sitemap).not.toContain('/media/wellness')
  })
})
