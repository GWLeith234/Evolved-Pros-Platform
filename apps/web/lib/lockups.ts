/**
 * Media + Fit masthead lockups. Discs are the Podcast mic illustration family
 * (red ring, white field, sunburst, white arcs). Type is Bebas Neue Regular.
 *
 * Podcast masthead stays composed HTML. These surfaces match that pattern:
 * Bebas wordmarks + disc PNGs, not the platform LogoMark.
 */

export const BEBAS_NEUE_STATIC = '/fonts/static/BebasNeue-Regular.ttf' as const

export const MEDIA_MEGAPHONE_DISC = '/brand/masthead/megaphone-disc.png' as const
export const FIT_BARBELL_DISC = '/brand/masthead/barbell-disc.png' as const

export const MEDIA_LOCKUP_DARK = '/brand/masthead/media-lockup-dark.png' as const
export const MEDIA_LOCKUP_LIGHT = '/brand/masthead/media-lockup-light.png' as const
export const FIT_LOCKUP_DARK = '/brand/masthead/fit-lockup-dark.png' as const
export const FIT_LOCKUP_LIGHT = '/brand/masthead/fit-lockup-light.png' as const

export const MEDIA_LOCKUP_LABEL = 'Evolved Media'
export const FIT_LOCKUP_LABEL = 'Evolved Pros Fit'

export const MASTHEAD_LOCKUP_ASSETS = [
  MEDIA_MEGAPHONE_DISC,
  FIT_BARBELL_DISC,
  MEDIA_LOCKUP_DARK,
  MEDIA_LOCKUP_LIGHT,
  FIT_LOCKUP_DARK,
  FIT_LOCKUP_LIGHT,
  BEBAS_NEUE_STATIC,
] as const
