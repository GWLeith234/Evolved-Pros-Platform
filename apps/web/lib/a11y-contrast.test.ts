/**
 * Sprint 4B — WCAG AA contrast contracts for brand / theme pairs.
 */
import { describe, it, expect } from 'vitest'
import {
  contrastRatio,
  evaluateContrast,
  parseHex,
  WCAG_AA_PAIRS,
} from '@evolved-pros/ui'

describe('contrast utilities', () => {
  it('parses 3- and 6-digit hex', () => {
    expect(parseHex('#fff')).toEqual({ r: 255, g: 255, b: 255 })
    expect(parseHex('#C9302A')).toEqual({ r: 201, g: 48, b: 42 })
    expect(parseHex('not-a-color')).toBeNull()
  })

  it('computes white-on-black near 21:1', () => {
    const r = contrastRatio('#FFFFFF', '#000000')
    expect(r).toBeGreaterThan(20)
  })

  it('flags insufficient contrast', () => {
    const { passesAA, level } = evaluateContrast('#777777', '#888888')
    expect(passesAA).toBe(false)
    expect(level).toBe('fail')
  })
})

describe('brand WCAG AA pairs', () => {
  it.each(WCAG_AA_PAIRS)('$name passes AA', pair => {
    const { ratio, passesAA } = evaluateContrast(pair.fg, pair.bg, {
      largeText: pair.largeText,
    })
    expect(ratio).not.toBeNull()
    expect(passesAA).toBe(true)
  })
})
