import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { FIT_BARBELL_DISC } from '@/lib/lockups'

const root = resolve(__dirname, '../..')

function src(rel: string) {
  return readFileSync(resolve(root, rel), 'utf8')
}

const drawer = src('components/layout/MoreDrawer.tsx')
const tabs = src('components/layout/BottomTabBar.tsx')
const css = src('app/globals.css')

describe('member drawer + footer lanes', () => {
  it('puts the official horizontal wordmark in the more drawer', () => {
    expect(drawer).toContain('LogoMark')
    expect(drawer).toContain('data-testid="ep-drawer-wordmark"')
    expect(drawer).toContain("variant={isDark ? 'light' : 'dark'}")
    expect(drawer).not.toMatch(/logo_circle/)
    expect(drawer).not.toMatch(/EVOLVED\s*<span[\s\S]*?·[\s\S]*?PROS/)
    expect(drawer).not.toContain('EVOLVED·PROS')
  })

  it('keeps account items in the drawer and drops Fit / Media / LIVE', () => {
    expect(drawer).toContain('href="/messages"')
    expect(drawer).toContain('My Profile')
    expect(drawer).toContain('Membership')
    expect(drawer).toContain('Settings')
    expect(drawer).toContain('Admin Dashboard')
    expect(drawer).toContain('Branding')
    expect(drawer).toContain('Sign Out')
    expect(drawer).not.toMatch(/href="\/fit"/)
    expect(drawer).not.toMatch(/href="\/media"/)
    expect(drawer).not.toMatch(/href="\/live"/)
  })

  it('places Fit, Media, and LIVE in the mobile footer lanes with the Fit barbell', () => {
    expect(tabs).toContain('data-testid="ep-footer-lanes"')
    expect(tabs).toContain("label: 'Fit'")
    expect(tabs).toContain("href: '/fit'")
    expect(tabs).toContain("label: 'Media'")
    expect(tabs).toContain("href: '/media'")
    expect(tabs).toContain("label: 'LIVE'")
    expect(tabs).toContain("href: '/live'")
    expect(tabs).toContain('FIT_BARBELL_DISC')
    expect(FIT_BARBELL_DISC).toBe('/brand/masthead/barbell-disc.png')
    expect(tabs).toMatch(/FOOTER_LANES[\s\S]*Fit[\s\S]*Media[\s\S]*LIVE/)
  })

  it('keeps the five-slot thumb bar for Home / Community / Podcast / Academy / More', () => {
    expect(tabs).toContain('data-testid="ep-footer-tabs"')
    expect(tabs).toContain("label: 'Home'")
    expect(tabs).toContain("label: 'Community'")
    expect(tabs).toContain("label: 'Podcast'")
    expect(tabs).toContain("label: 'Academy'")
    expect(tabs).toContain('More')
    expect(tabs).not.toMatch(/isMoreActive = \/\^\\\/\(messages\|profile\|settings\|admin\|leaderboard\|membership\|live\|media\)/)
  })

  it('sizes member scroll and toasts against the two-row footer tokens', () => {
    expect(css).toContain('--ep-footer-lanes-height')
    expect(css).toContain('--ep-footer-tabs-height')
    expect(css).toContain('--ep-footer-chrome')
    expect(css).toMatch(/\.ep-main-scroll \{[\s\S]*padding-bottom: var\(--ep-footer-chrome\)/)
    expect(css).toMatch(/\.ep-bottom-tabs \{[\s\S]*min-height: var\(--ep-footer-chrome\)/)
    expect(css).toMatch(/\.ep-toast-viewport \{[\s\S]*bottom: var\(--ep-footer-chrome\)/)
  })
})
