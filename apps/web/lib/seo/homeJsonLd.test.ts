import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { HOME_SUB } from '@/lib/home/conversion'
import { FOOTER_LEGAL_ENTITY } from '@/lib/layout/publicFooter'
import { CANONICAL_ORIGIN } from './canonical'
import {
  HOME_JSON_LD_ORG_NAME,
  homeOrganizationJsonLd,
  homeWebsiteJsonLd,
} from './homeJsonLd'

const EM_DASH = '\u2014'
const here = dirname(fileURLToPath(import.meta.url))

describe('homepage JSON-LD', () => {
  it('emits WebSite + Organization on www, with no em dash', () => {
    const website = homeWebsiteJsonLd()
    const organization = homeOrganizationJsonLd()

    expect(website['@context']).toBe('https://schema.org')
    expect(website['@type']).toBe('WebSite')
    expect(website.name).toBe(HOME_JSON_LD_ORG_NAME)
    expect(website.url).toBe(CANONICAL_ORIGIN)
    expect(website.description).toBe(HOME_SUB)
    expect(website.publisher).toEqual({
      '@type': 'Organization',
      name: HOME_JSON_LD_ORG_NAME,
      url: CANONICAL_ORIGIN,
    })

    expect(organization['@context']).toBe('https://schema.org')
    expect(organization['@type']).toBe('Organization')
    expect(organization.name).toBe(HOME_JSON_LD_ORG_NAME)
    expect(organization.legalName).toBe(FOOTER_LEGAL_ENTITY)
    expect(organization.url).toBe(CANONICAL_ORIGIN)
    expect(organization.description).toBe(HOME_SUB)

    for (const value of [website.name, website.description, organization.name, organization.legalName]) {
      expect(value).not.toContain(EM_DASH)
    }
    expect(website.url).not.toContain('platform.evolvedpros.com')
    expect(organization.url).not.toContain('platform.evolvedpros.com')
  })

  it('is mounted on the conversion homepage as application/ld+json', () => {
    const src = readFileSync(resolve(here, '../../app/(public)/page.tsx'), 'utf8')
    expect(src).toMatch(/type="application\/ld\+json"/)
    expect(src).toMatch(/homeWebsiteJsonLd/)
    expect(src).toMatch(/homeOrganizationJsonLd/)
    expect(src).toMatch(/JSON\.stringify\(homeWebsiteJsonLd\(\)\)/)
    expect(src).toMatch(/JSON\.stringify\(homeOrganizationJsonLd\(\)\)/)
  })
})
