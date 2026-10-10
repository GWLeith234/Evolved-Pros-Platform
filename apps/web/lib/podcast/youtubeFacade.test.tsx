import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { YouTubeFacade } from '@/components/podcast/public/YouTubeFacade'

const here = dirname(fileURLToPath(import.meta.url))
const episodePage = readFileSync(
  resolve(here, '../../app/(public)/podcast/[slug]/page.tsx'),
  'utf8',
)

describe('podcast YouTube facade', () => {
  it('renders a play button and does not load the iframe until click', () => {
    const html = renderToStaticMarkup(
      <YouTubeFacade youtubeId="BYqyPhhOQvQ" title="Evolved Pros Pilot Episode" />,
    )
    expect(html).toContain('<button')
    expect(html).toContain('aria-label="Play video: Evolved Pros Pilot Episode"')
    expect(html).toContain('i.ytimg.com/vi/BYqyPhhOQvQ/')
    expect(html).not.toContain('<iframe')
    expect(html).not.toContain('youtube-nocookie.com/embed')
  })

  it('is what public episode pages render, with nocookie only after activation', () => {
    expect(episodePage).toContain('<YouTubeFacade')
    expect(episodePage).not.toMatch(/<iframe/)
    const facade = readFileSync(
      resolve(here, '../../components/podcast/public/YouTubeFacade.tsx'),
      'utf8',
    )
    expect(facade).toContain('youtube-nocookie.com/embed')
    expect(facade).toContain('aria-label={`Play video: ${title}`}')
  })
})
