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

  it('names the H1 Evolved Pros Media', () => {
    expect(src).toMatch(/data-masthead-evolved[\s\S]*Evolved/)
    expect(src).toMatch(/data-masthead-media[\s\S]*Pros Media/)
    expect(src).toMatch(/Promoting evolution\. The topics George/)
    expect(src).not.toMatch(/Promoting evolution &mdash;/)
  })

  it('keeps the red / navy split and thickens Evolved by weight, not size', () => {
    expect(src).toMatch(/data-masthead-evolved[\s\S]*color: '#C9302A'[\s\S]*fontWeight: 900/)
    expect(src).toMatch(/data-masthead-media[\s\S]*color: '#112535'/)
    expect(src).toMatch(/fontSize: 'clamp\(40px, 9vw, 108px\)'/)
    const evolved = src.slice(src.indexOf('data-masthead-evolved'), src.indexOf('data-masthead-media'))
    expect(evolved).toMatch(/fontWeight: 900/)
    expect(evolved).not.toMatch(/fontSize:/)
  })
})
