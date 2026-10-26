import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { PublicFooter } from '@/components/layout/PublicFooter'
import {
  FOOTER_LEGAL_ENTITY,
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
  it('renders the approved links, in order, with the exact labels', () => {
    expect(PUBLIC_FOOTER_LINKS.map(l => [l.label, l.href])).toEqual([
      ['Join free', '/pricing'],
      ['Pricing', '/pricing'],
      ['Podcast', '/podcast'],
      ['Media', '/media'],
      ['Fit', '/fit'],
      ['LIVE', '/live'],
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

  it('marks exactly one red CTA, and it is Join free', () => {
    const ctas = PUBLIC_FOOTER_LINKS.filter(l => l.cta)
    expect(ctas).toHaveLength(1)
    expect(ctas[0]).toMatchObject({ label: 'Join free', href: '/pricing' })
  })

  it('does not sell Join free into the /join 308', () => {
    expect(PUBLIC_FOOTER_LINKS.some(l => l.href === '/join')).toBe(false)
  })

  it('does not retarget the Community card door — that stays off the footer', () => {
    expect(PUBLIC_FOOTER_LINKS.some(l => l.href.includes('/login'))).toBe(false)
  })

  it('uses site-relative hrefs only — never a hardcoded host', () => {
    for (const link of PUBLIC_FOOTER_LINKS) {
      expect(link.href.startsWith('/')).toBe(true)
      expect(link.href).not.toMatch(/^\/\/|https?:/)
    }
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

describe('footer logo lockup', () => {
  it('crops the shipped horizontal PNG instead of inventing a new mark', () => {
    expect(logoTsx).toContain('logos.horizontalDark')
    expect(logoTsx).toContain('logos.horizontalNavy')
    expect(logoTsx).not.toMatch(/<img[\s>/]/)
    expect(footerTsx).toContain('<FooterLogo')
    expect(footerTsx).not.toContain('next/image')
  })

  it('optically centers the disc on the wordmark and flush-lefts the E', () => {
    expect(footerCss).toContain('.ep-public-footer-lockup')
    expect(footerCss).toContain('align-items: center')
    expect(footerCss).toContain('calc(-130px * var(--s))')
    expect(footerCss).toContain('calc(-126px * var(--s))')
  })

  it('stacks the footer column on the 16/24/32 rhythm', () => {
    expect(footerTsx).toContain('className="ep-stack"')
    expect(footerTsx).toContain("padding: '32px 16px calc(32px + env(safe-area-inset-bottom, 0px))'")
  })
})

describe('LISTEN_ON_LINKS', () => {
  it('lists the platforms in order, with Podcast Index immediately before RSS', () => {
    expect(LISTEN_ON_LINKS.map(l => [l.label, l.href, l.mark])).toEqual([
      ['Apple Podcasts', 'https://podcasts.apple.com/us/podcast/evolved-pros-podcast/id1895786556', 'apple'],
      ['Spotify', 'https://open.spotify.com/show/1KZoT8k38tBfq242pKUdg9', 'spotify'],
      ['YouTube', 'https://www.youtube.com/@evolvedpros/podcasts', 'youtube'],
      ['Pocket Casts', 'https://pocketcasts.com/podcast/evolved-pros-podcast/cc1e4a60-310b-013f-9952-0afff26cbb09', 'text'],
      ['Castbox', 'https://castbox.fm/channel/id7226086', 'text'],
      ['Podcast Addict', 'https://podcastaddict.com/podcast/evolved-pros-podcast/7329000', 'text'],
      ['Podchaser', 'https://www.podchaser.com/podcasts/evolved-pros-podcast-6476083', 'text'],
      ['Podcast Index', 'https://podcastindex.org/podcast/7854130', 'text'],
      ['RSS', 'https://anchor.fm/s/111ea3a3c/podcast/rss', 'text'],
    ])
    const labels = LISTEN_ON_LINKS.map(l => l.label)
    expect(labels.indexOf('RSS') - labels.indexOf('Podcast Index')).toBe(1)
  })

  it('does not add Player.fm, Amazon, or iHeart', () => {
    const blob = `${JSON.stringify(LISTEN_ON_LINKS)} ${footerTsx}`.toLowerCase()
    expect(blob).not.toMatch(/player\.fm|amazon|iheart/)
  })

  it('gives every platform an external listen label with no em dash', () => {
    for (const link of LISTEN_ON_LINKS) {
      expect(link.href.startsWith('https://')).toBe(true)
      expect(link.ariaLabel.startsWith('Listen on ')).toBe(true)
      expect(link.ariaLabel).toContain(link.label)
      expect(`${link.label} ${link.ariaLabel}`).not.toMatch(/\u2014|\u2013/)
    }
  })

  it('records the source URL of each official asset and renders those files', () => {
    expect(footerTsx).toContain(
      'https://www.apple.com/105/media/us/ipoditunes/itunes/2017/e3fd5849_f16b_4256_9188_db2103c3a4ef/badges-podcasts/us.zip',
    )
    expect(footerTsx).toContain('https://marketing.services.apple/apple-podcasts-identity-guidelines')
    expect(footerTsx).toContain('https://developer.spotify.com/documentation/design')
    expect(footerTsx).toContain(
      'https://developer.spotify.com/images/guidelines/design/2024-spotify-full-logo.zip',
    )
    expect(footerTsx).toContain('https://brand.youtube/youtube-logo')
    expect(footerTsx).toContain(
      'https://www.gstatic.com/marketing-cms/52/7d/637fef5a4788a97747e6feabc4aa/youtube-logo.zip',
    )
    expect(footerTsx).toContain('/brand/listen/apple-podcasts-listen-badge.svg')
    expect(footerTsx).toContain('/brand/listen/spotify-logo-black.svg')
    expect(footerTsx).toContain('/brand/listen/spotify-logo-white.svg')
    expect(footerTsx).toContain('/brand/listen/youtube-logo-almostblack.png')
    expect(footerTsx).toContain('/brand/listen/youtube-logo-white.png')
    expect(footerCss).toContain('.ep-listen-on a:focus-visible')
  })

  it('opens every listen link in a new tab and wraps the row', () => {
    const html = renderToStaticMarkup(createElement(PublicFooter))
    expect(html).toContain('aria-label="Listen on"')
    expect(html).toContain('Listen on')
    expect(html).toContain('flex-wrap:wrap')
    for (const link of LISTEN_ON_LINKS) {
      expect(html).toContain(`href="${link.href}"`)
      expect(html).toContain(`aria-label="${link.ariaLabel}"`)
    }
    const listenCount = LISTEN_ON_LINKS.length
    const blank = html.split('target="_blank"').length - 1
    const rel = html.split('rel="noopener noreferrer"').length - 1
    expect(blank).toBe(listenCount)
    expect(rel).toBe(listenCount)
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
