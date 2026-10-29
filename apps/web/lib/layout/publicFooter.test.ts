import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { PublicFooter } from '@/components/layout/PublicFooter'
import {
  FOOTER_JOIN_FREE,
  FOOTER_LEGAL_ENTITY,
  FOOTER_LINK_GROUPS,
  FOOTER_TAGLINE,
  LISTEN_ON_LINKS,
  PUBLIC_FOOTER_LINKS,
  SPEAKING_EMAIL,
  SUPPORT_EMAIL,
  footerCopyright,
} from './publicFooter'

const footerCss = readFileSync(resolve(__dirname, '../../app/globals.css'), 'utf8')
const footerTsx = readFileSync(
  resolve(__dirname, '../../components/layout/PublicFooter.tsx'),
  'utf8',
)
const logoTsx = readFileSync(
  resolve(__dirname, '../../components/layout/FooterLogo.tsx'),
  'utf8',
)

describe('PUBLIC_FOOTER_LINKS', () => {
  it('renders JOIN FREE, then the three approved groups, with the exact labels', () => {
    expect(FOOTER_TAGLINE).toBe(
      'Straight talk on revenue, leadership and growth from George Leith.',
    )
    expect(FOOTER_JOIN_FREE).toEqual({ label: 'JOIN FREE', href: '/pricing', cta: true })
    expect(FOOTER_LINK_GROUPS.map(group => [group.label, group.links.map(link => [link.label, link.href])])).toEqual([
      ['Platform', [
        ['Pricing', '/pricing'],
        ['Podcast', '/podcast'],
        ['Media', '/media'],
        ['Fit', '/fit'],
        ['Live', '/live'],
      ]],
      ['Company', [
        ['About', '/about'],
        ['Contact', '/contact'],
      ]],
      ['Legal', [
        ['Privacy', '/privacy'],
        ['Terms', '/terms'],
      ]],
    ])
    expect(PUBLIC_FOOTER_LINKS.map(l => [l.label, l.href])).toEqual([
      ['JOIN FREE', '/pricing'],
      ['Pricing', '/pricing'],
      ['Podcast', '/podcast'],
      ['Media', '/media'],
      ['Fit', '/fit'],
      ['Live', '/live'],
      ['About', '/about'],
      ['Contact', '/contact'],
      ['Privacy', '/privacy'],
      ['Terms', '/terms'],
    ])
  })

  it('carries the three legal doors the Sprint 0 crawl found missing', () => {
    const hrefs = PUBLIC_FOOTER_LINKS.map(l => l.href)
    for (const path of ['/contact', '/privacy', '/terms']) {
      expect(hrefs).toContain(path)
    }
  })

  it('marks exactly one red CTA, and it is JOIN FREE', () => {
    const ctas = PUBLIC_FOOTER_LINKS.filter(l => l.cta)
    expect(ctas).toHaveLength(1)
    expect(ctas[0]).toMatchObject({ label: 'JOIN FREE', href: '/pricing' })
  })

  it('does not sell JOIN FREE into the /join 308', () => {
    expect(PUBLIC_FOOTER_LINKS.some(l => l.href === '/join')).toBe(false)
  })

  it('does not retarget the Community card door. That stays off the footer', () => {
    expect(PUBLIC_FOOTER_LINKS.some(l => l.href.includes('/login'))).toBe(false)
  })

  it('uses site-relative hrefs only. Never a hardcoded host', () => {
    for (const link of PUBLIC_FOOTER_LINKS) {
      expect(link.href.startsWith('/')).toBe(true)
      expect(link.href).not.toMatch(/^\/\/|https?:/)
    }
  })

  it('keeps footer copy free of em and en dashes', () => {
    const copy = [
      FOOTER_TAGLINE,
      ...PUBLIC_FOOTER_LINKS.map(link => `${link.label} ${link.href}`),
      ...FOOTER_LINK_GROUPS.map(group => group.label),
      ...LISTEN_ON_LINKS.map(link => `${link.label} ${link.ariaLabel}`),
    ].join('\n')
    expect(copy).not.toMatch(/\u2014|\u2013/)
  })
})

