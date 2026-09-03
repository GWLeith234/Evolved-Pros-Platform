import { describe, expect, it } from 'vitest'
import { houseAdHref } from '@/lib/ads/house'
import {
  ACADEMY_SPONSOR_AD,
  ACADEMY_UPGRADE_AD,
  ACADEMY_IAB_MAX,
  IN_FEED_IAB_MAX,
  PODCAST_IAB_MAX,
  adsConflictAdjacent,
  advertiserFamilyKey,
  ensurePodcastSponsors,
  isAcademyAd,
  isEvolveXAd,
  isFirstPartyAd,
  pickAcademySponsors,
  pickArticleAds,
  pickCommunityFeedAds,
  pickHomeEndBigBox,
  pickHomeSponsors,
  pickMediaFeedAds,
  pickScrollBanners,
  selectPodcastBigBoxes,
  spreadNonAdjacentAds,
} from './partners'
import type { SponsorAd } from '@/components/home/HomeSponsorAd'

const HOUSE = houseAdHref('300x250')

describe('ACADEMY_* fallback destinations', () => {
  it('points both hardcoded house units at /pricing with house UTMs', () => {
    expect(ACADEMY_SPONSOR_AD.click_url).toBe(HOUSE)
    expect(ACADEMY_SPONSOR_AD.link_url).toBe(HOUSE)
    expect(ACADEMY_UPGRADE_AD.click_url).toBe(HOUSE)
    expect(ACADEMY_UPGRADE_AD.link_url).toBe(HOUSE)
    for (const url of [ACADEMY_SPONSOR_AD.click_url, ACADEMY_UPGRADE_AD.click_url]) {
      expect(url).not.toContain('/join')
      expect(url).not.toContain('/academy')
      expect(url).not.toContain('/membership')
    }
  })
})

