import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * SPRINT M - the ad separation standard, locked.
 *
 * These are not style preferences. Each assertion is one of the eight rules,
 * and the two contrast tests compute real WCAG ratios from the checked-in
 * tokens rather than trusting a comment. If someone tunes --ad-plane-bg toward
 * the page again, the direction test fails before anyone sees the page.
 */

const here = dirname(fileURLToPath(import.meta.url))
const read = (rel: string) => readFileSync(resolve(here, rel), 'utf8')

const css = read('../../app/globals.css')
const adPlane = read('../../components/ads/AdPlane.tsx')
const iab = read('../../components/ads/IabImageAd.tsx')
const sponsorCard = read('../../components/ads/SponsorCard.tsx')
const adZone = read('../../components/media/MediaAdZone.tsx')
const partnerSlot = read('../../components/media/MediaPartnerSlot.tsx')

/** The page planes the ad plane has to step away from. */
const PAGE_LIGHT = '#F5F0E8'

/**
 * The approved floor from the ad design standard: a plane must clear 1.3:1
 * against the page it sits on. Sprint M shipped light mode at 1.26:1 while
 * this test only asked for 1.15, so the gate passed and the standard did not.
 * One named constant now, so the gate and the standard cannot drift again.
 */
const SEPARATION_FLOOR = 1.3
const PAGE_DARK = '#0A0F18'
const PAGE_DARK_NAVY = '#112535'

/**
 * Colours an ad may never wear. Platform navy, platform red, the cream page,
 * and the six pillar colours - anything that would let an ad borrow the
 * authority of a real Evolved Pros control.
 */
const RESERVED = [
  '#112535',
  '#ef0e30',
  '#F5F0E8',
  '#FFA538',
  '#A78BFA',
  '#F87171',
  '#60A5FA',
  '#C9A84C',
  '#0ABFA3',
]

function luminance(hex: string): number {
  const channels = [1, 3, 5]
    .map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

function contrast(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)]
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}

/** Reads a custom property out of the LAST block that declares it. */
function token(block: string, name: string): string {
  const match = block.match(new RegExp(`${name}:\\s*(#[0-9A-Fa-f]{6})`))
  expect(match, `${name} not declared`).not.toBeNull()
  return match![1]
}

function blockAfter(selector: string): string {
  const start = css.indexOf(selector)
  expect(start, `${selector} not found in globals.css`).toBeGreaterThan(-1)
  return css.slice(start, css.indexOf('}', start))
}

describe('ad separation standard: the plane steps away from the page', () => {
  const darkBlock = blockAfter('--ad-plane-bg:')
  const lightBlock = css.slice(css.indexOf('html.light-mode {\n  --ad-plane-bg'))

  const darkPlane = token(darkBlock, '--ad-plane-bg')
  const lightPlane = token(lightBlock, '--ad-plane-bg')

  it('is DARKER than the page in light mode', () => {
    expect(luminance(lightPlane)).toBeLessThan(luminance(PAGE_LIGHT))
    // Visible, not merely different: a step this size survives a phone screen
    // at an angle. Below the floor the border is doing all the work.
    expect(contrast(lightPlane, PAGE_LIGHT)).toBeGreaterThanOrEqual(SEPARATION_FLOOR)
  })

  it('is LIGHTER than the page in dark mode, on both dark page values', () => {
    expect(luminance(darkPlane)).toBeGreaterThan(luminance(PAGE_DARK))
    expect(luminance(darkPlane)).toBeGreaterThan(luminance(PAGE_DARK_NAVY))
    expect(contrast(darkPlane, PAGE_DARK)).toBeGreaterThanOrEqual(SEPARATION_FLOOR)
    expect(contrast(darkPlane, PAGE_DARK_NAVY)).toBeGreaterThanOrEqual(SEPARATION_FLOOR)
  })

  it('keeps the dark plane inside fixed-dark shells, so it never steps the wrong way', () => {
    const forceDark = css.slice(
      css.indexOf('html.light-mode .live-force-dark,\nhtml.light-mode .ep-force-dark {\n  --ad-plane-bg'),
    )
    expect(token(forceDark, '--ad-plane-bg')).toBe(darkPlane)
  })

  it('carries a hairline on all four sides in a mid neutral', () => {
    const plane = blockAfter('.ep-ad-plane {')
    expect(plane).toMatch(/border:\s*1px solid var\(--ad-plane-line\)/)
    // A one-sided rule would read as a divider, not a boundary.
    expect(plane).not.toMatch(/border-(top|right|bottom|left):/)
    for (const line of [token(darkBlock, '--ad-plane-line'), token(lightBlock, '--ad-plane-line')]) {
      // Mid neutral: legible against its own plane, never a hard black/white.
      expect(contrast(line, line === token(lightBlock, '--ad-plane-line') ? lightPlane : darkPlane))
        .toBeGreaterThan(1.6)
    }
  })

  it('never puts a reserved colour in ad chrome', () => {
    for (const file of [adPlane, iab, sponsorCard, adZone, partnerSlot]) {
      // Strip comments first: the rules are written down in these files, and
      // naming a banned colour in prose is the point.
      const code = file.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
      for (const colour of RESERVED) {
        expect(code.toLowerCase()).not.toContain(colour.toLowerCase())
      }
    }
    const planeCss = blockAfter('.ep-ad-plane {') + darkBlock + lightBlock.slice(0, 200)
    for (const colour of RESERVED) {
      expect(planeCss.toLowerCase()).not.toContain(colour.toLowerCase())
    }
  })
})

