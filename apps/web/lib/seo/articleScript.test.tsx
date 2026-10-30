import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LdJson } from '@/components/seo/LdJson'

/**
 * media_stories.title, excerpt, and author are written by the admin CMS
 * (app/api/admin/media) and rendered on the public article page. A raw
 * JSON.stringify inside <script> lets `</script>` close the JSON-LD tag.
 */
const BREAKOUT = '</script><script>alert(1)</script>'

const here = dirname(fileURLToPath(import.meta.url))
const article = readFileSync(
  resolve(here, '../../components/media/MediaStoryDocument.tsx'),
  'utf8',
)

function articleSchemas(title: string, excerpt: string, byline: string) {
  return {
    articleSchema: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: title,
      description: excerpt,
      author: { '@type': 'Person', name: byline },
    },
    breadcrumbSchema: {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem' as const, position: 3, name: title.slice(0, 80) },
      ],
    },
  }
}

describe('article JSON-LD script', () => {
  it('keeps a </script> payload inside the JSON string', () => {
    const { articleSchema, breadcrumbSchema } = articleSchemas(
      BREAKOUT,
      `notes ${BREAKOUT}`,
      BREAKOUT,
    )

    const raw = `${JSON.stringify(articleSchema)}${JSON.stringify(breadcrumbSchema)}`
    expect(raw).toContain('</script><script>alert(1)</script>')

    const html = renderToStaticMarkup(
      <>
        <LdJson data={articleSchema} />
        <LdJson data={breadcrumbSchema} />
      </>,
    )

    expect(html.match(/<\/script>/gi)).toHaveLength(2)
    expect(html).not.toContain('<script>alert(1)</script>')
    expect(html).not.toContain('</script><script>')
    expect(html).toContain('\\u003c/script>')

    const bodies = [...html.matchAll(/<script type="application\/ld\+json">([^<]*)<\/script>/g)]
    expect(bodies).toHaveLength(2)
    const parsed = bodies.map(block => JSON.parse(block[1]) as Record<string, unknown>)
    expect(parsed[0].headline).toBe(BREAKOUT)
    expect(parsed[0].description).toBe(`notes ${BREAKOUT}`)
    expect(parsed[0].author).toEqual({ '@type': 'Person', name: BREAKOUT })
    const crumbs = parsed[1].itemListElement as Array<{ name: string }>
    expect(crumbs[0].name).toBe(BREAKOUT.slice(0, 80))
  })

  it('sends CMS title, excerpt, and byline through LdJson', () => {
    expect(article).toContain('headline: story.title')
    expect(article).toContain('description: story.excerpt')
    expect(article).toContain('byline')
    expect(article).toContain('name: story.title.slice(0, 80)')
    expect(article).toContain('<LdJson data={articleSchema} />')
    expect(article).toContain('<LdJson data={breadcrumbSchema} />')
    expect(article).not.toContain('JSON.stringify(articleSchema)')
    expect(article).not.toContain('JSON.stringify(breadcrumbSchema)')
    expect(article).not.toContain('dangerouslySetInnerHTML')
  })
})
