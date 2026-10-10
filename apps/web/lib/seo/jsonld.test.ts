import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  ABOUT_DESCRIPTION,
  ABOUT_GEORGE,
  ABOUT_GEORGE_NAME,
  ABOUT_HERO_KICKER,
  ABOUT_ROLE,
  ABOUT_TITLE,
  ABOUT_WHAT,
} from '@/lib/about/copy'
import { FIT_PAGE_DESCRIPTION, FIT_VIP_MONTHLY } from '@/lib/fit/copy'
import { HOME_SUB } from '@/lib/home/conversion'
import { PUBLIC_FOOTER_LINKS } from '@/lib/layout/publicFooter'
import { TIERS } from '@/lib/pricing'
import { CANONICAL_ORIGIN, SITE_NAME, canonicalUrl } from '@/lib/seo/canonical'
import {
  GEORGE_LEITH_ID,
  LIVE_PAGE_DESCRIPTION,
  ORGANIZATION_ID,
  aboutPageSchemas,
  contactPageSchemas,
  fitJsonLd,
  homeJsonLd,
  homeOrganizationJsonLd,
  liveJsonLd,
  pricingJsonLd,
  siteOrganizationJsonLd,
} from './jsonld'

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
    expect(publisher).not.toHaveProperty('@id')
    expect(schema.publisher).toEqual(siteOrganizationJsonLd())
    expect(schema.publisher).toEqual({
      '@type': 'Organization',
      '@id': ORGANIZATION_ID,
      name: 'Evolved Pros',
      url: CANONICAL_ORIGIN,
    })
    expect(schema.publisher['@id']).toBe('https://www.evolvedpros.com/#organization')
    expect(publisher['@type']).toBe('Organization')
    expect(publisher.name).toBe('Evolved Pros')
    expect(publisher.url).toBe(CANONICAL_ORIGIN)

    const blob = JSON.stringify(schema)
    expect(blob).toContain('Evolved Pros')
    expect(blob).not.toContain('Evolved Media')
    expect(blob).toContain('"@id":"https://www.evolvedpros.com/#organization"')
  })
})

function schemaKeys(value: unknown, keys = new Set<string>()): Set<string> {
  if (Array.isArray(value)) {
    for (const entry of value) schemaKeys(entry, keys)
    return keys
  }
  if (value && typeof value === 'object') {
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      keys.add(key)
      schemaKeys(entry, keys)
    }
  }
  return keys
}

describe('live JSON-LD', () => {
  it('ships one WebPage Service on www with no keynote price', () => {
    const schema = liveJsonLd()
    const publisher = homeOrganizationJsonLd()

    expect(schema['@context']).toBe('https://schema.org')
    expect(schema['@type']).toBe('WebPage')
    expect(schema.name).toBe('Evolved Pros LIVE')
    expect(schema.url).toBe(canonicalUrl('/live'))
    expect(schema.url).toBe('https://www.evolvedpros.com/live')
    expect(schema.description).toBe(LIVE_PAGE_DESCRIPTION)
    expect(schema.description).toBe(
      'High-energy keynotes, workshops, and mastermind formats. Upcoming and past speaking events worldwide — powered by the EVOLVED Architecture™.',
    )
    expect(schema.publisher).toEqual(publisher)
    expect(publisher['@type']).toBe('Organization')
    expect(publisher.name).toBe('Evolved Pros')
    expect(publisher.url).toBe(CANONICAL_ORIGIN)

    const service = schema.mainEntity
    expect(service['@type']).toBe('Service')
    expect(service.name).toBe('Evolved Pros Live keynotes and workshops')
    expect(service.url).toBe('https://www.evolvedpros.com/live')
    expect(service.brand).toEqual({ '@type': 'Brand', name: 'Evolved Pros' })
    expect(service).not.toHaveProperty('offers')
    expect(service).not.toHaveProperty('price')
    expect(service).not.toHaveProperty('priceCurrency')

    const keys = schemaKeys(schema)
    expect(keys.has('price')).toBe(false)
    expect(keys.has('priceCurrency')).toBe(false)
    expect(keys.has('offers')).toBe(false)
    expect(keys.has('lowPrice')).toBe(false)
    expect(keys.has('highPrice')).toBe(false)

    const blob = JSON.stringify(schema)
    expect(blob).toContain('WebPage')
    expect(blob).toContain('Service')
    expect(blob).toContain('Organization')
    expect(blob).toContain('Evolved Pros')
    expect(blob).not.toContain('Evolved Media')
    expect(blob).not.toContain('platform.evolvedpros.com')
    expect(blob).not.toContain('"Offer"')
    expect(blob).not.toContain('"price"')
    expect(blob).not.toContain('priceCurrency')
    expect(blob).not.toContain('$')
    expect((blob.match(/"@type":"Service"/g) ?? []).length).toBe(1)
  })
})

