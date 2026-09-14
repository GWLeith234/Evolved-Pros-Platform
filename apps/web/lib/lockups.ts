/**
 * Media + Fit masthead lockups. Canonical assets are the theme-pair PNGs
 * (v4 equal letter height, George lock 2026-09-12).
 * Fit: EVOLVED PR + barbell disc (as O) + S FIT.
 * Media: EVOLVED + megaphone disc + MEDIA (no Pros).
 * Podcast LogoMark is unchanged. Type is Bebas Neue Regular.
 *
 * Live marks swap the full lockup PNGs the same way FooterLogo / the loader
 * do (CSS --on-dark / --on-light). Do not compose a third HTML+disc pattern.
 * Do not type the family wordmark in chrome.
 *
 * File names follow the chrome they sit on, not George letter-color slang:
 *   *-dark.png  = white letters for dark --bg-nav
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
