/**
 * Evolved Pros design tokens — single source of truth for brand, theme,
 * typography, and skeleton surfaces. Mirrored as CSS custom properties in
 * apps/web/app/globals.css (:root + html.light-mode).
 */

// ── Brand core (theme-invariant) ────────────────────────────────────────────
export const colors = {
  navy: '#1B2A4A',
  navyDark: '#112535',
  navyDeep: '#0d1c27',
  navyNav: '#0D1B2A',
  red: '#C9302A',
  redHot: '#ef0e30',
  redDark: '#c50a26',
  redHover: '#cc0a28',
  teal: '#0ABFA3',
  tealLegacy: '#68a2b9',
  tealLight: '#a8cdd9',
  tealDark: '#0A9980',
  gold: '#C9A84C',
  goldDark: '#8B6A00',
  blue: '#60A5FA',
  violet: '#A78BFA',
  offWhite: '#faf9f7',
  paper: '#F5F0E8',
  paperCard: '#FFFFFF',
  muted: '#7a8a96',
} as const

// ── Semantic surfaces per theme ─────────────────────────────────────────────
export const themes = {
  dark: {
    bgPage: '#0A0F18',
    bgSurface: '#111926',
    bgElevated: '#1A2332',
    bgNav: '#0D1B2A',
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.60)',
    textTertiary: 'rgba(255,255,255,0.35)',
    border: 'rgba(255,255,255,0.07)',
    borderEmphasized: 'rgba(255,255,255,0.15)',
    skeletonBase: 'rgba(255,255,255,0.06)',
    skeletonHighlight: 'rgba(255,255,255,0.12)',
    topnavLinkActive: '#FFFFFF',
    topnavLinkIdle: 'rgba(255,255,255,0.50)',
    topnavLinkHover: 'rgba(255,255,255,0.85)',
    shadowMd: '0 4px 12px rgba(0,0,0,0.40)',
  },
  // Light theme values are WCAG-AA-tuned against the parchment surfaces:
  // textSecondary #4A5868 ≈ 7.4:1 (AAA) on #FFFFFF, textTertiary #5C6A7C ≈
  // 5.0:1 (AA). topnavLinkIdle raised 0.55 → 0.72 (~2.8:1 → ~4.6:1) so idle
  // nav links clear AA; border raised 0.12 → 0.14 for card definition on the
  // low-contrast parchment page (THEME-CONSISTENCY). Mirrored in globals.css.
  light: {
    bgPage: '#F5F0E8',
    bgSurface: '#FFFFFF',
    bgElevated: '#F0EBE3',
    bgNav: '#FAF7F2',
    textPrimary: '#1B2A4A',
    textSecondary: '#4A5868',
    textTertiary: '#5C6A7C',
    border: 'rgba(27,42,74,0.14)',
    borderEmphasized: 'rgba(27,42,74,0.24)',
    skeletonBase: 'rgba(27,42,74,0.06)',
    skeletonHighlight: 'rgba(27,42,74,0.12)',
    topnavLinkActive: '#1B2A4A',
    topnavLinkIdle: 'rgba(27,42,74,0.72)',
    topnavLinkHover: '#1B2A4A',
    shadowMd: '0 4px 12px rgba(27,42,74,0.10)',
  },
} as const

export type ThemeName = keyof typeof themes

// ── Typography scale ────────────────────────────────────────────────────────
// Sizes in rem (base 16). Tracking as em. Use with CSS vars --type-*.
export const typography = {
  families: {
    bebas: '"Bebas Neue", "Impact", "Arial Narrow", sans-serif',
    barlow: '"Barlow", "Inter", system-ui, -apple-system, sans-serif',
    barlowCondensed: '"Barlow Condensed", "Oswald", "Arial Narrow", sans-serif',
    playfair: '"Playfair Display", "Times New Roman", serif',
    merriweather: '"Merriweather", Georgia, "Times New Roman", serif',
    abril: '"Abril Fatface", "Playfair Display", Georgia, serif',
  },
  scale: {
    /** Page hero display (Community, Events) */
    display: { size: 'clamp(2.75rem, 9vw, 5.5rem)', weight: 400, lineHeight: 0.95, tracking: '0.02em' },
    /** Section H1 */
    h1: { size: '1.75rem', weight: 700, lineHeight: 1.2, tracking: '-0.01em' },
    /** Card / panel H2 */
    h2: { size: '1.25rem', weight: 700, lineHeight: 1.25, tracking: '0' },
    /** Subsection H3 */
    h3: { size: '1rem', weight: 600, lineHeight: 1.3, tracking: '0.02em' },
    /** Body copy */
    body: { size: '0.9375rem', weight: 400, lineHeight: 1.6, tracking: '0' },
    /** Compact body */
    bodySm: { size: '0.8125rem', weight: 400, lineHeight: 1.5, tracking: '0' },
    /** Eyebrow labels */
    eyebrow: { size: '0.6875rem', weight: 600, lineHeight: 1.2, tracking: '0.14em' },
    /** Micro labels / pills */
    label: { size: '0.625rem', weight: 700, lineHeight: 1.2, tracking: '0.18em' },
    /** Nav links (Bebas) */
    nav: { size: '1rem', weight: 400, lineHeight: 1, tracking: '0.08em' },
  },
} as const

