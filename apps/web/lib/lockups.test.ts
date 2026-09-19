import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import {
  BEBAS_NEUE_STATIC,
  FIT_BARBELL_DISC,
  FIT_LOCKUP_DARK,
  FIT_LOCKUP_LIGHT,
  GOLD_MEDIA_LOCKUP_SHA256,
  MASTHEAD_LOCKUP_ASSETS,
  MEDIA_LOCKUP_DARK,
  MEDIA_LOCKUP_LIGHT,
  MEDIA_MEGAPHONE_DISC,
} from './lockups'

const here = dirname(fileURLToPath(import.meta.url))
const webRoot = resolve(here, '..')

function publicFile(urlPath: string) {
  return resolve(webRoot, 'public', urlPath.replace(/^\//, ''))
}

describe('Media + Fit lockup assets', () => {
  it('ships the lockup/disc PNGs and Bebas Neue Regular on the Podcast font path', () => {
    for (const asset of MASTHEAD_LOCKUP_ASSETS) {
      const abs = publicFile(asset)
      expect(existsSync(abs), abs).toBe(true)
      expect(readFileSync(abs).byteLength, abs).toBeGreaterThan(8)
    }
  })

  it('ferries file-exact gold Media v5 lockup PNGs (SHA-256 MATCH)', () => {
    const dests = {
      'media-lockup-dark.png': MEDIA_LOCKUP_DARK,
      'media-lockup-light.png': MEDIA_LOCKUP_LIGHT,
    } as const
    for (const [name, urlPath] of Object.entries(dests)) {
      const abs = publicFile(urlPath)
      const sha = createHash('sha256').update(readFileSync(abs)).digest('hex')
      expect(sha, `${name} must be the gold v5 file`).toBe(GOLD_MEDIA_LOCKUP_SHA256[name])
    }
  })

  it('keeps theme pairs, disc paths, and the social-fonts Bebas path stable', () => {
    expect(MEDIA_MEGAPHONE_DISC).toBe('/brand/masthead/megaphone-disc.png')
    expect(FIT_BARBELL_DISC).toBe('/brand/masthead/barbell-disc.png')
    expect(MEDIA_LOCKUP_DARK).toBe('/brand/masthead/media-lockup-dark.png')
    expect(MEDIA_LOCKUP_LIGHT).toBe('/brand/masthead/media-lockup-light.png')
    expect(FIT_LOCKUP_DARK).toBe('/brand/masthead/fit-lockup-dark.png')
    expect(FIT_LOCKUP_LIGHT).toBe('/brand/masthead/fit-lockup-light.png')
    expect(BEBAS_NEUE_STATIC).toBe('/social-fonts/BebasNeue-Regular.ttf')
  })

  it('keeps MEDIA_LOCKUP_DARK white-letter and MEDIA_LOCKUP_LIGHT navy-letter', async () => {
    async function letterBias(urlPath: string) {
      const { data, info } = await sharp(publicFile(urlPath))
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true })
      let dark = 0
      let light = 0
      for (let i = 0; i < data.length; i += info.channels) {
        const a = info.channels === 4 ? data[i + 3] : 255
        if (a < 20) continue
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        if (r > 180 && g < 90 && b < 90) continue
        const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
        if (lum < 80) dark += 1
        else if (lum > 200) light += 1
      }
      return { dark, light }
    }

    const onDark = await letterBias(MEDIA_LOCKUP_DARK)
    const onLight = await letterBias(MEDIA_LOCKUP_LIGHT)
    expect(onDark.light).toBeGreaterThan(onDark.dark * 8)
    expect(onLight.dark).toBeGreaterThan(onLight.light * 2)
  })

  it('does not change the Podcast masthead except shared font availability', () => {
    const podcast = readFileSync(
      resolve(webRoot, 'components/podcast/PodcastMasthead.tsx'),
      'utf8',
    )
    expect(podcast).toContain('The podcast')
    expect(podcast).toContain('var(--font-bebas)')
    expect(podcast).not.toContain('megaphone-disc')
    expect(podcast).not.toContain('barbell-disc')
    const socialRoute = readFileSync(
      resolve(webRoot, 'app/api/social/[template]/route.tsx'),
      'utf8',
    )
    expect(socialRoute).toContain("public', 'social-fonts'")
    expect(existsSync(publicFile(BEBAS_NEUE_STATIC))).toBe(true)
  })
})
