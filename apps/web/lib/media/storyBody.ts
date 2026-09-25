/**
 * Media story body normalisation.
 *
 * The drafting pipeline sometimes stores the article title again as the
 * first markdown heading. Rendering that line makes a second H1 under the
 * article title. New admin saves drop a matching leading heading; the
 * document renderer does the same so already-published rows stay clean
 * without a data backfill.
 */

const CURLY_SINGLE = /[\u2018\u2019\u201A\u201B]/g
const CURLY_DOUBLE = /[\u201C\u201D\u201E\u201F]/g
const DASHES = /[\u2013\u2014\u2212]/g
const TRAILING_PUNCT = /[\s.!?…,;:'"”’]+$/u

/** Lowercase, fold quotes and dashes, collapse whitespace, trim trailing punctuation. */
export function normalizeStoryHeading(value: string): string {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;|&#0*34;|&#x0*22;/gi, '"')
    .replace(/&#0*39;|&#x0*27;|&apos;/gi, "'")
    .replace(CURLY_SINGLE, "'")
    .replace(CURLY_DOUBLE, '"')
    .replace(DASHES, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(TRAILING_PUNCT, '')
    .trim()
}

function dropBlankLines(lines: string[], start: number): string {
  let i = start
  while (i < lines.length && lines[i].trim() === '') i += 1
  return lines.slice(i).join('\n')
}

/**
 * Remove a leading `#` / `##` heading, or a leading `<h1>`, when its text
 * matches `title`. Comparison is case- and whitespace-insensitive, and
 * folds curly quotes, dashes, and trailing punctuation. Blank lines around
 * that heading are dropped. Any other first line is left alone.
 */
export function stripLeadingTitle(body: string, title: string): string {
  if (!body || !title.trim()) return body
  const wanted = normalizeStoryHeading(title)
  if (!wanted) return body

  const lines = body.split(/\r?\n/)
  let i = 0
  while (i < lines.length && lines[i].trim() === '') i += 1
  if (i >= lines.length) return body

  const markdown = lines[i].match(/^#{1,2}[ \t]+(.+?)\s*$/)
  if (markdown) {
    if (normalizeStoryHeading(markdown[1]) !== wanted) return body
    return dropBlankLines(lines, i + 1)
  }

  const rest = lines.slice(i).join('\n')
  const html = rest.match(/^<h1\b[^>]*>[\s\S]*?<\/h1>[ \t]*(?:\r?\n)*/i)
  if (!html) return body
  const inner = html[0].replace(/^<h1\b[^>]*>/i, '').replace(/<\/h1>[\s\S]*$/i, '')
  if (normalizeStoryHeading(inner) !== wanted) return body
  return rest.slice(html[0].length).replace(/^(?:[ \t]*\r?\n)+/, '')
}

/**
 * Body headings must not compete with the article title. Marked turns a
 * markdown `#` into `<h1>`; this rewrites those tags (and raw HTML h1s)
 * to h2 after sanitizing. Code fences stay inside `<code>`, so a `#`
 * comment there is not a heading.
 */
export function demoteHtmlH1(html: string): string {
  return html
    .replace(/<h1(\s[^>]*)?>/gi, '<h2$1>')
    .replace(/<\/h1>/gi, '</h2>')
}
