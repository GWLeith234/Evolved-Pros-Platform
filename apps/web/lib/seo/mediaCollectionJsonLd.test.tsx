import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LdJsonGraph } from '@/components/seo/LdJson'
import { popularStories, splitSectionDesk } from '@/lib/media/desk'
import { MEDIA_HUB_DESCRIPTION, MEDIA_HUB_TITLE } from '@/lib/media/brand'
import { mediaStoryHref } from '@/lib/media/paths'
import { SECTION_LATEST_LIST } from '@/lib/media/scrollInventory'
import { PILLARS, getPillarLabel } from '@/lib/pillars'
import { CANONICAL_ORIGIN, canonicalUrl } from '@/lib/seo/canonical'
import { jsonLdScriptHtml } from '@/lib/seo/jsonld'
import {
  MEDIA_ACADEMY_COLLECTION,
  MEDIA_COLLECTION_ITEM_CAP,
  MEDIA_COMMUNITY_COLLECTION,
  MEDIA_EVENTS_COLLECTION,
  MEDIA_MAGAZINE_COLLECTIONS,
  capCollectionItems,
  collectionItemsFromNames,
  magazineStoryItems,
  magazineStoryPath,
  mediaCollectionPageSchemas,
  mediaIndexCollectionSchemas,
  mediaMagazineCollection,
  mediaPillarCollectionDescription,
  mediaSectionCollectionSchemas,
  sectionLandingStoryItems,
  type CollectionListItem,
  type MediaCollectionPageSchema,
  type MediaBreadcrumbSchema,
} from './mediaCollectionJsonLd'

const here = dirname(fileURLToPath(import.meta.url))

function read(rel: string): string {
  return readFileSync(resolve(here, rel), 'utf8')
}

function story(index: number, views = 0) {
  return {
    id: `id-${index}`,
    title: `Story ${index}`,
    pillar: 'strategy' as string | null,
    slug: `story-${index}`,
    views,
    published_at: `2026-01-${String(index).padStart(2, '0')}T00:00:00.000Z`,
  }
}

function parseLdJson(html: string): unknown[] {
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([^<]*)<\/script>/g)]
  expect(blocks.length).toBeGreaterThan(0)
  return blocks.map(block => JSON.parse(block[1]))
}

function renderedSchemas(schemas: readonly object[]): unknown[] {
  return parseLdJson(renderToStaticMarkup(<LdJsonGraph schemas={schemas} />))
}

const BANNED_KEYS = [
  'price',
  'priceCurrency',
  'aggregateRating',
  'ratingValue',
  'reviewCount',
  'offers',
  'datePublished',
  'dateModified',
]

