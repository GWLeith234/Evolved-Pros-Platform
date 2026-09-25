/**
 * House hero prompt. George locked this direction at 8:31pm Regina on 2026-09-24:
 * AI-generated realistic documentary photography with people.
 * Section 1 is the style. Section 3 keeps the {slots} this module fills per story.
 * Section 4 is the negative block, pasted verbatim.
 */

export const HERO_IMAGE_CREDIT = 'Illustration: AI-generated image by Evolved Pros'

/** Section 2 settings the pipeline already sends. Model id stays on XAI_IMAGE_MODEL. */
export const HERO_IMAGE_ASPECT_RATIO = '16:9'
export const HERO_IMAGE_RESOLUTION = '2k'

export const HERO_NEGATIVE_BLOCK = [
  'Absolutely no text, no letters, no numbers, no readable writing on paper, no signage, no watermarks, no logos, no brand marks; laptops and phones are plain unbranded with no logo; every screen is out of focus with only soft blurred color shapes and no readable interface. No symbolic or metaphorical props, no staged studio set, not stock photography, not glossy, not CGI. Paper, notebooks, sticky notes and whiteboards are completely blank or face-down with no marks, no scribbles and no handwriting. Facial expression is subtle and understated, not exaggerated. Hardware is generic and unmarked: monitor bezels are plain smooth matte black with no emblem, no badge, no dot, no light, no mark of any kind on the bezel or stand; headphones and headsets are plain matte black with smooth, completely unmarked ear cups and headband, no print, no lettering, no emblem; keyboards have blank keycaps; mugs and cups are plain solid color with no print. Any paper visible is plain blank white with nothing printed on it, or turned face down showing a blank back; no type, no lines, no rows of text-like marks on any paper.',
  'Also never: eye contact with the lens, posed or symmetrical stances, grins or exaggerated expressions, plastic or airbrushed skin, model-perfect faces, lightbulbs, chess pieces, puzzle pieces, rockets, arrows, handshakes over a desk, or any other metaphor prop, navy or red walls or gels, a recognizable face or public figure.',
].join('\n\n')

const HERO_STYLE_SECTION = [
  'AI-generated, realistic documentary photography with people. It should read like a photojournalist on assignment for a business magazine.',
  'The scene shows the real work the story is about, taken literally. It is not a metaphor.',
  'Candid and unposed. The subject sits off-center (rule of thirds). Nobody looks at the lens.',
  'Real, cluttered, lived-in workplaces: cables, cups, coffee rings, papers, screens, colleagues in the background.',
  'Natural light (window light mixed with practical lamps and screen glow). Shallow depth of field, 35mm at about f/2, subtle film grain, true-to-life muted color.',
  'Real skin: pores, fine lines, small blemishes, uneven tone, stray hairs. Ordinary generic people, not models.',
  'Layered depth: an out-of-focus foreground object, the subject in the midground, a busy real background.',
  'EP navy #1B3C5A and EP red #EF0E30 appear only as natural accents on real objects (a navy sweater, cardigan or jacket, a red mug). Never as painted walls, backdrops, lighting gels or graphics.',
  'No text in the image, no logos, no real or recognizable people.',
  'No-people frames are a fallback only: use one when a people frame fails 4 rounds, or when the story cannot show people honestly.',
].join(' ')

const HERO_PROMPT_TEMPLATE = [
  "Candid photograph, 16:9. {SETTING: the real workplace where this story's work happens, time of day}: {SUBJECT: an ordinary person, age range, wearing {NAVY ITEM}} sits/stands {left of center | right of center}, {ACTION: the literal task from the story, mid-task, eyes on the work}; {SECONDARY: optional colleague, partly cut off or softly out of focus, doing a related task}. {SCREENS/OBJECTS: what is on the desk, all screens soft blurred color shapes}. Foreground: out-of-focus {FOREGROUND OBJECT} and a red mug. Background: {BACKGROUND: colleagues, window light, clutter specific to this workplace}. Documentary editorial realism, shot on assignment by a photojournalist for a business magazine feature: candid unposed moment, natural window light mixed with practical lamps and screen glow, shallow depth of field on a 35mm full-frame camera at f/2, subtle film grain, true-to-life muted-natural color, real textures, lived-in and slightly messy, imperfect surfaces, dust, fingerprints, creases. Layered depth: an out-of-focus foreground object, the main subject in the midground, and a busy real background. Off-center rule-of-thirds framing, with the subject's face and hands inside the central third so a 9:16 center crop keeps them. Deep navy blue and signal red appear only as small natural accents in real objects, never as painted walls or backdrops. People are ordinary, generic, anonymous, not models, with real skin: visible pores, fine lines, slight blemishes, natural uneven skin tone, stray hairs, and they do not resemble any real or famous person. Nobody looks at the camera. Relaxed asymmetrical natural body posture. Hands natural with five fingers.",
  HERO_NEGATIVE_BLOCK,
].join(' ')

