import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const here = dirname(fileURLToPath(import.meta.url))
const EM_DASH = '\u2014'

function read(rel: string): string {
  return readFileSync(resolve(here, rel), 'utf8')
}

describe('public chrome copy', () => {
  it('404 eyebrow uses a period, not an em dash', () => {
    const src = read('../../app/not-found.tsx')
    expect(src).toMatch(/404\. Page Not Found/)
    expect(src).not.toMatch(/404\s+\u2014/)
    expect(src).not.toMatch(/>\s*404 —/)
  })

  it('LIVE and podcast document titles use a pipe, not an em dash', () => {
    expect(read('../../app/live/page.tsx')).toMatch(/title: 'LIVE \| Evolved Pros'/)
    expect(read('../../app/live/page.tsx')).not.toMatch(/LIVE — Evolved Pros/)
    expect(read('../../app/(public)/podcast/page.tsx')).toMatch(/\$\{SERIES_NAME\} \| Evolved Pros/)
    expect(read('../../app/(public)/podcast/[slug]/page.tsx')).toMatch(
      /\$\{ep\.title\} \| \$\{SERIES_NAME\}/,
    )
  })
})
