import type { Database } from '@evolved-pros/db'

export type Sponsor = Database['public']['Tables']['sponsors']['Row']

// THEME-QA: sponsor cards now bind to the semantic theme tokens so the ad
// units read correctly in BOTH themes (dark navy surface in dark mode, white
// parchment card in light mode) instead of rendering as a hardcoded dark
// island on the light theme. All five card variants + SponsorDisclosure
// consume these as inline style values, so retargeting here flips them all.
export const SPONSOR_BG = 'var(--bg-surface)'
export const SPONSOR_TEXT = 'var(--text-primary)'
export const SPONSOR_TEXT_MUTED = 'var(--text-secondary)'
export const SPONSOR_TEXT_FAINT = 'var(--text-tertiary)'
export const SPONSOR_BORDER = 'var(--border-color)'

export const DEFAULT_BRAND_COLOR = '#C9A84C'

export function brandColor(sponsor: Pick<Sponsor, 'brand_color'>): string {
  return sponsor.brand_color || DEFAULT_BRAND_COLOR
}

export function logoLetter(sponsor: Pick<Sponsor, 'name'>): string {
  return sponsor.name.trim().charAt(0).toUpperCase() || '·'
}
