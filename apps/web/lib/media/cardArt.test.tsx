import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { NewspaperThumb } from '@/components/media/NewspaperThumb'
import {
  NewspaperFeaturedGrid,
  NewspaperLatestRail,
  type NewspaperStory,
} from '@/components/media/newspaper'
import { MEDIA_LOCKUP_DARK, MEDIA_LOCKUP_LIGHT } from '../lockups'

const here = dirname(fileURLToPath(import.meta.url))

function read(rel: string): string {
  return readFileSync(resolve(here, rel), 'utf8')
}

const story = (id: string, image: string | null = '/brand/city-fallback.svg'): NewspaperStory => ({
  id,
  title: `Story ${id}`,
  slug: `story-${id}`,
  excerpt: 'A desk lede.',
  pillar: 'strategy',
  featured_image_url: image,
  author: 'George Leith',
  published_at: '2026-09-01T00:00:00.000Z',
  body: 'word '.repeat(200),
})

describe('EPM card-art presentation', () => {
  const portal = read('../../app/(public)/media/MediaPortalClient.tsx')
  const modules = read('../../components/media/newspaper.tsx')
  const thumb = read('../../components/media/NewspaperThumb.tsx')
  const article = read('../../app/(public)/media/[pillar]/[slug]/page.tsx')
  const magazine = read('../../components/media/MediaSectionMagazine.tsx')
  const css = read('../../app/globals.css')
  const slot = read('../../components/media/MediaPartnerSlot.tsx')
  const masthead = read('../../components/media/Masthead.tsx')
  const lockups = read('../lockups.ts')

  it('unifies home and newspaper thumbs on 3:2 cover crop', () => {
    expect(portal).toContain('NewspaperThumb')
    expect(portal).not.toContain('function StoryThumb')
    expect(portal).not.toMatch(/ratio="16 \/ 9"/)
    expect(modules).not.toMatch(/ratio="16 \/ 9"/)
    expect(thumb).toContain("ratio = '3 / 2'")
    expect(css).toMatch(/\.ed-story-art \{[\s\S]*object-fit: cover/)
    expect(css).not.toMatch(/ed-story-art--crop-baked-pros/)
  })

  it('renders a token fallback when featured_image_url is blank', () => {
    const empty = renderToStaticMarkup(<NewspaperThumb story={story('empty', null)} />)
    expect(empty).toContain('ep-media-thumb-fallback')
    expect(empty).toContain('data-media-thumb-empty="true"')
    expect(empty).not.toContain('<img')
    const filled = renderToStaticMarkup(
      <NewspaperThumb story={story('filled')} variant="hero" priority />,
    )
    expect(filled).toContain('src="/brand/city-fallback.svg"')
    expect(filled).not.toContain('data-media-thumb-empty')
    expect(css).toMatch(/\.ep-media-thumb-fallback \{[\s\S]*background: var\(--media-slot-thumb\)/)
    expect(css).not.toMatch(/var\(--navy\) 70%, black/)
    expect(css).not.toMatch(/#1a2540/)
  })

  it('uses Soo/TT large-thumb list rows and featured 3:2 cards', () => {
    expect(css).toMatch(/\.ep-media-list-row \{[\s\S]*grid-template-columns: 140px minmax\(0, 1fr\)/)
    expect(css).toMatch(/grid-template-columns: 160px minmax\(0, 1fr\)/)
    expect(css).not.toMatch(/grid-template-columns: 100px minmax\(0, 1fr\)/)
    const featured = renderToStaticMarkup(
      <NewspaperFeaturedGrid stories={[story('f1'), story('f2')]} />,
    )
    expect(featured).toContain('aspect-ratio:3 / 2')
    expect(featured).not.toContain('16 / 9')
    const rail = renderToStaticMarkup(
      <NewspaperLatestRail stories={[story('l1', null), story('l2')]} />,
    )
    expect(rail).toContain('data-media-thumb="list"')
    expect(rail).toContain('ep-media-thumb-fallback')
  })

  it('keeps article hero geometry and empty-state in the same 3:2 grammar', () => {
    expect(article).toContain('ep-media-thumb-fallback')
    expect(article).toContain('data-media-thumb-empty')
    expect(article).toContain('ep-media-article-art')
    expect(css).toMatch(/\.ep-media-article-art \{[\s\S]*aspect-ratio: 3 \/ 2/)
    expect(magazine).toContain('ep-media-thumb-fallback')
    expect(magazine).toMatch(/aspectRatio: '3 \/ 2'/)
    expect(magazine).not.toMatch(/21\/9|16\/9/)
  })

  it('does not regress Phase 3a 300×250 slots or gold masthead lockups', () => {
    expect(slot).toContain("'mid-rect': { w: 300, h: 250 }")
    expect(slot).toContain("'rail-half': { w: 300, h: 600 }")
    expect(slot).toContain("leaderboard: { w: 728, h: 90 }")
    expect(slot).toContain("'mid-fluid': { w: 970, h: 250 }")
    expect(portal).toContain('MediaScrollRect')
    expect(portal).toContain('kind="leaderboard"')
    expect(portal).toContain('kind="mid-fluid"')
    expect(masthead).toContain('MEDIA_LOCKUP_DARK')
    expect(masthead).toContain('MEDIA_LOCKUP_LIGHT')
    expect(lockups).toContain(MEDIA_LOCKUP_DARK)
    expect(lockups).toContain(MEDIA_LOCKUP_LIGHT)
    expect(MEDIA_LOCKUP_DARK).toBe('/brand/masthead/media-lockup-dark.png')
    expect(MEDIA_LOCKUP_LIGHT).toBe('/brand/masthead/media-lockup-light.png')
  })
})
