import { describe, it, expect } from 'vitest'
import {
  PILLARS,
  PILLAR_CONFIG,
  PILLAR_SLUGS,
  getPillar,
  getPillarLabel,
  getPillarColor,
  getPillarFamily,
} from './pillars'

describe('PILLARS single source', () => {
  it('has all six pillars in ascending program order 1→6', () => {
    expect(PILLARS.map(p => p.n)).toEqual([1, 2, 3, 4, 5, 6])
  })

  it('orders 1 Foundation → 6 Execution', () => {
    expect(PILLARS[0].name).toBe('Foundation')
    expect(PILLARS[5].name).toBe('Execution')
  })

  it('uses one abbreviation scheme — single full word, never a truncated stub', () => {
    for (const p of PILLARS) {
      expect(p.abbr).not.toMatch(/\./) // no "FOUNDTN." / "EXEC." style stubs
      expect(p.abbr.trim().split(/\s+/)).toHaveLength(1) // single word
    }
    // The only pillar whose abbr differs from its name is the two-word one.
    const differing = PILLARS.filter(p => p.abbr !== p.name)
    expect(differing.map(p => p.name)).toEqual(['Mental Toughness'])
  })

  it('every pillar slug resolves in PILLAR_CONFIG', () => {
    for (const p of PILLARS) {
      expect(PILLAR_CONFIG[p.slug]).toBeDefined()
    }
  })
})

describe('getPillar', () => {
  it('looks up by number', () => {
    expect(getPillar(1)?.name).toBe('Foundation')
    expect(getPillar(6)?.slug).toBe('execution')
  })
  it('returns undefined for an out-of-range number', () => {
    expect(getPillar(0)).toBeUndefined()
    expect(getPillar(7)).toBeUndefined()
  })
})

describe('pillar lookups', () => {
  it('getPillarLabel resolves a known slug and falls back to the input', () => {
    expect(getPillarLabel('mental-toughness')).toBe('Mental Toughness')
    expect(getPillarLabel('unknown')).toBe('unknown')
    expect(getPillarLabel(null)).toBe('')
  })

  it('getPillarColor returns the config color or a neutral fallback', () => {
    expect(getPillarColor('foundation')).toBe('#FFA538')
    expect(getPillarColor(null)).toBe('#7a8a96')
  })

  it('getPillarFamily partitions warm/cool, defaulting to cosmic', () => {
    expect(getPillarFamily('foundation')).toBe('grounded')
    expect(getPillarFamily('identity')).toBe('cosmic')
    expect(getPillarFamily(null)).toBe('cosmic')
  })

  it('PILLAR_SLUGS covers all six config keys', () => {
    expect(PILLAR_SLUGS).toHaveLength(6)
  })
})
