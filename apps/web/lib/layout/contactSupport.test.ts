/**
 * Contact support must be a native mailto anchor.
 *
 * next/link in the App Router calls preventDefault and navigates inside
 * startTransition. A mailto: href is then location.assign()'d outside the
 * user gesture, and the browser drops it. The click looks dead.
 */
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const here = dirname(fileURLToPath(import.meta.url))

function src(rel: string): string {
  return readFileSync(resolve(here, rel), 'utf8')
}

describe('contact support clicks', () => {
  it('pricing uses a native mailto anchor, not next/link', () => {
    const page = src('../../app/(public)/pricing/page.tsx')
    expect(page).toContain(
      'href="mailto:support@evolvedpros.com?subject=Pricing%20question%20-%20Evolved%20Pros"',
    )
    expect(page).toContain('Contact support')
    expect(page).toMatch(/<a[\s\S]*mailto:support@evolvedpros\.com[\s\S]*Contact support/)
    expect(page).not.toMatch(/<Link[\s\S]*mailto:/)
    expect(page).not.toContain("from 'next/link'")
  })

  it('membership-expired uses a native mailto anchor for Contact Support', () => {
    const page = src('../../app/(auth)/membership-expired/page.tsx')
    const support = page.slice(page.indexOf('Contact Support') - 400, page.indexOf('Contact Support'))
    expect(support).toContain('href="mailto:support@evolvedpros.com"')
    expect(support).toContain('<a')
    expect(support).not.toContain('<Link')
  })
})
