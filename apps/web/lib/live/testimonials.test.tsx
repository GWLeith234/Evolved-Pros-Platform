import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { EM_DASH, hasEmDash } from '@/lib/home/conversion'
import { LiveTestimonials } from '@/components/live/LiveTestimonials'
import {
  LIVE_TESTIMONIALS,
  groupLiveTestimonials,
  headshotSources,
  liveTestimonialCopyStrings,
} from './testimonials'

const root = resolve(__dirname, '../..')
const publicDir = resolve(root, 'public')

const HREFS = [
  'https://www.vendasta.com/newsroom/vendasta-promotes-george-leith-to-cro/',
  'https://www.vendasta.com/newsroom/vendasta-cco-george-leith-named-top-gun-51-channel-partners/',
  'https://charleslaughlin.substack.com/p/episode-3-george-leith-evp-and-cro',
  'https://iabcanada.com/humans-of-digital-george-leith-on-lifelong-learning-and-growth/',
  'https://podcasts.apple.com/us/podcast/conquer-local-podcast/id1327121811',
  'https://blog.hubspot.com/sales/top-sales-podcasts',
  'https://www.localogy.com/2019/03/new-podcast-glengarry-glen-george-featuring-george-leith/',
]

describe('LIVE testimonials REV2', () => {
  it('keeps the approved order, kinds, and existing three', () => {
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

  it('links the seven new sources and leaves the existing three unlinked', () => {
    expect(LIVE_TESTIMONIALS.filter(item => !item.existing).map(item => item.href)).toEqual(HREFS)
    expect(LIVE_TESTIMONIALS.filter(item => item.existing).every(item => item.href == null)).toBe(true)
  })

  it('wires supplied headshots and does not invent logos or an Amy photo', () => {
    const withPhotos = ['Brendan King', 'Charles Laughlin', 'Mike Giamprini', 'Dr. Cindy McGovern']
    for (const author of withPhotos) {
      const item = LIVE_TESTIMONIALS.find(entry => entry.author === author)
      expect(item?.headshotUrl, author).toMatch(/\.webp$/)
      const sources = headshotSources(item!.headshotUrl!)
      expect(existsSync(resolve(publicDir, sources.webp!.slice(1)))).toBe(true)
      expect(existsSync(resolve(publicDir, sources.src.slice(1)))).toBe(true)
    }
    const amy = LIVE_TESTIMONIALS.find(item => item.author === 'Amy Andrew Delardi')
    expect(amy?.headshotUrl).toBeUndefined()
    expect(amy?.initials).toBe('AA')
    expect(amy?.quote).toContain('George, an incredible leader')
    expect(LIVE_TESTIMONIALS.every(item => item.logoUrl == null)).toBe(true)
    for (const author of ['IAB Canada', 'HubSpot']) {
      const item = LIVE_TESTIMONIALS.find(entry => entry.author === author)
      expect(item?.headshotUrl, author).toBeUndefined()
      expect(item?.logoLabel, author).toBeTruthy()
    }
  })

  it('ships no Harvard card and no em dashes in copy', () => {
    const blob = JSON.stringify(LIVE_TESTIMONIALS).toLowerCase()
    expect(blob).not.toContain('harvard')
    expect(blob).not.toContain('76%')
    for (const value of liveTestimonialCopyStrings()) {
      expect(hasEmDash(value), value).toBe(false)
      expect(value).not.toContain(EM_DASH)
      expect(value).not.toContain('\u2013')
    }
  })

  it('renders the section in order with headshots, logo slots, and source links', () => {
    const html = renderToStaticMarkup(<LiveTestimonials />)
    const authors = [...html.matchAll(/data-author="([^"]+)"/g)].map(match => match[1])
    expect(authors).toEqual(LIVE_TESTIMONIALS.map(item => item.author))
    expect(html).toContain('Top Gun 51')
    expect(html).toContain('5.0')
    expect(html).toContain('109 reviews')
    expect(html).toContain('brendan-king-320.webp')
    expect(html).toContain('brendan-king-320.jpg')
    expect(html).toContain('charles-laughlin-320.webp')
    expect(html).toContain('mike-giamprini-320.jpg')
    expect(html).toContain('cindy-mcgovern-320.webp')
    expect(html).toContain('Photo pending for Amy Andrew Delardi')
    expect(html).not.toContain('amy-andrew')
    expect(html.toLowerCase()).not.toContain('harvard')
    expect(html).not.toContain(EM_DASH)
    for (const href of HREFS) {
      expect(html).toContain(href)
    }
    const component = readFileSync(resolve(root, 'components/live/LiveTestimonials.tsx'), 'utf8')
    expect(component).not.toMatch(/#[0-9a-fA-F]{6}\b/)
    expect(component).not.toContain('harvard')
  })
})