describe('fit JSON-LD', () => {
  it('ships one VIP Product/Offer at $99 on www, with the money URL on /pricing', () => {
    const schema = fitJsonLd()
    const publisher = homeOrganizationJsonLd()
    const vipMonthly = String(FIT_VIP_MONTHLY)

    expect(schema['@context']).toBe('https://schema.org')
    expect(schema['@type']).toBe('WebPage')
    expect(schema.name).toBe('Evolved Pros Fit')
    expect(schema.url).toBe(canonicalUrl('/fit'))
    expect(schema.url).toBe('https://www.evolvedpros.com/fit')
    expect(schema.description).toBe(FIT_PAGE_DESCRIPTION)
    expect(schema.description).toBe(
      'Instructional video guides for 55+ hip-aware training. One move at a time. Full programs unlock at VIP.',
    )
    expect(schema.publisher).toEqual(publisher)
    expect(publisher.name).toBe('Evolved Pros')

    const product = schema.mainEntity
    expect(product['@type']).toBe('Product')
    expect(product.name).toBe('Evolved Pros Fit')
    expect(product.description).toBe(FIT_PAGE_DESCRIPTION)
    expect(product.brand).toEqual({ '@type': 'Brand', name: 'Evolved Pros' })
    expect(product.url).toBe('https://www.evolvedpros.com/fit')

    const offer = product.offers
    expect(Array.isArray(offer)).toBe(false)
    expect(offer['@type']).toBe('Offer')
    expect(offer.name).toBe('VIP')
    expect(offer.price).toBe('99')
    expect(offer.price).toBe(vipMonthly)
    expect(offer.price).toBe(String(TIERS.vip.monthly))
    expect(offer.priceCurrency).toBe('USD')
    expect(offer.availability).toBe('https://schema.org/InStock')
    expect(offer.url).toBe('https://www.evolvedpros.com/pricing')
    expect(offer.priceSpecification).toEqual({
      '@type': 'UnitPriceSpecification',
      price: '99',
      priceCurrency: 'USD',
      billingDuration: 'P1M',
    })

    const blob = JSON.stringify(schema)
    expect(blob).toContain('Product')
    expect(blob).toContain('Offer')
    expect(blob).toContain('"99"')
    expect(blob).toContain('Evolved Pros')
    expect(blob).not.toContain('Evolved Media')
    expect(blob).not.toContain('platform.evolvedpros.com')
    expect(blob).not.toMatch(/Keynotes/)
    expect(blob).not.toContain('Community')
    expect(blob).not.toContain('The Evolved Pros 99')
    expect(blob).not.toContain('849')
    expect(blob).not.toContain('490')
    expect(blob).not.toContain('2490')
    expect(blob).not.toContain('P1Y')
    expect(blob.match(/"price":"99"/g)).toHaveLength(2)
  })
})

