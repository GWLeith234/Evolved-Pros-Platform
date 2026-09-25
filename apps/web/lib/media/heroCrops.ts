import sharp from 'sharp'

/**
 * Output set for one story. Center crop (`cover` + centre) so every frame
 * keeps the middle of the picture.
 * Files: media-heroes/{slug}/{variant}.png
 */
export const HERO_CROP_SIZES = {
  'hero-16x9': { width: 1920, height: 1080 },
  '1x1': { width: 1080, height: 1080 },
  '4x5': { width: 1080, height: 1350 },
  '9x16': { width: 1080, height: 1920 },
  'og-1200x630': { width: 1200, height: 630 },
} as const

export type HeroVariant = keyof typeof HERO_CROP_SIZES

export const HERO_VARIANTS = Object.keys(HERO_CROP_SIZES) as HeroVariant[]

export const HERO_BUCKET = 'Branding'

export function heroSlug(slug: string): string {
  const safe = slug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
  return safe || 'story'
}

export function heroObjectPath(slug: string, variant: HeroVariant, optionId?: string): string {
  const safe = heroSlug(slug)
  if (!optionId) return `media-heroes/${safe}/${variant}.png`
  const opt = optionId.toLowerCase().replace(/[^a-z0-9]/g, '')
  if (!opt) throw new Error('A hero option id is required')
  return `media-heroes/${safe}/options/${opt}/${variant}.png`
}

export async function cropHeroVariants(source: Buffer): Promise<Record<HeroVariant, Buffer>> {
  const entries = await Promise.all(
    HERO_VARIANTS.map(async (variant) => {
      const size = HERO_CROP_SIZES[variant]
      const png = await sharp(source)
        .rotate()
        .resize(size.width, size.height, { fit: 'cover', position: 'centre' })
        .png()
        .toBuffer()
      return [variant, png] as const
    }),
  )
  return Object.fromEntries(entries) as Record<HeroVariant, Buffer>
}
