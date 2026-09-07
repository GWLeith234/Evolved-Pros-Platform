import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { FitMasthead, FitMastheadLockup } from '@/components/fit/FitMasthead'
import { FIT_LOCKUP_DARK, FIT_LOCKUP_LABEL, FIT_LOCKUP_LIGHT } from '@/lib/lockups'

const here = dirname(fileURLToPath(import.meta.url))
const src = readFileSync(resolve(here, '../../components/fit/FitMasthead.tsx'), 'utf8')
const page = readFileSync(resolve(here, '../../app/(public)/fit/page.tsx'), 'utf8')
const css = readFileSync(resolve(here, '../../app/globals.css'), 'utf8')

describe('Fit masthead lockup', () => {
  it('uses the theme-swapped fit-lockup PNG pair', () => {
    expect(src).toContain('FIT_LOCKUP_DARK')
    expect(src).toContain('FIT_LOCKUP_LIGHT')
    expect(src).toContain('ep-fit-masthead-logo--on-dark')
    expect(src).toContain('ep-fit-masthead-logo--on-light')
    expect(src).not.toMatch(/Arial Black/)
    expect(src).not.toMatch(/next\/image/)
    expect(src).not.toMatch(/<svg /)
    expect(src).not.toMatch(/logo_horizontal/)
  })

  it('renders both theme lockups with the Fit label', () => {
    const html = renderToStaticMarkup(<FitMastheadLockup />)
    expect(html).toContain(`aria-label="${FIT_LOCKUP_LABEL}"`)
    expect(html).toContain(FIT_LOCKUP_DARK)
    expect(html).toContain(FIT_LOCKUP_LIGHT)
    expect(html.indexOf(FIT_LOCKUP_DARK)).toBeLessThan(html.indexOf(FIT_LOCKUP_LIGHT))
    expect(html).not.toContain('Arial Black')
  })

  it('keeps Fit chrome theme-aware and on /fit', () => {
    const html = renderToStaticMarkup(<FitMasthead />)
    expect(html).toContain('ep-fit-masthead')
    expect(html).toContain('Back to platform')
    expect(page).toContain('<FitMasthead')
    expect(page).toContain('bg-page')
    expect(css).toMatch(/\.ep-fit-masthead-logo--on-dark \{[\s\S]*display: block/)
    expect(css).toMatch(/html\.light-mode \.ep-fit-masthead-logo--on-light[\s\S]*display: block/)
  })
})
