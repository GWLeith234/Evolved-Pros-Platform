import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  ACADEMY_LOCKUP_DARK,
  ACADEMY_LOCKUP_LABEL,
  ACADEMY_LOCKUP_LIGHT,
  BEBAS_NEUE_STATIC,
  FAMILY_V5_LOCKUP_ASSETS,
  FIT_BARBELL_DISC,
  FIT_LOCKUP_DARK,
  FIT_LOCKUP_LABEL,
  FIT_LOCKUP_LIGHT,
  GOLD_LOCKUP_SHA256,
  MEDIA_LOCKUP_DARK,
  MEDIA_LOCKUP_LABEL,
  MEDIA_LOCKUP_LIGHT,
  MEDIA_MEGAPHONE_DISC,
  PODCAST_LOCKUP_DARK,
  PODCAST_LOCKUP_LABEL,
  PODCAST_LOCKUP_LIGHT,
  SHIPPED_LOCKUP_ASSETS,
} from './lockups'

const here = dirname(fileURLToPath(import.meta.url))
const webRoot = resolve(here, '..')

function publicFile(urlPath: string) {
  return resolve(webRoot, 'public', urlPath.replace(/^\//, ''))
}

function sha256File(abs: string) {
  return createHash('sha256').update(readFileSync(abs)).digest('hex')
}

describe('family v5 lockup assets', () => {
  it('ships the lockup/disc PNGs that already live on the Podcast font path', () => {
    for (const asset of SHIPPED_LOCKUP_ASSETS) {
      const abs = publicFile(asset)
      expect(existsSync(abs), abs).toBe(true)
      expect(readFileSync(abs).byteLength, abs).toBeGreaterThan(8)
    }
  })

  it('keeps family v5 dest paths, labels, and gold SHA-256 constants stable', () => {
    expect(PODCAST_LOCKUP_DARK).toBe('/brand/masthead/podcast-lockup-dark.png')
    expect(PODCAST_LOCKUP_LIGHT).toBe('/brand/masthead/podcast-lockup-light.png')
    expect(FIT_LOCKUP_DARK).toBe('/brand/masthead/fit-lockup-dark.png')
    expect(FIT_LOCKUP_LIGHT).toBe('/brand/masthead/fit-lockup-light.png')
    expect(MEDIA_LOCKUP_DARK).toBe('/brand/masthead/media-lockup-dark.png')
    expect(MEDIA_LOCKUP_LIGHT).toBe('/brand/masthead/media-lockup-light.png')
    expect(ACADEMY_LOCKUP_DARK).toBe('/brand/masthead/academy-lockup-dark.png')
    expect(ACADEMY_LOCKUP_LIGHT).toBe('/brand/masthead/academy-lockup-light.png')
    expect(MEDIA_MEGAPHONE_DISC).toBe('/brand/masthead/megaphone-disc.png')
    expect(FIT_BARBELL_DISC).toBe('/brand/masthead/barbell-disc.png')
    expect(BEBAS_NEUE_STATIC).toBe('/social-fonts/BebasNeue-Regular.ttf')
    expect(PODCAST_LOCKUP_LABEL).toBe('Evolved Pros Podcast')
    expect(FIT_LOCKUP_LABEL).toBe('Evolved Pros Fit')
    expect(MEDIA_LOCKUP_LABEL).toBe('Evolved Pros Media')
    expect(ACADEMY_LOCKUP_LABEL).toBe('Evolved Pros Academy')
    expect(GOLD_LOCKUP_SHA256['podcast-lockup-light.png']).toBe(
      '09242470412a0f19d750239427cb9b6f02c73478f4333ea2474cf2a731fd4ae0',
    )
    expect(GOLD_LOCKUP_SHA256['podcast-lockup-dark.png']).toBe(
      '8c3e38e4276aae9b2ab383ba7392aebe9806e982fef41a3c7d49f3fc8a891c19',
    )
    expect(GOLD_LOCKUP_SHA256['fit-lockup-light.png']).toBe(
      '7be96d88cc1e3eab218932d4f89bd849798fc71775934b68344ed61b743241ef',
    )
    expect(GOLD_LOCKUP_SHA256['fit-lockup-dark.png']).toBe(
      'aa2ce4c6c43cd36ccff27c3ad24558c09482026ebfac11de0947d7d648ac9545',
    )
    expect(GOLD_LOCKUP_SHA256['media-lockup-light.png']).toBe(
      '091892644837377c4e0a586f3d737f803886ae7cc38b5d32b3935704b2df1bbc',
    )
    expect(GOLD_LOCKUP_SHA256['media-lockup-dark.png']).toBe(
      '192631d5eb695325b20fdcc074961489a204b2573db89687725b266196ba4757',
    )
    expect(GOLD_LOCKUP_SHA256['academy-lockup-light.png']).toBe(
      '1ea85389df95b6a414a8baea47ee05f0adfa42b4a0c90aae25752bccf959ee3f',
    )
    expect(GOLD_LOCKUP_SHA256['academy-lockup-dark.png']).toBe(
      'cd6536e38b3271c3de94276e8c088ef6e0dd794b29761e247b1853d37814bbd3',
    )
    expect(FAMILY_V5_LOCKUP_ASSETS).toHaveLength(8)
  })

  it('does not type the family wordmark in Podcast or Academy chrome', () => {
    const podcast = readFileSync(
      resolve(webRoot, 'components/podcast/PodcastMasthead.tsx'),
      'utf8',
    )
    expect(podcast).toContain('PODCAST_LOCKUP_DARK')
    expect(podcast).toContain('PODCAST_LOCKUP_LIGHT')
    expect(podcast).toContain('ep-podcast-masthead-logo--on-dark')
    expect(podcast).toContain('ep-podcast-masthead-logo--on-light')
    expect(podcast).not.toContain('The podcast')
    expect(podcast).not.toContain('The Evolved Pros')
    expect(podcast).not.toContain('megaphone-disc')
    expect(podcast).not.toContain('barbell-disc')
    expect(podcast).not.toMatch(/<svg /)

    const academy = readFileSync(
      resolve(webRoot, 'components/academy/AcademyMasthead.tsx'),
      'utf8',
    )
    expect(academy).toContain('ACADEMY_LOCKUP_DARK')
    expect(academy).toContain('ACADEMY_LOCKUP_LIGHT')
    expect(academy).toContain('ep-academy-masthead-logo--on-dark')
    expect(academy).toContain('ep-academy-masthead-logo--on-light')
    expect(academy).not.toContain('The Academy')
    expect(academy).not.toMatch(/<svg /)

    const academyPage = readFileSync(
      resolve(webRoot, 'app/(member)/academy/page.tsx'),
      'utf8',
    )
    expect(academyPage).toContain('<AcademyMastheadLockup')
    expect(academyPage).not.toMatch(/<h1[^>]*>\s*The Academy\s*<\/h1>/)

    const socialRoute = readFileSync(
      resolve(webRoot, 'app/api/social/[template]/route.tsx'),
      'utf8',
    )
    expect(socialRoute).toContain("public', 'social-fonts'")
    expect(existsSync(publicFile(BEBAS_NEUE_STATIC))).toBe(true)
  })

  it('Media lockup is Layout A, not the old EVOLVED [disc] MEDIA separator', () => {
    const media = readFileSync(
      resolve(webRoot, 'components/media/Masthead.tsx'),
      'utf8',
    )
    expect(media).toContain('EVOLVED PR [megaphone disc] S MEDIA')
    expect(media).not.toContain('EVOLVED [megaphone disc] MEDIA')
    expect(MEDIA_LOCKUP_LABEL).toBe('Evolved Pros Media')
  })

  it('scores each dest lockup MATCH, DIFF, or MISSING against gold SHA-256', () => {
    const rows = FAMILY_V5_LOCKUP_ASSETS.map(asset => {
      const name = asset.split('/').pop() as keyof typeof GOLD_LOCKUP_SHA256
      const abs = publicFile(asset)
      if (!existsSync(abs)) {
        return { name, status: 'MISSING', sha: null as string | null }
      }
      const sha = sha256File(abs)
      return { name, status: sha === GOLD_LOCKUP_SHA256[name] ? 'MATCH' : 'DIFF', sha }
    })

    expect(rows).toHaveLength(8)
    for (const row of rows) {
      expect(['MATCH', 'DIFF', 'MISSING']).toContain(row.status)
      if (row.status === 'MATCH') {
        expect(row.sha).toBe(GOLD_LOCKUP_SHA256[row.name])
      }
    }
  })
})
