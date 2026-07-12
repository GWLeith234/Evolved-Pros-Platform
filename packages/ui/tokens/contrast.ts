/**
 * WCAG contrast utilities — used by the design-system a11y contract tests and
 * available to product code that needs to validate color pairs at runtime.
 */

export interface RGB {
  r: number
  g: number
  b: number
}

/** Parse a 3- or 6-digit hex color to RGB, or null if it isn't a valid hex. */
export function parseHex(hex: string): RGB | null {
  if (typeof hex !== 'string') return null
  let h = hex.trim().replace(/^#/, '')
  if (h.length === 3) h = h.split('').map(c => c + c).join('')
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}

function channel(c: number): number {
  const s = c / 255
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
}

function relativeLuminance({ r, g, b }: RGB): number {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

/** WCAG contrast ratio between two hex colors (1–21), or null if either is invalid. */
export function contrastRatio(fg: string, bg: string): number | null {
  const f = parseHex(fg)
  const b = parseHex(bg)
  if (!f || !b) return null
  const l1 = relativeLuminance(f)
  const l2 = relativeLuminance(b)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

export type ContrastLevel = 'fail' | 'AA' | 'AAA'

export interface ContrastResult {
  ratio: number | null
  passesAA: boolean
  passesAAA: boolean
  level: ContrastLevel
}

/** Evaluate a foreground/background pair against WCAG AA/AAA thresholds. */
export function evaluateContrast(
  fg: string,
  bg: string,
  opts?: { largeText?: boolean },
): ContrastResult {
  const ratio = contrastRatio(fg, bg)
  if (ratio == null) {
    return { ratio: null, passesAA: false, passesAAA: false, level: 'fail' }
  }
  const large = !!opts?.largeText
  const aaThreshold = large ? 3 : 4.5
  const aaaThreshold = large ? 4.5 : 7
  const passesAA = ratio >= aaThreshold
  const passesAAA = ratio >= aaaThreshold
  return {
    ratio,
    passesAA,
    passesAAA,
    level: passesAAA ? 'AAA' : passesAA ? 'AA' : 'fail',
  }
}

export interface WcagPair {
  name: string
  fg: string
  bg: string
  largeText?: boolean
}

/** Brand/theme color pairs that must clear WCAG AA. */
export const WCAG_AA_PAIRS: WcagPair[] = [
  { name: 'white on dark page', fg: '#FFFFFF', bg: '#0A0F18' },
  { name: 'navy on parchment', fg: '#1B2A4A', bg: '#F5F0E8' },
  { name: 'white on brand red', fg: '#FFFFFF', bg: '#C9302A', largeText: true },
  { name: 'light-mode secondary text on white', fg: '#4A5868', bg: '#FFFFFF' },
  { name: 'light-mode tertiary text on white', fg: '#5C6A7C', bg: '#FFFFFF' },
]
