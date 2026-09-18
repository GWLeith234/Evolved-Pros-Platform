import { existsSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const webRoot = resolve(__dirname, '../..')
const publicBrand = resolve(webRoot, 'public/brand')
const publicMasthead = resolve(webRoot, 'public/brand/masthead')

const PRODUCTION_MASTHEAD_LOCKUPS = [
  'barbell-disc.png',
  'fit-lockup-dark.png',
  'fit-lockup-light.png',
  'media-lockup-dark.png',
  'media-lockup-light.png',
  'megaphone-disc.png',
] as const

function stagingPathsUnder(root: string): string[] {
  if (!existsSync(root)) return []
  const hits: string[] = []
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const abs = resolve(dir, entry.name)
      if (entry.name === '_staging') hits.push(abs)
      if (entry.isDirectory()) walk(abs)
    }
  }
  walk(root)
  return hits
}

describe('public masthead _staging leftovers stay gone', () => {
  it('does not keep the public /brand/masthead/_staging tree', () => {
    expect(existsSync(resolve(publicMasthead, '_staging'))).toBe(false)
    expect(existsSync(resolve(publicMasthead, '_staging/md.p000.txt'))).toBe(false)
  })

  it('does not ship any _staging path under public/brand', () => {
    expect(stagingPathsUnder(publicBrand)).toEqual([])
  })

  it('keeps production masthead lockups in place', () => {
    for (const file of PRODUCTION_MASTHEAD_LOCKUPS) {
      expect(existsSync(resolve(publicMasthead, file)), file).toBe(true)
    }
  })
})
