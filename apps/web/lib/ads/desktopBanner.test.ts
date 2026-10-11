import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { IAB_SLOT_PX } from '@/lib/ads/iab'

/**
 * Chaela QA, Oct 1 2026: on desktop the 728x90 leaderboards sat at their
 * 728px mobile size inside a 1232px column. Horizontal banners now fill the
 * column at >= 1024px; square and vertical units never change.
 */
const here = dirname(fileURLToPath(import.meta.url))
const css = readFileSync(resolve(here, '../../app/globals.css'), 'utf8')
const iab = readFileSync(resolve(here, '../../components/ads/IabImageAd.tsx'), 'utf8')

const isBanner = ({ w, h }: { w: number; h: number }) => w / h >= 4

describe('desktop full-width banners', () => {
  it('treats 728x90 as a banner and 300x250 / 300x600 as not', () => {
    expect(isBanner(IAB_SLOT_PX['728x90'])).toBe(true)
    expect(isBanner(IAB_SLOT_PX['300x250'])).toBe(false)
    expect(isBanner(IAB_SLOT_PX['300x600'])).toBe(false)
  })

  it('marks banners in the shared ad container with the same ratio rule', () => {
    expect(iab).toMatch(/const isBanner = w \/ h >= 4/)
    expect(iab).toMatch(/'data-ad-shape': 'banner'/)
  })

  it('only lifts the width cap at desktop widths', () => {
    const block = css.match(/@media \(min-width: 1024px\) \{\s*\.ep-ad-plane\[data-ad-shape='banner'\][\s\S]*?\n\}/)
    expect(block).not.toBeNull()
    expect(block![0]).toMatch(/max-width: 100% !important/)
    // no unconditional banner override outside the media query
    const outside = css.replace(block![0], '')
    expect(outside).not.toMatch(/data-ad-shape='banner'/)
  })
})
