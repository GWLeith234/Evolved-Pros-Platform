import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

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

  it('uses the platform wordmark plus a Media section label', () => {
    expect(src).toMatch(/logos\.horizontalDark/)
    expect(src).toMatch(/logos\.horizontalNavy/)
    expect(src).toMatch(/data-masthead-section[\s\S]*Media/)
    expect(src).toMatch(/aria-label="Evolved Pros Media"/)
    expect(src).not.toMatch(/data-masthead-evolved/)
    expect(src).not.toMatch(/Pros Media/)
    expect(src).not.toMatch(/Abril Fatface|Playfair Display|font-abril/)
    expect(src).not.toMatch(/MEDIA_DESK_TAGLINE/)
    expect(src).not.toMatch(/Promoting evolution/)
    expect(src).not.toMatch(/The Evolved Pros desk for sales/)
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
    expect(src.indexOf('ep-media-masthead-wordmark')).toBeLessThan(src.indexOf('MediaMastheadRail'))
  })

  it('uses platform chrome tokens with light and dark parity', () => {
    expect(src).not.toMatch(/colorScheme: 'light'/)
    expect(layout).toMatch(/bg-page/)
    expect(layout).toMatch(/media-desk-shell/)
    expect(layout).not.toMatch(/colorScheme: 'light'/)
    expect(layout).not.toMatch(/bg-\[#F5F0E8\]/)
    expect(css).toMatch(/\.ep-media-masthead \{[\s\S]*background: var\(--bg-nav\)/)
    expect(css).toMatch(/\.ep-media-masthead-logo--on-dark/)
    expect(css).toMatch(/\.ep-media-masthead-logo--on-light/)
    expect(css).toMatch(/html\.light-mode \.ep-media-masthead-logo--on-light/)
    expect(css).toMatch(/\.media-desk-shell \{[\s\S]*background: var\(--paper\)/)
  })
})
