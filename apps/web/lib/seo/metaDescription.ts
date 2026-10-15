/**
 * Public meta description length.
 *
 * Google truncates snippets past ~155 characters and may replace a short
 * boilerplate description with its own. These helpers keep description,
 * og:description, and twitter:description in a 70–155 character range
 * using text the page already has. They do not rewrite stored articles.
 */

export const META_DESCRIPTION_MIN = 70
export const META_DESCRIPTION_MAX = 155

const TRAILING_JOINER = /[\s,;:|/\\–—-]+$/u

function collapse(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

/**
 * Cut an over-long description on a word boundary. A description that
 * already fits is returned unchanged, including its internal whitespace.
 */
export function trimMetaDescription(
  text: string,
  max: number = META_DESCRIPTION_MAX,
): string {
  const edge = text.trim()
  if (!edge) return ''
  const collapsed = collapse(edge)
  const source = edge.length <= max ? edge : collapsed
  if (source.length <= max) return source

  let cut = max
  if (source[max] !== ' ') {
    const lastSpace = source.lastIndexOf(' ', max)
    if (lastSpace > 0) cut = lastSpace
  }
  const wordCut = source.slice(0, cut).trim()
  const withoutJoiner = wordCut.replace(TRAILING_JOINER, '').trim()
  const trimmed = withoutJoiner.length < META_DESCRIPTION_MIN && collapsed.length >= META_DESCRIPTION_MIN
    ? wordCut
    : withoutJoiner
  return trimmed.length > max ? trimmed.slice(0, max).trim() : trimmed
}

/**
 * Keep a description that is already in range. Extend a short one with
 * later source text. A supplement is added whole when it still fits in
 * 155 characters. The first supplement that would pass 155 is trimmed on
 * a word boundary only when the description is still under 70; otherwise
 * it is left off. An over-long primary is trimmed on its own.
 */
export function fitMetaDescription(
  primary: string,
  supplements: readonly string[] = [],
): string {
  const lead = collapse(primary)
  if (lead.length > META_DESCRIPTION_MAX) return trimMetaDescription(lead)
  if (lead.length >= META_DESCRIPTION_MIN) {
    const edge = primary.trim()
    return edge.length <= META_DESCRIPTION_MAX ? edge : trimMetaDescription(lead)
  }

  let text = lead
  for (const extra of supplements) {
    const addition = collapse(extra)
    if (!addition || (text && text.includes(addition))) continue
    const next = !text ? addition : addition.includes(text) ? addition : `${text} ${addition}`
    if (next.length <= META_DESCRIPTION_MAX) {
      text = next
      continue
    }
    if (text.length >= META_DESCRIPTION_MIN) break
    return trimMetaDescription(next)
  }
  return text
}

/** Plain paragraphs from a markdown or HTML article body. Order preserved. */
export function plainTextBlocks(source: string | null | undefined): string[] {
  if (!source) return []
  return source
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map(block =>
      block
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
        .replace(/\[([^\]]*)]\([^)]*\)/g, '$1')
        .replace(/<\/?[^>]+>/g, ' ')
        .replace(/^#{1,6}[ \t]*/gm, '')
        .replace(/[*_]{1,3}([^*_\n]+)[*_]{1,3}/g, '$1')
        .replace(/`+/g, '')
        .replace(/\s+/g, ' ')
        .trim(),
    )
    .filter(block => block.length > 0)
}
