import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { MEDIA_INDEX_SECTIONS, MEDIA_ON_AIR, splitHubDesk } from './desk'
import { MEDIA_LOCKUP_LABEL } from '../lockups'

const here = dirname(fileURLToPath(import.meta.url))

function read(rel: string): string {
  return readFileSync(resolve(here, rel), 'utf8')
}

describe('Phase 1 EPM←TT newspaper home', () => {
  const portal = read('../../app/(public)/media/MediaPortalClient.tsx')
  const masthead = read('../../components/media/Masthead.tsx')
  const slot = read('../../components/media/MediaPartnerSlot.tsx')
  const page = read('../../app/(public)/media/page.tsx')

  it('names the surface Evolved Pros Media and keeps the red-dot wordmark', () => {
    expect(MEDIA_LOCKUP_LABEL).toBe('Evolved Pros Media')
    expect(masthead).toContain('EpWordmarkMark')
    expect(masthead).toContain('MEDIA')
    expect(masthead).not.toContain('Evolved Media')
    expect(portal).toContain('Evolved Pros Media')
    expect(portal).not.toContain('Evolved Media')
  })

  it('rails only Strategy, Execution, Identity, and Foundation', () => {
    expect(MEDIA_INDEX_SECTIONS.map(s => s.label)).toEqual([
      'Strategy',
      'Execution',
      'Identity',
      'Foundation',
    ])
    expect(MEDIA_INDEX_SECTIONS.some(s => s.label === 'Latest')).toBe(false)
    expect(MEDIA_INDEX_SECTIONS.some(s => /Education|Events/i.test(s.label))).toBe(false)
  })

  it('ships dual hero, Featured 2-up, Latest thumbs, and a labeled Podcast module', () => {
    expect(portal).toContain('data-media-module="dual-hero"')
    expect(portal).toContain('data-media-module="featured-grid"')
    expect(portal).toContain('data-media-module="latest-list"')
    expect(portal).toContain('data-media-module="podcast"')
    expect(portal).toContain('The Podcast')
    expect(portal).toContain('ep-media-list-row')
    expect(page).toMatch(/\.limit\(5\)/)
    const desk = splitHubDesk(
      ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'].map((id, i) => ({
        id,
        pillar: 'strategy',
        views: i,
        published_at: '2026-09-01T00:00:00.000Z',
      })),
    )
    expect(desk.featured?.id).toBe('a')
    expect(desk.secondary?.id).toBe('b')
    expect(desk.featuredGrid).toHaveLength(2)
    expect(desk.latestList.length).toBeGreaterThanOrEqual(5)
  })

  it('reserves Soo/TT partner geometry without an open ad network', () => {
    expect(slot).toContain("kind === 'sponsored-row'")
    expect(slot).toContain('leaderboard')
    expect(slot).toContain('mid-fluid')
    expect(slot).toContain('rail-half')
    expect(slot).toMatch(/Never loads an open ad network/)
    expect(portal).toContain('MediaPartnerSlot')
    expect(portal).toContain('kind="leaderboard"')
    expect(portal).toContain('kind="mid-fluid"')
    expect(portal).toContain('kind="rail-half"')
    expect(portal).toContain('kind="sponsored-row"')
    expect(portal).not.toMatch(/googletag|doubleclick|gpt\.js/)
    expect(slot).not.toMatch(/googletag|doubleclick|gpt\.js/)
  })

  it('keeps On Air on real platform destinations and drops Events', () => {
    expect(MEDIA_ON_AIR.map(l => l.label)).toEqual(['LIVE', 'Podcast', 'Email brief'])
    expect(MEDIA_ON_AIR.every(l => l.href === '/live' || l.href === '/podcast')).toBe(true)
    expect(portal).toContain('MEDIA_ON_AIR')
    expect(portal).toContain('href={link.href}')
    expect(portal).not.toContain("href=\"/events\"")
  })
})
