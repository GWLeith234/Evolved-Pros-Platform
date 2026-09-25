/**
 * Hero image prompt assembly.
 *
 * TODO: Art direction is pending George's lock. HERO_STYLE_PROMPT is the only
 * style string the pipeline sends. Leave it empty until he signs a direction.
 */

export const HERO_STYLE_PROMPT = ''

export interface HeroBrief {
  title?: string | null
  thesis?: string | null
  dek?: string | null
  excerpt?: string | null
}

const TEXT_MAX = 280

function cleanText(value: string | null | undefined): string {
  if (!value) return ''
  const cleaned = value.replace(/[\r\n]+/g, ' ').replace(/"/g, "'").replace(/\s+/g, ' ').trim()
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

/**
 * Story text plus the style config. The default style is empty, so the prompt
 * is only the title and summary until HERO_STYLE_PROMPT is set.
 */
export function buildHeroPrompt(brief: HeroBrief, stylePrompt: string = HERO_STYLE_PROMPT): string {
  const title = cleanText(brief.title)
  const summary = storySummary(brief)
  if (!title && !summary) {
    throw new Error('A story title, thesis, dek, or excerpt is required to build hero art')
  }

  const lines: string[] = []
  if (title) lines.push(`Title: ${title}`)
  if (summary && summary !== title) lines.push(`Summary: ${summary}`)
  const story = lines.join('\n')
  const style = stylePrompt.trim()
  if (!style) return story
  return `${style}\n\n${story}`
}
