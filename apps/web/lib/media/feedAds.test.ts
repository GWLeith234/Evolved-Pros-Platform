import { describe, expect, it } from 'vitest'
import { hasAdjacentAds } from '@/lib/ads/rhythm'
import { layoutMediaFeed } from './feedAds'
import type { SponsorAd } from '@/components/home/HomeSponsorAd'

function still(
  id: string,
  sponsor: string,
  zone: 'A' | 'C',
): SponsorAd {
  const slot = zone === 'C' ? '728x90' : '300x250'
  return {
    id,
    sponsor_name: sponsor,
    tool_name: null,
    headline: null,
    cta_text: null,
    endorsement_quote: null,
    image_url: `https://example.com/${id}.png`,
    click_url: `https://example.com/${id}?utm_content=${slot}`,
    link_url: null,
    ad_type: 'image',
    title: 'Ad',
    zone,
  }
}

const stories = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `s${i}` }))

describe('layoutMediaFeed', () => {
  const inFeed = [
    still('tr-c', 'Transcend Clinic', 'C'),
    still('adc-c', 'AdCellerant', 'C'),
    still('evx-a', 'EvolveX360', 'A'),
  ]

  it('places one centered unit after each magazine row', () => {
    const layout = layoutMediaFeed(stories(9), inFeed)
    expect(layout.chunks.map(c => c.kind)).toEqual(['content', 'ad', 'content', 'ad', 'content', 'ad'])
    expect(layout.chunks[0]?.kind === 'content' && layout.chunks[0].items).toHaveLength(3)
    expect(layout.chunks.filter(c => c.kind === 'ad')).toHaveLength(3)
  })

  it('allows a single trailing unit after one story row — never a footer pair', () => {
    const layout = layoutMediaFeed(stories(3), inFeed)
    expect(layout.chunks.map(c => c.kind)).toEqual(['content', 'ad'])
    expect(hasAdjacentAds(layout.chunks)).toBe(false)
  })

  it('never places two ad blocks back-to-back, even with leftover inventory', () => {
    const layout = layoutMediaFeed(stories(18), inFeed)
    expect(hasAdjacentAds(layout.chunks)).toBe(false)
    expect(layout.chunks.filter(c => c.kind === 'ad').length).toBeGreaterThanOrEqual(3)
    expect(hasAdjacentAds(layout.chunks)).toBe(false)
  })

  it('keeps an empty grid empty — no ads-only board', () => {
    const layout = layoutMediaFeed([], inFeed)
    expect(layout.chunks).toEqual([])
  })

  it('does not rewrite stored click URLs', () => {
    const layout = layoutMediaFeed(stories(12), inFeed)
    const banner = layout.chunks.find(c => c.kind === 'ad')
    expect(banner && banner.kind === 'ad' && banner.ad.click_url).toBe(inFeed[0].click_url)
  })
})