describe('footerCopyright', () => {
  it('names GWLeith Revenue Growth Solutions with the given year', () => {
    expect(footerCopyright(2026)).toBe('© 2026 GWLeith Revenue Growth Solutions')
  })

  it('defaults to the current year', () => {
    expect(footerCopyright()).toBe(`© ${new Date().getFullYear()} ${FOOTER_LEGAL_ENTITY}`)
  })

  it('does not name a brand or a sibling company as the entity', () => {
    const line = footerCopyright(2026).toLowerCase()
    for (const wrong of ['evolved pros', 'evolved publishing', 'evolvex360', 'adcellerant']) {
      expect(line).not.toContain(wrong)
    }
  })
})

describe('contact inboxes', () => {
  it('routes support and keynotes to the evolvedpros.com inboxes', () => {
    expect(SUPPORT_EMAIL).toBe('support@evolvedpros.com')
    expect(SPEAKING_EMAIL).toBe('speaking@evolvedpros.com')
  })

  it('never surfaces the personal evolvex360 address', () => {
    expect([SUPPORT_EMAIL, SPEAKING_EMAIL].join(' ')).not.toContain('evolvex360')
  })
})

describe('footer logo', () => {
  it('uses the approved trimmed lockup as-is and does not crop or redraw it', () => {
    expect(logoTsx).toContain("'/brand/footer/logo_horizontal_dark.png'")
    expect(logoTsx).not.toContain('logos.horizontalDark')
    expect(logoTsx).not.toContain('logos.horizontalNavy')
    expect(logoTsx).not.toContain('ep-public-footer-lockup')
    expect(footerTsx).toContain('<FooterLogo')
    expect(footerTsx).not.toContain('next/image')
    expect(footerCss).not.toContain('.ep-public-footer-lockup')

    const png = readFileSync(
      resolve(__dirname, '../../public/brand/footer/logo_horizontal_dark.png'),
    )
    expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
    expect(png.readUInt32BE(16)).toBe(1085)
    expect(png.readUInt32BE(20)).toBe(242)

    const siteLogo = readFileSync(
      resolve(__dirname, '../../public/logo_horizontal_dark.png'),
    )
    expect(siteLogo.readUInt32BE(16)).toBe(800)
    expect(siteLogo.readUInt32BE(20)).toBe(160)
  })
})

