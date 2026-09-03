import { existsSync } from 'node:fs'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const here = dirname(fileURLToPath(import.meta.url))

describe('guest still order', () => {
  it('episodePosterUrl prefers guest_image_url over thumbnail_url', () => {
    const src = readFileSync(resolve(here, 'public.ts'), 'utf8')
    const fn = src.slice(src.indexOf('export function episodePosterUrl'))
    expect(fn).toMatch(/guest_image_url\?\.trim\(\)[\s\S]*thumbnail_url\?\.trim\(\)/)
  })

  it('listing cover prefers guest_image_url over thumbnail_url', () => {
    const src = readFileSync(resolve(here, 'transforms.ts'), 'utf8')
    expect(src).toMatch(/cover:\s*row\.guest_image_url\s*\?\?\s*row\.thumbnail_url/)
  })
})

describe('Juan Ep 010 public still', () => {
  const asset = resolve(here, '../../public/podcast/guests/juan-fernandez.jpg')
  const migration = resolve(here, '../../../../supabase/migrations/083_juan_ep010_guest_still.sql')

  it('ships the full-head still as a public platform asset', () => {
    expect(existsSync(asset)).toBe(true)
  })

  it('points the live Ep 010 slug at that asset and does not invent one', () => {
    const sql = readFileSync(migration, 'utf8')
    expect(sql).toContain("slug = 'evolved-pros-podcast-ep-010-juan-fernandez'")
    expect(sql).toContain("episode_number = 10")
    expect(sql).toContain("/podcast/guests/juan-fernandez.jpg")
    expect(sql).not.toContain('juan-fernandez-ep-010')
  })
})
