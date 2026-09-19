import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MEDIA_INDEX_SECTIONS, splitSectionDesk } from './desk'
import { lockedArticleByline } from './storyArt'
import { MEDIA_LOCKUP_LABEL } from '../lockups'
import {
  NewspaperDualHero,
  NewspaperMoreInSection,
  type NewspaperStory,
} from '@/components/media/newspaper'

const here = dirname(fileURLToPath(import.meta.url))

function read(rel: string): string {
  return readFileSync(resolve(here, rel), 'utf8')
}

describe('Phase 2 EPM←TT article + section landings', () => {
  const article = read('../../app/(public)/media/[pillar]/[slug]/page.tsx')
  const share = read('../../app/(public)/media/[pillar]/[slug]/ArticleShareBar.tsx')
  const pillar = read('../../app/(public)/media/[pillar]/page.tsx')
  const landing = read('../../components/media/MediaSectionLanding.tsx')
  const modules = read('../../components/media/newspaper.tsx')
  const slot = read('../../components/media/MediaPartnerSlot.tsx')
  const masthead = read('../../components/media/Masthead.tsx')
  const rail = read('../../components/media/MediaMastheadRail.tsx')
  const home = read('../../app/(public)/media/MediaPortalClient.tsx')

  it('keeps Phase 1 masthead / chips / Evolved Pros Media naming', () => {
    expect(MEDIA_LOCKUP_LABEL).toBe('Evolved Pros Media')
    expect(masthead).toContain('EpWordmarkMark')
    expect(masthead).toContain('MEDIA')
    expect(rail).toContain('MEDIA_INDEX_SECTIONS')
    expect(MEDIA_INDEX_SECTIONS.map(s => s.label)).toEqual([
      'Strategy',
      'Execution',
      'Identity',
      'Foundation',
    ])
    expect(landing).toContain('MEDIA_BRAND')
    expect(modules).toContain('Evolved Pros Media')
    expect(article).not.toContain('Evolved Media')
    expect(landing).not.toContain('Evolved Media')
    expect(home).toContain('data-media-module="dual-hero"')
  })

  it('ships a newspaper article: breadcrumb, byline, share, Bottom Line, end modules', () => {
    expect(article).toContain('data-media-surface="article"')
    expect(article).toMatch(/Media/)
    expect(article).toContain('ep-media-breadcrumb')
    expect(article).toContain('ep-media-article-title')
    expect(article).toContain('ep-media-kicker')
    expect(article).toContain('lockedArticleByline')
    expect(article).toContain('ArticleShareBar')
    expect(article).toContain('markBottomLine')
    expect(article).toContain('ep-media-bottom-line')
    expect(article).toContain('The Bottom Line')
    expect(article).toContain('NewspaperMoreInSection')
    expect(article).toContain('Latest on Media')
    expect(article).toContain('From the Podcast')
    expect(article).toContain('NewspaperSoftVipCta')
    expect(modules).toContain('data-media-module="more-in-section"')
    expect(modules).toContain('data-media-module="soft-vip-cta"')
    expect(modules).toContain('Join Community')
    expect(modules).toContain('See VIP')
    expect(modules).toContain('href="/community"')
    expect(modules).not.toMatch(/paywall|Subscribe to continue/i)
    expect(share).toContain('Email')
    expect(share).toContain('Facebook')
    expect(share).toContain('LinkedIn')
    expect(share).toContain('Print')
  })

  it('turns Discussion off and does not invent bylines', () => {
    expect(article).toContain('data-media-comments="off"')
    expect(article).not.toMatch(/StoryComments/)
    expect(article).not.toMatch(/Discussion/)
    expect(lockedArticleByline({})).toBe('George Leith')
    expect(lockedArticleByline({ author: 'Dana Whitfield' })).toBe('Dana Whitfield')
    expect(lockedArticleByline({ author: '  ' })).toBe('George Leith')
    expect(article).not.toMatch(/Staff Writer|Jane Doe|Sarah Chen/)
    expect(modules).not.toMatch(/Staff Writer|Jane Doe|Sarah Chen/)
  })

  it('builds section landings with mini-hero, Featured, and a bordered Latest rail', () => {
    expect(pillar).toContain('MediaSectionLanding')
    expect(pillar).not.toContain('MediaSectionMagazine')
    expect(landing).toContain('data-media-surface="section"')
    expect(landing).toContain('NewspaperDualHero')
    expect(landing).toContain('mini')
    expect(landing).toContain('NewspaperFeaturedGrid')
    expect(landing).toContain('NewspaperLatestRail')
    expect(modules).toContain('ep-media-list-row')
    expect(modules).toContain('ep-media-latest-list')
    const desk = splitSectionDesk(
      ['a', 'b', 'c', 'd', 'e', 'f'].map(id => ({ id, pillar: 'strategy' })),
    )
    expect(desk.featured?.id).toBe('a')
    expect(desk.featuredGrid).toHaveLength(2)
    expect(desk.latestList.length).toBeGreaterThanOrEqual(2)
  })

  it('reserves Soo/TT partner geometry on article and section without an open ad network', () => {
    expect(slot).toContain('article-inline')
    expect(slot).toContain('mid-rect')
    expect(slot).toMatch(/Never loads an open ad network/)
    expect(article).toContain('kind="article-inline"')
    expect(article).toContain('kind="rail-half"')
    expect(article).toContain('NewspaperArticleBody')
    expect(landing).toContain('kind="leaderboard"')
    expect(landing).toContain('kind="mid-fluid"')
    expect(landing).toContain('kind="rail-half"')
    expect(landing).toContain('MediaScrollRect')
    expect(article).not.toMatch(/googletag|doubleclick|gpt\.js|DFP/)
    expect(landing).not.toMatch(/googletag|doubleclick|gpt\.js|DFP/)
    expect(modules).not.toMatch(/googletag|doubleclick|gpt\.js|DFP/)
    expect(share).not.toMatch(/googletag|doubleclick|gpt\.js|DFP/)
  })

  it('click-path hrefs run home chips to section, then article, then More in section', () => {
    expect(rail).toContain('href={section.href}')
    expect(MEDIA_INDEX_SECTIONS[0]).toMatchObject({
      label: 'Strategy',
      href: '/media/strategy',
    })
    const story: NewspaperStory = {
      id: 's1',
      title: 'Tokens are materials',
      slug: 'ai-tokens-materials-line',
      excerpt: 'A desk lede.',
      pillar: 'strategy',
      featured_image_url: null,
      author: 'George Leith',
      published_at: '2026-09-01T00:00:00.000Z',
      body: 'word '.repeat(400),
    }
    const hero = renderToStaticMarkup(
      <NewspaperDualHero lede={story} secondary={null} mini />,
    )
    expect(hero).toContain('/media/strategy/ai-tokens-materials-line')
    expect(hero).toContain('Tokens are materials')
    const more = renderToStaticMarkup(
      <NewspaperMoreInSection
        label="Strategy"
        href="/media/strategy"
        stories={[
          { ...story, id: 's2', slug: 'walk-away-criteria-before-the-discount' },
        ]}
      />,
    )
    expect(more).toContain('More in Strategy')
    expect(more).toContain('/media/strategy')
    expect(more).toContain('/media/strategy/walk-away-criteria-before-the-discount')
    expect(article).toContain('NewspaperMoreInSection')
    expect(article).toContain('sectionHref')
  })

  it('does not invent a Media theme toggle', () => {
    expect(article).not.toMatch(/ThemeToggle|theme-toggle|NO_TOGGLE/)
    expect(landing).not.toMatch(/ThemeToggle|theme-toggle/)
    expect(masthead).not.toMatch(/ThemeToggle/)
  })
})
