/**
 * Navy Hour Still Life prompt. George locked the house style on 2026-09-24
 * (STYLE-LOCK). Palette, lighting, composition, and the hard NO list are fixed
 * and appended verbatim. Title, thesis, dek, and excerpt collapse to one
 * physical metaphor in the subject slot.
 */

export const HERO_STYLE_LOCK = '2026-09-24'

export const HERO_PROMPT_OPENING =
  'Cinematic editorial still life photograph, 16:9 wide frame.'

export const HERO_COMPOSITION =
  'placed dead center and small in frame, occupying only the middle 30 percent of the width, with wide empty atmospheric space on the left and right.'

export const HERO_PALETTE =
  'Deep navy blue (#1B3C5A) backdrop fading into soft shadow, ivory (#F7F4EC) matte surface, cool teal (#68A2B9) rim light, one small vivid red (#EF0E30) accent on the subject.'

export const HERO_LIGHTING =
  'Low-key lighting, single soft key light from upper left, faint volumetric haze, shallow depth of field, 50mm lens, subtle film grain, premium magazine cover mood, calm and minimal.'

/** Hard NO list from the locked template. Append verbatim. Do not paraphrase. */
export const HERO_HARD_NO_LIST =
  'No people, no faces, no hands, no text, no letters, no numbers, no signage, no logos, no brand names, no watermarks, no screens with readable content.'

export interface HeroBrief {
  title?: string | null
  thesis?: string | null
  dek?: string | null
  excerpt?: string | null
  /** Noun phrase override. Composition, palette, lighting, and the NO list still append. */
  subject?: string | null
}

const THESIS_MAX = 280

function cleanThesis(value: string | null | undefined): string {
  if (!value) return ''
  const cleaned = value.replace(/[\r\n]+/g, ' ').replace(/"/g, "'").replace(/\s+/g, ' ').trim()
  if (!cleaned) return ''
  if (cleaned.length <= THESIS_MAX) return cleaned
  return cleaned.slice(0, THESIS_MAX).trim()
}

/**
 * One story idea. Thesis wins, then dek, then excerpt, then title.
 * A single string so the image is one metaphor, not a stack of subjects.
 */
export function storyThesis(brief: HeroBrief): string {
  const candidates = [brief.thesis, brief.dek, brief.excerpt, brief.title]
  for (const value of candidates) {
    const cleaned = cleanThesis(value)
    if (cleaned) return cleaned
  }
  return ''
}

/** One physical object or small arrangement. No second subject. */
export function physicalMetaphor(brief: HeroBrief): string {
  const thesis = storyThesis(brief)
  if (!thesis) return ''
  return `one physical object or small arrangement that symbolizes "${thesis}"`
}

export function buildHeroPrompt(brief: HeroBrief): string {
  const subject = cleanThesis(brief.subject) || physicalMetaphor(brief)
  if (!subject) {
    throw new Error('A story title, thesis, dek, or excerpt is required to build hero art')
  }
  return [
    HERO_PROMPT_OPENING,
    `${subject}, ${HERO_COMPOSITION}`,
    HERO_PALETTE,
    HERO_LIGHTING,
    HERO_HARD_NO_LIST,
  ].join(' ')
}