function assertCollection(
  parsed: unknown[],
  expected: {
    name: string
    description: string
    url: string
    crumbs: readonly string[]
    items?: readonly { name: string; url?: string }[]
  },
) {
  const collection = parsed.find(
    (entry): entry is MediaCollectionPageSchema =>
      Boolean(entry) &&
      typeof entry === 'object' &&
      (entry as { '@type'?: string })['@type'] === 'CollectionPage',
  )
  const breadcrumb = parsed.find(
    (entry): entry is MediaBreadcrumbSchema =>
      Boolean(entry) &&
      typeof entry === 'object' &&
      (entry as { '@type'?: string })['@type'] === 'BreadcrumbList',
  )
  expect(collection).toBeTruthy()
  expect(breadcrumb).toBeTruthy()
  expect(collection?.['@context']).toBe('https://schema.org')
  expect(breadcrumb?.['@context']).toBe('https://schema.org')
  expect(collection?.name).toBe(expected.name)
  expect(collection?.description).toBe(expected.description)
  expect(collection?.url).toBe(expected.url)
  expect(collection?.url.startsWith(`${CANONICAL_ORIGIN}/`)).toBe(true)
  expect(collection?.publisher).toEqual({
    '@type': 'Organization',
    name: 'Evolved Pros',
    url: CANONICAL_ORIGIN,
  })

  const crumbs = breadcrumb?.itemListElement ?? []
  expect(crumbs.map(crumb => crumb.name)).toEqual([...expected.crumbs])
  expect(crumbs.map(crumb => crumb.position)).toEqual(expected.crumbs.map((_, index) => index + 1))
  expect(crumbs[0]?.item).toBe(CANONICAL_ORIGIN)
  expect(crumbs[1]?.item).toBe(canonicalUrl('/media'))
  if (expected.crumbs.length === 3) {
    expect(crumbs[2]?.item).toBe(expected.url)
  }

  const list = collection?.mainEntity
  if (expected.items && expected.items.length > 0) {
    expect(list?.['@type']).toBe('ItemList')
    expect(list?.itemListElement.map(entry => entry.position)).toEqual(
      expected.items.map((_, index) => index + 1),
    )
    expect(list?.itemListElement.map(entry => ({ name: entry.name, url: entry.url }))).toEqual(
      expected.items.map(item => ({ name: item.name, url: item.url })),
    )
  } else {
    expect(list).toBeUndefined()
    expect(JSON.stringify(collection)).not.toContain('ItemList')
  }

  const blob = JSON.stringify(parsed)
  expect(blob).not.toContain('platform.evolvedpros.com')
  expect(blob).not.toContain('Evolved Media')
  for (const key of BANNED_KEYS) {
    expect(blob).not.toContain(`"${key}"`)
  }
}

describe('jsonLdScriptHtml', () => {
  it('escapes < so a title cannot close the script tag', () => {
    const html = jsonLdScriptHtml({ name: '</script><img alt="x">' })
    expect(html).not.toContain('<')
    expect(html).toContain('\\u003c/script>')
    expect(JSON.parse(html)).toEqual({ name: '</script><img alt="x">' })
  })
})

describe('/media index JSON-LD', () => {
  it('emits CollectionPage and Home > Media, with no ItemList', () => {
    const parsed = renderedSchemas(mediaIndexCollectionSchemas())
    assertCollection(parsed, {
      name: MEDIA_HUB_TITLE,
      description: MEDIA_HUB_DESCRIPTION,
      url: canonicalUrl('/media'),
      crumbs: ['Home', 'Media'],
    })
    expect(JSON.stringify(parsed)).not.toContain('ItemList')
  })
})