/** Style, template slots, and the verbatim negative block. Non-empty. */
export const HERO_STYLE_PROMPT = `${HERO_STYLE_SECTION} ${HERO_PROMPT_TEMPLATE}`

export interface HeroBrief {
  title?: string | null
  thesis?: string | null
  dek?: string | null
  excerpt?: string | null
}

const TEXT_MAX = 280

function cleanText(value: string | null | undefined): string {
  if (!value) return ''
  const cleaned = value
    .replace(/[\r\n]+/g, ' ')
    .replace(/"/g, "'")
    .replace(/\u2014/g, ', ')
    .replace(/\u2013/g, ', ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!cleaned) return ''
  if (cleaned.length <= TEXT_MAX) return cleaned
  return cleaned.slice(0, TEXT_MAX).trim()
}

/** Thesis, then dek, then excerpt. Title is separate and is not copied here. */
export function storySummary(brief: HeroBrief): string {
  const candidates = [brief.thesis, brief.dek, brief.excerpt]
  for (const value of candidates) {
    const cleaned = cleanText(value)
    if (cleaned) return cleaned
  }
  return ''
}

function framing(title: string): 'left of center' | 'right of center' {
  let n = 0
  for (const ch of title) n += ch.charCodeAt(0)
  return n % 2 === 0 ? 'left of center' : 'right of center'
}

function fillStorySlots(template: string, brief: HeroBrief): string {
  const title = cleanText(brief.title)
  const summary = storySummary(brief)
  const task = summary || title
  const setting = task
    ? `the real workplace where this work happens, daytime, work in progress: ${task}`
    : 'the real workplace where this work happens, daytime'
  const background = title
    ? `colleagues, window light, clutter specific to the workplace for ${title}`
    : 'colleagues, window light, clutter specific to this workplace'

  return template
    .replaceAll(
      "{SETTING: the real workplace where this story's work happens, time of day}",
      setting,
    )
    .replaceAll(
      '{SUBJECT: an ordinary person, age range, wearing {NAVY ITEM}}',
      'an ordinary adult wearing a navy jacket',
    )
    .replaceAll('{left of center | right of center}', framing(title))
    .replaceAll(
      '{ACTION: the literal task from the story, mid-task, eyes on the work}',
      `${task}, mid-task, eyes on the work`,
    )
    .replaceAll(
      '{SECONDARY: optional colleague, partly cut off or softly out of focus, doing a related task}',
      'a colleague, partly cut off and softly out of focus, doing a related task',
    )
    .replaceAll(
      '{SCREENS/OBJECTS: what is on the desk, all screens soft blurred color shapes}',
      'papers and plain work tools on the desk, all screens soft blurred color shapes',
    )
    .replaceAll('{FOREGROUND OBJECT}', 'a coffee cup')
    .replaceAll(
      '{BACKGROUND: colleagues, window light, clutter specific to this workplace}',
      background,
    )
}

export function buildHeroPrompt(brief: HeroBrief, stylePrompt: string = HERO_STYLE_PROMPT): string {
  const title = cleanText(brief.title)
  const summary = storySummary(brief)
  if (!title && !summary) {
    throw new Error('A story title, thesis, dek, or excerpt is required to build hero art')
  }
  const style = stylePrompt.trim() || HERO_STYLE_PROMPT
  return fillStorySlots(style, brief)
}

/** Credit for a hero this pipeline stored under media-heroes/. Other art has none. */
export function heroImageCreditForUrl(url: string | null | undefined): string | null {
  if (!url || !url.includes('/media-heroes/')) return null
  return HERO_IMAGE_CREDIT
}
