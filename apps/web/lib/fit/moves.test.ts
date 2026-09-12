import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { hasEmDash } from '@/lib/home/conversion'
import { canAccessFitLibrary, FIT_REQUIRED_TIER, fitUpgradeHref } from './gating'
import { fitCopyStrings } from './copy'
import {
  featuredFitMove,
  FIT_MOVES,
  FIT_SAMPLE_CODE,
  fitLibraryStats,
  fitMoveCopyStrings,
  fitTeaseMeta,
  formatFitAdminDate,
  FO55_CODE_RE,
  isFo55Code,
  publishedFitMoves,
  rotateFitMove,
  teaseFitMoves,
} from './moves'

const EM = /\u2014|\u2013/

describe('Fit FO55 catalog', () => {
  it('uses letter-O FO55 codes on every move', () => {
    expect(FIT_SAMPLE_CODE).toBe('FO55-035')
    expect(FIT_SAMPLE_CODE).toMatch(FO55_CODE_RE)
    expect(FIT_SAMPLE_CODE.startsWith('FO')).toBe(true)
    expect(FIT_SAMPLE_CODE.startsWith('F0')).toBe(false)
    for (const move of FIT_MOVES) {
      expect(isFo55Code(move.code), move.code).toBe(true)
      expect(move.code).not.toMatch(/^F0/)
      expect(move.requiredTier).toBe('vip')
    }
  })

  it('ships the gold sample move and library counts', () => {
    const sample = featuredFitMove()
    expect(sample.code).toBe('FO55-035')
    expect(sample.title).toBe('Wall-supported RDL')
    expect(sample.hipMod).toBe(true)
    expect(sample.hipModNote).toBe('Soft hinge, no deep chase')
    expect(sample.location).toBe('Hotel')
    expect(fitTeaseMeta(sample)).toBe('FO55-035 Hip hinge · 3 reps · ~2 min')
    expect(fitLibraryStats()).toEqual({ published: 12, pilot: 4, draft: 3, total: 19 })
  })

  it('rotates published teasers and keeps featured first', () => {
    const pool = teaseFitMoves()
    expect(pool[0]?.code).toBe('FO55-035')
    expect(pool.every(m => m.status === 'published')).toBe(true)
    expect(publishedFitMoves()).toHaveLength(12)
    expect(rotateFitMove(FIT_MOVES, 0)?.code).toBe('FO55-035')
    expect(rotateFitMove(FIT_MOVES, 1)?.code).not.toBe('FO55-035')
    expect(rotateFitMove(FIT_MOVES, pool.length)?.code).toBe('FO55-035')
  })

  it('formats admin dates without em dashes', () => {
    expect(formatFitAdminDate('2026-09-04')).toBe('4 Sep 2026')
    expect(formatFitAdminDate(null)).toBe('Not published')
    expect(hasEmDash(formatFitAdminDate('2026-09-04'))).toBe(false)
  })
})

describe('Fit VIP gate', () => {
  it('opens the library at VIP and Professional, not Community', () => {
    expect(FIT_REQUIRED_TIER).toBe('vip')
    expect(canAccessFitLibrary('community')).toBe(false)
    expect(canAccessFitLibrary(null)).toBe(false)
    expect(canAccessFitLibrary('vip')).toBe(true)
    expect(canAccessFitLibrary('pro')).toBe(true)
    expect(fitUpgradeHref()).toBe('/pricing?from=fit&tier=vip')
  })
})

describe('Fit copy hygiene', () => {
  it('has no em dashes in locked copy or fixture titles', () => {
    for (const value of [...fitCopyStrings(), ...fitMoveCopyStrings()]) {
      expect(value, value).not.toMatch(EM)
    }
  })

  it('does not type EVOLVED PROS in Fit surfaces', () => {
    const files = [
      '../../components/fit/FitMasthead.tsx',
      '../../components/fit/FitMarketing.tsx',
      '../../components/fit/FitTeaseCard.tsx',
      '../../components/home/HomeFitTeaseBand.tsx',
      '../../app/(public)/fit/page.tsx',
      '../../app/(admin)/admin/fit/page.tsx',
    ]
    for (const file of files) {
      const src = readFileSync(resolve(__dirname, file), 'utf8')
      expect(src, file).not.toContain('EVOLVED PROS')
      expect(src, file).not.toContain('EVOLVED·PROS')
      expect(src, file).not.toMatch(/<h[1-6][^>]*>EVOLVED/)
      expect(src, file).not.toMatch(EM)
    }
  })
})
