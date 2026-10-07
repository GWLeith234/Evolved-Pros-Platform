/**
 * CollectionPage + BreadcrumbList for public /media listing pages.
 *
 * Story articles already emit Article + BreadcrumbList from
 * MediaStoryDocument. These builders cover the index and the hub/landing
 * pages the sitemap asks Google to crawl. Item urls are only the public
 * paths the listing already links. Community posts, academy lessons, and
 * events are named from the rows those pages render. Their detail routes
 * (/community, /academy, /events) require a session, so they are not
 * written into JSON-LD.
 *
 * No dates, prices, ratings, or counts beyond the capped list itself.
 * Canonical origin stays https://www.evolvedpros.com via canonicalUrl.
 */

import { popularStories, splitSectionDesk } from '@/lib/media/desk'
import { mediaStoryHref } from '@/lib/media/paths'
import { SECTION_LATEST_LIST } from '@/lib/media/scrollInventory'
import { MEDIA_HUB_DESCRIPTION, MEDIA_HUB_TITLE } from '@/lib/media/brand'
import { canonicalUrl } from '@/lib/seo/canonical'
import { homeOrganizationJsonLd } from '@/lib/seo/jsonld'

/** First N rendered items. Section desks already stop near this size. */
export const MEDIA_COLLECTION_ITEM_CAP = 20

/** Most Read rail length on MediaSectionLanding. */
const SECTION_MOST_READ = 5

export type CollectionListItem = {
  name: string
  /** Public path the page links, such as /media/strategy/some-story. */
  path?: string
}

type CollectionListEntry = {
  '@type': 'ListItem'
  position: number
  name: string
  url?: string
}

export type MediaCollectionPageSchema = {
  '@context': 'https://schema.org'
  '@type': 'CollectionPage'
  name: string
  description: string
  url: string
  publisher: ReturnType<typeof homeOrganizationJsonLd>
  mainEntity?: {
    '@type': 'ItemList'
    itemListElement: CollectionListEntry[]
  }
}

export type MediaBreadcrumbSchema = {
  '@context': 'https://schema.org'
  '@type': 'BreadcrumbList'
  itemListElement: Array<{
    '@type': 'ListItem'
    position: number
    name: string
    item: string
  }>
}

export type MediaCollectionSchemas = readonly [
  MediaCollectionPageSchema,
  MediaBreadcrumbSchema,
]

/**
 * Same sentence generateMetadata uses for /media/[pillar], including
 * /media/general ("Original").
 */
export function mediaPillarCollectionDescription(label: string): string {
  return `${label} stories from the Evolved Pros desk.`
}

/** Drop blank names, keep order, stop at the cap. */
export function capCollectionItems(items: readonly CollectionListItem[]): CollectionListItem[] {
  const capped: CollectionListItem[] = []
  for (const item of items) {
    const name = item.name.trim()
    if (!name) continue
    const path = item.path?.trim()
    capped.push(path ? { name, path } : { name })
    if (capped.length >= MEDIA_COLLECTION_ITEM_CAP) break
  }
  return capped
}

/** Names only. Used when the rendered card has no public item URL. */
export function collectionItemsFromNames(names: readonly string[]): CollectionListItem[] {
  return capCollectionItems(names.map(name => ({ name })))
}

type StoryCard = {
  id: string
  title: string
  pillar: string | null
  slug: string
  views?: number | null
  published_at?: string | null
}

/**
 * Stories MediaSectionLanding paints: mini-hero, Featured, Latest, then
 * Most Read rows that were not already in that desk. Same href helper the
 * newspaper modules use. Capped.
 */
export function sectionLandingStoryItems(articles: readonly StoryCard[]): CollectionListItem[] {
  const desk = splitSectionDesk(articles, { latestList: SECTION_LATEST_LIST })
  const ordered = [desk.featured, desk.secondary, ...desk.featuredGrid, ...desk.latestList]
  const seen = new Set<string>()
  const items: CollectionListItem[] = []
  const push = (story: StoryCard | null | undefined) => {
    if (!story || seen.has(story.id)) return
    const name = story.title.trim()
    if (!name) return
    seen.add(story.id)
    items.push({ name, path: mediaStoryHref(story.pillar, story.slug) })
  }
  for (const story of ordered) push(story)
  for (const story of popularStories(articles, SECTION_MOST_READ)) push(story)
  return items.slice(0, MEDIA_COLLECTION_ITEM_CAP)
}

/**
 * Href MediaSectionMagazine already renders. Null pillar is /media/general.
 */
export function magazineStoryPath(article: {
  pillar: string | null
  slug: string
}): string {
  return `/media/${article.pillar ?? 'general'}/${article.slug}`
}

