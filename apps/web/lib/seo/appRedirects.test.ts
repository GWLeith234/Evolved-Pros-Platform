import { describe, expect, it } from 'vitest'
import {
  PLATFORM_HOST,
  PLATFORM_ORIGIN,
  RAILWAY_PUBLIC_HOST,
  appRedirects,
  redirectsPlatformHostToWww,
} from './appRedirects.mjs'

describe('appRedirects host policy', () => {
  it('does not 308 platform.evolvedpros.com to www.evolvedpros.com', () => {
    expect(redirectsPlatformHostToWww()).toBe(false)
    for (const rule of appRedirects()) {
      const hosts = (rule.has ?? [])
        .filter((h) => h.type === 'host')
        .map((h) => h.value)
      if (hosts.includes(PLATFORM_HOST)) {
        expect(String(rule.destination)).not.toContain('www.evolvedpros.com')
      }
      expect(String(rule.destination)).not.toBe('https://www.evolvedpros.com/:path')
    }
  })

  it('keeps /join and /signup on the same host (relative, not www)', () => {
    const join = appRedirects().find((r) => r.source === '/join')
    const signup = appRedirects().find((r) => r.source === '/signup')
    expect(join?.destination).toBe('/login?mode=signup')
    expect(signup?.destination).toBe('/login?mode=signup')
    expect(join?.destination).not.toContain('www.evolvedpros.com')
    expect(signup?.destination).not.toContain('www.evolvedpros.com')
  })

  it('sends leftover Railway page hits to platform, not WordPress', () => {
    const railway = appRedirects().find((r) =>
      (r.has ?? []).some((h) => h.type === 'host' && h.value === RAILWAY_PUBLIC_HOST),
    )
    expect(railway).toBeDefined()
    expect(railway?.destination).toBe(`${PLATFORM_ORIGIN}/:path`)
    expect(String(railway?.destination)).not.toContain('www.evolvedpros.com')
  })
})
