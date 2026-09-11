/**
 * Media + Fit masthead lockups. Canonical assets are the theme-pair PNGs
 * (dark = white type on #0A0F18, light = navy type on #FAF9F7). Discs are
 * the Podcast mic illustration family companions. Type in the lockups is
 * Bebas Neue Regular — the same cut Podcast loads via next/font, vendored
 * at public/social-fonts for the path cover/OG already reads from disk.
 *
 * Live marks swap the full lockup PNGs the same way FooterLogo / the loader
 * do (CSS --on-dark / --on-light). Do not compose a third HTML+disc pattern.
 */

export const BEBAS_NEUE_STATIC = '/social-fonts/BebasNeue-Regular.ttf' as const

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
