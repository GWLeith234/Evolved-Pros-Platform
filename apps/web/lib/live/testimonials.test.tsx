import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { EM_DASH, hasEmDash } from '@/lib/home/conversion'
import { LiveTestimonials } from '@/components/live/LiveTestimonials'
import { ROTATOR_PHOTOS } from './photo-rotator'
import {
  LIVE_TESTIMONIALS,
  LIVE_TESTIMONIALS_KICKER,
  groupLiveTestimonials,
  headshotSources,
  liveTestimonialCopyStrings,
  type LiveTestimonial,
} from './testimonials'

const root = resolve(__dirname, '../..')
const publicDir = resolve(root, 'public')

const HREFS = [
  'https://www.vendasta.com/newsroom/vendasta-promotes-george-leith-to-cro/',
  'https://www.vendasta.com/newsroom/vendasta-cco-george-leith-named-top-gun-51-channel-partners/',
  'https://charleslaughlin.substack.com/p/episode-3-george-leith-evp-and-cro',
  'https://iabcanada.com/humans-of-digital-george-leith-on-lifelong-learning-and-growth/',
  'https://blog.hubspot.com/sales/top-sales-podcasts',
  'https://www.localogy.com/2019/03/new-podcast-glengarry-glen-george-featuring-george-leith/',
]

const APPLE_BADGE = '5.0 on Apple Podcasts'

/** Retired Apple review total. Split so this file does not contain the figure. */
const BANNED_REVIEW_TOTAL = '1' + '09'

function appleCardCopy(item: LiveTestimonial | undefined): string {
  return [item?.quote, item?.author, item?.role, item?.event, item?.ratingLabel, item?.sourceLabel, item?.mark]
    .filter((value): value is string => Boolean(value))
    .join('\n')
}

function appleCardMarkup(html: string): string {
  const match = html.match(/<article\b[^>]*data-author="Apple Podcasts listeners"[^>]*>[\s\S]*?<\/article>/)
  if (!match) throw new Error('Apple card markup missing')
  return match[0]
}

function appleCardSource(data: string): string {
  const start = data.indexOf("kind: 'reviews'")
  const end = data.indexOf("author: 'HubSpot'")
  if (start < 0 || end < start) throw new Error('Apple card source missing')
  return data.slice(start, end)
}

