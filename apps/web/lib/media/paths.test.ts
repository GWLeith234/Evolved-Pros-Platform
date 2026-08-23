import { describe, expect, it } from 'vitest'
import { mediaStoryHref } from './paths'

describe('mediaStoryHref', () => {
  it('uses the pillar slug when present', () => {
    expect(mediaStoryHref('strategy', 'build-repeatable-sales')).toBe(
      '/media/strategy/build-repeatable-sales',
    )
  })

  it('maps a null / missing pillar to the general route', () => {
    expect(mediaStoryHref(null, 'an-original')).toBe('/media/general/an-original')
    expect(mediaStoryHref(undefined, 'an-original')).toBe('/media/general/an-original')
  })

  it('does not emit /media/null/…', () => {
    expect(mediaStoryHref('null', 'oops')).toBe('/media/general/oops')
  })
})
