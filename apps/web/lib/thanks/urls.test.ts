import { describe, expect, it } from 'vitest'
import { isWwwThanksClaimUrl, thanksClaimUrl } from './urls'

describe('thanksClaimUrl', () => {
  it('builds the www-only claim URL', () => {
    const url = thanksClaimUrl('11111111-2222-3333-4444-555555555555')
    expect(url).toBe(
      'https://www.evolvedpros.com/invite/thanks?token=11111111-2222-3333-4444-555555555555',
    )
    expect(isWwwThanksClaimUrl(url)).toBe(true)
  })

  it('never names platform or /welcome', () => {
    const url = thanksClaimUrl('abc')
    expect(url).not.toContain('platform.evolvedpros.com')
    expect(url).not.toContain('/welcome')
    expect(url).not.toContain('FRIENDSOFGEORGE')
  })
})
