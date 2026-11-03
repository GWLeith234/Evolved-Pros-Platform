import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MediaMastheadRail } from '@/components/media/MediaMastheadRail'
import {
  NewspaperDualHero,
  NewspaperFeaturedGrid,
  NewspaperLatestRail,
  NewspaperMostRead,
  type NewspaperStory,
} from '@/components/media/newspaper'
import {
  mediaPillarCollectionDescription,
  sectionLandingStoryItems,
} from '@/lib/seo/mediaCollectionJsonLd'
import { mediaListingRobots } from '@/lib/seo/mediaListingRobots'
import { ALL_MEDIA_SECTIONS, MEDIA_COLLECTION_NAV, splitSectionDesk } from './desk'
import { SECTION_LATEST_LIST } from './scrollInventory'
import { sectionHubLinkPlan } from './sectionHubLinks'

vi.mock('next/navigation', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('next/navigation')
  return {
    ...actual,
    usePathname: () => '/media/strategy',
  }
})

const here = dirname(fileURLToPath(import.meta.url))

/**
 * The seven /media/strategy/* URLs present in the live sitemap on
 * 2026-11-03 and absent from the strategy hub HTML that day.
 */
const LIVE_UNLINKED_STRATEGY = [
  '40-percent-discovery-advantage-top-performers',
  'ctv-multilocation-measurement-before-scale',
  'fiscal-year-halftime-trends-2026',
  'fox-roku-acquisition-what-it-means-for-advertisers',
  'niche-vs-horizontal-sales-strategy-mckinsey-data',
  'strategic-planning-q2-sales-targets',
  'what-happened-to-claudes-fable-5',
] as const

type Row = NewspaperStory & { is_published?: boolean | null }

function story(index: number, slug: string, over: Partial<Row> = {}): Row {
  return {
    id: `s-${index}-${slug}`,
    title: slug,
    slug,
    excerpt: 'A desk lede.',
    pillar: 'strategy',
    featured_image_url: null,
    author: 'George Leith',
    published_at: new Date(Date.UTC(2026, 0, 1) + (100 - index) * 86_400_000).toISOString(),
    body: 'word '.repeat(40),
    views: 0,
    story_type: 'article',
    is_published: true,
    ...over,
  }
}

function strategyRows(): Row[] {
  const linked = Array.from({ length: 20 }, (_, index) => story(index, `desk-story-${index}`))
  const missing = LIVE_UNLINKED_STRATEGY.map((slug, offset) => story(20 + offset, slug))
  return [...linked, ...missing]
}

function uniqueHrefs(html: string, prefix: string): string[] {
  const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map(match => match[1] ?? '')
  return [...new Set(hrefs.filter(href => href.startsWith(prefix)))]
}

/** Same story modules MediaSectionLanding renders, without the ad catalog. */
function renderHub(articles: NewspaperStory[], overflow: NewspaperStory[]): string {
  const desk = splitSectionDesk(articles, { latestList: SECTION_LATEST_LIST })
  return [
    renderToStaticMarkup(
      <NewspaperDualHero lede={desk.featured} secondary={desk.secondary} mini />,
    ),
    renderToStaticMarkup(<NewspaperFeaturedGrid stories={desk.featuredGrid} />),
    renderToStaticMarkup(
      <NewspaperLatestRail
        stories={[...desk.latestList, ...overflow]}
        title="Latest"
        insertSponsoredAt={1}
      />,
    ),
    renderToStaticMarkup(<NewspaperMostRead stories={articles} />),
  ].join('')
}

