/**
 * Sprint 4A — canonical viewport breakpoints for Evolved Pros web.
 * Keep in sync with Tailwind defaults + apps/web/app/globals.css SPRINT 4A block.
 */
export const MOBILE_BREAKPOINTS = {
  /** Phone max (Tailwind sm - 1) */
  phoneMax: 639,
  /** Tablet min */
  tabletMin: 640,
  /** Desktop / TopNav link strip (Tailwind lg) */
  desktopMin: 1024,
  /** Home 4-up single column */
  home4upSingleCol: 720,
  /** Home 4-up two columns */
  home4upTwoCol: 1100,
} as const

export const VIEWPORTS = {
  iphoneSE: { name: 'iPhone SE', width: 375, height: 667 },
  iphone14: { name: 'iPhone 14', width: 390, height: 844 },
  iphone14ProMax: { name: 'iPhone 14 Pro Max', width: 430, height: 932 },
  pixel5: { name: 'Pixel 5', width: 393, height: 851 },
  ipadMini: { name: 'iPad Mini', width: 768, height: 1024 },
  ipadPro: { name: 'iPad Pro 11', width: 834, height: 1194 },
  desktop: { name: 'Desktop', width: 1280, height: 800 },
} as const

export type ViewportKey = keyof typeof VIEWPORTS

/** True when bottom tab bar is the primary nav (below lg). */
export function usesBottomTabs(width: number): boolean {
  return width < MOBILE_BREAKPOINTS.desktopMin
}

/** True when TopNav link strip is visible. */
export function usesTopNavLinks(width: number): boolean {
  return width >= MOBILE_BREAKPOINTS.desktopMin
}

/** Minimum touch target (CSS px) per WCAG 2.5.5 / Apple HIG. */
export const MIN_TOUCH_TARGET_PX = 44
