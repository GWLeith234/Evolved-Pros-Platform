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
  },
  light: {
    bgPage: '#F5F0E8',
    bgSurface: '#FFFFFF',
    bgElevated: '#F0EBE3',
    bgNav: '#FAF7F2',
    textPrimary: '#1B2A4A',
    textSecondary: '#4A5868',
    textTertiary: '#5C6A7C',
    border: 'rgba(27,42,74,0.12)',
    borderEmphasized: 'rgba(27,42,74,0.22)',
    skeletonBase: 'rgba(27,42,74,0.06)',
    skeletonHighlight: 'rgba(27,42,74,0.12)',
    topnavLinkActive: '#1B2A4A',
    topnavLinkIdle: 'rgba(27,42,74,0.55)',
    topnavLinkHover: '#1B2A4A',
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
