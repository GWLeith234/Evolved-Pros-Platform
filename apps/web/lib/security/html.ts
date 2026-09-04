/**
 * XSS helpers for member-authored and CMS HTML.
 *
 * Pinned community bodies: escape, then allow **bold** → <strong> only.
 * Media articles: sanitize marked output with a conservative allowlist.
 */

const ALLOWED_TAGS = new Set([
  'p', 'br', 'hr',
  'h1', 'h2', 'h3', 'h4',
  'strong', 'b', 'em', 'i', 'u', 's',
  'a', 'ul', 'ol', 'li',
  'blockquote', 'pre', 'code',
  'img', 'figure', 'figcaption',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
])

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(['href', 'title', 'rel', 'target']),
  img: new Set(['src', 'alt', 'width', 'height']),
  td: new Set(['colspan', 'rowspan']),
  th: new Set(['colspan', 'rowspan']),
}

export function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Escape the pinned body, then restore **bold** as <strong> only. */
export function pinnedBodyToHtml(body: string): string {
  return escapeHtml(body).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
}

function isSafeUrl(raw: string): boolean {
  const value = raw.trim()
  if (!value) return false
  if (value.startsWith('/') || value.startsWith('#') || value.startsWith('?')) {
    return !value.startsWith('//') && !value.includes('\\')
  }
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'https:'
      || parsed.protocol === 'http:'
      || parsed.protocol === 'mailto:'
  } catch {
    return false
  }
}

function sanitizeAttributes(tag: string, rawAttrs: string): string {
  const allowed = ALLOWED_ATTRS[tag]
  if (!allowed) return ''
  const kept: string[] = []
  const attrRe = /([^\s=]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g
  let match: RegExpExecArray | null
  while ((match = attrRe.exec(rawAttrs)) !== null) {
    const name = match[1].toLowerCase()
    if (name.startsWith('on') || name === 'style' || name === 'srcset') continue
    if (!allowed.has(name)) continue
    const value = match[2] ?? match[3] ?? match[4] ?? ''
    if ((name === 'href' || name === 'src') && !isSafeUrl(value)) continue
    kept.push(`${name}="${escapeHtml(value)}"`)
  }
  if (tag === 'a') {
    const href = kept.find(a => a.startsWith('href='))
    if (!href) return ''
    if (!kept.some(a => a.startsWith('rel='))) {
      kept.push('rel="noopener noreferrer"')
    }
  }
  return kept.length ? ` ${kept.join(' ')}` : ''
}

/**
 * Allowlisted HTML sanitizer for marked output. Strips scripts, event
 * handlers, javascript: URLs, and unknown tags. Text content is escaped.
 */
export function sanitizeMediaHtml(html: string): string {
  if (!html) return ''
  const parts = html.split(/(<[^>]+>)/g)
  const openStack: string[] = []
  let out = ''

  for (const part of parts) {
    if (!part) continue
    if (part[0] !== '<') {
      out += escapeHtml(part)
      continue
    }

    const closeMatch = /^<\/\s*([a-zA-Z][a-zA-Z0-9]*)\s*>$/.exec(part)
    if (closeMatch) {
      const tag = closeMatch[1].toLowerCase()
      if (!ALLOWED_TAGS.has(tag)) continue
      const idx = openStack.lastIndexOf(tag)
      if (idx === -1) continue
      openStack.splice(idx, 1)
      out += `</${tag}>`
      continue
    }

    const commentOrDoctype = /^<!/.test(part)
    if (commentOrDoctype) continue

    const openMatch = /^<\s*([a-zA-Z][a-zA-Z0-9]*)(\s+[^<>]*)?\s*(\/?)\s*>$/.exec(part)
    if (!openMatch) {
      out += escapeHtml(part)
      continue
    }
    const tag = openMatch[1].toLowerCase()
    if (!ALLOWED_TAGS.has(tag)) continue
    const rawAttrs = openMatch[2] ?? ''
    const selfClosing = openMatch[3] === '/' || tag === 'br' || tag === 'hr' || tag === 'img'
    const attrs = sanitizeAttributes(tag, rawAttrs)
    if (tag === 'a' && !attrs.includes('href=')) continue
    if (tag === 'img' && !attrs.includes('src=')) continue
    if (!selfClosing) openStack.push(tag)
    out += `<${tag}${attrs}${selfClosing && tag !== 'img' ? ' /' : ''}>`
  }

  while (openStack.length) {
    out += `</${openStack.pop()}>`
  }
  return out
}
