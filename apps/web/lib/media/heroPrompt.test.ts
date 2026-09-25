import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { HERO_STYLE_PROMPT, buildHeroPrompt, storySummary } from './heroPrompt'

const here = dirname(fileURLToPath(import.meta.url))

describe('media hero prompt builder', () => {
  it('keeps the style config empty until a direction is locked', () => {
    expect(HERO_STYLE_PROMPT).toBe('')
    const source = readFileSync(resolve(here, './heroPrompt.ts'), 'utf8')
    expect(source).toContain('HERO_STYLE_PROMPT')
    expect(source).toContain("pending George's lock")
    expect(source).not.toContain('#1B3C5A')
    expect(source).not.toContain('#F7F4EC')
    expect(source).not.toContain('#68A2B9')
    expect(source).not.toContain('#EF0E30')
  })

  it('sends title and summary only while the style config is empty', () => {
    const prompt = buildHeroPrompt({
      title: 'AI Is a Creative Tool, Not the Creative',
      excerpt: 'AI floods the board with options; the human owns the craft bar.',
    })
    expect(prompt).toBe(
      [
        'Title: AI Is a Creative Tool, Not the Creative',
        'Summary: AI floods the board with options; the human owns the craft bar.',
      ].join('\n'),
    )
    expect(prompt).not.toContain('\u2014')
  })

  it('uses thesis, then dek, then excerpt, and keeps the title on its own line', () => {
    expect(storySummary({ title: 'Title only' })).toBe('')
    expect(storySummary({
      title: 'The headline',
      thesis: 'The promise is loud, the proof is quiet.',
      dek: 'Dek line',
      excerpt: 'Excerpt line',
    })).toBe('The promise is loud, the proof is quiet.')
    expect(storySummary({
      title: 'The headline',
      dek: 'Day-to-day proof is quiet.',
      excerpt: 'Excerpt line',
    })).toBe('Day-to-day proof is quiet.')
    expect(storySummary({
      title: 'The headline',
      excerpt: 'Excerpt line',
    })).toBe('Excerpt line')

    expect(buildHeroPrompt({
      title: 'The headline',
      thesis: 'One idea',
      dek: 'Other idea',
      excerpt: 'Third idea',
    })).toBe('Title: The headline\nSummary: One idea')

    expect(buildHeroPrompt({ title: 'Title only' })).toBe('Title: Title only')
  })

  it('prepends a style string verbatim when one is supplied', () => {
    const prompt = buildHeroPrompt(
      { title: 'The headline', excerpt: 'A short summary.' },
      'Direction pending. Use the configured style string only.',
    )
    expect(prompt).toBe(
      [
        'Direction pending. Use the configured style string only.',
        '',
        'Title: The headline',
        'Summary: A short summary.',
      ].join('\n'),
    )
  })

  it('refuses to build a prompt with no story text', () => {
    expect(() => buildHeroPrompt({ title: '   ', excerpt: '\n' })).toThrow(/title, thesis, dek, or excerpt/)
  })
})