describe('pillar hub JSON-LD', () => {
  it('emits CollectionPage and Home > Media > pillar for each hub', () => {
    expect(PILLARS.map(pillar => `/media/${pillar.slug}`)).toEqual([
      '/media/foundation',
      '/media/identity',
      '/media/mental-toughness',
      '/media/strategy',
      '/media/accountability',
      '/media/execution',
    ])

    for (const pillar of PILLARS) {
      const articles = [story(1), story(2)]
      articles.forEach(row => {
        row.pillar = pillar.slug
      })
      const items = sectionLandingStoryItems(articles)
      const parsed = renderedSchemas(
        mediaSectionCollectionSchemas({
          path: `/media/${pillar.slug}`,
          name: pillar.name,
          description: mediaPillarCollectionDescription(pillar.name),
          items,
        }),
      )
      assertCollection(parsed, {
        name: pillar.name,
        description: `${pillar.name} stories from the Evolved Pros desk.`,
        url: canonicalUrl(`/media/${pillar.slug}`),
        crumbs: ['Home', 'Media', pillar.name],
        items: items.map(item => ({ name: item.name, url: canonicalUrl(item.path!) })),
      })
      expect(getPillarLabel(pillar.slug)).toBe(pillar.name)
    }
  })

  it('lists the stories the section landing renders, desk order first, capped at 20', () => {
    const articles = [story(1, 1), story(2, 50), story(3, 3)]
    const desk = splitSectionDesk(articles, { latestList: SECTION_LATEST_LIST })
    const rendered = [desk.featured, desk.secondary, ...desk.featuredGrid, ...desk.latestList].filter(
      (row): row is NonNullable<typeof row> => Boolean(row),
    )
    const seen = new Set(rendered.map(row => row.id))
    for (const row of popularStories(articles, 5)) {
      if (!seen.has(row.id)) rendered.push(row)
    }

    const items = sectionLandingStoryItems(articles)
    expect(items.map(item => item.name)).toEqual(rendered.map(row => row.title))
    expect(items.map(item => item.path)).toEqual(
      rendered.map(row => mediaStoryHref(row.pillar, row.slug)),
    )
    expect(items.map(item => item.name)).toEqual(['Story 1', 'Story 2', 'Story 3'])
  })

  it('caps a full desk at the first 20 rendered stories', () => {
    const articles = Array.from({ length: 25 }, (_, index) => story(index + 1, index + 1))
    const items = sectionLandingStoryItems(articles)
    expect(MEDIA_COLLECTION_ITEM_CAP).toBe(20)
    expect(items).toHaveLength(20)
    expect(items.map(item => item.name)).toEqual(articles.slice(0, 20).map(row => row.title))
    expect(items.map(item => item.name)).not.toContain('Story 25')
    expect(items[0]?.path).toBe('/media/strategy/story-1')
  })

  it('uses the general article path for a null pillar', () => {
    const items = sectionLandingStoryItems([
      { ...story(1), pillar: null, slug: 'piece', title: 'Original piece' },
    ])
    expect(items).toEqual([{ name: 'Original piece', path: '/media/general/piece' }])
  })

  it('emits no ItemList when the landing has no stories', () => {
    const parsed = renderedSchemas(
      mediaSectionCollectionSchemas({
        path: '/media/general',
        name: 'Original',
        description: mediaPillarCollectionDescription('Original'),
        items: sectionLandingStoryItems([]),
      }),
    )
    assertCollection(parsed, {
      name: 'Original',
      description: 'Original stories from the Evolved Pros desk.',
      url: canonicalUrl('/media/general'),
      crumbs: ['Home', 'Media', 'Original'],
    })
  })
})