describe('section hub crawl links', () => {
  const landing = readFileSync(resolve(here, '../../components/media/MediaSectionLanding.tsx'), 'utf8')
  const page = readFileSync(resolve(here, '../../app/(public)/media/[pillar]/page.tsx'), 'utf8')
  const layout = readFileSync(resolve(here, '../../app/(public)/media/layout.tsx'), 'utf8')

  it('links every published strategy article from the hub when there are more than 20', () => {
    const rows = strategyRows()
    const { articles, overflow } = sectionHubLinkPlan(rows)
    expect(articles).toHaveLength(24)
    expect(overflow.map(item => item.slug)).toEqual([...LIVE_UNLINKED_STRATEGY])

    const before = renderHub(articles, [])
    const after = renderHub(articles, overflow)
    const beforeHrefs = uniqueHrefs(before, '/media/strategy/')
    const afterHrefs = uniqueHrefs(after, '/media/strategy/')

    expect(beforeHrefs).toHaveLength(20)
    expect(afterHrefs).toHaveLength(27)
    for (const slug of LIVE_UNLINKED_STRATEGY) {
      const href = `/media/strategy/${slug}`
      expect(beforeHrefs).not.toContain(href)
      expect(afterHrefs).toContain(href)
    }

    expect(after).toContain('data-media-module="dual-hero"')
    expect(after).toContain('data-media-module="featured-grid"')
    expect(after).toContain('data-media-module="latest-list"')
    expect(after).toContain('data-media-module="most-read"')
    expect(after).toContain('href="/media/strategy/desk-story-0"')
    expect(after).toContain('ep-media-lede')
    expect(after).toContain('ep-media-feature-card')
    expect(after).toContain('ep-media-list-row')

    const desk = splitSectionDesk(articles, { latestList: SECTION_LATEST_LIST })
    const latest = renderToStaticMarkup(
      <NewspaperLatestRail
        stories={[...desk.latestList, ...overflow]}
        title="Latest"
        insertSponsoredAt={1}
      />,
    )
    const latestHrefs = [...latest.matchAll(/href="(\/media\/strategy\/[^"]+)"/g)].map(
      match => match[1],
    )
    expect(latestHrefs[0]).toBe('/media/strategy/desk-story-4')
    expect(latestHrefs.slice(-LIVE_UNLINKED_STRATEGY.length)).toEqual(
      LIVE_UNLINKED_STRATEGY.map(slug => `/media/strategy/${slug}`),
    )

    const items = sectionLandingStoryItems(articles)
    expect(items).toHaveLength(20)
    for (const slug of LIVE_UNLINKED_STRATEGY) {
      expect(items.map(item => item.path)).not.toContain(`/media/strategy/${slug}`)
    }
    expect(mediaPillarCollectionDescription('Strategy', articles.map(article => article.title))).toBe(
      mediaPillarCollectionDescription('Strategy', rows.map(article => article.title)),
    )
    expect(mediaListingRobots(articles.length)).toEqual(mediaListingRobots(24))
    expect(mediaListingRobots(articles.length)).toEqual({})
  })

  it('keeps the first-page hero, cards, and JSON-LD wired to the 24-row window', () => {
    expect(landing).toContain('ep-media-section-hero')
    expect(landing).toContain('NewspaperDualHero')
    expect(landing).toContain('NewspaperFeaturedGrid')
    expect(landing).toContain('NewspaperOnAir')
    expect(landing).toContain('sectionLandingStoryItems(articles)')
    expect(landing).toContain('<NewspaperMostRead stories={articles} />')
    expect(landing).toContain('[...desk.latestList, ...overflow]')
    expect(landing).toContain('latestMidRectIndexes(desk.latestList.length, { skipTrailing: true })')
    expect(landing).not.toContain('sectionLandingStoryItems(overflow)')
    expect(page).toContain(".eq('is_published', true)")
    expect(page).toContain('sectionHubLinkPlan')
    expect(page).toContain('overflow={overflow}')
  })

  it('does not add a hub link for a noindex or unpublished story past the desk', () => {
    const foundation = [
      ...Array.from({ length: 21 }, (_, index) =>
        story(index, `foundation-${index}`, { pillar: 'foundation' }),
      ),
      story(21, 'cooking-with-tallow-three-recipes', { pillar: 'foundation', id: 'tallow-window' }),
      story(22, 'foundation-extra-22', { pillar: 'foundation' }),
      story(23, 'foundation-extra-23', { pillar: 'foundation' }),
      story(24, 'cooking-with-tallow-three-recipes', { pillar: 'foundation', id: 'tallow-tail' }),
      story(25, 'build-repeatable-sales-strategy-framework', {
        pillar: 'strategy',
        id: 'denylist',
      }),
      story(26, 'still-a-draft', { pillar: 'foundation', id: 'draft', is_published: false }),
    ]
    const { articles, overflow } = sectionHubLinkPlan(foundation)
    expect(overflow.map(item => item.slug)).toEqual([
      'foundation-20',
      'foundation-extra-22',
      'foundation-extra-23',
    ])
    expect(articles.map(item => item.id)).not.toContain('tallow-tail')
    expect(articles.map(item => item.id)).not.toContain('denylist')
    expect(articles.map(item => item.id)).not.toContain('draft')

    const html = renderHub(articles, overflow)
    expect(html).not.toContain('cooking-with-tallow-three-recipes')
    expect(html).not.toContain('build-repeatable-sales-strategy-framework')
    expect(html).not.toContain('still-a-draft')
    expect(html).toContain('href="/media/foundation/foundation-20"')
    expect(uniqueHrefs(html, '/media/foundation/')).toHaveLength(23)
  })

  it('keeps an existing first-page link to a noindex story and does not add another', () => {
    const rows = [
      story(0, 'cooking-with-tallow-three-recipes', { pillar: 'foundation', id: 'tallow' }),
      ...Array.from({ length: 4 }, (_, index) =>
        story(index + 1, `foundation-${index}`, { pillar: 'foundation' }),
      ),
    ]
    const { articles, overflow } = sectionHubLinkPlan(rows)
    expect(overflow).toEqual([])
    expect(uniqueHrefs(renderHub(articles, overflow), '/media/foundation/')).toEqual([
      '/media/foundation/cooking-with-tallow-three-recipes',
      '/media/foundation/foundation-0',
      '/media/foundation/foundation-1',
      '/media/foundation/foundation-2',
      '/media/foundation/foundation-3',
    ])
  })

  it('leaves a category that already fits on the desk unchanged', () => {
    const rows = Array.from({ length: 8 }, (_, index) => story(index, `short-${index}`))
    const { articles, overflow } = sectionHubLinkPlan(rows)
    expect(overflow).toEqual([])
    expect(uniqueHrefs(renderHub(articles, overflow), '/media/strategy/')).toHaveLength(8)
  })

  it('does not repeat a Most Read story that already sits outside the desk', () => {
    const rows = strategyRows()
    rows[22] = story(22, 'popular-in-window', { views: 9000, id: 'popular-tail' })
    const { articles, overflow } = sectionHubLinkPlan(rows)
    expect(overflow.map(item => item.id)).not.toContain('popular-tail')
    const html = renderHub(articles, overflow)
    expect(html.match(/href="\/media\/strategy\/popular-in-window"/g)).toHaveLength(1)
    expect(uniqueHrefs(html, '/media/strategy/')).toHaveLength(27)
  })

  it('links Community and Events from the Media section nav after the pillar doors', () => {
    const html = renderToStaticMarkup(
      <MediaMastheadRail sections={[...ALL_MEDIA_SECTIONS, ...MEDIA_COLLECTION_NAV]} />,
    )
    const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map(match => match[1])
    expect(hrefs).toEqual([
      '/media/foundation',
      '/media/identity',
      '/media/mental-toughness',
      '/media/strategy',
      '/media/accountability',
      '/media/execution',
      '/media/community',
      '/media/events',
    ])
    expect(html).toContain('aria-label="Media sections"')
    expect(html).toContain('>Foundation<')
    expect(html).toContain('>Community<')
    expect(html).toContain('>Events<')
    expect(layout).toContain('...(await getMediaIndexSections()), ...MEDIA_COLLECTION_NAV')
  })
})
