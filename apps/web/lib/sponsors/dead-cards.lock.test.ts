import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const webRoot = resolve(__dirname, '../..')

describe('dead sponsor leftovers stay gone', () => {
  it('does not keep the pre-refactor components/sponsors tree', () => {
    expect(existsSync(resolve(webRoot, 'components/sponsors'))).toBe(false)
  })

  it('does not keep unused Home sponsor shims', () => {
    expect(existsSync(resolve(webRoot, 'components/home/HomeSponsorRow.tsx'))).toBe(false)
    expect(existsSync(resolve(webRoot, 'components/home/HomeSponsorAdClient.tsx'))).toBe(
      false,
    )
  })

  it('does not re-export HomeSponsorRow from the live HomeSponsorAd module', () => {
    const src = readFileSync(
      resolve(webRoot, 'components/home/HomeSponsorAd.tsx'),
      'utf8',
    )
    expect(src).not.toMatch(/export function HomeSponsorRow/)
    expect(src).not.toMatch(/export function SponsoredEyebrow/)
  })
})