describe('LIVE testimonials REV2', () => {
  it('keeps the approved order, kinds, and existing three', () => {
    expect(LIVE_TESTIMONIALS).toHaveLength(10)
    expect(LIVE_TESTIMONIALS.map(item => [item.kind, item.author])).toEqual([
      ['quote', 'Brendan King'],
      ['award', 'George Leith'],
      ['quote', 'Charles Laughlin'],
      ['quote', 'IAB Canada'],
      ['reviews', 'Apple Podcasts listeners'],
      ['quote', 'HubSpot'],
      ['quote', 'George Leith'],
      ['quote', 'Mike Giamprini'],
      ['quote', 'Amy Andrew Delardi'],
      ['quote', 'Dr. Cindy McGovern'],
    ])
    expect(LIVE_TESTIMONIALS.filter(item => item.featured).map(item => item.author)).toEqual([
      'Brendan King',
      'Charles Laughlin',
    ])
    expect(LIVE_TESTIMONIALS.filter(item => item.existing).map(item => item.author)).toEqual([
      'Mike Giamprini',
      'Amy Andrew Delardi',
      'Dr. Cindy McGovern',
    ])
    const groups = groupLiveTestimonials()
    expect(groups.featured).toHaveLength(3)
    expect(groups.featured.map(item => item.kind)).toEqual(['quote', 'award', 'quote'])
    expect(groups.industry.map(item => item.author)).toEqual(['IAB Canada'])
    expect(groups.reviews.map(item => item.author)).toEqual(['Apple Podcasts listeners'])
    expect(groups.recognition.map(item => item.author)).toEqual(['HubSpot', 'George Leith'])
    expect(groups.existing).toHaveLength(3)
  })

  it('links Top Gun, HubSpot, and the other sourced cards, and leaves Apple rating-only', () => {
    expect(LIVE_TESTIMONIALS.filter(item => item.href).map(item => item.href)).toEqual(HREFS)
    expect(LIVE_TESTIMONIALS.filter(item => item.existing).every(item => item.href == null)).toBe(true)
    const apple = LIVE_TESTIMONIALS.find(item => item.author === 'Apple Podcasts listeners')
    expect(apple?.ratingLabel).toBe(APPLE_BADGE)
    expect(apple?.event).toBe('Rating · public')
    expect(apple?.role).toBeUndefined()
    expect(apple?.href).toBeUndefined()
    expect(apple?.sourceLabel).toBeUndefined()
    expect(apple?.reviews).toBeUndefined()
    expect(apple?.logoUrl).toBeUndefined()
    expect(apple?.logoText).toBeUndefined()
    const appleCopy = appleCardCopy(apple)
    expect(appleCopy).not.toContain('Conquer Local')
    expect(appleCopy).not.toContain('Reviews · public')
    expect(appleCopy.includes(BANNED_REVIEW_TOTAL)).toBe(false)
    const award = LIVE_TESTIMONIALS.find(item => item.kind === 'award')
    expect(award?.mark).toBe('Top Gun 51')
    expect(award?.logoUrl).toBeUndefined()
    expect(award?.logoText).toBeUndefined()
    const hubspot = LIVE_TESTIMONIALS.find(item => item.author === 'HubSpot')
    expect(hubspot?.role).toBe('#22 · Top Sales Podcasts')
    expect(hubspot?.event).toBe('Conquer Local · 2026 list')
    expect(hubspot?.logoUrl).toBeUndefined()
    expect(hubspot?.logoText).toBeUndefined()
    const cindy = LIVE_TESTIMONIALS.find(item => item.author === 'Dr. Cindy McGovern')
    expect(cindy?.event).toBe('Conquer Local Podcast')
    const sanDiego = ROTATOR_PHOTOS.find(photo => photo.src === '/live/george-stage-blue-jacket.jpg')
    expect(sanDiego).toEqual({
      src: '/live/george-stage-blue-jacket.jpg',
      caption: 'Conquer Local',
      city: 'San Diego',
      country: 'USA',
    })
  })

  it('wires supplied headshots, keeps Amy on initials, and uses text badges', () => {
    const withPhotos = ['Brendan King', 'Charles Laughlin', 'Mike Giamprini', 'Dr. Cindy McGovern']
    for (const author of withPhotos) {
      const item = LIVE_TESTIMONIALS.find(entry => entry.author === author)
      expect(item?.headshotUrl, author).toMatch(/\.webp$/)
      const sources = headshotSources(item!.headshotUrl!)
      expect(existsSync(resolve(publicDir, sources.webp!.slice(1)))).toBe(true)
      expect(existsSync(resolve(publicDir, sources.src.slice(1)))).toBe(true)
    }
    const charles = LIVE_TESTIMONIALS.find(item => item.author === 'Charles Laughlin')
    expect(charles?.headshotUrl).toBe('/images/testimonials/charles-laughlin-320.webp')
    expect(charles?.initials).toBeUndefined()
    const amy = LIVE_TESTIMONIALS.find(item => item.author === 'Amy Andrew Delardi')
    expect(amy?.headshotUrl).toBeUndefined()
    expect(amy?.initials).toBe('AA')
    expect(amy?.quote).toContain('George, an incredible leader')
    expect(LIVE_TESTIMONIALS.every(item => item.logoUrl == null)).toBe(true)
    expect(LIVE_TESTIMONIALS.find(item => item.author === 'IAB Canada')?.logoText).toBe('IAB Canada')
    expect(LIVE_TESTIMONIALS.find(item => item.event === '2019 · 60/30/10 rule')?.logoText).toBe('Localogy')
    for (const author of ['IAB Canada', 'Apple Podcasts listeners', 'HubSpot']) {
      const item = LIVE_TESTIMONIALS.find(entry => entry.author === author)
      expect(item?.headshotUrl, author).toBeUndefined()
      expect(item?.initials, author).toBeUndefined()
    }
  })

  it('ships no em dashes', () => {
    expect(LIVE_TESTIMONIALS_KICKER).toBe(
      'Training floors, mentorship, and the mic. Not just the keynote slot.',
    )
    const blob = JSON.stringify(LIVE_TESTIMONIALS).toLowerCase()
    expect(blob).not.toContain('harvard')
    for (const value of liveTestimonialCopyStrings()) {
      expect(hasEmDash(value), value).toBe(false)
      expect(value).not.toContain(EM_DASH)
      expect(value).not.toContain('\u2013')
    }
  })

  it('renders ten cards in order with headshots, text badges, and no mock chrome', () => {
    const html = renderToStaticMarkup(<LiveTestimonials />)
    const authors = [...html.matchAll(/data-author="([^"]+)"/g)].map(match => match[1])
    expect(authors).toEqual(LIVE_TESTIMONIALS.map(item => item.author))
    expect(authors).toHaveLength(10)
    expect(html).toContain('data-band="industry"')
    expect(html).toMatch(/data-band="industry"[\s\S]*live-t-grid--full[\s\S]*IAB Canada/)
    expect(html).toMatch(/data-band="featured"[\s\S]*live-t-grid--featured/)
    expect(html).toMatch(/data-band="recognition"[\s\S]*live-t-grid--pair/)
    expect(html).toContain('Top Gun 51')
    expect(html).toContain('HubSpot')
    expect(html).not.toMatch(/live-t-badge|live-t-row-label|live-t-logo/)
    for (const leaked of [
      'New · quote',
      'New · award',
      'New · reviews',
      'Featured credibility',
      'logo slot',
      'Listener proof',
      'Quote · featured',
      'optional',
      'KEEP LIVE CROP',
      'podcasts.apple.com',
      'heavyweight in the world',
      'wizard in the industry',
      'Master Salesman',
    ]) {
      expect(html.toLowerCase()).not.toContain(leaked.toLowerCase())
    }
    expect(html).not.toMatch(/>\s*Existing\s*</)
    expect(html).toContain(APPLE_BADGE)
    expect(html).toContain('aria-label="5 stars"')
    expect(html).toContain('brendan-king-320.webp')
    expect(html).toContain('brendan-king-320.jpg')
    expect(html).toContain('charles-laughlin-320.webp')
    expect(html).toContain('charles-laughlin-320.jpg')
    expect(html).not.toContain('>CL<')
    expect(html).toContain('mike-giamprini-320.jpg')
    expect(html).toContain('cindy-mcgovern-320.webp')
    expect(html).toContain('Photo pending for Amy Andrew Delardi')
    expect(html).not.toContain('Photo pending for Charles Laughlin')
    expect(html).toContain('>AA<')
    expect(html).not.toContain('amy-andrew')
    expect(html.toLowerCase()).not.toContain('harvard')
    expect(html).not.toContain('AggregateRating')
    expect(html).not.toContain('"@type":"Review"')
    expect(html).not.toContain(EM_DASH)
    const appleHtml = appleCardMarkup(html)
    expect(appleHtml).toContain('Rating · public')
    expect(appleHtml).toContain(APPLE_BADGE)
    expect(appleHtml).not.toContain('Conquer Local')
    expect(appleHtml).not.toContain('Reviews · public')
    expect(appleHtml.includes(BANNED_REVIEW_TOTAL)).toBe(false)
    for (const href of HREFS) {
      expect(html).toContain(href)
    }
    expect(html).toContain('rel="noopener noreferrer"')
    const component = readFileSync(resolve(root, 'components/live/LiveTestimonials.tsx'), 'utf8')
    const data = readFileSync(resolve(root, 'lib/live/testimonials.ts'), 'utf8')
    const css = readFileSync(resolve(root, 'app/globals.css'), 'utf8')
    expect(component).not.toMatch(/#[0-9a-fA-F]{6}\b/)
    expect(component).not.toContain('harvard')
    expect(component).not.toContain("from 'next/image'")
    expect(component).toContain('<img src={sources.src} alt={item.author}')
    expect(css).toContain('grid-template-columns: 1.35fr 1fr 1.15fr;')
    const appleSource = appleCardSource(data)
    expect(appleSource).toContain(`ratingLabel: '${APPLE_BADGE}'`)
    expect(appleSource).toContain("event: 'Rating · public'")
    expect(appleSource).toContain('id1895786556')
    expect(appleSource).toContain('Checked Oct 19, 2026')
    expect(appleSource).toContain('1 rating, US')
    expect(appleSource).not.toContain('podcasts.apple.com')
    expect(appleSource).not.toContain('Conquer Local')
    expect(appleSource).not.toContain('Reviews · public')
    expect(appleSource).not.toContain('APPLE_PODCAST_REVIEW_COUNT')
    expect(appleSource.includes(BANNED_REVIEW_TOTAL)).toBe(false)
    expect(data).toContain("event: 'Conquer Local · 2026 list'")
    expect(data).toContain("event: 'Conquer Local Podcast'")
  })
})
