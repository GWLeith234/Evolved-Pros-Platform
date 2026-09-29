import { describe, expect, it } from 'vitest'
import {
  MEDIA_CATEGORY_HUB_PATHS,
  isListedPublicMediaStory,
  listPublicMediaStories,
  mediaArticlePath,
  toMediaCategoryHubEntries,
  toMediaSitemapEntries,
} from './sitemap'

const BASE = 'https://platform.evolvedpros.com'

describe('mediaArticlePath', () => {
  it('uses the pillar column as the live /media/{pillar}/{slug} segment', () => {
    expect(mediaArticlePath('mental-toughness', 'stay-in-the-fight')).toBe(
      '/media/mental-toughness/stay-in-the-fight',
    )
  })

  it('skips rows missing pillar or slug', () => {
    expect(mediaArticlePath(null, 'some-slug')).toBeNull()
    expect(mediaArticlePath('strategy', null)).toBeNull()
    expect(mediaArticlePath('', 'some-slug')).toBeNull()
    expect(mediaArticlePath('  ', 'some-slug')).toBeNull()
    expect(mediaArticlePath('strategy', '  ')).toBeNull()
  })
})

describe('toMediaSitemapEntries', () => {
  it('emits published articles with episode-matching lastmod / changefreq / priority', () => {
    const publishedAt = '2026-08-01T12:00:00.000Z'
    const [entry] = toMediaSitemapEntries(BASE, [
      {
        pillar: 'strategy',
        slug: 'close-the-gap',
        published_at: publishedAt,
        is_published: true,
      },
    ])
    expect(entry).toEqual({
      url: `${BASE}/media/strategy/close-the-gap`,
      lastModified: new Date(publishedAt),
      changeFrequency: 'monthly',
      priority: 0.7,
    })
  })

  it('excludes unpublished stories and incomplete rows', () => {
    const entries = toMediaSitemapEntries(BASE, [
      { pillar: 'identity', slug: 'draft-story', published_at: null, is_published: false },
      { pillar: null, slug: 'no-pillar', published_at: null, is_published: true },
      { pillar: 'foundation', slug: null, published_at: null, is_published: true },
      { pillar: 'execution', slug: 'ship-it', published_at: null, is_published: true },
    ])
    expect(entries.map(e => e.url)).toEqual([`${BASE}/media/execution/ship-it`])
  })

  it('does not add /login', () => {
    const entries = toMediaSitemapEntries(BASE, [
      { pillar: 'foundation', slug: 'first-principles', published_at: null, is_published: true },
    ])
    expect(entries.some(e => e.url.includes('/login'))).toBe(false)
  })

  it('skips the two known unpublished slugs even if is_published is wrongly true', () => {
    const entries = toMediaSitemapEntries(BASE, [
      {
        pillar: 'execution',
        slug: 'why-elite-sales-teams-swear-by-ritual-not-motivation',
        published_at: null,
        is_published: true,
      },
      {
        pillar: 'strategy',
        slug: 'build-repeatable-sales-strategy-framework',
        published_at: null,
        is_published: true,
      },
      { pillar: 'identity', slug: 'real-article', published_at: null, is_published: true },
    ])
    expect(entries.map(e => e.url)).toEqual([`${BASE}/media/identity/real-article`])
  })

  it('uses updated_at for lastmod and falls back to published_at', () => {
    const publishedAt = '2026-08-01T12:00:00.000Z'
    const updatedAt = '2026-09-29T02:06:33.000Z'
    const [edited] = toMediaSitemapEntries(BASE, [
      {
        pillar: 'strategy',
        slug: 'close-the-gap',
        published_at: publishedAt,
        updated_at: updatedAt,
        is_published: true,
      },
    ])
    expect(edited?.lastModified).toEqual(new Date(updatedAt))
  })

  it('includes a newly published article without hardcoding the slug', () => {
    const publishedAt = '2026-09-29T02:06:33.000Z'
    const [entry] = toMediaSitemapEntries(BASE, [
      {
        pillar: 'strategy',
        slug: 'what-ai-agents-actually-automate',
        published_at: publishedAt,
        updated_at: publishedAt,
        is_published: true,
      },
    ])
    expect(entry).toEqual({
      url: `${BASE}/media/strategy/what-ai-agents-actually-automate`,
      lastModified: new Date(publishedAt),
      changeFrequency: 'monthly',
      priority: 0.7,
    })
  })

  it('omits lastmod when the row has no updated_at or published_at', () => {
    const [entry] = toMediaSitemapEntries(BASE, [
      { pillar: 'execution', slug: 'ship-it', published_at: null, updated_at: null, is_published: true },
    ])
    expect(entry?.url).toBe(`${BASE}/media/execution/ship-it`)
    expect(entry?.lastModified).toBeUndefined()
  })

  it('never emits /media/preview, including a pillar named preview', () => {
    const entries = toMediaSitemapEntries(BASE, [
      { pillar: 'preview', slug: 'secret-draft', published_at: null, is_published: true },
      { pillar: 'foundation', slug: 'real-article', published_at: null, is_published: true },
    ])
    expect(entries.map(e => e.url)).toEqual([`${BASE}/media/foundation/real-article`])
    expect(entries.some(e => e.url.includes('/media/preview'))).toBe(false)
  })
})

