import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const webRoot = resolve(__dirname, '../..')

/**
 * Left behind after the Home rewrites:
 * - HomeContextStrip unmounted when #111 locked member Home to the three-band IA
 * - MarvelSkyScene only served WelcomeBanner, which #172 deleted
 */
const ORPHAN_PATHS = [
  'components/home/HomeContextStrip.tsx',
  'components/home/scenes/MarvelSkyScene.tsx',
]

describe('post-band home orphans stay gone', () => {
  it('does not keep the unmounted context strip or welcome-banner sky scenes', () => {
    for (const rel of ORPHAN_PATHS) {
      expect(existsSync(resolve(webRoot, rel)), rel).toBe(false)
    }
    expect(existsSync(resolve(webRoot, 'components/home/scenes'))).toBe(false)
  })

  it('does not remount those modules from member Home', () => {
    const page = readFileSync(resolve(webRoot, 'app/(member)/home/page.tsx'), 'utf8')
    expect(page).not.toMatch(/HomeContextStrip|MarvelSkyScene/)
  })

  it('does not import them from any web source file', () => {
    const root = resolve(webRoot)
    const hits: string[] = []
    const skip = new Set(['node_modules', '.next', 'weekly-reports'])

    function walk(dir: string) {
      for (const ent of readdirSync(dir, { withFileTypes: true })) {
        if (skip.has(ent.name)) continue
        const full = resolve(dir, ent.name)
        if (ent.isDirectory()) {
          walk(full)
          continue
        }
        if (!/\.(tsx?|jsx?|css)$/.test(ent.name)) continue
        if (ent.name === 'dead-post-band-orphans.lock.test.ts') continue
        const text = readFileSync(full, 'utf8')
        if (/HomeContextStrip|MarvelSkyScene|MarvelScenePeriod/.test(text)) {
          hits.push(full.slice(root.length + 1))
        }
      }
    }

    walk(root)
    expect(hits).toEqual([])
  })
})
