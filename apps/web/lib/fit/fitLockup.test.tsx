import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { FitMasthead, FitMastheadLockup } from '@/components/fit/FitMasthead'
import { FIT_BARBELL_DISC, FIT_LOCKUP_LABEL } from '@/lib/lockups'

const here = dirname(fileURLToPath(import.meta.url))
const src = readFileSync(resolve(here, '../../components/fit/FitMasthead.tsx'), 'utf8')
const page = readFileSync(resolve(here, '../../app/(public)/fit/page.tsx'), 'utf8')
const css = readFileSync(resolve(here, '../../app/globals.css'), 'utf8')

describe('Fit masthead lockup', () => {
  it('uses Bebas + barbell disc as the O in PROS', () => {
    expect(src).toMatch(/data-fit-evolved[\s\S]*EVOLVED/)
    expect(src).toMatch(/data-fit-pros[\s\S]*PR/)
    expect(src).toMatch(/data-fit-mark/)
    expect(src).toMatch(/data-fit-section[\s\S]*FIT/)
    expect(src).toContain('FIT_BARBELL_DISC')
    expect(src).not.toMatch(/Arial Black/)
    expect(src).not.toMatch(/next\/image/)
    expect(src).not.toMatch(/<svg /)
    expect(src).not.toMatch(/logo_horizontal/)
  })

  it('renders EVOLVED PR [barbell] S FIT', () => {
    const html = renderToStaticMarkup(<FitMastheadLockup />)
    const evolved = html.indexOf('EVOLVED')
    const pr = html.indexOf('>PR<')
    const mark = html.indexOf('data-fit-mark')
    const ess = html.indexOf('>S<')
    const fit = html.indexOf('>FIT<')
    expect(evolved).toBeGreaterThan(-1)
    expect(pr).toBeGreaterThan(evolved)
    expect(mark).toBeGreaterThan(pr)
    expect(ess).toBeGreaterThan(mark)
    expect(fit).toBeGreaterThan(ess)
    expect(html).toContain(`aria-label="${FIT_LOCKUP_LABEL}"`)
    expect(html).toContain(FIT_BARBELL_DISC)
    expect(html).not.toContain('Arial Black')
  })

  it('keeps Fit chrome theme-aware and on /fit', () => {
    const html = renderToStaticMarkup(<FitMasthead />)
    expect(html).toContain('ep-fit-masthead')
    expect(html).toContain('Back to platform')
    expect(page).toContain('<FitMasthead')
    expect(page).toContain('bg-page')
    expect(css).toMatch(/\.ep-fit-masthead-disc \{[\s\S]*1\.18em/)
    expect(css).toMatch(/\.ep-fit-masthead-brand,[\s\S]*var\(--font-bebas\)/)
    expect(css).toMatch(/\.ep-fit-masthead-brand,[\s\S]*var\(--text-primary\)/)
  })
})
