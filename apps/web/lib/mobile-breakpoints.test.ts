import { describe, it, expect } from 'vitest'
import {
  MOBILE_BREAKPOINTS,
  VIEWPORTS,
  usesBottomTabs,
  usesTopNavLinks,
  MIN_TOUCH_TARGET_PX,
} from './mobile-breakpoints'

describe('mobile breakpoints (Sprint 4A)', () => {
  it('defines phone / tablet / desktop ranges without gaps', () => {
    expect(MOBILE_BREAKPOINTS.phoneMax + 1).toBe(MOBILE_BREAKPOINTS.tabletMin)
    expect(MOBILE_BREAKPOINTS.desktopMin).toBe(1024)
    expect(MOBILE_BREAKPOINTS.tabletMin).toBeLessThan(MOBILE_BREAKPOINTS.desktopMin)
  })

  it('uses bottom tabs below desktop and top-nav links at desktop+', () => {
    expect(usesBottomTabs(VIEWPORTS.iphone14.width)).toBe(true)
    expect(usesBottomTabs(VIEWPORTS.ipadMini.width)).toBe(true)
    expect(usesBottomTabs(VIEWPORTS.desktop.width)).toBe(false)
    expect(usesTopNavLinks(VIEWPORTS.desktop.width)).toBe(true)
    expect(usesTopNavLinks(1023)).toBe(false)
  })

  it('covers key QA devices in the viewport matrix', () => {
    const keys = Object.keys(VIEWPORTS)
    expect(keys).toEqual(
      expect.arrayContaining(['iphoneSE', 'iphone14', 'ipadMini', 'desktop']),
    )
    expect(MIN_TOUCH_TARGET_PX).toBe(44)
  })
})
