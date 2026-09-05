import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { MEDIA_DESK_TAGLINE } from './brand'

const EM_DASH = '\u2014'
const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '../../../..')

const USER_FACING = [
  resolve(here, '../../components/media/Masthead.tsx'),
  resolve(here, '../../components/media/MediaMastheadRail.tsx'),
  resolve(here, '../../app/(public)/media/MediaPortalClient.tsx'),
  resolve(here, './brand.ts'),
  resolve(here, './desk.ts'),
]

describe('Media copy hygiene', () => {
  it('keeps leftover desk copy free of manifesto language and em dashes', () => {
    expect(MEDIA_DESK_TAGLINE).toBe(
      'The Evolved Pros desk for sales, identity, and execution stories.',
    )
    expect(MEDIA_DESK_TAGLINE).not.toMatch(/Promoting evolution/)
    expect(MEDIA_DESK_TAGLINE).not.toContain(EM_DASH)
    const masthead = readFileSync(
      resolve(here, '../../components/media/Masthead.tsx'),
      'utf8',
    )
    expect(masthead).not.toMatch(/MEDIA_DESK_TAGLINE/)
    expect(masthead).not.toContain(MEDIA_DESK_TAGLINE)
  })

  it('keeps user-facing Media chrome free of em dashes', () => {
    for (const file of USER_FACING) {
      const src = readFileSync(file, 'utf8')
      expect(src, file).not.toContain(EM_DASH)
    }
  })

  it('keeps rewritten Media markdown free of em dashes and Bottom Line headers', () => {
    const dir = join(repoRoot, 'content/media')
    const files = readdirSync(dir).filter(f => f.endsWith('.md'))
    expect(files.length).toBeGreaterThanOrEqual(5)
    for (const file of files) {
      const src = readFileSync(join(dir, file), 'utf8')
      expect(src, file).not.toContain(EM_DASH)
      expect(src, file).not.toMatch(/^## The Bottom Line$/m)
      expect(src, file).not.toMatch(/THE CONFESSION BEFORE THE PRINCIPLE/)
      expect(src, file).not.toMatch(/watch your numbers transform/)
    }
  })

  it('rewrites the five live card titles without em dashes', () => {
    const dir = join(repoRoot, 'content/media')
    const blob = readdirSync(dir)
      .filter(f => f.endsWith('.md'))
      .map(f => readFileSync(join(dir, f), 'utf8'))
      .join('\n')
    expect(blob).toContain("Everyone Wants the Advanced Playbook. It's Just the Basics, Done Without Shortcuts")
    expect(blob).toContain("The Reps Who Hit Their Number Aren't More Talented. They're More Consistent")
    expect(blob).toContain("Mental Toughness Isn't a Mindset. It's a Practice With a Brutal Entry Fee")
    expect(blob).toContain('The Industry Teaches You to Stand Out. Nobody Teaches You to Stand for Something')
    const sql = readFileSync(join(repoRoot, 'supabase/migrations/086_media_desk_copy_cull.sql'), 'utf8')
    expect(sql).toContain("What Happened to Claude''s Fable 5, and Why Sales Pros Should Care")
    expect(sql).toContain('the most useful tool a small team has ever had')
    expect(sql).toContain('## Still carrying the bag')
  })
})
