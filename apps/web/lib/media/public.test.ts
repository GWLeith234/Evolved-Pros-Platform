import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = {
  data: [] as unknown[],
  error: null as { message: string } | null,
  throwOnFrom: false,
  tables: [] as string[],
  eqFilters: [] as Array<[string, unknown]>,
}

vi.mock('@/lib/supabase/admin', () => ({
  adminClient: {
    from(table: string) {
      if (state.throwOnFrom) throw new Error('admin unavailable')
      state.tables.push(table)
      const chain = {
        select: () => chain,
        eq: (col: string, val: unknown) => {
          state.eqFilters.push([col, val])
          return chain
        },
        order: () => Promise.resolve({ data: state.data, error: state.error }),
      }
      return chain
    },
  },
}))

import { getPublishedMediaStoriesForHub, MEDIA_HUB_STORY_COLUMNS } from './public'

function story(over: Record<string, unknown> = {}) {
  return {
    id: 'id-1',
    title: 'A story',
    slug: 'a-story',
    excerpt: null,
    pillar: 'foundation',
    story_type: 'article',
    featured_image_url: null,
    author: 'George Leith',
    published_at: '2026-08-01T00:00:00.000Z',
    body: 'Hello',
    views: 1,
    is_published: true,
    ...over,
  }
}

describe('getPublishedMediaStoriesForHub', () => {
  beforeEach(() => {
    state.data = []
    state.error = null
    state.throwOnFrom = false
    state.tables = []
    state.eqFilters = []
  })

  it('reads media_stories through adminClient with is_published=true', async () => {
    state.data = [story()]
    const rows = await getPublishedMediaStoriesForHub()
    expect(state.tables).toEqual(['media_stories'])
    expect(state.eqFilters).toEqual([['is_published', true]])
    expect(MEDIA_HUB_STORY_COLUMNS).toContain('is_published')
    expect(rows).toHaveLength(1)
    expect(rows[0]?.slug).toBe('a-story')
  })

  it('keeps every published story so the hub is not capped at 30', async () => {
    state.data = Array.from({ length: 36 }, (_, i) =>
      story({ id: `id-${i + 1}`, slug: `story-${i + 1}` }),
    )
    expect(await getPublishedMediaStoriesForHub()).toHaveLength(36)
  })

  it('drops unpublished rows and the two denylisted slugs', async () => {
    state.data = [
      story({ id: 'keep', slug: 'real-article', pillar: 'identity' }),
      story({ id: 'draft', slug: 'draft', is_published: false }),
      story({
        id: 'ritual',
        pillar: 'execution',
        slug: 'why-elite-sales-teams-swear-by-ritual-not-motivation',
      }),
      story({
        id: 'framework',
        pillar: 'strategy',
        slug: 'build-repeatable-sales-strategy-framework',
      }),
    ]
    const rows = await getPublishedMediaStoriesForHub()
    expect(rows.map(s => s.slug)).toEqual(['real-article'])
  })

  it('returns [] when the admin query errors or throws', async () => {
    state.error = { message: 'boom' }
    expect(await getPublishedMediaStoriesForHub()).toEqual([])

    state.error = null
    state.throwOnFrom = true
    expect(await getPublishedMediaStoriesForHub()).toEqual([])
  })
})
