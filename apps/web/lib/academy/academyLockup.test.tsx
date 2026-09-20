import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { AcademyMastheadLockup } from '@/components/academy/AcademyMasthead'
import { ACADEMY_LOCKUP_DARK, ACADEMY_LOCKUP_LABEL, ACADEMY_LOCKUP_LIGHT } from '@/lib/lockups'

const here = dirname(fileURLToPath(import.meta.url))
const src = readFileSync(resolve(here, '../../components/academy/AcademyMasthead.tsx'), 'utf8')
const page = readFileSync(resolve(here, '../../app/(member)/academy/page.tsx'), 'utf8')
const css = readFileSync(resolve(here, '../../app/globals.css'), 'utf8')

describe('Academy masthead lockup', () => {
  it('uses the theme-swapped academy-lockup PNG pair', () => {
    expect(src).toContain('ACADEMY_LOCKUP_DARK')
    expect(src).toContain('ACADEMY_LOCKUP_LIGHT')
    expect(src).toContain('ep-academy-masthead-logo--on-dark')
    expect(src).toContain('ep-academy-masthead-logo--on-light')
    expect(src).not.toMatch(/next\/image/)
    expect(src).not.toMatch(/<svg /)
    expect(src).not.toMatch(/The Academy/)
  })

  it('renders both theme lockups with the Academy label', () => {
    const html = renderToStaticMarkup(<AcademyMastheadLockup />)
    expect(html).toContain(`aria-label="${ACADEMY_LOCKUP_LABEL}"`)
    expect(html).toContain(ACADEMY_LOCKUP_DARK)
    expect(html).toContain(ACADEMY_LOCKUP_LIGHT)
    expect(html.indexOf(ACADEMY_LOCKUP_DARK)).toBeLessThan(html.indexOf(ACADEMY_LOCKUP_LIGHT))
    expect(html).not.toContain('<svg')
  })

  it('mounts the lockup on /academy and uses the CSS theme swap', () => {
    expect(page).toContain('<AcademyMastheadLockup')
    expect(page).not.toMatch(/<h1[^>]*>\s*The Academy\s*<\/h1>/)
    expect(css).toMatch(/\.ep-academy-masthead-logo--on-dark[\s\S]*display: block/)
    expect(css).toMatch(/html\.light-mode \.ep-academy-masthead-logo--on-light[\s\S]*display: block/)
  })
})
