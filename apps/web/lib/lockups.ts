/**
 * Masthead lockups. Canonical assets are the theme-pair PNGs
 * (family v5 Layout A, George MATCH YES 2026-09-13).
 * All four siblings: EVOLVED PR [disc] S PRODUCT.
 * Fit: barbell disc. Media: megaphone disc. Podcast: mic disc.
 * Academy: grad-cap disc.
 *
 * Live marks swap the full lockup PNGs the same way FooterLogo / the loader
 * do (CSS --on-dark / --on-light). Do not compose a third HTML+disc pattern.
 * Do not type the family wordmark in chrome.
 */

export const BEBAS_NEUE_STATIC = '/social-fonts/BebasNeue-Regular.ttf' as const

export const MEDIA_MEGAPHONE_DISC = '/brand/masthead/megaphone-disc.png' as const
export const FIT_BARBELL_DISC = '/brand/masthead/barbell-disc.png' as const

export const PODCAST_LOCKUP_DARK = '/brand/masthead/podcast-lockup-dark.png' as const
export const PODCAST_LOCKUP_LIGHT = '/brand/masthead/podcast-lockup-light.png' as const
export const FIT_LOCKUP_DARK = '/brand/masthead/fit-lockup-dark.png' as const
export const FIT_LOCKUP_LIGHT = '/brand/masthead/fit-lockup-light.png' as const
export const MEDIA_LOCKUP_DARK = '/brand/masthead/media-lockup-dark.png' as const
export const MEDIA_LOCKUP_LIGHT = '/brand/masthead/media-lockup-light.png' as const
export const ACADEMY_LOCKUP_DARK = '/brand/masthead/academy-lockup-dark.png' as const
export const ACADEMY_LOCKUP_LIGHT = '/brand/masthead/academy-lockup-light.png' as const

export const PODCAST_LOCKUP_LABEL = 'Evolved Pros Podcast'
export const FIT_LOCKUP_LABEL = 'Evolved Pros Fit'
export const MEDIA_LOCKUP_LABEL = 'Evolved Pros Media'
export const ACADEMY_LOCKUP_LABEL = 'Evolved Pros Academy'

export const LOCKUP_INTRINSIC_WIDTH = 1358
export const LOCKUP_INTRINSIC_HEIGHT = 207

/** File-exact SHA-256 of the gold v5 Layout A PNGs. Gate for MATCH. */
export const GOLD_LOCKUP_SHA256 = {
  'podcast-lockup-light.png':
    '09242470412a0f19d750239427cb9b6f02c73478f4333ea2474cf2a731fd4ae0',
  'podcast-lockup-dark.png':
    '8c3e38e4276aae9b2ab383ba7392aebe9806e982fef41a3c7d49f3fc8a891c19',
  'fit-lockup-light.png':
    '7be96d88cc1e3eab218932d4f89bd849798fc71775934b68344ed61b743241ef',
  'fit-lockup-dark.png':
    'aa2ce4c6c43cd36ccff27c3ad24558c09482026ebfac11de0947d7d648ac9545',
  'media-lockup-light.png':
    '091892644837377c4e0a586f3d737f803886ae7cc38b5d32b3935704b2df1bbc',
  'media-lockup-dark.png':
    '192631d5eb695325b20fdcc074961489a204b2573db89687725b266196ba4757',
  'academy-lockup-light.png':
    '1ea85389df95b6a414a8baea47ee05f0adfa42b4a0c90aae25752bccf959ee3f',
  'academy-lockup-dark.png':
    'cd6536e38b3271c3de94276e8c088ef6e0dd794b29761e247b1853d37814bbd3',
} as const

export const FAMILY_V5_LOCKUP_ASSETS = [
  PODCAST_LOCKUP_DARK,
  PODCAST_LOCKUP_LIGHT,
  FIT_LOCKUP_DARK,
  FIT_LOCKUP_LIGHT,
  MEDIA_LOCKUP_DARK,
  MEDIA_LOCKUP_LIGHT,
  ACADEMY_LOCKUP_DARK,
  ACADEMY_LOCKUP_LIGHT,
] as const

export const MASTHEAD_LOCKUP_ASSETS = [
  MEDIA_MEGAPHONE_DISC,
  FIT_BARBELL_DISC,
  ...FAMILY_V5_LOCKUP_ASSETS,
  BEBAS_NEUE_STATIC,
] as const

/** Dest files that already ship on the default branch (overwrite with gold). */
export const SHIPPED_LOCKUP_ASSETS = [
  MEDIA_MEGAPHONE_DISC,
  FIT_BARBELL_DISC,
  FIT_LOCKUP_DARK,
  FIT_LOCKUP_LIGHT,
  MEDIA_LOCKUP_DARK,
  MEDIA_LOCKUP_LIGHT,
  BEBAS_NEUE_STATIC,
] as const
