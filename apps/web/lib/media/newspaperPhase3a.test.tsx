import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  NewspaperArticleBody,
  NewspaperLatestRail,
  type NewspaperStory,
} from '@/components/media/newspaper'
import { splitHubDesk, splitSectionDesk } from './desk'
import {
  SECTION_LATEST_LIST,
  countArticleScrollRects,
  countHomeScrollRects,
  countSectionScrollRects,
} from './scrollInventory'

const here = dirname(fileURLToPath(import.meta.url))

function read(rel: string): string {
  return readFileSync(resolve(here, rel), 'utf8')
}

function story(id: string, pillar = 'strategy'): NewspaperStory {
  return {
    id,
    title: `Story ${id}`,
    slug: `story-${id}`,
    excerpt: 'A desk lede.',
    pillar,
    featured_image_url: null,
    author: 'George Leith',
    published_at: '2026-09-01T00:00:00.000Z',
    body: 'word '.repeat(80),
  }
}

describe('Phase 3a EPM denser 300x250 scroll avails', () => {
  const portal = read('../../app/(public)/media/MediaPortalClient.tsx')
  const landing = read('../../components/media/MediaSectionLanding.tsx')
  const article = read('../../app/(public)/media/[pillar]/[slug]/page.tsx')
  const modules = read('../../components/media/newspaper.tsx')
  const slot = read('../../components/media/MediaPartnerSlot.tsx')
  const css = read('../../app/globals.css')

  it('extends MediaPartnerSlot with a 300x250 mid-rect and no open ad network', () => {
    expect(slot).toContain("'mid-rect'")
    expect(slot).toContain('w: 300, h: 250')
    expect(slot).toContain('MediaScrollRect')
    expect(slot).toMatch(/Never loads an open ad network/)
    expect(slot).not.toMatch(/googletag|doubleclick|gpt\.js|DFP/)
    expect(portal).not.toMatch(/googletag|doubleclick|gpt\.js|DFP/)
    expect(landing).not.toMatch(/googletag|doubleclick|gpt\.js|DFP/)
    expect(article).not.toMatch(/googletag|doubleclick|gpt\.js|DFP/)
    expect(modules).not.toMatch(/googletag|doubleclick|gpt\.js|DFP/)
  })

  it('places repeating 300x250 units on long home, section, and article scrolls', () => {
    expect(portal).toContain('MediaScrollRect')
    expect(portal).toContain('homeMidRectBands')
    expect(portal).toContain('latestMidRectIndexes')
    expect(portal).toContain('media-home-rect-featured')
    expect(portal).toContain('media-home-rect-sections')
    expect(portal).toContain('media-home-rect-podcast')
    expect(landing).toContain('MediaScrollRect')
    expect(landing).toContain('SECTION_LATEST_LIST')
    expect(landing).toContain('media-section-rect-featured')
    expect(article).toContain('NewspaperArticleBody')
    expect(article).toContain('kind="article-inline"')
    expect(article).toContain('kind="rail-half"')
    expect(css).toContain('.ep-media-mid-rect')
    expect(css).toContain('.ep-media-partner-mid-fluid')
  })

  it('renders two distinct 300x250 units down a long Latest rail and a long article', () => {
    const rows = Array.from({ length: 8 }, (_, i) => story(String(i)))
    const latest = renderToStaticMarkup(
      <NewspaperLatestRail
        stories={rows}
        insertSponsoredAt={1}
        midRectAt={[3, 7]}
      />,
    )
    expect(latest.match(/data-media-scroll-rect="300x250"/g)?.length).toBe(2)
    expect(latest.match(/data-media-partner-slot="mid-rect"/g)?.length).toBe(2)

    const html = Array.from({ length: 16 }, (_, i) => `<p>Block ${i + 1}</p>`).join('')
    const body = renderToStaticMarkup(<NewspaperArticleBody html={html} ads={[]} />)
    expect(body.match(/data-media-scroll-rect="300x250"/g)?.length).toBeGreaterThanOrEqual(2)
    expect(body).toContain('data-media-article-body')
  })

  it('locks long-page placement counts at two or more 300x250 scroll units', () => {
    const homeStories = Array.from({ length: 20 }, (_, i) => ({
      id: `h${i}`,
      pillar: (['strategy', 'execution', 'identity', 'foundation'] as const)[i % 4],
    }))
    const home = splitHubDesk(homeStories)
    expect(countHomeScrollRects({
      featuredCount: home.featuredGrid.length,
      latestCount: home.latestList.length,
      sectionCount: home.sections.length,
      episodeCount: 3,
    })).toBeGreaterThanOrEqual(2)

    const strategy = splitSectionDesk(
      Array.from({ length: 20 }, (_, i) => ({ id: `s${i}`, pillar: 'strategy' })),
      { latestList: SECTION_LATEST_LIST },
    )
    expect(countSectionScrollRects({
      featuredCount: strategy.featuredGrid.length,
      latestCount: strategy.latestList.length,
    })).toBeGreaterThanOrEqual(2)
    expect(strategy.latestList.length).toBeGreaterThan(8)

    expect(countArticleScrollRects(16)).toBeGreaterThanOrEqual(2)
  })

  it('does not invent a theme toggle or turn comments on', () => {
    expect(portal).not.toMatch(/ThemeToggle|theme-toggle/)
    expect(landing).not.toMatch(/ThemeToggle|theme-toggle/)
    expect(article).not.toMatch(/ThemeToggle|theme-toggle/)
    expect(article).toContain('data-media-comments="off"')
    expect(article).not.toMatch(/StoryComments/)
    expect(portal).toContain('Evolved Pros Media')
    expect(landing).toContain('MEDIA_BRAND')
  })
})
