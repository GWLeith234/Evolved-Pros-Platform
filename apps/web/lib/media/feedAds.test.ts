import { describe, expect, it } from 'vitest'
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
  const banners = [
    still('tr-c', 'Transcend Clinic', 'C'),
    still('adc-c', 'AdCellerant', 'C'),
  ]
  const footer = [
    still('aca-a', 'Evolved Pros Academy', 'A'),
    still('adc-a', 'AdCellerant', 'A'),
  ]

  it('interleaves banners between story rows, never as the last chunk', () => {
    const layout = layoutMediaFeed(stories(9), { banners, footer })
    expect(layout.leadBanner).toBeNull()
    expect(layout.chunks.map(c => c.kind)).toEqual([
      'stories',
      'banner',
      'stories',
      'banner',
      'stories',
    ])
    expect(layout.chunks[layout.chunks.length - 1]?.kind).toBe('stories')
    const inserted = layout.chunks.filter(c => c.kind === 'banner')
    expect(inserted).toHaveLength(2)
    expect(inserted[0].kind === 'banner' && inserted[0].ad.click_url).toBe(banners[0].click_url)
  })

  it('does not stack two banners when there is only one story row', () => {
    const layout = layoutMediaFeed(stories(3), { banners, footer })
    expect(layout.leadBanner?.id).toBe('tr-c')
    expect(layout.chunks.every(c => c.kind === 'stories')).toBe(true)
    expect(layout.chunks).toHaveLength(1)
    expect(layout.footer.map(a => a.id)).toEqual(['aca-a', 'adc-a'])
  })

  it('never places two ad blocks back-to-back in the grid', () => {
    const layout = layoutMediaFeed(stories(12), { banners, footer })
    for (let i = 1; i < layout.chunks.length; i++) {
      const prev = layout.chunks[i - 1]
      const cur = layout.chunks[i]
      expect(prev.kind === 'banner' && cur.kind === 'banner').toBe(false)
    }
  })

  it('drops a footer square that would sit next to a conflicting lead banner when there are no cards', () => {
    const layout = layoutMediaFeed([], {
      banners: [still('aca-c', 'Evolved Pros Academy', 'C')],
      footer: [still('evx-a', 'EvolveX360', 'A'), still('tr-a', 'Transcend Clinic', 'A')],
    })
    expect(layout.leadBanner?.sponsor_name).toBe('Evolved Pros Academy')
    expect(layout.chunks).toEqual([])
    expect(layout.footer.map(a => a.sponsor_name)).toEqual(['Transcend Clinic'])
  })

  it('does not rewrite stored click URLs', () => {
    const layout = layoutMediaFeed(stories(6), { banners, footer })
    const banner = layout.chunks.find(c => c.kind === 'banner')
    expect(banner && banner.kind === 'banner' && banner.ad.click_url).toBe(banners[0].click_url)
    expect(layout.footer[0]?.click_url).toBe(footer[0].click_url)
  })
})
