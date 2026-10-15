import { describe, expect, it } from 'vitest'
import { DOCUMENT_TITLE_LIMIT } from '@/lib/seo/documentTitle'
import {
  MEDIA_BRAND,
  MEDIA_HUB_DESCRIPTION,
  MEDIA_HUB_DOCUMENT_TITLE,
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
    expect(MEDIA_HUB_DOCUMENT_TITLE).toBe(
      'Evolved Pros Media | Sales & Personal Development',
    )
    expect(MEDIA_HUB_DOCUMENT_TITLE.length).toBeLessThanOrEqual(DOCUMENT_TITLE_LIMIT)
    expect(MEDIA_BRAND).not.toContain(EM_DASH)
    expect(MEDIA_HUB_TITLE).not.toContain(EM_DASH)
    expect(MEDIA_HUB_TITLE).not.toBe(
      'Evolved Media — Sales & Personal Development Intelligence',
    )
    expect(MEDIA_HUB_DESCRIPTION).toBe(
      'Pioneer stories, leadership insights, and business strategy from the EVOLVED framework.',
    )
    expect(MEDIA_HUB_DESCRIPTION).not.toContain('Evolved Media')
  })

  it('uses a short article title suffix and keeps the section suffix', () => {
    expect(mediaStoryTitle('Close the Gap')).toBe('Close the Gap | Evolved Pros')
    expect(mediaSectionTitle('Leadership')).toBe('Leadership | Evolved Pros Media')
    expect(mediaStoryTitle('Close the Gap')).not.toContain(EM_DASH)
    expect(mediaSectionTitle('Leadership')).not.toContain(EM_DASH)
  })
})
