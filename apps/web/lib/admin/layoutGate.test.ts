import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { adminLayoutPrefetchOmitsChildren, adminLayoutRedirectTarget } from './layoutGate'

const layoutSrc = readFileSync(resolve(__dirname, '../../app/(admin)/admin/layout.tsx'), 'utf8')

describe('admin layout role gate', () => {
  it('omits children for a prefetch and not for a real RSC navigation', () => {
    expect(adminLayoutPrefetchOmitsChildren('1')).toBe(true)
    expect(adminLayoutPrefetchOmitsChildren(null)).toBe(false)
    expect(adminLayoutPrefetchOmitsChildren('0')).toBe(false)
    expect(adminLayoutPrefetchOmitsChildren('')).toBe(false)
  })

  it('sends a logged-out caller to login and a non-admin to home', () => {
    expect(adminLayoutRedirectTarget({ signedIn: false, role: null })).toBe('/login')
    expect(adminLayoutRedirectTarget({ signedIn: false, role: 'admin' })).toBe('/login')
    expect(adminLayoutRedirectTarget({ signedIn: true, role: 'member' })).toBe('/home')
    expect(adminLayoutRedirectTarget({ signedIn: true, role: null })).toBe('/home')
    expect(adminLayoutRedirectTarget({ signedIn: true, role: undefined })).toBe('/home')
    expect(adminLayoutRedirectTarget({ signedIn: true, role: 'Admin' })).toBe('/home')
    expect(adminLayoutRedirectTarget({ signedIn: true, role: '' })).toBe('/home')
  })

  it('lets an admin through', () => {
    expect(adminLayoutRedirectTarget({ signedIn: true, role: 'admin' })).toBeNull()
  })

  it('applies that gate in the admin layout before children render', () => {
    expect(layoutSrc).not.toContain("get('RSC')")
    expect(layoutSrc).not.toContain('return <>{children}</>')

    const prefetchCall = layoutSrc.indexOf('adminLayoutPrefetchOmitsChildren(')
    const prefetchReturn = layoutSrc.indexOf('return null')
    const redirectCall = layoutSrc.indexOf('adminLayoutRedirectTarget(')
    const children = layoutSrc.indexOf('{children}')

    expect(prefetchCall).toBeGreaterThan(-1)
    expect(prefetchReturn).toBeGreaterThan(prefetchCall)
    expect(redirectCall).toBeGreaterThan(prefetchReturn)
    expect(children).toBeGreaterThan(redirectCall)
    expect(layoutSrc).toContain("headers().get('Next-Router-Prefetch')")
  })
})