describe('isAcademyAd', () => {
  it('recognizes hardcoded house units and partner units stay partners', () => {
    expect(isAcademyAd(ACADEMY_SPONSOR_AD)).toBe(true)
    expect(isAcademyAd(ACADEMY_UPGRADE_AD)).toBe(true)
    expect(
      isAcademyAd({
        id: 'adc-live',
        sponsor_name: 'AdCellerant',
        tool_name: null,
        image_url: 'https://example.com/adc.png',
        click_url: 'https://www.adcellerant.com/',
        link_url: null,
      }),
    ).toBe(false)
    expect(
      isAcademyAd({
        id: 'evx-live',
        sponsor_name: 'EvolveX360',
        tool_name: null,
        image_url: 'https://example.com/evx.png',
        click_url: 'https://evolvex360.com/',
        link_url: null,
      }),
    ).toBe(false)
  })

  it('serves live IAB stills and never invents fallback cards', () => {
    const stills: SponsorAd[] = [
      {
        id: 'adc-a',
        sponsor_name: 'AdCellerant',
        tool_name: null,
        headline: null,
        cta_text: null,
        endorsement_quote: null,
        image_url: 'https://example.com/adc-300x250.png',
        click_url: 'https://www.adcellerant.com/?utm_content=300x250',
        link_url: null,
        ad_type: 'image',
        title: 'Ad',
        zone: 'A',
      },
      {
        id: 'aca-a',
        sponsor_name: 'Evolved Pros Academy',
        tool_name: null,
        headline: null,
        cta_text: null,
        endorsement_quote: null,
        image_url: 'https://example.com/aca-300x250.png',
        click_url: 'https://www.evolvedpros.com/pricing?utm_content=300x250',
        link_url: null,
        ad_type: 'image',
        title: 'Ad',
        zone: 'A',
      },
      {
        id: 'tr-a',
        sponsor_name: 'Transcend Clinic',
        tool_name: null,
        headline: null,
        cta_text: null,
        endorsement_quote: null,
        image_url: 'https://example.com/tr-300x250.png',
        click_url: 'https://transcendibogaine.com/?utm_content=300x250',
        link_url: null,
        ad_type: 'image',
        title: 'Ad',
        zone: 'A',
      },
      {
        id: 'evx-a',
        sponsor_name: 'EvolveX360',
        tool_name: null,
        headline: null,
        cta_text: null,
        endorsement_quote: null,
        image_url: 'https://example.com/evx-300x250.png',
        click_url: 'https://evolvex360.com/?utm_content=300x250',
        link_url: null,
        ad_type: 'image',
        title: 'Ad',
        zone: 'A',
      },
    ]
    const home = pickHomeSponsors(stills)
    expect(home).toHaveLength(2)
    expect(home.every(a => a.title === 'Ad' && !a.headline && !a.cta_text)).toBe(true)
    expect(home.length).toBeLessThanOrEqual(IN_FEED_IAB_MAX)
    expect(pickHomeSponsors([ACADEMY_SPONSOR_AD])).toEqual([])
    expect(ensurePodcastSponsors([])).toEqual([])
    expect(pickAcademySponsors([], 2)).toEqual([])
    expect(pickAcademySponsors(stills, 4).length).toBeGreaterThan(0)
    expect(pickAcademySponsors(stills, 4).length).toBeLessThanOrEqual(ACADEMY_IAB_MAX)
    expect(
      pickAcademySponsors(
        [
          {
            ...stills[2],
            zone: 'C',
            click_url: 'https://transcendibogaine.com/?utm_content=728x90',
          },
        ],
        2,
      ).every(a => a.zone === 'C'),
    ).toBe(true)
    const mixed = pickHomeSponsors([
      ...stills,
      { ...stills[2], id: 'tr-c', zone: 'C', click_url: 'https://transcendibogaine.com/?utm_content=728x90' },
    ])
    expect(mixed.every(a => a.zone === 'A')).toBe(true)
    expect(mixed.filter(a => a.sponsor_name === 'Transcend Clinic')).toHaveLength(1)
  })

  it('treats a platform_ads row with house UTMs as Academy self-promo', () => {
    expect(
      isAcademyAd({
        id: '00000000-0000-4000-8000-000000000099',
        sponsor_name: 'Evolved Pros',
        tool_name: null,
        image_url: '/ads/academy-300x600.png',
        click_url: houseAdHref('300x600'),
        link_url: houseAdHref('300x600'),
      }),
    ).toBe(true)
  })
})

