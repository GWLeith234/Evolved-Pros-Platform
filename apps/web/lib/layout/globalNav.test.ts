import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { GLOBAL_NAV_CTA, GLOBAL_NAV_LINKS, isGlobalNavCurrent } from './globalNav'

const here = dirname(fileURLToPath(import.meta.url))
const read = (rel: string) => readFileSync(resolve(here, rel), 'utf8')

describe('global nav on the public sections', () => {
  it('carries all seven platform destinations', () => {
    expect(GLOBAL_NAV_LINKS.map(l => l.href)).toEqual([
      '/home',
      '/community',
      '/academy',
      '/live',
      '/podcast',
      '/media',
      '/fit',
    ])
  })

  it('agrees with TopNav, so the public rail and the member shell say the same thing', () => {
    const topNav = read('../../components/layout/TopNav.tsx')
    for (const link of GLOBAL_NAV_LINKS) {
      expect(topNav, link.href).toContain(`href: '${link.href}'`)
    }
  })

  it('points its single CTA at the sell page, never at /join', () => {
    expect(GLOBAL_NAV_CTA.href).toBe('/pricing')
    expect(GLOBAL_NAV_CTA.label).toBe('Join free')
  })

  it('marks the section the visitor is already in, including child routes', () => {
    expect(isGlobalNavCurrent('/media', '/media')).toBe(true)
    expect(isGlobalNavCurrent('/media', '/media/accountability/a-story')).toBe(true)
    expect(isGlobalNavCurrent('/media', '/mediation')).toBe(false)
    expect(isGlobalNavCurrent('/fit', '/media')).toBe(false)
    expect(isGlobalNavCurrent('/home', '/')).toBe(false)
    expect(isGlobalNavCurrent('/home', '')).toBe(false)
  })

  // SPRINT M - /media, /fit and /live each replaced the app shell with a lone
  // "Back to platform" link, so three of the seven destinations were dead ends.
  it('is mounted on all three public sections that drop the app shell', () => {
    const media = read('../../components/media/Masthead.tsx')
    const fit = read('../../components/fit/FitMasthead.tsx')
    const live = read('../../app/live/page.tsx')

    expect(media).toContain('<PublicGlobalNav current="/media" />')
    expect(fit).toContain('<PublicGlobalNav current="/fit" />')
    // /live is a fixed-dark studio shell, so the rail has to be pinned dark.
    expect(live).toContain('<PublicGlobalNav current="/live" tone="dark" />')
  })

  it('stays out of the client bundle and off the session', () => {
    // Comments stripped: the file explains what it deliberately does not do.
    const nav = read('../../components/layout/PublicGlobalNav.tsx')
      .replace(/\/\*[\s\S]*?\*\//g, '')
    // A session read here would make all three sections dynamic and cost the
    // anonymous-crawler rendering these pages exist for.
    expect(nav).not.toContain("'use client'")
    expect(nav).not.toContain('usePathname')
    expect(nav).not.toMatch(/supabase|getUser|resolveCurrentUser/)
    expect(nav).toContain('<GlobalNavList>')
    const scroller = read('../../components/layout/GlobalNavList.tsx')
    expect(scroller).toContain("'use client'")
    expect(scroller).toContain('scrollTo')
    expect(scroller).toContain('[aria-current="page"]')
  })
})
