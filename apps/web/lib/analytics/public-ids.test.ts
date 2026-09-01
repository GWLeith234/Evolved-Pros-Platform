import { afterEach, describe, expect, it } from 'vitest'
import { getClarityId, getGaMeasurementId, getGscVerification } from './public-ids'

const KEYS = [
  'NEXT_PUBLIC_GA_MEASUREMENT_ID',
  'NEXT_PUBLIC_GSC_VERIFICATION',
  'NEXT_PUBLIC_CLARITY_ID',
] as const

afterEach(() => {
  for (const key of KEYS) delete process.env[key]
})

describe('getGaMeasurementId', () => {
  it('treats missing and blank values as unset', () => {
    expect(getGaMeasurementId()).toBeUndefined()
    expect(getGaMeasurementId('')).toBeUndefined()
    expect(getGaMeasurementId('   ')).toBeUndefined()
  })

  it('returns a trimmed GA4 measurement id', () => {
    expect(getGaMeasurementId('  G-ABC123XYZ  ')).toBe('G-ABC123XYZ')
  })

  it('rejects GTM containers and other non-GA4 prefixes', () => {
    expect(getGaMeasurementId('GTM-ABC123')).toBeUndefined()
    expect(getGaMeasurementId('UA-123456-1')).toBeUndefined()
    expect(getGaMeasurementId('not-an-id')).toBeUndefined()
  })
})

describe('getGscVerification', () => {
  it('treats missing and blank values as unset', () => {
    expect(getGscVerification()).toBeUndefined()
    expect(getGscVerification('')).toBeUndefined()
    expect(getGscVerification('\t')).toBeUndefined()
  })

  it('returns a trimmed verification token', () => {
    expect(getGscVerification('  abcDEF123_-  ')).toBe('abcDEF123_-')
  })

  it('rejects tokens that cannot safely sit in a meta tag', () => {
    expect(getGscVerification('foo bar')).toBeUndefined()
    expect(getGscVerification('foo"bar')).toBeUndefined()
    expect(getGscVerification('<script>')).toBeUndefined()
  })
})

describe('getClarityId', () => {
  it('treats missing and blank values as unset', () => {
    expect(getClarityId()).toBeUndefined()
    expect(getClarityId('')).toBeUndefined()
  })

  it('returns a trimmed Clarity project id', () => {
    expect(getClarityId('  a1b2c3d4e5  ')).toBe('a1b2c3d4e5')
  })

  it('rejects ids with punctuation or URLs', () => {
    expect(getClarityId('https://clarity.ms/tag/abc')).toBeUndefined()
    expect(getClarityId('abc-def')).toBeUndefined()
  })
})