describe('category landing JSON-LD', () => {
  it('keeps the existing meta descriptions', () => {
    expect(mediaPillarCollectionDescription('Foundation')).toBe(
      'Foundation stories from the Evolved Pros desk.',
    )
    expect(MEDIA_MAGAZINE_COLLECTIONS['/media/evolved-architecture'].description).toBe(
      'All 6 pillars of the EVOLVED Architecture: Foundation, Identity, Mental Toughness, Strategy, Accountability, Execution.',
    )
    expect(MEDIA_COMMUNITY_COLLECTION.description).toBe(
      'See what 10,000 high-performing sales professionals are talking about inside Evolved Pros.',
    )
    expect(MEDIA_ACADEMY_COLLECTION.description).toBe(
      'Preview the Evolved Pros Academy. Free weekly lesson teasers plus the full 6-pillar course catalog.',
    )
    expect(MEDIA_EVENTS_COLLECTION.description).toBe(
      'Upcoming and past events from Evolved Pros. Workshops, keynotes, and networking for sales professionals.',
    )
    expect(MEDIA_MAGAZINE_COLLECTIONS['/media/ai-trends'].description).toBe(
      'Artificial intelligence trends shaping sales, marketing, and business strategy.',
    )
    expect(MEDIA_MAGAZINE_COLLECTIONS['/media/leadership'].description).toBe(
      'Leadership insights, management strategy, and executive development.',
    )
    expect(MEDIA_MAGAZINE_COLLECTIONS['/media/wellness'].description).toBe(
      'Physical and mental wellness strategies for high-performing professionals.',
    )
  })

  it('emits Evolved Architecture story urls that match the magazine hrefs', () => {
    const articles = [
      { title: 'Architecture lede', pillar: 'foundation', slug: 'architecture-lede' },
      { title: 'Second', pillar: null, slug: 'second-story' },
      { title: '  ', pillar: 'strategy', slug: 'blank' },
    ]
    const items = magazineStoryItems(articles)
    expect(magazineStoryPath(articles[0])).toBe('/media/foundation/architecture-lede')
    expect(magazineStoryPath(articles[1])).toBe('/media/general/second-story')
    expect(items).toEqual([
      { name: 'Architecture lede', path: '/media/foundation/architecture-lede' },
      { name: 'Second', path: '/media/general/second-story' },
    ])

    const listing = mediaMagazineCollection('/media/evolved-architecture')
    const parsed = renderedSchemas(
      mediaSectionCollectionSchemas({
        path: listing.path,
        name: listing.name,
        description: listing.description,
        items,
      }),
    )
    assertCollection(parsed, {
      name: 'Evolved Architecture',
      description: listing.description,
      url: canonicalUrl('/media/evolved-architecture'),
      crumbs: ['Home', 'Media', 'Evolved Architecture'],
      items: [
        {
          name: 'Architecture lede',
          url: canonicalUrl('/media/foundation/architecture-lede'),
        },
        { name: 'Second', url: canonicalUrl('/media/general/second-story') },
      ],
    })
  })

  it('caps magazine stories at 20', () => {
    const articles = Array.from({ length: 24 }, (_, index) => ({
      title: `Piece ${index + 1}`,
      pillar: 'execution',
      slug: `piece-${index + 1}`,
    }))
    const items = magazineStoryItems(articles)
    expect(items).toHaveLength(20)
    expect(items[19]?.name).toBe('Piece 20')
    expect(items.map(item => item.name)).not.toContain('Piece 21')
  })

  it('emits community post names and no member urls', () => {
    const posts = [' First post body ', '', 'Second post']
    const items = collectionItemsFromNames(posts)
    expect(items).toEqual([{ name: 'First post body' }, { name: 'Second post' }])
    const parsed = renderedSchemas(
      mediaSectionCollectionSchemas({
        path: MEDIA_COMMUNITY_COLLECTION.path,
        name: MEDIA_COMMUNITY_COLLECTION.name,
        description: MEDIA_COMMUNITY_COLLECTION.description,
        items,
      }),
    )
    assertCollection(parsed, {
      name: 'Community',
      description: MEDIA_COMMUNITY_COLLECTION.description,
      url: canonicalUrl('/media/community'),
      crumbs: ['Home', 'Media', 'Community'],
      items: [{ name: 'First post body' }, { name: 'Second post' }],
    })
    const list = (parsed[0] as MediaCollectionPageSchema).mainEntity?.itemListElement ?? []
    expect(list.every(entry => entry.url === undefined)).toBe(true)
    expect(JSON.stringify(list)).not.toContain('/community')
    expect(JSON.stringify(list)).not.toContain('/login')
  })

  it('emits the featured lesson and course titles, and nothing when both are empty', () => {
    const items = collectionItemsFromNames(['Weekly lesson', 'Foundation', 'Identity'])
    const parsed = renderedSchemas(
      mediaSectionCollectionSchemas({
        path: MEDIA_ACADEMY_COLLECTION.path,
        name: MEDIA_ACADEMY_COLLECTION.name,
        description: MEDIA_ACADEMY_COLLECTION.description,
        items,
      }),
    )
    assertCollection(parsed, {
      name: 'Academy',
      description: MEDIA_ACADEMY_COLLECTION.description,
      url: canonicalUrl('/media/academy'),
      crumbs: ['Home', 'Media', 'Academy'],
      items: [
        { name: 'Weekly lesson' },
        { name: 'Foundation' },
        { name: 'Identity' },
      ],
    })

    const empty = renderedSchemas(
      mediaSectionCollectionSchemas({
        path: MEDIA_ACADEMY_COLLECTION.path,
        name: MEDIA_ACADEMY_COLLECTION.name,
        description: MEDIA_ACADEMY_COLLECTION.description,
        items: collectionItemsFromNames([]),
      }),
    )
    assertCollection(empty, {
      name: 'Academy',
      description: MEDIA_ACADEMY_COLLECTION.description,
      url: canonicalUrl('/media/academy'),
      crumbs: ['Home', 'Media', 'Academy'],
    })
  })

  it('emits upcoming then past event titles and skips a blank title', () => {
    const items = collectionItemsFromNames(['Launch night', '  ', 'Replay'])
    const parsed = renderedSchemas(
      mediaSectionCollectionSchemas({
        path: MEDIA_EVENTS_COLLECTION.path,
        name: MEDIA_EVENTS_COLLECTION.name,
        description: MEDIA_EVENTS_COLLECTION.description,
        items,
      }),
    )
    assertCollection(parsed, {
      name: 'Events',
      description: MEDIA_EVENTS_COLLECTION.description,
      url: canonicalUrl('/media/events'),
      crumbs: ['Home', 'Media', 'Events'],
      items: [{ name: 'Launch night' }, { name: 'Replay' }],
    })
    const list = (parsed[0] as MediaCollectionPageSchema).mainEntity?.itemListElement ?? []
    expect(JSON.stringify(list)).not.toContain('/events/')
    expect(JSON.stringify(list)).not.toContain('/pricing')
  })

  it('emits no ItemList for an empty thin magazine', () => {
    for (const path of ['/media/ai-trends', '/media/leadership', '/media/wellness'] as const) {
      const listing = mediaMagazineCollection(path)
      const parsed = renderedSchemas(
        mediaSectionCollectionSchemas({
          path: listing.path,
          name: listing.name,
          description: listing.description,
          items: magazineStoryItems([]),
        }),
      )
      assertCollection(parsed, {
        name: listing.name,
        description: listing.description,
        url: canonicalUrl(path),
        crumbs: ['Home', 'Media', listing.name],
      })
      expect(JSON.stringify(parsed)).not.toContain('ItemList')
    }
  })

  it('lists a real thin-magazine story and does not invent extras', () => {
    const items = magazineStoryItems([
      { title: 'A real leadership note', pillar: 'identity', slug: 'real-leadership-note' },
    ])
    expect(items).toEqual([
      { name: 'A real leadership note', path: '/media/identity/real-leadership-note' },
    ])
    const listing = mediaMagazineCollection('/media/leadership')
    const parsed = renderedSchemas(mediaSectionCollectionSchemas({ ...listing, items }))
    const collection = parsed[0] as MediaCollectionPageSchema
    expect(collection.mainEntity?.itemListElement).toEqual([
      {
        '@type': 'ListItem',
        position: 1,
        name: 'A real leadership note',
        url: canonicalUrl('/media/identity/real-leadership-note'),
      },
    ])
  })
})

