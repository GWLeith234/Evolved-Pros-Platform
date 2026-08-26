import { describe, expect, it } from 'vitest'
import {
  CANONICAL_ORIGIN,
  canonicalUrl,
  canonicalizePath,
  publicPageMetadata,
  resolveCanonicalOrigin,
} from './canonical'

describe('resolveCanonicalOrigin', () => {
  it('defaults to www when env is missing', () => {
    expect(resolveCanonicalOrigin()).toBe(CANONICAL_ORIGIN)
    expect(resolveCanonicalOrigin(null)).toBe(CANONICAL_ORIGIN)
    expect(resolveCanonicalOrigin('')).toBe(CANONICAL_ORIGIN)
  })

  it('collapses apex and platform to www', () => {
    expect(resolveCanonicalOrigin('https://evolvedpros.com')).toBe(CANONICAL_ORIGIN)
    expect(resolveCanonicalOrigin('https://evolvedpros.com/')).toBe(CANONICAL_ORIGIN)
    expect(resolveCanonicalOrigin('https://platform.evolvedpros.com')).toBe(CANONICAL_ORIGIN)
    expect(resolveCanonicalOrigin('https://www.evolvedpros.com')).toBe(CANONICAL_ORIGIN)
  })

  it('never emits the platform host, including preview / localhost / junk', () => {
    const inputs = [
      'https://platform.evolvedpros.com',
      'http://localhost:3000',
      'https://evolved-pros-platform-production.up.railway.app',
      'not a url',
      'www.evolvedpros.com',
    ]
    for (const input of inputs) {
      expect(resolveCanonicalOrigin(input)).toBe(CANONICAL_ORIGIN)
      expect(resolveCanonicalOrigin(input)).not.toContain('platform.evolvedpros.com')
    }
  })
})

describe('canonicalizePath / canonicalUrl', () => {
  it('normalizes empty and root to the bare www origin', () => {
    expect(canonicalizePath('')).toBe('/')
    expect(canonicalizePath('/')).toBe('/')
    expect(canonicalizePath('///')).toBe('/')
    expect(canonicalUrl('/')).toBe('https://www.evolvedpros.com')
    expect(canonicalUrl('')).toBe('https://www.evolvedpros.com')
  })

  it('builds www URLs for the public indexable surfaces', () => {
    expect(canonicalUrl('/media')).toBe('https://www.evolvedpros.com/media')
    expect(canonicalUrl('media')).toBe('https://www.evolvedpros.com/media')
    expect(canonicalUrl('/media/')).toBe('https://www.evolvedpros.com/media')
    expect(canonicalUrl('/media/strategy/close-the-gap')).toBe(
      'https://www.evolvedpros.com/media/strategy/close-the-gap',
    )
    expect(canonicalUrl('/podcast')).toBe('https://www.evolvedpros.com/podcast')
    expect(canonicalUrl('/podcast/carson-heady')).toBe(
      'https://www.evolvedpros.com/podcast/carson-heady',
    )
    expect(canonicalUrl('/pricing')).toBe('https://www.evolvedpros.com/pricing')
    expect(canonicalUrl('/live')).toBe('https://www.evolvedpros.com/live')
  })

  it('never names the platform host', () => {
    expect(canonicalUrl('/media')).not.toContain('platform.evolvedpros.com')
    expect(canonicalUrl('/media/identity/real-article')).not.toContain(
      'platform.evolvedpros.com',
    )
  })
})

describe('publicPageMetadata', () => {
  it('emits matching canonical + og:url for the /media hub', () => {
    const meta = publicPageMetadata('/media', {
      title: 'Evolved Media',
      description: 'Pioneer stories',
    })
    expect(meta.alternates?.canonical).toBe('https://www.evolvedpros.com/media')
    expect(meta.openGraph?.url).toBe('https://www.evolvedpros.com/media')
    expect(meta.title).toBe('Evolved Media')
    expect(meta.description).toBe('Pioneer stories')
  })

  it('emits matching canonical + og:url for a sample article', () => {
    const path = '/media/strategy/close-the-gap'
    const meta = publicPageMetadata(path, {
      title: 'Close the Gap | Evolved Media',
      openGraph: { type: 'article' },
    })
    expect(meta.alternates?.canonical).toBe(`https://www.evolvedpros.com${path}`)
    expect(meta.openGraph?.url).toBe(`https://www.evolvedpros.com${path}`)
    // Next's OpenGraph union does not share `type` across members.
    const articleOg = meta.openGraph as { type?: string } | undefined
    expect(articleOg?.type).toBe('article')
  })

  it('lets a caller set og title but not override the www url', () => {
    const meta = publicPageMetadata('/pricing', {
      openGraph: {
        url: 'https://platform.evolvedpros.com/pricing',
        title: 'Pricing',
      },
      alternates: { canonical: 'https://platform.evolvedpros.com/pricing' },
    })
    expect(meta.alternates?.canonical).toBe('https://www.evolvedpros.com/pricing')
    expect(meta.openGraph?.url).toBe('https://www.evolvedpros.com/pricing')
    const pricedOg = meta.openGraph as { title?: string } | undefined
    expect(pricedOg?.title).toBe('Pricing')
  })
})
