import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { PodcastMasthead, PodcastMastheadLockup } from '@/components/podcast/PodcastMasthead'
import { PODCAST_LOCKUP_DARK, PODCAST_LOCKUP_LABEL, PODCAST_LOCKUP_LIGHT } from '@/lib/lockups'

const here = dirname(fileURLToPath(import.meta.url))
const src = readFileSync(resolve(here, '../../components/podcast/PodcastMasthead.tsx'), 'utf8')
const css = readFileSync(resolve(here, '../../app/globals.css'), 'utf8')

describe('Podcast masthead lockup', () => {
  it('uses the theme-swapped podcast-lockup PNG pair', () => {
    expect(src).toContain('PODCAST_LOCKUP_DARK')
    expect(src).toContain('PODCAST_LOCKUP_LIGHT')
    expect(src).toContain('ep-podcast-masthead-logo--on-dark')
    expect(src).toContain('ep-podcast-masthead-logo--on-light')
    expect(src).not.toMatch(/next\/image/)
    expect(src).not.toMatch(/<svg /)
    expect(src).not.toMatch(/The podcast/)
    expect(src).not.toMatch(/The Evolved Pros/)
  })

  it('renders both theme lockups with the Podcast label', () => {
    const html = renderToStaticMarkup(<PodcastMastheadLockup />)
    expect(html).toContain(`aria-label="${PODCAST_LOCKUP_LABEL}"`)
    expect(html).toContain(PODCAST_LOCKUP_DARK)
    expect(html).toContain(PODCAST_LOCKUP_LIGHT)
    expect(html.indexOf(PODCAST_LOCKUP_DARK)).toBeLessThan(html.indexOf(PODCAST_LOCKUP_LIGHT))
    expect(html).not.toContain('<svg')
  })

  it('keeps the podcast dek and the CSS --on-dark / --on-light swap', () => {
    const html = renderToStaticMarkup(<PodcastMasthead />)
    expect(html).toContain('ep-podcast-masthead')
    expect(html).toContain('Real conversations with the pros who are crushing it')
    expect(css).toMatch(/\.ep-podcast-masthead-logo--on-dark[\s\S]*display: block/)
    expect(css).toMatch(/html\.light-mode \.ep-podcast-masthead-logo--on-light[\s\S]*display: block/)
  })
})