describe('podcast big box + scroll banners', () => {
  const zoneA: SponsorAd = {
    id: 'tr-a',
    sponsor_name: 'Transcend Clinic',
    tool_name: null,
    headline: null,
    cta_text: null,
    endorsement_quote: null,
    image_url: 'https://example.com/tr-300x250.png',
    click_url: 'https://transcendibogaine.com/?utm_content=300x250',
    link_url: null,
    ad_type: 'image',
    title: 'Ad',
    zone: 'A',
  }
  const zoneE: SponsorAd = {
    ...zoneA,
    id: 'tr-e',
    image_url: 'https://example.com/tr-300x600.png',
    click_url: 'https://transcendibogaine.com/?utm_content=300x600',
    zone: 'E',
  }
  const zoneC: SponsorAd = {
    ...zoneA,
    id: 'tr-c',
    image_url: 'https://example.com/tr-728x90.png',
    click_url: 'https://transcendibogaine.com/?utm_content=728x90',
    zone: 'C',
  }
  const adcE: SponsorAd = {
    ...zoneE,
    id: 'adc-e',
    sponsor_name: 'AdCellerant',
    image_url: 'https://example.com/adc-300x600.png',
    click_url: 'https://www.adcellerant.com/?utm_content=300x600',
  }
  const evxE: SponsorAd = {
    ...zoneE,
    id: 'evx-e',
    sponsor_name: 'EvolveX360',
    image_url: 'https://example.com/evx-300x600.png',
    click_url: 'https://evolvex360.com/?utm_content=300x600',
  }
  const acaE: SponsorAd = {
    ...zoneE,
    id: 'aca-e',
    sponsor_name: 'Evolved Pros Academy',
    image_url: 'https://example.com/aca-300x600.png',
    click_url: 'https://www.evolvedpros.com/pricing?utm_content=300x600',
  }

  it('picks Zone E 300×600 for podcast — not the square A unit', () => {
    const pool = ensurePodcastSponsors([zoneA, zoneE, zoneC, adcE])
    expect(pool.length).toBeGreaterThan(0)
    expect(pool.every(a => a.zone === 'E')).toBe(true)
    expect(pool.every(a => a.click_url?.includes('300x600'))).toBe(true)
    expect(pool.some(a => a.zone === 'A' || a.zone === 'C')).toBe(false)
  })

  it('picks multiple Zone E boxes for 4 / ad / 4 / ad — never squares', () => {
    const boxes = selectPodcastBigBoxes([zoneE, adcE, evxE, acaE, zoneA])
    expect(boxes.length).toBeGreaterThan(1)
    expect(boxes.length).toBeLessThanOrEqual(PODCAST_IAB_MAX)
    expect(boxes.every(a => a.zone === 'E')).toBe(true)
    for (let i = 1; i < boxes.length; i++) {
      expect(adsConflictAdjacent(boxes[i - 1], boxes[i])).toBe(false)
    }
  })

  it('end-of-home big box is Zone E and not a mid-scroll advertiser', () => {
    const home = pickHomeSponsors([zoneA, adcE, evxE, zoneE])
    const end = pickHomeEndBigBox([zoneA, adcE, evxE, zoneE], home)
    expect(end?.zone).toBe('E')
    if (end && home[0]) {
      expect(advertiserFamilyKey(end)).not.toBe(advertiserFamilyKey(home[0]))
    }
  })

  it('uses Zone C banners in scroll and never falls back to a square', () => {
    expect(pickScrollBanners([zoneA, zoneE], 1)).toEqual([])
    const banners = pickScrollBanners([zoneA, zoneE, zoneC], 2)
    expect(banners).toHaveLength(1)
    expect(banners[0].zone).toBe('C')
    expect(banners[0].click_url).toContain('728x90')
  })

  it('does not rewrite stored destinations when selecting layout sizes', () => {
    const e = ensurePodcastSponsors([zoneE])[0]
    const c = pickScrollBanners([zoneC])[0]
    expect(e.click_url).toBe(zoneE.click_url)
    expect(c.click_url).toBe(zoneC.click_url)
  })
})

