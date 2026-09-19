/**
 * Media + Fit masthead lockups. Canonical Media assets are the family v5
 * Layout A theme-pair PNGs (George MATCH YES 2026-09-13 / gold ferry
 * 2026-09-19): EVOLVED PR [megaphone disc] S MEDIA.
 * Fit still uses its PNG pair (EVOLVED PR [barbell disc] S FIT).
 * Podcast LogoMark is unchanged. Type is Bebas Neue Regular (baked in PNG).
 *
 * Live marks swap the full lockup PNGs the same way FooterLogo / the loader
 * do (CSS --on-dark / --on-light). Do not compose a third HTML+disc pattern.
 * Do not type the family wordmark in Media chrome. Surface name stays
 * Evolved Pros Media.
 *
 * File names follow the chrome they sit on, not George letter-color slang:
 *   *-dark.png  = white letters for dark --bg-page
 *   *-light.png = navy letters for parchment / html.light-mode
 */

export const BEBAS_NEUE_STATIC = '/social-fonts/BebasNeue-Regular.ttf' as const

export const MEDIA_MEGAPHONE_DISC = '/brand/masthead/megaphone-disc.png' as const
export const FIT_BARBELL_DISC = '/brand/masthead/barbell-disc.png' as const

/** White-letter MEDIA lockup. Pair with --on-dark (default dark chrome). */
export const MEDIA_LOCKUP_DARK = '/brand/masthead/media-lockup-dark.png' as const
/** Navy-letter MEDIA lockup. Pair with --on-light (parchment / light chrome). */
export const MEDIA_LOCKUP_LIGHT = '/brand/masthead/media-lockup-light.png' as const
export const FIT_LOCKUP_DARK = '/brand/masthead/fit-lockup-dark.png' as const
export const FIT_LOCKUP_LIGHT = '/brand/masthead/fit-lockup-light.png' as const

export const MEDIA_LOCKUP_LABEL = 'Evolved Pros Media'
export const FIT_LOCKUP_LABEL = 'Evolved Pros Fit'

/** Family v5 lockup intrinsic size (gold Media PNGs). */
export const LOCKUP_INTRINSIC_WIDTH = 1358
export const LOCKUP_INTRINSIC_HEIGHT = 207

/** File-exact SHA-256 of the gold Media v5 Layout A PNGs. Gate for MATCH. */
export const GOLD_MEDIA_LOCKUP_SHA256 = {
  'media-lockup-dark.png':
    '192631d5eb695325b20fdcc074961489a204b2573db89687725b266196ba4757',
  'media-lockup-light.png':
    '091892644837377c4e0a586f3d737f803886ae7cc38b5d32b3935704b2df1bbc',
} as const

export const MASTHEAD_LOCKUP_ASSETS = [
  MEDIA_MEGAPHONE_DISC,
  FIT_BARBELL_DISC,
  MEDIA_LOCKUP_DARK,
  MEDIA_LOCKUP_LIGHT,
  FIT_LOCKUP_DARK,
  FIT_LOCKUP_LIGHT,
  BEBAS_NEUE_STATIC,
] as const