/** Featured story, then the grid, in the order the magazine renders. Capped. */
export function magazineStoryItems(
  articles: readonly { title: string; pillar: string | null; slug: string }[],
): CollectionListItem[] {
  return capCollectionItems(
    articles.map(article => ({
      name: article.title,
      path: magazineStoryPath(article),
    })),
  )
}

function itemListElement(items: readonly CollectionListItem[]): CollectionListEntry[] {
  return capCollectionItems(items).map((item, index) => ({
    '@type': 'ListItem' as const,
    position: index + 1,
    name: item.name,
    ...(item.path ? { url: canonicalUrl(item.path) } : {}),
  }))
}

/**
 * CollectionPage plus BreadcrumbList.
 * Index crumb is Home > Media. Section crumb is Home > Media > page name.
 * ItemList is CollectionPage.mainEntity, and only when at least one item
 * survives the cap. An empty landing emits no ItemList.
 */
export function mediaCollectionPageSchemas(input: {
  path: string
  name: string
  description: string
  breadcrumb: 'index' | 'section'
  items?: readonly CollectionListItem[]
}): MediaCollectionSchemas {
  const url = canonicalUrl(input.path)
  const entries = itemListElement(input.items ?? [])
  const collection: MediaCollectionPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: input.name,
    description: input.description,
    url,
    publisher: homeOrganizationJsonLd(),
  }
  if (entries.length > 0) {
    collection.mainEntity = {
      '@type': 'ItemList',
      itemListElement: entries,
    }
  }

  const crumbs: MediaBreadcrumbSchema['itemListElement'] = [
    { '@type': 'ListItem', position: 1, name: 'Home', item: canonicalUrl('/') },
    { '@type': 'ListItem', position: 2, name: 'Media', item: canonicalUrl('/media') },
  ]
  if (input.breadcrumb === 'section') {
    crumbs.push({ '@type': 'ListItem', position: 3, name: input.name, item: url })
  }

  const breadcrumb: MediaBreadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs,
  }

  return [collection, breadcrumb]
}

/** /media index. No ItemList: the crumb is Home > Media. */
export function mediaIndexCollectionSchemas(): MediaCollectionSchemas {
  return mediaCollectionPageSchemas({
    path: '/media',
    name: MEDIA_HUB_TITLE,
    description: MEDIA_HUB_DESCRIPTION,
    breadcrumb: 'index',
  })
}

export function mediaSectionCollectionSchemas(input: {
  path: string
  name: string
  description: string
  items?: readonly CollectionListItem[]
}): MediaCollectionSchemas {
  return mediaCollectionPageSchemas({
    path: input.path,
    name: input.name,
    description: input.description,
    breadcrumb: 'section',
    items: input.items,
  })
}

/**
 * Category landings in the sitemap (PR #213) plus the thin magazines that
 * share MediaSectionMagazine. Descriptions are the existing meta
 * descriptions, moved here so the JSON-LD cannot drift from the tag.
 */
export const MEDIA_MAGAZINE_COLLECTIONS = {
  '/media/evolved-architecture': {
    name: 'Evolved Architecture',
    description:
      'All 6 pillars of the EVOLVED Architecture: Foundation, Identity, Mental Toughness, Strategy, Accountability, Execution.',
  },
  '/media/ai-trends': {
    name: 'AI Trends',
    description: 'Artificial intelligence trends shaping sales, marketing, and business strategy.',
  },
  '/media/leadership': {
    name: 'Leadership',
    description: 'Leadership insights, management strategy, and executive development.',
  },
  '/media/wellness': {
    name: 'Wellness',
    description: 'Physical and mental wellness strategies for high-performing professionals.',
  },
} as const

export type MediaMagazinePath = keyof typeof MEDIA_MAGAZINE_COLLECTIONS

export function mediaMagazineCollection(path: MediaMagazinePath) {
  return { path, ...MEDIA_MAGAZINE_COLLECTIONS[path] }
}

export const MEDIA_COMMUNITY_COLLECTION = {
  path: '/media/community',
  name: 'Community',
  description:
    'See what 10,000 high-performing sales professionals are talking about inside Evolved Pros.',
} as const

export const MEDIA_ACADEMY_COLLECTION = {
  path: '/media/academy',
  name: 'Academy',
  description:
    'Preview the Evolved Pros Academy. Free weekly lesson teasers plus the full 6-pillar course catalog.',
} as const

export const MEDIA_EVENTS_COLLECTION = {
  path: '/media/events',
  name: 'Events',
  description:
    'Upcoming and past events from Evolved Pros. Workshops, keynotes, and networking for sales professionals.',
} as const
