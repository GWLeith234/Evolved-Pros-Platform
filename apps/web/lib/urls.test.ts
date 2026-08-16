import { afterEach, describe, expect, it } from 'vitest'
import { getAppUrl, getSiteUrl } from './urls'

const KEYS = ['NEXT_PUBLIC_APP_URL', 'NEXT_PUBLIC_SITE_URL'] as const

afterEach(() => {
  for (const key of KEYS) delete process.env[key]
})

describe('getAppUrl', () => {
  it('prefers APP_URL over SITE_URL', () => {
    expect(
      getAppUrl('https://platform.evolvedpros.com/', 'https://evolvedpros.com'),
    ).toBe('https://platform.evolvedpros.com')
  })

  it('falls back to SITE_URL when APP_URL is blank', () => {
    expect(getAppUrl('  ', 'https://evolvedpros.com/')).toBe('https://evolvedpros.com')
  })

  it('uses the platform default when both are unset', () => {
    expect(getAppUrl(undefined, undefined)).toBe('https://platform.evolvedpros.com')
  })
})

describe('getSiteUrl', () => {
  it('prefers SITE_URL over APP_URL', () => {
    expect(
      getSiteUrl('https://evolvedpros.com/', 'https://platform.evolvedpros.com'),
    ).toBe('https://evolvedpros.com')
  })

  it('falls back to APP_URL when SITE_URL is blank', () => {
    expect(getSiteUrl('', 'https://platform.evolvedpros.com')).toBe(
      'https://platform.evolvedpros.com',
    )
  })

  it('uses the brand default when both are unset', () => {
    expect(getSiteUrl(undefined, undefined)).toBe('https://evolvedpros.com')
  })
})