describe('collection item cap', () => {
  it('stops at 20 names and drops blanks', () => {
    const names = ['', ...Array.from({ length: 25 }, (_, index) => `Name ${index + 1}`)]
    const items = capCollectionItems(names.map(name => ({ name })))
    expect(items).toHaveLength(20)
    expect(items[0]).toEqual({ name: 'Name 1' })
    expect(items.map(item => item.name)).not.toContain('Name 21')
  })
})

describe('script injection on a rendered listing', () => {
  it('keeps a hostile story title inside the JSON string', () => {
    const items: CollectionListItem[] = [
      { name: '</script><script>alert(1)</script>', path: '/media/strategy/hostile' },
    ]
    const html = renderToStaticMarkup(
      <LdJsonGraph
        schemas={mediaSectionCollectionSchemas({
          path: '/media/strategy',
          name: 'Strategy',
          description: mediaPillarCollectionDescription('Strategy'),
          items,
        })}
      />,
    )
    expect(html).not.toContain('</script><script>')
    expect(html).toContain('\\u003c/script>')
    const parsed = parseLdJson(html)
    const collection = parsed[0] as MediaCollectionPageSchema
    expect(collection.mainEntity?.itemListElement[0]?.name).toBe(
      '</script><script>alert(1)</script>',
    )
  })
})

