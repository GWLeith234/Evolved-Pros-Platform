import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { EM_DASH, hasEmDash } from '@/lib/home/conversion'
import { LiveTestimonials } from '@/components/live/LiveTestimonials'
import {
  LIVE_TESTIMONIALS,
  LIVE_TESTIMONIALS_KICKER,
  groupLiveTestimonials,
  headshotSources,
  liveTestimonialCopyStrings,
} from './testimonials'

const root = resolve(__dirname, '../..')
const publicDir = resolve(root, 'public')

const HREFS = [
  'https://www.vendasta.com/newsroom/vendasta-promotes-george-leith-to-cro/',
  'https://charleslaughlin.substack.com/p/episode-3-george-leith-evp-and-cro',
  'https://iabcanada.com/humans-of-digital-george-leith-on-lifelong-learning-and-growth/',
  'https://podcasts.apple.com/us/podcast/conquer-local-podcast/id1327121811',
  'https://www.localogy.com/2019/03/new-podcast-glengarry-glen-george-featuring-george-leith/',
]

const APPLE_BADGE = '5.0 on Apple Podcasts'

/** Retired review totals. Split so the source does not contain the figures. */
const RETIRED_REVIEW_TOTALS = ['1' + '09', '2' + '05']

describe('LIVE testimonials REV2', () => {
  it('keeps the approved order, kinds, and existing three', () => {
    expect(LIVE_TESTIMONIALS.map(item => [item.kind, item.author])).toEqual([
      ['quote', 'Brendan King'],
      ['quote', 'Charles Laughlin'],
      ['quote', 'IAB Canada'],
      ['reviews', 'Apple Podcasts listeners'],
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
    expect(groups.featured).toHaveLength(2)
    expect(groups.featured.map(item => item.kind)).toEqual(['quote', 'quote'])
    expect(groups.industry.map(item => item.author)).toEqual(['IAB Canada'])
    expect(groups.reviews.map(item => item.author)).toEqual(['Apple Podcasts listeners'])
    expect(groups.recognition.map(item => item.author)).toEqual(['George Leith'])
    expect(groups.existing).toHaveLength(3)
  })

  it('links the new sources and leaves the existing three unlinked', () => {
    expect(LIVE_TESTIMONIALS.filter(item => !item.existing).map(item => item.href)).toEqual(HREFS)
    expect(LIVE_TESTIMONIALS.filter(item => item.existing).every(item => item.href == null)).toBe(true)
  })

  it('wires supplied headshots, keeps Charles and Amy on initials, and uses text badges', () => {
    const withPhotos = ['Brendan King', 'Mike Giamprini', 'Dr. Cindy McGovern']
    for (const author of withPhotos) {
      const item = LIVE_TESTIMONIALS.find(entry => entry.author === author)
      expect(item?.headshotUrl, author).toMatch(/\.webp$/)
      const sources = headshotSources(item!.headshotUrl!)
      expect(existsSync(resolve(publicDir, sources.webp!.slice(1)))).toBe(true)
      expect(existsSync(resolve(publicDir, sources.src.slice(1)))).toBe(true)
    }
    const charles = LIVE_TESTIMONIALS.find(item => item.author === 'Charles Laughlin')
    expect(charles?.headshotUrl).toBeUndefined()
    expect(charles?.initials).toBe('CL')
    expect(existsSync(resolve(publicDir, 'images/testimonials/charles-laughlin-320.webp'))).toBe(true)
    expect(existsSync(resolve(publicDir, 'images/testimonials/charles-laughlin-320.jpg'))).toBe(true)
    const amy = LIVE_TESTIMONIALS.find(item => item.author === 'Amy Andrew Delardi')
    expect(amy?.headshotUrl).toBeUndefined()
    expect(amy?.initials).toBe('AA')
    expect(amy?.quote).toContain('George, an incredible leader')
    expect(LIVE_TESTIMONIALS.every(item => item.logoUrl == null)).toBe(true)
    expect(LIVE_TESTIMONIALS.find(item => item.author === 'IAB Canada')?.logoText).toBe('IAB Canada')
    expect(LIVE_TESTIMONIALS.find(item => item.author === 'George Leith')?.logoText).toBe('Localogy')
    for (const author of ['IAB Canada', 'Apple Podcasts listeners']) {
      const item = LIVE_TESTIMONIALS.find(entry => entry.author === author)
      expect(item?.headshotUrl, author).toBeUndefined()
      expect(item?.initials, author).toBeUndefined()
    }
    const apple = LIVE_TESTIMONIALS.find(item => item.author === 'Apple Podcasts listeners')
    expect(apple?.ratingLabel).toBe(APPLE_BADGE)
    expect(apple?.logoText).toBeUndefined()
  })

  it('ships no em dashes and no retired review totals in copy', () => {
    expect(LIVE_TESTIMONIALS_KICKER).toBe(
      'Training floors, mentorship, and the mic. Not just the keynote slot.',
    )
    const blob = JSON.stringify(LIVE_TESTIMONIALS).toLowerCase()
    expect(blob).not.toContain('harvard')
    for (const value of liveTestimonialCopyStrings()) {
      expect(hasEmDash(value), value).toBe(false)
      expect(value).not.toContain(EM_DASH)
      expect(value).not.toContain('\u2013')
      for (const total of RETIRED_REVIEW_TOTALS) {
        expect(value.includes(total), value).toBe(false)
      }
    }
    for (const total of RETIRED_REVIEW_TOTALS) {
      expect(blob.includes(total)).toBe(false)
    }
  })

  it('renders the section in order with headshots, text badges, and no mock chrome', () => {
    const html = renderToStaticMarkup(<LiveTestimonials />)
    const authors = [...html.matchAll(/data-author="([^"]+)"/g)].map(match => match[1])
    expect(authors).toEqual(LIVE_TESTIMONIALS.map(item => item.author))
    expect(html).toContain('data-band="industry"')
    expect(html).toMatch(/data-band="industry"[\s\S]*live-t-grid--full[\s\S]*IAB Canada/)
    expect(html).toMatch(/data-band="featured"[\s\S]*live-t-grid--featured/)
    expect(html).toMatch(/data-band="recognition"[\s\S]*live-t-grid--full/)
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
    ]) {
      expect(html.toLowerCase()).not.toContain(leaked.toLowerCase())
    }
    expect(html).not.toMatch(/>\s*Existing\s*</)
    expect(html).toContain(APPLE_BADGE)
    expect(html).toContain('aria-label="5 stars"')
    expect(html).toContain('brendan-king-320.webp')
    expect(html).toContain('brendan-king-320.jpg')
    expect(html).not.toContain('charles-laughlin')
    expect(html).toContain('>CL<')
    expect(html).toContain('mike-giamprini-320.jpg')
    expect(html).toContain('cindy-mcgovern-320.webp')
    expect(html).toContain('Photo pending for Amy Andrew Delardi')
    expect(html).toContain('Photo pending for Charles Laughlin')
    expect(html).toContain('>AA<')
    expect(html).not.toContain('amy-andrew')
    expect(html.toLowerCase()).not.toContain('harvard')
    expect(html).not.toContain('AggregateRating')
    expect(html).not.toContain('"@type":"Review"')
    expect(html).not.toContain(EM_DASH)
    for (const total of RETIRED_REVIEW_TOTALS) {
      expect(html.includes(total)).toBe(false)
    }
    for (const href of HREFS) {
      expect(html).toContain(href)
    }
    expect(html).toContain('rel="noopener noreferrer"')
    const component = readFileSync(resolve(root, 'components/live/LiveTestimonials.tsx'), 'utf8')
    const data = readFileSync(resolve(root, 'lib/live/testimonials.ts'), 'utf8')
    expect(component).not.toMatch(/#[0-9a-fA-F]{6}\b/)
    expect(component).not.toContain('harvard')
    expect(component).toContain("from 'next/image'")
    expect(data).toContain(`ratingLabel: '${APPLE_BADGE}'`)
    expect(data).not.toContain('APPLE_PODCAST_REVIEW_COUNT')
    for (const total of RETIRED_REVIEW_TOTALS) {
      expect(component.includes(total)).toBe(false)
      expect(data.includes(total)).toBe(false)
    }
  })
})
