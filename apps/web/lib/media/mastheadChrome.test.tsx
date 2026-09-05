import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MediaMastheadLockup } from '@/components/media/Masthead'

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

  it('uses a centered EVOLVED PROS megaphone MEDIA lockup', () => {
    expect(src).toMatch(/data-masthead-evolved[\s\S]*Evolved Pros/)
    expect(src).toMatch(/data-masthead-mark/)
    expect(src).toMatch(/data-masthead-section[\s\S]*Media/)
    expect(src).toMatch(/aria-label="Evolved Pros Media"/)
    expect(src).toMatch(/<svg /)
    expect(src).not.toMatch(/logos\.horizontalDark|logos\.horizontalNavy/)
    expect(src).not.toMatch(/next\/image/)
    expect(src).not.toMatch(/>Pros Media</)
    expect(src).not.toMatch(/Abril Fatface|Playfair Display|font-abril/)
    expect(src).not.toMatch(/MEDIA_DESK_TAGLINE/)
    expect(src).not.toMatch(/Promoting evolution/)
    expect(src).not.toMatch(/The Evolved Pros desk for sales/)
    expect(src).not.toMatch(/#60A5FA|brand-blue|--brand-blue/)
  })

  it('renders the lockup as Evolved Pros, megaphone mark, then Media', () => {
    const html = renderToStaticMarkup(<MediaMastheadLockup />)
    const evolved = html.indexOf('Evolved Pros')
    const mark = html.indexOf('data-masthead-mark')
    const media = html.indexOf('>Media<')
    expect(evolved).toBeGreaterThan(-1)
    expect(mark).toBeGreaterThan(evolved)
    expect(media).toBeGreaterThan(mark)
    expect(html).toContain('aria-label="Evolved Pros Media"')
    expect(html).toContain('<svg')
    expect(html).not.toContain('#60A5FA')
    expect(html).not.toContain('logo_horizontal')
  })

  it('drops the newspaper costume: no split-color nameplate, manifesto, or gold rules', () => {
    expect(src).not.toMatch(/fontWeight: 900/)
    expect(src).not.toMatch(/clamp\(40px, 9vw, 108px\)/)
    expect(src).not.toMatch(/#C9A84C/)
    expect(src).not.toMatch(/#F5F0E8/)
    expect(src).not.toMatch(/fontStyle: 'italic'/)
    expect(src).not.toMatch(/Community/)
    expect(rail).toMatch(/MEDIA_INDEX_SECTIONS/)
    expect(rail).not.toMatch(/\/community/)
    expect(rail).not.toMatch(/\/events/)
    expect(rail).not.toMatch(/\/podcast/)
    expect(rail).not.toMatch(/\/live/)
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
    expect(layout).toMatch(/bg-page/)
    expect(layout).toMatch(/media-desk-shell/)
    expect(layout).not.toMatch(/colorScheme: 'light'/)
    expect(layout).not.toMatch(/bg-\[#F5F0E8\]/)
    expect(css).toMatch(/\.ep-media-masthead \{[\s\S]*background: var\(--bg-nav\)/)
    expect(css).toMatch(/\.ep-media-masthead-wordmark \{[\s\S]*justify-content: center/)
    expect(css).toMatch(/\.ep-media-masthead-brand,[\s\S]*color: var\(--text-primary\)/)
    expect(css).toMatch(/\.ep-media-masthead-mark \{[\s\S]*background: var\(--brand-red\)/)
    expect(css).toMatch(/\.ep-media-masthead-mark \{[\s\S]*color: var\(--white\)/)
    expect(css).toMatch(/\.media-desk-shell \{[\s\S]*background: var\(--paper\)/)
    expect(css).not.toMatch(/\.ep-media-masthead[\s\S]{0,1800}box-shadow/)
    expect(css).not.toMatch(/\.ep-media-masthead[\s\S]{0,1800}#60A5FA/)
    expect(css).not.toMatch(/\.ep-media-masthead[\s\S]{0,1800}--brand-blue/)
    expect(css).not.toMatch(/\.ep-media-masthead-logo--on-dark/)
    expect(css).not.toMatch(/\.ep-media-masthead-logo--on-light/)
  })
})
