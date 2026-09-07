import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  BEBAS_NEUE_STATIC,
  FIT_BARBELL_DISC,
  FIT_LOCKUP_DARK,
  FIT_LOCKUP_LIGHT,
  MASTHEAD_LOCKUP_ASSETS,
  MEDIA_LOCKUP_DARK,
  MEDIA_LOCKUP_LIGHT,
  MEDIA_MEGAPHONE_DISC,
} from './lockups'

const here = dirname(fileURLToPath(import.meta.url))
const webRoot = resolve(here, '..')
const repoRoot = resolve(webRoot, '../..')

function publicFile(urlPath: string) {
  return resolve(webRoot, 'public', urlPath.replace(/^\//, ''))
}

describe('Media + Fit lockup assets', () => {
  it('ships the ship-pack discs, lockups, and Bebas Neue Regular', () => {
    for (const asset of MASTHEAD_LOCKUP_ASSETS) {
      const abs = publicFile(asset)
      expect(existsSync(abs), abs).toBe(true)
      expect(readFileSync(abs).byteLength, abs).toBeGreaterThan(8)
    }
    expect(existsSync(resolve(repoRoot, 'fonts/static/BebasNeue-Regular.ttf'))).toBe(true)
  })

  it('keeps theme pairs and disc paths stable', () => {
    expect(MEDIA_MEGAPHONE_DISC).toBe('/brand/masthead/megaphone-disc.png')
    expect(FIT_BARBELL_DISC).toBe('/brand/masthead/barbell-disc.png')
    expect(MEDIA_LOCKUP_DARK).toBe('/brand/masthead/media-lockup-dark.png')
    expect(MEDIA_LOCKUP_LIGHT).toBe('/brand/masthead/media-lockup-light.png')
    expect(FIT_LOCKUP_DARK).toBe('/brand/masthead/fit-lockup-dark.png')
    expect(FIT_LOCKUP_LIGHT).toBe('/brand/masthead/fit-lockup-light.png')
    expect(BEBAS_NEUE_STATIC).toBe('/fonts/static/BebasNeue-Regular.ttf')
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
    const css = readFileSync(resolve(webRoot, 'app/globals.css'), 'utf8')
    expect(css).toContain("url('/fonts/static/BebasNeue-Regular.ttf')")
  })
})
