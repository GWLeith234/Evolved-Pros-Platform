import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const src = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), '../../components/media/Masthead.tsx'),
  'utf8',
)

describe('Media masthead chrome', () => {
  it('does not ship dead hashes, a fake issue number, or a broken Search', () => {
    expect(src).not.toMatch(/#revenue|#ai|#leadership|#pillars|#desk/)
    expect(src).not.toMatch(/Issue \{/)
    expect(src).not.toMatch(/№/)
    expect(src).not.toMatch(/aria-label="Search"/)
    expect(src).not.toMatch(/George.?s Desk/)
  })
})
