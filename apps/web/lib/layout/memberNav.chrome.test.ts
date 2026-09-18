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
const topnav = src('components/layout/TopNav.tsx')
const css = src('app/globals.css')

describe('member drawer + 4-slot footer (George IA relock 2026-09-17 ~20:02)', () => {
  it('puts EpWordmark EVOLVED·PROS (red ·) in the more drawer, never a circle mark', () => {
    expect(drawer).toContain('EpWordmark')
    expect(drawer).toContain('data-testid="ep-drawer-wordmark"')
    expect(drawer).toContain("tone={isDark ? 'light' : 'dark'}")
    expect(drawer).not.toMatch(/logo_circle/)
    expect(drawer).not.toContain('LogoMark')
  })

  it('keeps Community, Academy, LIVE, and account items in the drawer', () => {
    expect(drawer).toContain('href="/community"')
    expect(drawer).toContain('Community')
    expect(drawer).not.toContain('Team')
    expect(drawer).toContain('href="/academy"')
    expect(drawer).toContain('Academy')
    expect(drawer).toContain('href="/live"')
    expect(drawer).toContain('LIVE')
    expect(drawer).toContain('href="/messages"')
    expect(drawer).toContain('Messages')
    expect(drawer).toContain('My Profile')
    expect(drawer).toContain('Membership')
    expect(drawer).toContain('Settings')
    expect(drawer).toContain('Admin Dashboard')
    expect(drawer).toContain('Branding')
    expect(drawer).toContain('Sign Out')
    expect(drawer).not.toMatch(/href="\/fit"/)
    expect(drawer).not.toMatch(/href="\/media"/)
    expect(drawer).not.toMatch(/href="\/podcast"/)
  })

  it('uses the locked 4-slot bar Home | Fit | Media | Pods', () => {
    expect(tabs).toContain('data-testid="ep-footer-tabs"')
    expect(tabs).toContain("label: 'Home'")
    expect(tabs).toContain("label: 'Fit'")
    expect(tabs).toContain("href: '/fit'")
    expect(tabs).toContain("label: 'Media'")
    expect(tabs).toContain("href: '/media'")
    expect(tabs).toContain("label: 'Pods'")
    expect(tabs).toContain("href: '/podcast'")
    expect(tabs).toContain('FIT_BARBELL_DISC')
    expect(FIT_BARBELL_DISC).toBe('/brand/masthead/barbell-disc.png')
    expect(tabs).not.toContain("label: 'LIVE'")
    expect(tabs).not.toContain("href: '/live'")
    expect(tabs).not.toContain("label: 'More'")
    expect(tabs).not.toContain('MoreDrawer')
    expect(tabs).not.toContain('FOOTER_LANES')
    expect(tabs).not.toContain("label: 'Community'")
    expect(tabs).not.toContain("label: 'Academy'")
  })

  it('opens the tray from existing TopNav chrome (no footer More tab)', () => {
    expect(topnav).toContain('MoreDrawer')
    expect(topnav).toContain('data-testid="ep-more-trigger"')
    expect(topnav).toContain("{ label: 'Community', href: '/community' }")
    expect(topnav).not.toContain("{ label: 'Team', href: '/community' }")
  })

  it('does not grow the footer into a two-row chrome', () => {
    expect(css).not.toContain('--ep-footer-lanes-height')
    expect(css).not.toContain('.ep-footer-lanes')
    expect(css).toMatch(/\.ep-bottom-tabs \{[\s\S]*min-height: calc\(56px/)
  })
})
