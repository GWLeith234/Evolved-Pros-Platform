import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  NewspaperDualHero,
  NewspaperFeaturedGrid,
  NewspaperLatestRail,
  NewspaperMoreInSection,
  NewspaperThumb,
  type NewspaperStory,
} from '@/components/media/newspaper'
import { MEDIA_LOCKUP_DARK, MEDIA_LOCKUP_LIGHT } from '../lockups'
import { MEDIA_STORY_THUMB_RATIO } from './storyArt'

const here = dirname(fileURLToPath(import.meta.url))

function read(rel: string): string {
  return readFileSync(resolve(here, rel), 'utf8')
}

function story(id: string, image: string | null = null): NewspaperStory {
  return {
    id,
    title: `Story ${id}`,
    slug: `story-${id}`,
    excerpt: 'A desk lede.',
    pillar: 'strategy',
    featured_image_url: image,
    author: 'George Leith',
    published_at: '2026-09-01T00:00:00.000Z',
    body: 'word '.repeat(80),
  }
}

describe('EPM Media card-art presentation', () => {
  const portal = read('../../app/(public)/media/MediaPortalClient.tsx')
  const modules = read('../../components/media/newspaper.tsx')
  const landing = read('../../components/media/MediaSectionLanding.tsx')
  const article = read('../../app/(public)/media/[pillar]/[slug]/page.tsx')
  const masthead = read('../../components/media/Masthead.tsx')
  const css = read('../../app/globals.css')
  const slot = read('../../components/media/MediaPartnerSlot.tsx')

  it('shares NewspaperThumb on home, section, and article rails', () => {
    expect(portal).toContain('NewspaperThumb')
    expect(portal).not.toMatch(/function StoryThumb/)
    expect(modules).toContain('export function NewspaperThumb')
    expect(landing).toContain('NewspaperDualHero')
    expect(landing).toContain('NewspaperFeaturedGrid')
    expect(landing).toContain('NewspaperLatestRail')
    expect(article).toContain('NewspaperMoreInSection')
    expect(article).toContain('NewspaperLatestRail')
  })

  it('uses Soo/TT 3:2 large-thumb grammar on hero, featured 2-up, and list rails', () => {
    expect(MEDIA_STORY_THUMB_RATIO).toBe('3 / 2')
    expect(modules).toContain('MEDIA_STORY_THUMB_RATIO')
    expect(modules).not.toMatch(/ratio="16 \/ 9"/)
    expect(portal).not.toMatch(/ratio="16 \/ 9"/)
    expect(css).toMatch(/\.ep-media-thumb \{[\s\S]*aspect-ratio: 3 \/ 2/)
    expect(css).toMatch(/\.ep-media-article-art img \{[\s\S]*aspect-ratio: 3 \/ 2/)
    expect(css).toMatch(/\.ep-media-list-row \{[\s\S]*grid-template-columns: 148px minmax\(0, 1fr\)/)
  })

  it('crops Unsplash and Supabase stills in the same absolute cover frame', () => {
    expect(css).toMatch(/\.ep-media-thumb,[\s\S]*position: relative/)
    expect(css).toMatch(/\.ep-media-thumb img,[\s\S]*object-fit: cover/)
    expect(css).toMatch(/\.ep-media-thumb img,[\s\S]*object-position: center/)
    expect(css).toMatch(/\.ed-story-art \{[\s\S]*object-fit: cover/)
    expect(css).toMatch(/\.ed-story-art \{[\s\S]*object-position: center/)
  })

  it('renders an EP brand empty-state instead of a black plate', () => {
    const empty = renderToStaticMarkup(<NewspaperThumb story={story('empty')} />)
    expect(empty).toContain('data-media-thumb="empty"')
    expect(empty).toContain('ep-media-thumb-fallback')
    expect(empty).toContain('ep-media-thumb-fallback-mark')
    expect(empty).toContain('>EP<')
    expect(empty).not.toContain('<img')

    const filled = renderToStaticMarkup(
      <NewspaperThumb story={story('art', 'https://images.unsplash.com/photo-desk')} />,
    )
    expect(filled).toContain('data-media-thumb="art"')
    expect(filled).toContain('images.unsplash.com/photo-desk')
    expect(filled).toContain('ed-story-art')
    expect(filled).not.toContain('ep-media-thumb-fallback')

    expect(css).toMatch(/\.ep-media-thumb-fallback \{[\s\S]*var\(--navy\)[\s\S]*var\(--bg-elevated\)/)
    expect(css).toMatch(/html\.light-mode \.ep-media-thumb-fallback \{[\s\S]*var\(--paper\)/)
    expect(css).not.toMatch(/\.ep-media-thumb-fallback \{[\s\S]{0,180}black/)
    expect(css).not.toMatch(/\.ep-media-podcast-still \{[\s\S]{0,120}--navy-dark/)
  })

  it('fills hero, featured 2-up, and list modules with the shared thumb', () => {
    const lede = story('lede', 'https://cdn.example/branding/cover.jpg')
    const blank = story('blank')
    const hero = renderToStaticMarkup(
      <NewspaperDualHero lede={lede} secondary={blank} />,
    )
    expect(hero).toContain('data-media-module="dual-hero"')
    expect(hero).toContain('data-media-thumb="art"')
    expect(hero).toContain('data-media-thumb="empty"')

    const featured = renderToStaticMarkup(
      <NewspaperFeaturedGrid stories={[lede, blank]} />,
    )
    expect(featured).toContain('data-media-module="featured-grid"')
    expect(featured).toContain('data-media-thumb="art"')
    expect(featured).toContain('data-media-thumb="empty"')

    const latest = renderToStaticMarkup(<NewspaperLatestRail stories={[lede, blank]} />)
    expect(latest).toContain('data-media-module="latest-list"')
    expect(latest).toContain('ep-media-list-row')
    expect(latest.match(/data-media-thumb="/g)?.length).toBe(2)

    const more = renderToStaticMarkup(
      <NewspaperMoreInSection label="Strategy" href="/media/strategy" stories={[blank]} />,
    )
    expect(more).toContain('data-media-thumb="empty"')
  })

  it('does not regress gold masthead lockups or Phase 1–3a ad geometry', () => {
    expect(masthead).toContain('MEDIA_LOCKUP_DARK')
    expect(masthead).toContain('MEDIA_LOCKUP_LIGHT')
    expect(MEDIA_LOCKUP_DARK).toBe('/brand/masthead/media-lockup-dark.png')
    expect(MEDIA_LOCKUP_LIGHT).toBe('/brand/masthead/media-lockup-light.png')
    expect(portal).toContain('kind="leaderboard"')
    expect(portal).toContain('kind="mid-fluid"')
    expect(portal).toContain('kind="rail-half"')
    expect(portal).toContain('kind="sponsored-row"')
    expect(portal).toContain('MediaScrollRect')
    expect(landing).toContain('MediaScrollRect')
    expect(slot).toContain("'mid-rect'")
    expect(slot).toContain('data-media-scroll-rect="300x250"')
    expect(css).toContain('.ep-media-mid-rect')
    expect(css).toContain('.ep-media-partner-mid-fluid')
    expect(portal).not.toMatch(/googletag|doubleclick|gpt\.js/)
    expect(modules).not.toMatch(/googletag|doubleclick|gpt\.js/)
  })
})