// ── Skeleton tokens (theme-aware) ───────────────────────────────────────────
export const skeleton = {
  dark: {
    base: themes.dark.skeletonBase,
    highlight: themes.dark.skeletonHighlight,
  },
  light: {
    base: themes.light.skeletonBase,
    highlight: themes.light.skeletonHighlight,
  },
} as const

// ── Tiers & pillars (product taxonomy) ──────────────────────────────────────
export const tiers = {
  community: { label: 'Community', color: '#68a2b9' },
  vip: { label: 'VIP', color: '#C9A84C' },
  pro: { label: 'Pro', color: '#C9302A' },
} as const

export const pillars = [
  { number: 1, slug: 'p1-foundation', name: 'Foundation', tier: 'community' },
  { number: 2, slug: 'p2-identity', name: 'Identity', tier: 'community' },
  { number: 3, slug: 'p3-mental-toughness', name: 'Mental Toughness', tier: 'community' },
  { number: 4, slug: 'p4-strategy', name: 'Strategy', tier: 'community' },
  { number: 5, slug: 'p5-accountability', name: 'Accountability', tier: 'pro' },
  { number: 6, slug: 'p6-execution', name: 'Execution', tier: 'pro' },
] as const

// ── Brand logos (public paths) ──────────────────────────────────────────────
/** Horizontal EVOLVED PROS wordmark with red mic disc. */
export const logos = {
  /** White wordmark — dark surfaces / dark nav */
  horizontalDark: '/logo_horizontal_dark.png',
  /** Navy wordmark — light surfaces / light nav */
  horizontalNavy: '/logo_horizontal_navy.png',
  /** Light-blue wordmark — alternate dark surface accent */
  horizontalLight: '/logo_horizontal_light.png',
  /** Legacy alias used by loading screens / email */
  navDark: '/logo_nav_dark.png',
} as const

// ── Spacing / radii / shadows (mirror tailwind.config `ep-*` + globals.css) ──
/** 4px base scale. Values in px; use for gaps/padding when not using Tailwind. */
export const spacing = {
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
} as const

export const radii = {
  none: '0px',
  sm: '2px',
  md: '4px',
  lg: '8px',
  pill: '9999px',
} as const

/** Reference the CSS custom properties defined in globals.css. */
export const shadows = {
  sm: 'var(--shadow-sm)',
  md: 'var(--shadow-md)',
  lg: 'var(--shadow-lg)',
  glowRed: 'var(--shadow-glow-red)',
  glowGold: 'var(--shadow-glow-gold)',
  glowTeal: 'var(--shadow-glow-teal)',
} as const

export const gradients = {
  primary: 'linear-gradient(135deg, #ef0e30 0%, #c50a26 100%)',
  success: 'linear-gradient(135deg, #0ABFA3 0%, #0A9980 100%)',
  gold: 'linear-gradient(135deg, #C9A84C 0%, #8B6A00 100%)',
  navy: 'linear-gradient(135deg, #1B2A4A 0%, #0d1c27 100%)',
} as const

// ── Pillar colors (1–6) ─────────────────────────────────────────────────────
// Canonical pillar accent colors, mirrored in apps/web/lib/pillar-colors.ts.
export const pillarColors: Record<number, { color: string; colorMuted: string; label: string }> = {
  1: { color: '#FFA538', colorMuted: 'rgba(255,165,56,0.12)',  label: 'Foundation' },
  2: { color: '#A78BFA', colorMuted: 'rgba(167,139,250,0.12)', label: 'Identity' },
  3: { color: '#F87171', colorMuted: 'rgba(248,113,113,0.12)', label: 'Mental Toughness' },
  4: { color: '#60A5FA', colorMuted: 'rgba(96,165,250,0.12)',  label: 'Strategy' },
  5: { color: '#C9A84C', colorMuted: 'rgba(201,168,76,0.12)',  label: 'Accountability' },
  6: { color: '#0ABFA3', colorMuted: 'rgba(10,191,163,0.12)',  label: 'Execution' },
}

/** Resolve a pillar number (or numeric string) to its accent color; falls back
 *  to the neutral muted color for null/undefined/unknown pillars. */
export function getPillarColor(pillar?: number | string | null): string {
  if (pillar == null) return colors.muted
  const n = typeof pillar === 'number' ? pillar : parseInt(String(pillar), 10)
  return pillarColors[n]?.color ?? colors.muted
}
