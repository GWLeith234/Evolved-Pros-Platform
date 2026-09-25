import { readFileSync } from 'fs'
import { join } from 'path'

/**
 * Fonts for /api/social (Satori / next/og).
 * Satori parses the sfnt `fvar` table and crashes on variable fonts
 * (`parseFvarAxis … reading '256'`), which 502s every template.
 * These files must be static TTF/OTF: Barlow Condensed 600 and 700,
 * Playfair Display 700. No fvar/gvar.
 */

export const SOCIAL_FONT_SANS = 'Barlow Condensed'
export const SOCIAL_FONT_SERIF = 'Playfair Display'

export const SOCIAL_FONT_FILES = {
  playfair: 'PlayfairDisplay.ttf',
  barlowSemi: 'BarlowCondensed-SemiBold.ttf',
  barlowBold: 'BarlowCondensed-Bold.ttf',
} as const

export function fontTableTags(data: Uint8Array): string[] {
  if (data.byteLength < 12) return []
  const numTables = (data[4] << 8) | data[5]
  const tags: string[] = []
  for (let i = 0; i < numTables; i++) {
    const offset = 12 + i * 16
    if (offset + 4 > data.byteLength) break
    tags.push(String.fromCharCode(data[offset], data[offset + 1], data[offset + 2], data[offset + 3]))
  }
  return tags
}

/** True for a static TrueType or CFF font. Variable fonts (fvar) are rejected. */
export function isStaticOutlineFont(data: Uint8Array): boolean {
  const tags = fontTableTags(data)
  const outlines = tags.includes('glyf') || tags.includes('CFF ') || tags.includes('CFF2')
  return outlines && !tags.includes('fvar')
}

/**
 * Read a bundled social font. A Node Buffer's `.buffer` is a shared pool;
 * passing it to satori reads the wrong bytes. Return a standalone ArrayBuffer.
 */
export function loadSocialFont(file: string): ArrayBuffer {
  const candidates = [
    join(process.cwd(), 'public', 'social-fonts', file),
    join(process.cwd(), 'apps', 'web', 'public', 'social-fonts', file),
  ]
  let lastError: unknown
  for (const path of candidates) {
    try {
      const bytes = readFileSync(path)
      const data = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
      if (!isStaticOutlineFont(new Uint8Array(data))) {
        throw new Error(
          `social font ${file} is not a static TTF/OTF (satori cannot parse variable fonts)`,
        )
      }
      return data
    } catch (err) {
      if (err instanceof Error && err.message.includes('not a static')) throw err
      lastError = err
    }
  }
  const detail = lastError instanceof Error ? lastError.message : 'unreadable'
  throw new Error(`social font not found: ${file} (${detail})`)
}
