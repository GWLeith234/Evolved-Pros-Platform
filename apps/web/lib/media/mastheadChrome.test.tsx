import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MediaMastheadLockup } from '@/components/media/Masthead'
import { MEDIA_LOCKUP_DARK, MEDIA_LOCKUP_LABEL, MEDIA_LOCKUP_LIGHT } from '@/lib/lockups'

const MEDIA_MEGAPHONE_DISC = '/brand/masthead/megaphone-disc.png'

const here = dirname(fileURLToPath(import.meta.url))
const src = readFileSync(resolve(here, '../../components/media/Masthead.tsx'), 'utf8')
const rail = readFileSync(resolve(here, '../../components/media/MediaMastheadRail.tsx'), 'utf8')
const layout = readFileSync(resolve(here, '../../app/(public)/media/layout.tsx'), 'utf8')
const css = readFileSync(resolve(here, '../../app/globals.css'), 'utf8')

describe('Media masthead chrome', () => {
  it('does not ship dead hashes, a fake issue number, or a broken Search', () => {
    expect(src).not.toMatch(/#revenue|#ai|#leadership|#pillars|#desk/)
    expect(src).not.toMatch(/Issue \{/)
    expect(src).not.toMatch(/№/)
    expect(src).not.toMatch(/aria-label="Search"/)
    expect(src).not.toMatch(/George.?s Desk/)
  })

  it('names the surface Evolved Pros Media and uses the theme-swapped lockup PNG pair', () => {
    expect(MEDIA_LOCKUP_LABEL).toBe('Evolved Pros Media')
    expect(src).toContain('MEDIA_LOCKUP_LABEL')
    expect(src).toContain('MEDIA_LOCKUP_DARK')
    expect(src).toContain('MEDIA_LOCKUP_LIGHT')
    expect(src).toContain('ep-media-masthead-logo--on-dark')
    expect(src).toContain('ep-media-masthead-logo--on-light')
    expect(src).not.toContain('EpWordmarkMark')
    expect(src).not.toContain('MEDIA_MEGAPHONE_DISC')
    expect(src).not.toContain('ep-media-masthead-media')
    expect(src).not.toMatch(/Abril Fatface|Playfair Display|font-abril/)
    expect(src).not.toMatch(/MEDIA_DESK_TAGLINE/)
    expect(src).not.toMatch(/Promoting evolution/)
    expect(src).not.toMatch(/#60A5FA|brand-blue|--brand-blue/)
    expect(src).not.toMatch(/Arial Black/)
  })

  it('renders both theme lockup PNGs with the Media label and no composed text', () => {
    const html = renderToStaticMarkup(<MediaMastheadLockup />)
    expect(html).toContain(`aria-label="${MEDIA_LOCKUP_LABEL}"`)
    expect(html).toContain(MEDIA_LOCKUP_DARK)
    expect(html).toContain(MEDIA_LOCKUP_LIGHT)
    expect(html.indexOf(MEDIA_LOCKUP_DARK)).toBeLessThan(html.indexOf(MEDIA_LOCKUP_LIGHT))
    expect(html).not.toContain('EVOLVED')
    expect(html).not.toContain('>MEDIA<')
    expect(html).not.toContain(MEDIA_MEGAPHONE_DISC)
    expect(html).not.toContain('<svg')
    expect(html).not.toContain('#60A5FA')
    expect(html).not.toContain('Evolved Media')
    expect(html).not.toContain('logo_horizontal')
    expect(html).toContain('Evolved Pros Media')
    expect(html).not.toMatch(/>Pros Media</)
    expect(html).not.toMatch(/>Evolved Media</)
  })

  it('drops the newspaper costume: no split-color nameplate, manifesto, or gold rules', () => {
    expect(src).not.toMatch(/fontWeight: 900/)
    expect(src).not.toMatch(/clamp\(40px, 9vw, 108px\)/)
    expect(src).not.toMatch(/#C9A84C/)
    expect(src).not.toMatch(/#F5F0E8/)
    expect(src).not.toMatch(/fontStyle: 'italic'/)
    expect(src).not.toMatch(/Community/)
    // SPRINT M — the rail takes sections as data (all six pillars that have
    // published stories), not a hardcoded four-entry constant.
    expect(rail).not.toMatch(/MEDIA_INDEX_SECTIONS/)
    expect(rail).toMatch(/sections\.map/)
    expect(layout).toMatch(/getMediaIndexSections/)
    expect(src).toMatch(/sections=\{sections\}/)
    expect(rail).not.toMatch(/\/community/)
    expect(rail).not.toMatch(/\/events/)
    expect(rail).not.toMatch(/\/podcast/)
    expect(rail).not.toMatch(/\/live/)
    expect(rail).not.toMatch(/Education/)
  })

  it('keeps Back to platform as a quiet utility and rails below the wordmark', () => {
    expect(src).toMatch(/Back to platform/)
    expect(src).toMatch(/href="\/home"/)
    expect(src).toMatch(/MediaMastheadRail/)
    expect(src.indexOf('<MediaMastheadLockup')).toBeLessThan(
      src.lastIndexOf('<MediaMastheadRail'),
    )
  })

  it('uses platform chrome tokens with light and dark parity', () => {
    expect(src).not.toMatch(/colorScheme: 'light'/)
    expect(layout).toMatch(/media-desk-root/)
    expect(layout).toMatch(/media-desk-shell/)
    expect(layout).not.toMatch(/colorScheme: 'light'/)
    expect(layout).not.toMatch(/bg-\[#F5F0E8\]/)
    expect(css).toMatch(/\.ep-fit-masthead \{[\s\S]*background: var\(--bg-nav\)/)
    expect(css).toMatch(/\.ep-media-masthead \{[\s\S]*background: var\(--bg-page\)/)
    expect(css).toMatch(/html\.light-mode \.ep-media-masthead \{[\s\S]*background: var\(--paper\)/)
    expect(css).toMatch(/\.ep-media-masthead-wordmark,[\s\S]*justify-content: center/)
    expect(css).toMatch(/\.media-desk-shell \{[\s\S]*background: var\(--bg-page\)/)
    expect(css).toMatch(/html\.light-mode \.media-desk-shell \{[\s\S]*background: var\(--paper\)/)
    expect(css).not.toMatch(/\.ep-media-masthead[\s\S]{0,1800}box-shadow/)
    expect(css).not.toMatch(/\.ep-media-masthead[\s\S]{0,1800}#60A5FA/)
    expect(css).not.toMatch(/\.ep-media-masthead[\s\S]{0,1800}--brand-blue/)
    expect(css).not.toMatch(/\.ep-media-masthead-mark \{[\s\S]*background: var\(--brand-red\)/)
    expect(css).toMatch(/\.ep-media-masthead-logo,[\s\S]*background: transparent/)
    expect(css).not.toMatch(/\.ep-media-masthead-lockup/)
    expect(css).not.toMatch(/\.ep-media-masthead-pros/)
    expect(css).not.toMatch(/\.ep-media-masthead-disc/)
    expect(css).not.toMatch(/\.ep-media-masthead-media \{/)
  })

  it('does not host-branch /media chrome and keeps utility links on theme tokens', () => {
    expect(src).not.toMatch(/evolvedpros\.com|hostname|window\.location/)
    expect(layout).not.toMatch(/evolvedpros\.com|hostname|window\.location/)
    expect(src).toMatch(/ep-media-masthead-back/)
    expect(src).toMatch(/ep-media-masthead-join/)
    expect(css).toMatch(/\.ep-media-masthead-back,[\s\S]*color: var\(--text-tertiary\)/)
    expect(css).toMatch(/\.ep-media-masthead-back:hover,[\s\S]*color: var\(--text-primary\)/)
  })

  it('shows one media lockup per theme and nothing under the wordmark', () => {
    expect(MEDIA_LOCKUP_DARK).toBe('/brand/masthead/media-lockup-dark.v2.png')
    expect(MEDIA_LOCKUP_LIGHT).toBe('/brand/masthead/media-lockup-light.v2.png')
    expect(css).toMatch(
      /\.ep-media-masthead-logo--on-dark,\n\.ep-fit-masthead-logo--on-dark \{ display: block; \}/,
    )
    expect(css).toMatch(
      /\.ep-media-masthead-logo--on-light,\n\.ep-fit-masthead-logo--on-light \{ display: none; \}/,
    )
    expect(css).toMatch(
      /html\.light-mode \.ep-media-masthead-logo--on-dark,\nhtml\.light-mode \.ep-fit-masthead-logo--on-dark \{ display: none; \}/,
    )
    expect(css).toMatch(
      /html\.light-mode \.ep-media-masthead-logo--on-light,\nhtml\.light-mode \.ep-fit-masthead-logo--on-light \{ display: block; \}/,
    )

    const mediaBodies: string[] = []
    const re = /@media[^{]*\{/g
    let match: RegExpExecArray | null
    while ((match = re.exec(css))) {
      let i = match.index + match[0].length
      let depth = 1
      const start = i
      while (i < css.length && depth > 0) {
        if (css[i] === '{') depth += 1
        else if (css[i] === '}') depth -= 1
        i += 1
      }
      mediaBodies.push(css.slice(start, i - 1))
    }
    for (const body of mediaBodies) {
      expect(body).not.toMatch(/ep-media-masthead-logo--on-dark/)
      expect(body).not.toMatch(/ep-media-masthead-logo--on-light/)
    }

    const html = renderToStaticMarkup(<MediaMastheadLockup />)
    expect(html.match(/<img /g)).toHaveLength(2)
    expect(html.match(/alt=""/g)).toHaveLength(2)
    expect(html).not.toContain('<figcaption')
    expect(html).not.toContain('Bebas Neue')
    expect(html).not.toContain('megaphone')
    expect(src).not.toContain('<figcaption')
    expect(src).not.toContain('ep-media-masthead-media')
  })

  it('keeps Fit lockup swap shared and does not crop media story stills', () => {
    expect(css).toMatch(/\.ed-story-art \{[\s\S]*object-fit: cover/)
    expect(css).not.toMatch(/ed-story-art--crop-baked-pros/)
    expect(css).toMatch(
      /\.ep-media-masthead-logo--on-dark,\n\.ep-fit-masthead-logo--on-dark \{ display: block; \}/,
    )
    expect(css).toMatch(
      /\.ep-media-masthead-logo--on-light,\n\.ep-fit-masthead-logo--on-light \{ display: none; \}/,
    )
  })
})
