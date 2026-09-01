import { describe, it, expect } from 'vitest'
import { BRAND, AUTHOR_NAME, BRAND_BYLINE, truncateOnWord, stripTrailingArrow } from './brand'

describe('brand constants', () => {
  it('are the single canonical spelling', () => {
    expect(BRAND).toBe('EVOLVED')
    expect(AUTHOR_NAME).toBe('George Leith')
    expect(BRAND_BYLINE).toBe('EVOLVED — George Leith') // em dash, not hyphen
  })
})

describe('truncateOnWord', () => {
  it('returns the text unchanged when within budget', () => {
    expect(truncateOnWord('George Leith', 20)).toBe('George Leith')
    expect(truncateOnWord('George Leith', 12)).toBe('George Leith')
  })

  it('breaks on a word boundary and trims a dangling separator', () => {
    // Budget 14 cuts mid-"George"; it backs up to the boundary and drops the
    // dangling em dash so we never render "EVOLVED — …".
    expect(truncateOnWord('EVOLVED — George Leith', 14)).toBe('EVOLVED…')
  })

  it('never truncates mid-word at a boundary', () => {
    const out = truncateOnWord('Accountability Partner Checkin', 20)
    expect(out.endsWith('…')).toBe(true)
    expect(out).toBe('Accountability…')
  })

  it('hard-cuts a single word longer than the budget', () => {
    expect(truncateOnWord('Supercalifragilistic', 8)).toBe('Superca…')
  })
})

describe('stripTrailingArrow', () => {
  it('removes a trailing arrow and surrounding space', () => {
    expect(stripTrailingArrow('Learn More →')).toBe('Learn More')
    expect(stripTrailingArrow('Learn More  →  ')).toBe('Learn More')
  })
  it('leaves a label without an arrow unchanged', () => {
    expect(stripTrailingArrow('Learn More')).toBe('Learn More')
  })
  it('handles other arrow glyphs', () => {
    expect(stripTrailingArrow('Read more ›')).toBe('Read more')
  })
})
