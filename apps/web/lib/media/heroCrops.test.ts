import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import {
  HERO_CROP_SIZES,
  HERO_VARIANTS,
  cropHeroVariants,
  heroObjectPath,
} from './heroCrops'

async function centerPixel(png: Buffer): Promise<{ rgb: number[]; width: number; height: number }> {
  const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true })
  const x = Math.floor(info.width / 2)
  const y = Math.floor(info.height / 2)
  const i = (y * info.width + x) * info.channels
  return {
    rgb: [data[i] ?? 0, data[i + 1] ?? 0, data[i + 2] ?? 0],
    width: info.width,
    height: info.height,
  }
}

async function cornerPixel(png: Buffer): Promise<number[]> {
  const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true })
  return [data[0] ?? 0, data[1] ?? 0, data[2] ?? 0]
}

describe('media hero crops', () => {
  it('locks the output sizes for 16:9, square, 4:5, 9:16, and OG', () => {
    expect(HERO_CROP_SIZES['hero-16x9']).toEqual({ width: 1920, height: 1080 })
    expect(HERO_CROP_SIZES['1x1']).toEqual({ width: 1080, height: 1080 })
    expect(HERO_CROP_SIZES['4x5']).toEqual({ width: 1080, height: 1350 })
    expect(HERO_CROP_SIZES['9x16']).toEqual({ width: 1080, height: 1920 })
    expect(HERO_CROP_SIZES['og-1200x630']).toEqual({ width: 1200, height: 630 })
    expect(HERO_VARIANTS).toEqual(['hero-16x9', '1x1', '4x5', '9x16', 'og-1200x630'])

    expect(heroObjectPath('AI Tool', 'hero-16x9')).toBe('media-heroes/ai-tool/hero-16x9.png')
    expect(heroObjectPath('ai-tool', '1x1')).toBe('media-heroes/ai-tool/1x1.png')
    expect(heroObjectPath('ai-tool', '4x5')).toBe('media-heroes/ai-tool/4x5.png')
    expect(heroObjectPath('ai-tool', '9x16')).toBe('media-heroes/ai-tool/9x16.png')
    expect(heroObjectPath('ai-tool', 'og-1200x630')).toBe('media-heroes/ai-tool/og-1200x630.png')
    expect(heroObjectPath('ai-tool', 'hero-16x9', 'ab12')).toBe(
      'media-heroes/ai-tool/options/ab12/hero-16x9.png',
    )
  })

  it('center-crops every variant to those dimensions and keeps the subject', async () => {
    const width = 1920
    const height = 1080
    const base = await sharp({
      create: {
        width,
        height,
        channels: 3,
        background: { r: 27, g: 60, b: 90 },
      },
    })
      .png()
      .toBuffer()

    const left = await sharp({
      create: { width: 200, height, channels: 3, background: { r: 0, g: 180, b: 80 } },
    }).png().toBuffer()
    const right = await sharp({
      create: { width: 200, height, channels: 3, background: { r: 0, g: 40, b: 200 } },
    }).png().toBuffer()
    const subject = await sharp({
      create: { width: 240, height: 240, channels: 3, background: { r: 239, g: 14, b: 48 } },
    }).png().toBuffer()

    const source = await sharp(base)
      .composite([
        { input: left, left: 0, top: 0 },
        { input: right, left: width - 200, top: 0 },
        { input: subject, left: Math.floor((width - 240) / 2), top: Math.floor((height - 240) / 2) },
      ])
      .png()
      .toBuffer()

    const crops = await cropHeroVariants(source)
    const red = [239, 14, 48]
    const edge = [0, 180, 80]

    for (const variant of HERO_VARIANTS) {
      const size = HERO_CROP_SIZES[variant]
      const center = await centerPixel(crops[variant])
      expect(center.width).toBe(size.width)
      expect(center.height).toBe(size.height)
      expect(center.rgb).toEqual(red)
    }

    const portraitCorner = await cornerPixel(crops['9x16'])
    expect(portraitCorner).not.toEqual(edge)
    const squareCorner = await cornerPixel(crops['1x1'])
    expect(squareCorner).not.toEqual(edge)
  })
})
