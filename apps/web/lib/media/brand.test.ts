import { describe, expect, it } from 'vitest'
import {
  MEDIA_BRAND,
  MEDIA_HUB_TITLE,
  mediaSectionTitle,
  mediaStoryTitle,
} from './brand'

const EM_DASH = '\u2014'

describe('Evolved Pros Media brand lock', () => {
  it('names the public hub Evolved Pros Media without an em dash', () => {
    expect(MEDIA_BRAND).toBe('Evolved Pros Media')
    expect(MEDIA_HUB_TITLE).toBe(
      'Evolved Pros Media | Sales & Personal Development Intelligence',
    )
    expect(MEDIA_BRAND).not.toContain(EM_DASH)
    expect(MEDIA_HUB_TITLE).not.toContain(EM_DASH)
    expect(MEDIA_HUB_TITLE).not.toBe(
      'Evolved Media — Sales & Personal Development Intelligence',
    )
  })

  it('keeps hub title and og title on Evolved Pros Media', () => {
    expect(MEDIA_HUB_TITLE.startsWith('Evolved Pros Media')).toBe(true)
    expect(MEDIA_HUB_TITLE).not.toBe(
      'Evolved Media — Sales & Personal Development Intelligence',
    )
    expect(MEDIA_HUB_TITLE).not.toMatch(/^Evolved Media\b/)
  })

  it('suffixes articles and section titles with Evolved Pros Media', () => {
    expect(mediaStoryTitle('Close the Gap')).toBe('Close the Gap | Evolved Pros Media')
    expect(mediaSectionTitle('Leadership')).toBe('Leadership | Evolved Pros Media')
    expect(mediaStoryTitle('Close the Gap')).not.toContain(EM_DASH)
    expect(mediaSectionTitle('Leadership')).not.toContain(EM_DASH)
  })
})
