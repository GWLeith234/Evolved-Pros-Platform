import { describe, expect, it } from 'vitest'
import { asKeyTakeaways, MAX_TAKEAWAYS, MAX_TAKEAWAY_LENGTH } from './takeaways'

describe('asKeyTakeaways', () => {
  it('accepts an array of non-empty strings and trims them', () => {
    expect(asKeyTakeaways(['  One. ', 'Two.'])).toEqual(['One.', 'Two.'])
  })

  it('rejects non-arrays, empty arrays, and non-string members', () => {
    expect(asKeyTakeaways(null)).toBeNull()
    expect(asKeyTakeaways('One.')).toBeNull()
    expect(asKeyTakeaways([])).toBeNull()
    expect(asKeyTakeaways(['ok', 42])).toBeNull()
    expect(asKeyTakeaways([{ text: 'nope' }])).toBeNull()
  })

  it('rejects blank or whitespace-only bullets', () => {
    expect(asKeyTakeaways(['ok', '   '])).toBeNull()
    expect(asKeyTakeaways([''])).toBeNull()
  })

  it('enforces the per-bullet length cap', () => {
    expect(asKeyTakeaways(['x'.repeat(MAX_TAKEAWAY_LENGTH)])).not.toBeNull()
    expect(asKeyTakeaways(['x'.repeat(MAX_TAKEAWAY_LENGTH + 1)])).toBeNull()
  })

  it('enforces the max bullet count', () => {
    expect(asKeyTakeaways(Array.from({ length: MAX_TAKEAWAYS }, (_, i) => `T${i}`))).toHaveLength(MAX_TAKEAWAYS)
    expect(asKeyTakeaways(Array.from({ length: MAX_TAKEAWAYS + 1 }, (_, i) => `T${i}`))).toBeNull()
  })
})