describe('LISTEN_ON_LINKS', () => {
  it('lists the platforms in order, with Podcast Index immediately before RSS', () => {
    expect(LISTEN_ON_LINKS.map(l => [l.label, l.href, l.icon, l.external])).toEqual([
      ['Apple Podcasts', 'https://podcasts.apple.com/us/podcast/evolved-pros-podcast/id1895786556', 'applepodcasts', true],
      ['Spotify', 'https://open.spotify.com/show/1KZoT8k38tBfq242pKUdg9', 'spotify', true],
      ['YouTube', 'https://www.youtube.com/@evolvedpros/podcasts', 'youtube', true],
      ['Pocket Casts', 'https://pocketcasts.com/podcast/evolved-pros-podcast/cc1e4a60-310b-013f-9952-0afff26cbb09', 'pocketcasts', true],
      ['Castbox', 'https://castbox.fm/channel/id7226086', 'castbox', true],
      ['Podcast Addict', 'https://podcastaddict.com/podcast/evolved-pros-podcast/7329000', 'podcastaddict', true],
      ['Podchaser', 'https://www.podchaser.com/podcasts/evolved-pros-podcast-6476083', 'podchaser', true],
      ['Podcast Index', 'https://podcastindex.org/podcast/7854130', 'podcastindex', true],
      ['RSS', '/podcast/rss.xml', 'rss', false],
    ])
    const labels = LISTEN_ON_LINKS.map(l => l.label)
    expect(labels.indexOf('RSS') - labels.indexOf('Podcast Index')).toBe(1)
  })

  it('does not add Player.fm, Amazon, or iHeart', () => {
    const blob = `${JSON.stringify(LISTEN_ON_LINKS)} ${footerTsx}`.toLowerCase()
    expect(blob).not.toMatch(/player\.fm|amazon|iheart/)
  })

  it('gives every platform a listen label with no em dash', () => {
    for (const link of LISTEN_ON_LINKS) {
      expect(link.ariaLabel.startsWith('Listen on ')).toBe(true)
      expect(link.ariaLabel).toContain(link.label)
      expect(`${link.label} ${link.ariaLabel}`).not.toMatch(/\u2014|\u2013/)
    }
  })

  it('serves white Simple Icons, and a white Podchaser mark, in 52px circles', () => {
    expect(footerCss).toContain('width: 52px;')
    expect(footerCss).toContain('height: 52px;')
    expect(footerCss).toContain('width: 24px;')
    expect(footerCss).toContain('height: 24px;')
    expect(footerCss).toContain('repeat(3, minmax(0, 1fr))')
    expect(footerCss).toContain('repeat(9, minmax(0, 1fr))')
    expect(footerCss).toContain('.ep-listen-on a:focus-visible')
    expect(footerCss).toContain('calc(32px + 64px + env(safe-area-inset-bottom, 0px))')
    expect(footerCss).toContain('padding: 64px 120px 36px;')

    for (const link of LISTEN_ON_LINKS) {
      const svg = readFileSync(
        resolve(__dirname, `../../public/brand/listen/marks/${link.icon}.svg`),
        'utf8',
      )
      expect(svg).toMatch(/#FFFFFF|#fff/i)
      expect(svg.toLowerCase()).not.toContain('#ff3382')
      if (link.icon !== 'podchaser') {
        expect(svg).toContain('viewBox="0 0 24 24"')
      } else {
        expect(svg).toContain('viewBox="0 0 100 100"')
      }
    }
  })

  it('opens external listen links in a new tab and keeps RSS on the site feed', () => {
    const html = renderToStaticMarkup(createElement(PublicFooter))
    expect(html).toContain('aria-label="Listen on"')
    expect(html).toContain('Listen on')
    expect(html).toContain(FOOTER_TAGLINE)
    expect(html).toContain('>JOIN FREE<')
    expect(html).toContain('>Platform<')
    expect(html).toContain('>Company<')
    expect(html).toContain('>Legal<')
    expect(html).toContain('class="ep-public-footer-cta"')
    expect(html.split('ep-public-footer-cta').length - 1).toBe(1)
    for (const link of LISTEN_ON_LINKS) {
      expect(html).toContain(`href="${link.href}"`)
      expect(html).toContain(`aria-label="${link.ariaLabel}"`)
      expect(html).toContain(`/brand/listen/marks/${link.icon}.svg`)
      expect(html).toContain(`>${link.label}<`)
    }
    const external = LISTEN_ON_LINKS.filter(link => link.external)
    const blank = html.split('target="_blank"').length - 1
    const rel = html.split('rel="noopener noreferrer"').length - 1
    expect(blank).toBe(external.length)
    expect(rel).toBe(external.length)
    expect(html).toContain('href="/podcast/rss.xml"')
    expect(html).not.toContain('anchor.fm')
    expect(html).not.toMatch(/\u2014|\u2013/)
  })
})

describe('builder credit', () => {
  const credit = '<a href="https://www.evolvex360.com/">EvolveX360</a>'

  it('places one dofollow branded anchor after the copyright line', () => {
    const occurrences = footerTsx.split(credit).length - 1
    expect(occurrences).toBe(1)
    const copyrightAt = footerTsx.indexOf('{footerCopyright()}')
    const creditAt = footerTsx.indexOf(credit)
    expect(copyrightAt).toBeGreaterThan(-1)
    expect(creditAt).toBeGreaterThan(copyrightAt)
    expect(footerTsx.slice(copyrightAt, creditAt)).toContain('Website by')
    const anchor = footerTsx.slice(footerTsx.indexOf('<a href="https://www.evolvex360.com/"'), footerTsx.indexOf('</a>', creditAt) + 4)
    expect(anchor).toBe(credit)
    expect(anchor).not.toContain('rel=')
  })
})
