import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'
import { rhythm, spacing } from '@evolved-pros/ui'

const globals = readFileSync(resolve(__dirname, '../app/globals.css'), 'utf8')

describe('vertical rhythm system', () => {
  it('maps semantic tokens onto the 16/24/32/40 scale', () => {
    expect(rhythm.section).toBe(spacing[4])
    expect(rhythm.stack).toBe(spacing[6])
    expect(rhythm.stackLg).toBe(spacing[8])
    expect(rhythm.ad).toBe(spacing[6])
    expect(rhythm.adLean).toBe(spacing[4])
    expect(rhythm.pageTop).toBe(spacing[4])
  })

  it('exposes shared utilities in globals.css', () => {
    for (const cls of [
      '.ep-stack',
      '.ep-stack--tight',
      '.ep-ad-slot',
      '.ep-ad-slot--lean',
      '.ep-section-head',
      '.ep-rule',
      '.ep-page-pad',
      '.ep-card-pad',
    ]) {
      expect(globals).toContain(cls)
    }
  })

  it('clears member chrome above and below the scroller', () => {
    expect(globals).toMatch(/\.ep-main-scroll[\s\S]*padding-top:\s*var\(--space-page-top\)/)
    expect(globals).toMatch(/\.ep-main-scroll[\s\S]*padding-bottom:\s*calc\(5rem/)
  })
})
