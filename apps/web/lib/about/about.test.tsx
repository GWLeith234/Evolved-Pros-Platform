import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { AboutPage } from '@/components/about/AboutPage'
import { JOIN_FREE_HREF } from '@/lib/home/conversion'
import {
  ABOUT_CLOSE_BODY,
  ABOUT_CLOSE_TITLE,
  ABOUT_DESCRIPTION,
  ABOUT_H1,
  ABOUT_JOIN_HREF,
  ABOUT_PATH,
  ABOUT_SURFACES,
  ABOUT_TITLE,
  ABOUT_WHAT_TITLE,
  ABOUT_WHO_TITLE,
  aboutCopyStrings,
} from './copy'

const root = resolve(__dirname, '../..')
const read = (rel: string) => readFileSync(resolve(root, rel), 'utf8')

const BANNED = [
  /evolvex\s*360/i,
  /evolvex360/i,
  /adcellerant/i,
  /vendasta/i,
  /keynote/i,
  /book george/i,
  /revops/i,
  /pavilion/i,
  /\$\d/,
  /\u2014/,
  /\u2013/,
]

describe('about copy', () => {
  it('sends Join free to the home primary door', () => {
    expect(ABOUT_JOIN_HREF).toBe(JOIN_FREE_HREF)
    expect(ABOUT_JOIN_HREF).toBe('/login?mode=signup')
    expect(ABOUT_JOIN_HREF).not.toBe('/pricing')
    expect(ABOUT_JOIN_HREF).not.toBe('/join')
  })

  it('marks Fit & Health as beta and keeps six surfaces', () => {
    expect(ABOUT_SURFACES.map(s => s.title)).toEqual([
      'Book',
      'Podcast',
      'Platform',
      'Academy',
      'Fit & Health',
      'LIVE',
    ])
    expect(ABOUT_SURFACES.find(s => s.title === 'Fit & Health')?.beta).toBe(true)
    expect(ABOUT_SURFACES.filter(s => s.beta)).toHaveLength(1)
  })

  it('has no em dashes, prices, rival entities, or keynote sell', () => {
    for (const value of aboutCopyStrings()) {
      for (const banned of BANNED) {
        expect(value, value).not.toMatch(banned)
      }
    }
  })
})

describe('about page', () => {
  const pageSrc = read('app/(public)/about/page.tsx')
  const viewSrc = read('components/about/AboutPage.tsx')

  it('uses publicPageMetadata and a marketing view, not LegalPage', () => {
    expect(pageSrc).toContain(`publicPageMetadata(${'ABOUT_PATH'}`)
    expect(pageSrc).toContain('AboutPage')
    expect(pageSrc).not.toContain('LegalPage')
    expect(viewSrc).not.toContain('LegalPage')
    expect(ABOUT_PATH).toBe('/about')
    expect(ABOUT_TITLE).toContain('About')
    expect(ABOUT_DESCRIPTION.length).toBeGreaterThan(40)
  })

  it('renders the mock section order with COPY-FRAME lines', () => {
    const html = renderToStaticMarkup(<AboutPage />)
    const order = ['hero', 'what', 'architecture', 'george', 'who', 'start', 'close']
    let at = -1
    for (const section of order) {
      const next = html.indexOf(`data-about-section="${section}"`)
      expect(next, section).toBeGreaterThan(at)
      at = next
    }

    expect(html).toContain(ABOUT_H1)
    expect(html).toContain(ABOUT_WHAT_TITLE)
    expect(html).toContain(ABOUT_WHO_TITLE)
    expect(html).toContain(ABOUT_CLOSE_TITLE)
    expect(html).toContain(ABOUT_CLOSE_BODY)
    expect(html).toContain('Beta')
    expect(html).toContain('[ photo: George Leith, portrait ]')

    for (const banned of BANNED) {
      expect(html).not.toMatch(banned)
    }
  })

  it('points every Join free control at the home primary href', () => {
    const html = renderToStaticMarkup(<AboutPage />)
    const joins = html.match(/href="\/login\?mode=signup"/g) ?? []
    expect(joins.length).toBeGreaterThanOrEqual(4)
    expect(html).toContain('href="/pricing"')
    expect(html).toContain('href="/home"')
    expect(html).not.toContain('href="/join"')
  })

  it('does not add About to the primary nav', () => {
    const html = renderToStaticMarkup(<AboutPage />)
    const headerEnd = html.indexOf('</header>')
    const header = html.slice(0, headerEnd)
    const navStart = header.indexOf('aria-label="Primary"')
    const navEnd = header.indexOf('</nav>', navStart)
    const nav = header.slice(navStart, navEnd)
    expect(nav).toContain('Podcast')
    expect(nav).toContain('Media')
    expect(nav).toContain('Academy')
    expect(nav).toContain('LIVE')
    expect(nav).not.toContain('Sign in')
    expect(nav).not.toContain('About')
    expect(header).toContain('Sign in')
    expect(header).toContain('Join free')
    expect(viewSrc).not.toContain('GLOBAL_NAV')
  })
})
