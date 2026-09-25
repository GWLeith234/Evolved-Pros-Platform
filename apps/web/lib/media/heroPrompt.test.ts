import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  HERO_IMAGE_CREDIT,
  HERO_NEGATIVE_BLOCK,
  HERO_STYLE_PROMPT,
  buildHeroPrompt,
  heroImageCreditForUrl,
  storySummary,
} from './heroPrompt'

const here = dirname(fileURLToPath(import.meta.url))

describe('media hero prompt builder', () => {
  it('ships a non-empty locked prompt, the verbatim negative block, and the exact credit', () => {
    expect(HERO_STYLE_PROMPT.trim().length).toBeGreaterThan(0)
    expect(HERO_NEGATIVE_BLOCK.trim().length).toBeGreaterThan(0)
    expect(HERO_STYLE_PROMPT).toContain(HERO_NEGATIVE_BLOCK)
    expect(HERO_NEGATIVE_BLOCK.startsWith('Absolutely no text, no letters, no numbers')).toBe(true)
    expect(HERO_NEGATIVE_BLOCK).toContain(
      'Also never: eye contact with the lens, posed or symmetrical stances',
    )
    expect(HERO_STYLE_PROMPT).toContain('realistic documentary photography with people')
    expect(HERO_STYLE_PROMPT).toContain('Candid photograph, 16:9.')
    expect(HERO_STYLE_PROMPT).toContain('{ACTION: the literal task from the story, mid-task, eyes on the work}')
    expect(HERO_IMAGE_CREDIT).toBe('Illustration: AI-generated image by Evolved Pros')
    expect(HERO_STYLE_PROMPT).not.toContain('\u2014')
    expect(HERO_NEGATIVE_BLOCK).not.toContain('\u2014')
    expect(HERO_IMAGE_CREDIT).not.toContain('\u2014')

    const source = readFileSync(resolve(here, './heroPrompt.ts'), 'utf8')
    expect(source).not.toContain("pending George's lock")

    const prompt = buildHeroPrompt({
      title: 'AI Is a Creative Tool, Not the Creative',
      excerpt: 'AI floods the board with options; the human owns the craft bar.',
    })
    expect(prompt.trim().length).toBeGreaterThan(0)
    expect(prompt).toContain(HERO_NEGATIVE_BLOCK)
    expect(prompt).toContain(
      'AI floods the board with options; the human owns the craft bar., mid-task, eyes on the work',
    )
    expect(prompt).not.toContain('{ACTION:')
    expect(prompt).not.toContain('{SETTING:')
    expect(prompt).not.toContain('{NEGATIVE BLOCK')
    expect(prompt).not.toContain('\u2014')
  })

  it('uses thesis, then dek, then excerpt for the task slot', () => {
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

    const prompt = buildHeroPrompt({
      title: 'The headline',
      thesis: 'One idea',
      dek: 'Other idea',
      excerpt: 'Third idea',
    })
    expect(prompt).toContain('One idea, mid-task, eyes on the work')
    expect(prompt).not.toContain('Other idea')
    expect(prompt).not.toContain('Third idea')
  })

  it('returns the credit only for pipeline hero files', () => {
    expect(heroImageCreditForUrl(
      'https://udbwrapkshfjkctylbmm.supabase.co/storage/v1/object/public/Branding/media-heroes/ai-tool/hero-16x9.png',
    )).toBe(HERO_IMAGE_CREDIT)
    expect(heroImageCreditForUrl('https://images.unsplash.com/photo-1')).toBeNull()
    expect(heroImageCreditForUrl(null)).toBeNull()
    expect(heroImageCreditForUrl('')).toBeNull()
  })

  it('refuses to build a prompt with no story text', () => {
    expect(() => buildHeroPrompt({ title: '   ', excerpt: '\n' })).toThrow(/title, thesis, dek, or excerpt/)
  })
})
