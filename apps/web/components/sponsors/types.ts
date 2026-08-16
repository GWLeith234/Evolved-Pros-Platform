import type { Database } from '@evolved-pros/db'

export type Sponsor = Database['public']['Tables']['sponsors']['Row']

export const SPONSOR_BG = '#0F172A'
export const SPONSOR_TEXT = '#F5F0E8'
export const SPONSOR_TEXT_MUTED = 'rgba(245,240,232,0.55)'
/** Disclosure / tertiary line — kept ≥ ~0.5 alpha so it stays readable on navy. */
export const SPONSOR_TEXT_FAINT = 'rgba(245,240,232,0.55)'
export const SPONSOR_BORDER = 'rgba(245,240,232,0.08)'

export const DEFAULT_BRAND_COLOR = '#C9A84C'

export function brandColor(sponsor: Pick<Sponsor, 'brand_color'>): string {
  return sponsor.brand_color || DEFAULT_BRAND_COLOR
}

export function logoLetter(sponsor: Pick<Sponsor, 'name'>): string {
  return sponsor.name.trim().charAt(0).toUpperCase() || '·'
}
