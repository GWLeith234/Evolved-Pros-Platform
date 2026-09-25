import { describe, expect, it } from 'vitest'
import {
  HERO_COMPOSITION,
  HERO_HARD_NO_LIST,
  HERO_LIGHTING,
  HERO_PALETTE,
  HERO_PROMPT_OPENING,
  buildHeroPrompt,
  physicalMetaphor,
  storyThesis,
} from './heroPrompt'

const EXCERPT = 'AI floods the board with options; the human owns the craft bar.'

describe('media hero prompt builder', () => {
  it('fills the locked template with one metaphor and appends the hard NO list verbatim', () => {
    const prompt = buildHeroPrompt({
      title: 'AI Is a Creative Tool, Not the Creative',
      excerpt: EXCERPT,
    })

    expect(prompt).toBe(
      [
        HERO_PROMPT_OPENING,
        `${physicalMetaphor({ excerpt: EXCERPT })}, ${HERO_COMPOSITION}`,
        HERO_PALETTE,
        HERO_LIGHTING,
        HERO_HARD_NO_LIST,
      ].join(' '),
    )
    expect(prompt.endsWith(HERO_HARD_NO_LIST)).toBe(true)
    expect(prompt.split(HERO_HARD_NO_LIST)).toHaveLength(2)
    expect(prompt).toContain('#1B3C5A')
    expect(prompt).toContain('#F7F4EC')
    expect(prompt).toContain('#68A2B9')
    expect(prompt).toContain('#EF0E30')
    expect(prompt).toContain('single soft key light from upper left')
    expect(prompt).toContain('middle 30 percent of the width')
    expect(prompt).not.toContain('\u2014')
  })

  it('collapses title, thesis, dek, and excerpt to one metaphor, thesis first', () => {
    expect(storyThesis({
      title: 'Title only',
    })).toBe('Title only')

    expect(storyThesis({
      title: 'The headline',
      thesis: 'The promise is loud, the proof is quiet.',
      dek: 'Dek line',
      excerpt: 'Excerpt line',
    })).toBe('The promise is loud, the proof is quiet.')

    expect(storyThesis({
      title: 'The headline',
      dek: 'Day-to-day proof is quiet.',
      excerpt: 'Excerpt line',
    })).toBe('Day-to-day proof is quiet.')

    expect(storyThesis({
      title: 'The headline',
      excerpt: 'Excerpt line',
    })).toBe('Excerpt line')

    const prompt = buildHeroPrompt({
      title: 'The headline',
      thesis: 'One idea',
      dek: 'Other idea',
      excerpt: 'Third idea',
    })
    expect(prompt).toContain('symbolizes "One idea"')
    expect(prompt).not.toContain('Other idea')
    expect(prompt).not.toContain('Third idea')
    expect(prompt).not.toContain('The headline')
    expect(prompt.match(/symbolizes/g)).toHaveLength(1)
  })

  it('keeps a subject override inside the fixed frame and still appends the NO list', () => {
    const prompt = buildHeroPrompt({
      title: 'Should not appear',
      subject: 'A single unbranded brass balance scale',
    })
    expect(prompt.startsWith(HERO_PROMPT_OPENING)).toBe(true)
    expect(prompt).toContain(`A single unbranded brass balance scale, ${HERO_COMPOSITION}`)
    expect(prompt).toContain(HERO_PALETTE)
    expect(prompt).toContain(HERO_LIGHTING)
    expect(prompt.endsWith(HERO_HARD_NO_LIST)).toBe(true)
    expect(prompt).not.toContain('Should not appear')
  })

  it('refuses to build a prompt with no story idea', () => {
    expect(() => buildHeroPrompt({ title: '   ', excerpt: '\n' })).toThrow(/title, thesis, dek, or excerpt/)
  })
})
