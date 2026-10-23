import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const webRoot = resolve(__dirname, '../..')

/**
 * Academy UI that nothing mounts.
 *
 * The member hub renders CourseCard directly. Lesson notes live in
 * LessonLayer (local save). Locked pillars use PillarLockPanel.
 */
const ORPHAN_PATHS = [
  'components/academy/CourseGrid.tsx',
  'components/academy/LessonNotes.tsx',
  'components/academy/UpgradePrompt.tsx',
] as const

const ORPHAN_SYMBOLS = ['CourseGrid', 'LessonNotes', 'UpgradePrompt'] as const

const SKIP_DIRS = new Set(['node_modules', '.next', 'coverage', 'public', 'fonts'])

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(ent.name)) continue
    const abs = join(dir, ent.name)
    if (ent.isDirectory()) sourceFiles(abs, out)
    else if (/\.(ts|tsx|js|jsx|css)$/.test(ent.name) && !/\.test\.(ts|tsx)$/.test(ent.name)) {
      out.push(abs)
    }
  }
  return out
}

describe('unmounted academy leftovers stay gone', () => {
  it('does not keep the unused course grid, lesson notes, or upgrade prompt', () => {
    for (const rel of ORPHAN_PATHS) {
      expect(existsSync(resolve(webRoot, rel)), rel).toBe(false)
    }
  })

  it('does not import those modules from any web source file', () => {
    const hits: string[] = []
    for (const file of sourceFiles(webRoot)) {
      const src = readFileSync(file, 'utf8')
      if (ORPHAN_SYMBOLS.some(symbol => src.includes(symbol))) {
        hits.push(relative(webRoot, file))
      }
    }
    expect(hits).toEqual([])
  })

  it('keeps the mounted academy replacements', () => {
    const page = readFileSync(resolve(webRoot, 'app/(member)/academy/page.tsx'), 'utf8')
    expect(page).toContain("from '@/components/academy/CourseCard'")
    expect(page).toContain('<CourseCard')
    expect(page).not.toContain('CourseGrid')

    const shell = readFileSync(resolve(webRoot, 'components/academy/PillarPageShell.tsx'), 'utf8')
    expect(shell).toContain("from '@/components/academy/PillarLockPanel'")
    expect(shell).not.toContain('UpgradePrompt')

    const lesson = readFileSync(
      resolve(webRoot, 'app/(member)/academy/[pillarSlug]/[lessonSlug]/LessonLayer.tsx'),
      'utf8',
    )
    expect(lesson).toContain('id="lesson-notes"')
    expect(lesson).toContain('Saved locally')
    expect(lesson).not.toContain('LessonNotes')
  })
})