describe('ad separation standard: the label is real', () => {
  const darkBlock = blockAfter('--ad-plane-bg:')
  const lightBlock = css.slice(css.indexOf('html.light-mode {\n  --ad-plane-bg'))
  const label = blockAfter('.ep-ad-plane-label {')

  it('is at least 11px, uppercase and letter-spaced', () => {
    const size = Number(label.match(/font-size:\s*(\d+)px/)?.[1])
    expect(size).toBeGreaterThanOrEqual(11)
    expect(label).toMatch(/text-transform:\s*uppercase/)
    const tracking = Number(label.match(/letter-spacing:\s*([\d.]+)em/)?.[1])
    expect(tracking).toBeGreaterThanOrEqual(0.1)
  })

  it('clears 4.5:1 on its own container, in both themes', () => {
    expect(contrast(token(darkBlock, '--ad-plane-label'), token(darkBlock, '--ad-plane-bg')))
      .toBeGreaterThanOrEqual(4.5)
    expect(contrast(token(lightBlock, '--ad-plane-label'), token(lightBlock, '--ad-plane-bg')))
      .toBeGreaterThanOrEqual(4.5)
  })

  it('is never faded: the old one was ~9px at 35% opacity', () => {
    expect(label).toMatch(/opacity:\s*1/)
    expect(label).not.toMatch(/rgba\([^)]*0\.[0-4]\d*\)/)
    expect(iab).not.toMatch(/rgba\(10,15,24,0\.35\)/)
    expect(adZone).not.toMatch(/fontSize: '10px'/)
  })

  it('reads ADVERTISEMENT or SPONSORED, above the unit and outside the creative', () => {
    expect(adPlane).toMatch(/'Advertisement' \| 'Sponsored'/)
    expect(adPlane.indexOf('ep-ad-plane-label')).toBeLessThan(
      adPlane.indexOf('ep-ad-plane-creative'),
    )
  })

  it('labels house Academy units too, instead of hiding the label for them', () => {
    expect(iab).toContain("isAcademyAd(ad) ? 'Sponsored' : 'Advertisement'")
    expect(adZone).toContain("house ? 'Sponsored' : 'Advertisement'")
    // The old MediaAdZone skipped the label entirely for house units.
    expect(adZone).not.toContain('{!house && (')
  })
})

describe('ad separation standard: every unit goes through the plane', () => {
  it('routes the IAB slot, the media zone and the partner card through AdPlane', () => {
    for (const file of [iab, sponsorCard, adZone]) {
      expect(file).toContain("from '@/components/ads/AdPlane'")
      expect(file).toContain('<AdPlane')
    }
  })

  it('renders nothing for an unfilled slot', () => {
    expect(partnerSlot).toContain('if (!ad?.image_url) return null')
    // Comments stripped: the file describes the box it used to draw.
    const code = partnerSlot.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
    expect(code).not.toContain('Evolved Pros Media partner inventory')
    expect(code).not.toContain('PARTNER STORY')
    expect(code).not.toContain('data-media-partner-empty')
    // The geometry wrappers must collapse too, or the hole stays.
    expect(css).toMatch(/\.ep-media-leaderboard:empty/)
    expect(css).toMatch(/\.ep-media-mid-rect:empty/)
  })

  it('still refuses to load an open ad network', () => {
    for (const file of [adPlane, iab, sponsorCard, adZone, partnerSlot]) {
      expect(file).not.toMatch(/googletag|doubleclick|gpt\.js|DFP/)
    }
  })
})