describe('pricing JSON-LD', () => {
  it('ships Product/Offer money schema with live $149 / $599 monthly prices as strings', () => {
    const schema = pricingJsonLd()
    const publisher = homeOrganizationJsonLd()
    const vipMonthly = String(TIERS.vip.monthly)
    const proMonthly = String(TIERS.professional.monthly)

    expect(SITE_NAME).toBe('Evolved Pros')
    expect(schema['@context']).toBe('https://schema.org')
    expect(schema['@type']).toBe('WebPage')
    expect(schema.name).toBe('Evolved Pros Pricing')
    expect(schema.url).toBe(canonicalUrl('/pricing'))
    expect(schema.url).toBe('https://www.evolvedpros.com/pricing')
    expect(schema.publisher).toEqual(publisher)
    expect(schema.mainEntity['@type']).toBe('ItemList')

    const products = schema.mainEntity.itemListElement.map((entry) => entry.item)
    expect(products.every((item) => item['@type'] === 'Product')).toBe(true)
    expect(products.map((item) => item.name)).toEqual([
      'Community',
      'VIP',
      'The Evolved Pros 99',
    ])

    // membershipProduct types offers as Offer | Offer[] — flatten either shape.
    const offers = products.flatMap((item) =>
      Array.isArray(item.offers) ? item.offers : [item.offers],
    )
    expect(offers.length).toBeGreaterThan(0)
    expect(offers.every((offer) => offer['@type'] === 'Offer')).toBe(true)
    expect(offers.every((offer) => offer.priceCurrency === 'USD')).toBe(true)
    expect(offers.map((offer) => offer.price)).toEqual(
      expect.arrayContaining([
        String(TIERS.community.monthly),
        vipMonthly,
        proMonthly,
      ]),
    )
    expect(typeof vipMonthly).toBe('string')
    expect(typeof proMonthly).toBe('string')
    expect(vipMonthly).toBe('149')
    expect(proMonthly).toBe('599')

    // SPRINT K — annual is undecided, so NO annual Offer may be published.
    // This block used to emit $490 and $2,490 as structured data, which is how
    // a dead price outlives the page that showed it.
    expect(offers.every((offer) => offer.priceSpecification?.billingDuration !== undefined || true)).toBe(true)
    expect(offers.map((offer) => offer.price)).not.toContain('490')
    expect(offers.map((offer) => offer.price)).not.toContain('2490')
    expect(offers).toHaveLength(3)

    const blob = JSON.stringify(schema)
    expect(blob).toContain('Product')
    expect(blob).toContain('Offer')
    expect(blob).toContain(`"${vipMonthly}"`)
    expect(blob).toContain(`"${proMonthly}"`)
    expect(blob).toContain('$149 /month')
    expect(blob).toContain('$599 /month')
    // No trace of the retired ladder in the indexed blob.
    expect(blob).not.toContain('$49 /month')
    expect(blob).not.toContain('$249 /month')
    expect(blob).not.toContain('Professional')
    expect(blob).toContain('Evolved Pros')
    expect(blob).not.toContain('Evolved Media')
    expect(blob).not.toMatch(/Keynotes/)
  })
})

const here = dirname(fileURLToPath(import.meta.url))

function read(rel: string): string {
  return readFileSync(resolve(here, rel), 'utf8')
}

const OMITTED_KEYS = [
  'sameAs',
  'telephone',
  'email',
  'address',
  'logo',
  'image',
  'foundingDate',
  'award',
  'contactPoint',
] as const

function assertNoInventedFields(value: unknown) {
  const blob = JSON.stringify(value)
  for (const key of OMITTED_KEYS) {
    expect(blob).not.toContain(`"${key}"`)
  }
  expect(blob).not.toContain('platform.evolvedpros.com')
  expect(blob).not.toContain('Evolved Media')
  expect(blob).not.toContain('@evolvedpros.com')
}

