import { describe, expect, it } from 'vitest'
import { HOME_SUB } from '@/lib/home/conversion'
import { CANONICAL_ORIGIN, SITE_NAME } from '@/lib/seo/canonical'
import { homeJsonLd, homeOrganizationJsonLd } from './jsonld'

describe('home JSON-LD', () => {
  it('names Evolved Pros as WebSite and Organization, never Evolved Media', () => {
    const schema = homeJsonLd()
    const publisher = homeOrganizationJsonLd()
    expect(SITE_NAME).toBe('Evolved Pros')
    expect(schema['@context']).toBe('https://schema.org')
    expect(schema['@type']).toBe('WebSite')
    expect(schema.name).toBe('Evolved Pros')
    expect(schema.url).toBe(CANONICAL_ORIGIN)
    expect(schema.description).toBe(HOME_SUB)
    expect(schema.publisher).toEqual(publisher)
    expect(publisher['@type']).toBe('Organization')
    expect(publisher.name).toBe('Evolved Pros')
    expect(publisher.url).toBe(CANONICAL_ORIGIN)

    const blob = JSON.stringify(schema)
    expect(blob).toContain('Evolved Pros')
    expect(blob).not.toContain('Evolved Media')
  })
})