describe('first-party adjacency + media magazine feed', () => {
  const zoneA = (id: string, sponsor: string, click: string): SponsorAd => ({
    id,
    sponsor_name: sponsor,
    tool_name: null,
    headline: null,
    cta_text: null,
    endorsement_quote: null,
    image_url: `https://example.com/${id}.png`,
    click_url: click,
    link_url: null,
    ad_type: 'image',
    title: 'Ad',
    zone: 'A',
  })
  const zoneC = (id: string, sponsor: string, click: string): SponsorAd => ({
    ...zoneA(id, sponsor, click),
    id,
    zone: 'C',
  })

  const catalog: SponsorAd[] = [
    zoneA('tr-a', 'Transcend Clinic', 'https://transcendibogaine.com/?utm_content=300x250'),
    zoneC('tr-c', 'Transcend Clinic', 'https://transcendibogaine.com/?utm_content=728x90'),
    zoneA('adc-a', 'AdCellerant', 'https://www.adcellerant.com/?utm_content=300x250'),
    zoneC('adc-c', 'AdCellerant', 'https://www.adcellerant.com/?utm_content=728x90'),
    zoneA('aca-a', 'Evolved Pros Academy', 'https://www.evolvedpros.com/pricing?utm_content=300x250'),
    zoneC('aca-c', 'Evolved Pros Academy', 'https://www.evolvedpros.com/pricing?utm_content=728x90'),
    zoneA('evx-a', 'EvolveX360', 'https://evolvex360.com/?utm_content=300x250'),
    zoneC('evx-c', 'EvolveX360', 'https://evolvex360.com/?utm_content=728x90'),
  ]

  it('treats Academy and EvolveX360 as first-party and AdCellerant as a partner', () => {
    expect(isEvolveXAd({ sponsor_name: 'EvolveX360' })).toBe(true)
    expect(isFirstPartyAd({ sponsor_name: 'EvolveX360' })).toBe(true)
    expect(isFirstPartyAd(ACADEMY_SPONSOR_AD)).toBe(true)
    expect(isFirstPartyAd({ sponsor_name: 'AdCellerant' })).toBe(false)
    expect(adsConflictAdjacent({ sponsor_name: 'Evolved Pros Academy' }, { sponsor_name: 'EvolveX360' })).toBe(true)
    expect(adsConflictAdjacent({ sponsor_name: 'Transcend Clinic' }, { sponsor_name: 'AdCellerant' })).toBe(false)
  })

  it('drops the second house unit rather than sitting Academy next to EvolveX360', () => {
    const pair = spreadNonAdjacentAds([
      zoneA('aca-a', 'Evolved Pros Academy', 'https://www.evolvedpros.com/pricing?utm_content=300x250'),
      zoneA('evx-a', 'EvolveX360', 'https://evolvex360.com/?utm_content=300x250'),
    ])
    expect(pair).toHaveLength(1)
    expect(pair[0].sponsor_name).toBe('Evolved Pros Academy')
  })

  it('picks a rail plus an in-feed stream — never a footer pair', () => {
    const feed = pickMediaFeedAds(catalog)
    expect(feed.sidebar.length).toBeGreaterThan(0)
    expect(feed.sidebar.length).toBeLessThanOrEqual(2)
    expect(feed.inFeed.length).toBeGreaterThan(0)
    expect(feed.inFeed.length).toBeLessThanOrEqual(IN_FEED_IAB_MAX)
    expect('footer' in feed).toBe(false)
    for (let i = 1; i < feed.inFeed.length; i++) {
      expect(adsConflictAdjacent(feed.inFeed[i - 1], feed.inFeed[i])).toBe(false)
    }
  })

  it('article rail + several in-body units, never the same advertiser twice in a row', () => {
    const article = pickArticleAds(catalog)
    expect(article.sidebar.length).toBeGreaterThan(0)
    expect(article.inBody.length).toBeGreaterThan(0)
    const placed = [...article.sidebar, ...article.inBody]
    for (let i = 1; i < article.inBody.length; i++) {
      expect(adsConflictAdjacent(article.inBody[i - 1], article.inBody[i])).toBe(false)
    }
    if (article.sidebar[0] && article.inBody[0]) {
      expect(advertiserFamilyKey(article.inBody[0])).not.toBe(advertiserFamilyKey(article.sidebar[0]))
    }
    expect(placed.length).toBeGreaterThan(2)
  })

  it('community feed mixes squares and banners and spreads advertisers', () => {
    const feed = pickCommunityFeedAds(catalog)
    expect(feed.length).toBeGreaterThan(1)
    expect(feed.some(a => a.zone === 'A')).toBe(true)
    expect(feed.some(a => a.zone === 'C')).toBe(true)
    for (let i = 1; i < feed.length; i++) {
      expect(adsConflictAdjacent(feed[i - 1], feed[i])).toBe(false)
    }
  })

  it('does not rewrite stored click URLs on media picks', () => {
    const feed = pickMediaFeedAds(catalog)
    for (const ad of [...feed.sidebar, ...feed.inFeed]) {
      const original = catalog.find(c => c.id === ad.id)
      expect(original).toBeTruthy()
      expect(ad.click_url).toBe(original?.click_url)
    }
  })
})