describe('toMediaCategoryHubEntries', () => {
  it('emits the six indexable pillar hubs on the given host', () => {
    const entries = toMediaCategoryHubEntries('https://www.evolvedpros.com', [])
    expect(entries.map(e => e.url)).toEqual(
      MEDIA_CATEGORY_HUB_PATHS.map(path => `https://www.evolvedpros.com${path}`),
    )
    expect(entries.every(e => e.lastModified === undefined)).toBe(true)
    expect(entries.every(e => e.changeFrequency === 'daily' && e.priority === 0.6)).toBe(true)
  })

  it('sets hub lastmod from the newest included story in that pillar', () => {
    const entries = toMediaCategoryHubEntries(BASE, [
      {
        pillar: 'strategy',
        slug: 'older',
        published_at: '2026-01-01T00:00:00.000Z',
        is_published: true,
      },
      {
        pillar: 'strategy',
        slug: 'what-ai-agents-actually-automate',
        published_at: '2026-09-29T02:06:33.000Z',
        updated_at: '2026-09-29T02:06:33.000Z',
        is_published: true,
      },
      {
        pillar: 'strategy',
        slug: 'build-repeatable-sales-strategy-framework',
        published_at: '2026-09-30T00:00:00.000Z',
        is_published: true,
      },
      {
        pillar: 'foundation',
        slug: 'one',
        published_at: '2026-04-01T00:00:00.000Z',
        is_published: true,
      },
    ])
    const strategy = entries.find(e => e.url.endsWith('/media/strategy'))
    const foundation = entries.find(e => e.url.endsWith('/media/foundation'))
    const execution = entries.find(e => e.url.endsWith('/media/execution'))
    expect(strategy?.lastModified).toEqual(new Date('2026-09-29T02:06:33.000Z'))
    expect(foundation?.lastModified).toEqual(new Date('2026-04-01T00:00:00.000Z'))
    expect(execution?.lastModified).toBeUndefined()
  })
})

describe('listPublicMediaStories', () => {
  it('keeps every published story so the /media hub is not capped at 30', () => {
    const rows = Array.from({ length: 36 }, (_, i) => ({
      pillar: 'foundation',
      slug: `story-${i + 1}`,
      is_published: true as const,
    }))
    expect(listPublicMediaStories(rows)).toHaveLength(36)
  })

  it('excludes unpublished rows and the two known unpublished slugs', () => {
    const listed = listPublicMediaStories([
      { pillar: 'identity', slug: 'real-article', is_published: true },
      { pillar: 'execution', slug: 'draft', is_published: false },
      {
        pillar: 'execution',
        slug: 'why-elite-sales-teams-swear-by-ritual-not-motivation',
        is_published: true,
      },
      {
        pillar: 'strategy',
        slug: 'build-repeatable-sales-strategy-framework',
        is_published: true,
      },
    ])
    expect(listed.map(s => s.slug)).toEqual(['real-article'])
  })

  it('drops rows missing pillar or slug', () => {
    expect(
      isListedPublicMediaStory({ pillar: null, slug: 'no-pillar', is_published: true }),
    ).toBe(false)
    expect(
      isListedPublicMediaStory({ pillar: 'strategy', slug: null, is_published: true }),
    ).toBe(false)
    expect(
      isListedPublicMediaStory({ pillar: 'preview', slug: 'secret-draft', is_published: true }),
    ).toBe(false)
  })
})
