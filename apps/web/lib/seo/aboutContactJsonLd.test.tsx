import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import AboutRoute from '@/app/(public)/about/page'
import ContactPage from '@/app/(public)/contact/page'
import { GEORGE_LEITH_ID, ORGANIZATION_ID, homeJsonLd } from '@/lib/seo/jsonld'

function parseLdJson(html: string): unknown[] {
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([^<]*)<\/script>/g)]
  expect(blocks.length).toBeGreaterThan(0)
  return blocks.map(block => JSON.parse(block[1]))
}

describe('server-rendered about and contact JSON-LD', () => {
  it('prints parseable AboutPage and BreadcrumbList without JavaScript', () => {
    const html = renderToStaticMarkup(<AboutRoute />)
    const parsed = parseLdJson(html)
    expect(parsed).toHaveLength(2)
    const types = parsed.map(entry => (entry as { '@type': string })['@type'])
    expect(types).toEqual(['AboutPage', 'BreadcrumbList'])

    const page = parsed[0] as {
      url: string
      mainEntity: { '@id': string; founder: { '@id': string; jobTitle: string; worksFor: { '@id': string } } }
      about: { '@id': string }
    }
    expect(page.url).toBe('https://www.evolvedpros.com/about')
    expect(page.mainEntity['@id']).toBe(ORGANIZATION_ID)
    expect(page.about['@id']).toBe(ORGANIZATION_ID)
    expect(page.mainEntity.founder['@id']).toBe(GEORGE_LEITH_ID)
    expect(page.mainEntity.founder.jobTitle).toBe('Founder')
    expect(page.mainEntity.founder.worksFor['@id']).toBe(ORGANIZATION_ID)
    expect(html).toContain('George Leith')
    expect(html).toContain('Founder')
  })

  it('prints parseable ContactPage and BreadcrumbList linked to the same id', () => {
    const html = renderToStaticMarkup(<ContactPage />)
    const parsed = parseLdJson(html)
    expect(parsed).toHaveLength(2)
    const types = parsed.map(entry => (entry as { '@type': string })['@type'])
    expect(types).toEqual(['ContactPage', 'BreadcrumbList'])

    const page = parsed[0] as {
      url: string
      mainEntity: { '@id': string; name: string; url: string }
      about: { '@id': string }
    }
    expect(page.url).toBe('https://www.evolvedpros.com/contact')
    expect(page.mainEntity['@id']).toBe(homeJsonLd().publisher['@id'])
    expect(page.mainEntity.name).toBe('Evolved Pros')
    expect(page.mainEntity.url).toBe('https://www.evolvedpros.com')
    expect(page.about['@id']).toBe(ORGANIZATION_ID)
    expect(html).toContain('support@evolvedpros.com')
    expect(html).not.toContain('"email"')
    expect(html).not.toContain('"contactPoint"')
  })
})
