import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(__dirname, '../..')

function src(rel: string) {
  return readFileSync(resolve(root, rel), 'utf8')
}

const CHROME_FILES = [
  'app/(public)/podcast/layout.tsx',
  'app/welcome/page.tsx',
  'components/layout/SessionOptionalShell.tsx',
  'components/layout/PublicChromeHeader.tsx',
  'components/layout/TopNav.tsx',
  'components/home/ConversionHome.tsx',
  'components/media/Masthead.tsx',
]

describe('public chrome wordmark', () => {
  it('uses the real lockup, never the EVOLVED interpunct PROS text mark', () => {
    const header = src('components/layout/PublicChromeHeader.tsx')
    expect(header).toContain('LogoMark')
    expect(header).toContain('variant="light"')

    for (const file of CHROME_FILES) {
      const text = src(file)
      expect(text, file).not.toMatch(/EVOLVED\s*<span[\s\S]*?·[\s\S]*?PROS/)
      expect(text, file).not.toContain('EVOLVED·PROS')
    }
  })

  it('keeps podcast, pricing, and welcome on the shared chrome header', () => {
    expect(src('app/(public)/podcast/layout.tsx')).toContain('<PublicChromeHeader')
    expect(src('components/layout/SessionOptionalShell.tsx')).toContain('<PublicChromeHeader')
    expect(src('app/welcome/page.tsx')).toContain('<PublicChromeHeader')
  })

  it('keeps member TopNav and conversion home on LogoMark', () => {
    expect(src('components/layout/TopNav.tsx')).toContain('<LogoMark')
    expect(src('components/home/ConversionHome.tsx')).toContain('<LogoMark')
  })
})