describe('listing pages wire the shared schema', () => {
  const hub = read('../../app/(public)/media/(hub)/page.tsx')
  const pillar = read('../../app/(public)/media/[pillar]/page.tsx')
  const landing = read('../../components/media/MediaSectionLanding.tsx')
  const magazine = read('../../components/media/MediaSectionMagazine.tsx')
  const architecture = read('../../app/(public)/media/evolved-architecture/page.tsx')
  const community = read('../../app/(public)/media/community/page.tsx')
  const academy = read('../../app/(public)/media/academy/page.tsx')
  const events = read('../../app/(public)/media/events/page.tsx')
  const careers = read('../../app/(public)/media/careers/page.tsx')
  const podcast = read('../../app/(public)/media/podcast/page.tsx')

  it('wires /media and the six pillar hubs', () => {
    expect(hub).toContain('mediaIndexCollectionSchemas()')
    expect(hub).toContain('LdJsonGraph')
    expect(hub).toContain('export const revalidate = 60')
    expect(hub).not.toContain('ItemList')
    expect(pillar).toContain('MediaSectionLanding')
    expect(pillar).toContain('mediaPillarCollectionDescription(label)')
    expect(pillar).toContain('export const revalidate = 120')
    expect(landing).toContain('sectionLandingStoryItems(articles)')
    expect(landing).toContain('mediaPillarCollectionDescription(title)')
    expect(landing).toContain('path: `/media/${sectionId}`')
    expect(landing).toContain('LdJsonGraph')
  })

  it('wires the four sitemap category landings from the rows they render', () => {
    expect(architecture).toContain("mediaMagazineCollection('/media/evolved-architecture')")
    expect(magazine).toContain('magazineStoryItems(articles)')
    expect(magazine).toContain('magazineStoryPath(article)')
    expect(community).toContain('collectionItemsFromNames(posts.map(post => post.body))')
    expect(community).toContain('MEDIA_COMMUNITY_COLLECTION')
    expect(academy).toContain('...(featured ? [featured.title] : [])')
    expect(academy).toContain('allCourses.map(course => course.title)')
    expect(academy).not.toContain("collectionItemsFromNames(['Academy Preview'])")
    expect(events).toContain('[...upcomingEvents, ...pastEvents].map(event => event.title)')
    expect(events).toContain('withoutConquerLocal')
    expect(events).not.toContain('collectionItemsFromNames(upcoming')
  })

  it('shares the magazine schema with thin landings and leaves redirects alone', () => {
    for (const path of ['/media/ai-trends', '/media/leadership', '/media/wellness'] as const) {
      const page = read(`../../app/(public)/media/${path.slice('/media/'.length)}/page.tsx`)
      expect(page).toContain(`mediaMagazineCollection('${path}')`)
      expect(page).toContain('MediaSectionMagazine')
      expect(page).not.toContain('ItemList')
    }
    expect(careers).not.toContain('LdJson')
    expect(careers).not.toContain('application/ld+json')
    expect(podcast).not.toContain('LdJson')
    expect(podcast).toContain("redirect('/podcast')")
  })

  it('does not build an index schema that requires items', () => {
    const schemas = mediaCollectionPageSchemas({
      path: '/media',
      name: MEDIA_HUB_TITLE,
      description: MEDIA_HUB_DESCRIPTION,
      breadcrumb: 'index',
      items: [],
    })
    expect(schemas[0].mainEntity).toBeUndefined()
    expect(schemas[1].itemListElement).toHaveLength(2)
  })
})
