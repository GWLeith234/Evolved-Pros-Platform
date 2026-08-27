import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { MediaStoryCrawlIndex, mediaHubCrawlLinks } from './crawlIndex'
import { UNPUBLISHED_MEDIA_PATHS } from './sitemap'

function story(over: Record<string, unknown> = {}) {
  return {
    id: 'id-1',
    title: 'A story',
    pillar: 'foundation',
    slug: 'a-story',
    is_published: true as const,
    ...over,
  }
}

describe('mediaHubCrawlLinks', () => {
  it('emits one unique /media/{pillar}/{slug} href per published story', () => {
    const rows = Array.from({ length: 36 }, (_, i) =>
      story({ id: `id-${i + 1}`, slug: `story-${i + 1}`, title: `Story ${i + 1}` }),
    )
    const hrefs = mediaHubCrawlLinks(rows).map(l => l.href)
    expect(hrefs).toHaveLength(36)
    expect(new Set(hrefs).size).toBe(36)
    expect(hrefs.every(h => /^\/media\/[a-z0-9-]+\/[a-z0-9-]+$/.test(h))).toBe(true)
  })

  it('keeps denylist unpublished slugs out', () => {
    const hrefs = mediaHubCrawlLinks([
      story({ id: 'keep', slug: 'real-article', pillar: 'identity' }),
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
      story({ id: 'draft', slug: 'draft', is_published: false }),
    ]).map(l => l.href)
    expect(hrefs).toEqual(['/media/identity/real-article'])
    for (const blocked of UNPUBLISHED_MEDIA_PATHS) {
      expect(hrefs).not.toContain(blocked)
    }
  })
})

describe('MediaStoryCrawlIndex', () => {
  it('puts published article <a href> tags in the server HTML', () => {
    const rows = Array.from({ length: 36 }, (_, i) =>
      story({ id: `id-${i + 1}`, slug: `story-${i + 1}`, title: `Story ${i + 1}` }),
    )
    const html = renderToStaticMarkup(<MediaStoryCrawlIndex stories={rows} />)
    const hrefs = [...html.matchAll(/href="(\/media\/[a-z0-9-]+\/[a-z0-9-]+)"/g)].map(m => m[1])
    expect(hrefs).toHaveLength(36)
    expect(new Set(hrefs).size).toBe(36)
    expect(html).toContain('aria-hidden="true"')
    expect(html).toContain('inert')
    expect(html).toContain('tabindex="-1"')
    expect(html).not.toContain('aria-label=')
    expect(html).not.toContain('why-elite-sales-teams-swear-by-ritual-not-motivation')
  })

  it('keeps crawl hrefs out of the a11y tree and tab order', () => {
    const html = renderToStaticMarkup(
      <MediaStoryCrawlIndex stories={[story({ id: 'keep', slug: 'real-article', pillar: 'identity' })]} />,
    )
    expect(html).toMatch(/<nav aria-hidden="true"[^>]*inert/)
    expect(html.match(/tabindex="-1"/g)?.length).toBe(1)
  })

  it('renders nothing when there are no listed stories', () => {
    expect(renderToStaticMarkup(<MediaStoryCrawlIndex stories={[]} />)).toBe('')
  })
})
