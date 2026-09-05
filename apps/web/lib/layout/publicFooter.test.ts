import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  FOOTER_LEGAL_ENTITY,
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
  it('renders the eight approved links, in order, with the exact labels', () => {
    expect(PUBLIC_FOOTER_LINKS.map(l => [l.label, l.href])).toEqual([
      ['Join free', '/pricing'],
      ['Pricing', '/pricing'],
      ['Podcast', '/podcast'],
      ['Media', '/media'],
      ['LIVE', '/live'],
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