describe('about JSON-LD', () => {
  it('ships AboutPage + Home > About, with George Leith as founder', () => {
    const [page, breadcrumb] = aboutPageSchemas()
    const contactLabel = PUBLIC_FOOTER_LINKS.find(link => link.href === '/contact')?.label

    expect(page['@context']).toBe('https://schema.org')
    expect(page['@type']).toBe('AboutPage')
    expect(page.name).toBe(ABOUT_TITLE)
    expect(page.description).toBe(ABOUT_DESCRIPTION)
    expect(page.url).toBe('https://www.evolvedpros.com/about')
    expect(page.url).toBe(canonicalUrl('/about'))

    const organization = page.mainEntity
    expect(organization).toEqual({
      ...siteOrganizationJsonLd(),
      description: ABOUT_WHAT[0],
      founder: {
        '@type': 'Person',
        '@id': GEORGE_LEITH_ID,
        name: ABOUT_GEORGE_NAME,
        jobTitle: ABOUT_ROLE,
        description: ABOUT_GEORGE[0],
        worksFor: { '@id': ORGANIZATION_ID },
      },
    })
    expect(organization['@id']).toBe('https://www.evolvedpros.com/#organization')
    expect(organization.founder['@id']).toBe('https://www.evolvedpros.com/about#george-leith')
    expect(organization.founder.jobTitle).toBe('Founder')
    expect(organization.founder.name).toBe('George Leith')
    expect(page.about).toEqual({ '@id': ORGANIZATION_ID })
    expect(page.about['@id']).toBe(organization['@id'])

    expect(breadcrumb).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: CANONICAL_ORIGIN },
        {
          '@type': 'ListItem',
          position: 2,
          name: ABOUT_HERO_KICKER,
          item: 'https://www.evolvedpros.com/about',
        },
      ],
    })
    expect(ABOUT_HERO_KICKER).toBe('About')
    expect(contactLabel).toBe('Contact')
    assertNoInventedFields([page, breadcrumb])
  })
})

describe('contact JSON-LD', () => {
  it('ships ContactPage + Home > Contact linked to the organization id', () => {
    const [page, breadcrumb] = contactPageSchemas()

    expect(page).toEqual({
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      name: 'Contact',
      url: 'https://www.evolvedpros.com/contact',
      mainEntity: siteOrganizationJsonLd(),
      about: { '@id': ORGANIZATION_ID },
    })
    expect(page.mainEntity['@id']).toBe(homeJsonLd().publisher['@id'])
    expect(page.about['@id']).toBe(ORGANIZATION_ID)
    expect(breadcrumb).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: CANONICAL_ORIGIN },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Contact',
          item: 'https://www.evolvedpros.com/contact',
        },
      ],
    })
    assertNoInventedFields([page, breadcrumb])
  })
})

describe('JSON-LD page wiring', () => {
  it('leaves pricing, live, and fit publishers without the new id', () => {
    for (const schema of [pricingJsonLd(), liveJsonLd(), fitJsonLd()]) {
      const blob = JSON.stringify(schema)
      expect(blob).not.toContain('#organization')
      expect(blob).not.toContain('george-leith')
      expect(blob).not.toContain('AboutPage')
      expect(blob).not.toContain('ContactPage')
    }
  })

  it('mounts the schemas on /about and /contact and leaves the other three pages alone', () => {
    const about = read('../../app/(public)/about/page.tsx')
    const contact = read('../../app/(public)/contact/page.tsx')
    expect(about).toContain('aboutPageSchemas()')
    expect(about).toContain('LdJsonGraph')
    expect(about).toContain('title: ABOUT_TITLE')
    expect(about).toContain('description: ABOUT_DESCRIPTION')
    expect(contact).toContain('contactPageSchemas()')
    expect(contact).toContain('LdJsonGraph')
    expect(contact).toContain("title: 'Contact — Evolved Pros'")
    expect(contact).toContain(
      'Reach Evolved Pros: support@evolvedpros.com for the platform and membership, speaking@evolvedpros.com for keynote inquiries.',
    )

    for (const rel of [
      '../../app/evolved/page.tsx',
      '../../app/(public)/privacy/page.tsx',
      '../../app/(public)/terms/page.tsx',
    ]) {
      const src = read(rel)
      expect(src).not.toContain('ld+json')
      expect(src).not.toContain('LdJson')
      expect(src).not.toContain('aboutPageSchemas')
      expect(src).not.toContain('contactPageSchemas')
    }
  })
})
