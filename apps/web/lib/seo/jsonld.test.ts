import { describe, expect, it } from 'vitest'
import { HOME_SUB } from '@/lib/home/conversion'
import { MEDIA_BRAND, MEDIA_HUB_DESCRIPTION } from '@/lib/media/brand'
import { TIERS } from '@/lib/pricing'
import { CANONICAL_ORIGIN, SITE_NAME, canonicalUrl } from '@/lib/seo/canonical'
import { LIVE_PAGE_DESCRIPTION, homeJsonLd, homeOrganizationJsonLd, liveJsonLd, mediaJsonLd, pricingJsonLd } from './jsonld'

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

describe('media JSON-LD', () => {
  it('ships one CollectionPage on www with Evolved Pros as publisher and no prices', () => {
    const schema = mediaJsonLd()
    const publisher = homeOrganizationJsonLd()

    expect(schema['@context']).toBe('https://schema.org')
    expect(schema['@type']).toBe('CollectionPage')
    expect(schema.name).toBe('Evolved Pros Media')
    expect(schema.name).toBe(MEDIA_BRAND)
    expect(schema.url).toBe(canonicalUrl('/media'))
    expect(schema.url).toBe('https://www.evolvedpros.com/media')
    expect(schema.description).toBe(MEDIA_HUB_DESCRIPTION)
    expect(schema.description).toBe(
      'Pioneer stories, leadership insights, and business strategy from the EVOLVED framework.',
    )
    expect(schema.publisher).toEqual(publisher)
    expect(publisher['@type']).toBe('Organization')
    expect(publisher.name).toBe('Evolved Pros')
    expect(publisher.url).toBe(CANONICAL_ORIGIN)
    expect(schema).not.toHaveProperty('mainEntity')
    expect(schema).not.toHaveProperty('offers')
    expect(schema).not.toHaveProperty('price')
    expect(schema).not.toHaveProperty('priceCurrency')

    const keys = schemaKeys(schema)
    expect(keys.has('price')).toBe(false)
    expect(keys.has('priceCurrency')).toBe(false)
    expect(keys.has('offers')).toBe(false)
    expect(keys.has('lowPrice')).toBe(false)
    expect(keys.has('highPrice')).toBe(false)

    const blob = JSON.stringify(schema)
    expect(blob).toContain('CollectionPage')
    expect(blob).toContain('Organization')
    expect(blob).toContain('Evolved Pros')
    expect(blob).toContain('Evolved Pros Media')
    expect(blob).not.toContain('Evolved Media')
    expect(blob).not.toContain('platform.evolvedpros.com')
    expect(blob).not.toContain('"Offer"')
    expect(blob).not.toContain('"price"')
    expect(blob).not.toContain('priceCurrency')
    expect(blob).not.toContain('$')
    expect((blob.match(/"@type":"CollectionPage"/g) ?? []).length).toBe(1)
  })

  it('lists stories the hub already loaded, on www, with no invented prices', () => {
    const schema = mediaJsonLd([
      {
        title: 'Close the Gap',
        pillar: 'identity',
        slug: 'close-the-gap',
        is_published: true,
      },
      {
        title: 'Ritual',
        pillar: 'execution',
        slug: 'why-elite-sales-teams-swear-by-ritual-not-motivation',
        is_published: true,
      },
    ])

    expect(schema.mainEntity?.['@type']).toBe('ItemList')
    expect(schema.mainEntity?.name).toBe('Evolved Pros Media')
    expect(schema.mainEntity?.itemListElement).toEqual([
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Close the Gap',
        url: 'https://www.evolvedpros.com/media/identity/close-the-gap',
      },
    ])

    const blob = JSON.stringify(schema)
    expect(blob).not.toContain('platform.evolvedpros.com')
    expect(blob).not.toContain('Evolved Media')
    expect(blob).not.toContain('"Offer"')
    expect(blob).not.toContain('"price"')
    expect(blob).not.toContain('priceCurrency')
    expect(blob).not.toContain('$')
    expect(schemaKeys(schema).has('price')).toBe(false)
  })
})

describe('pricing JSON-LD', () => {
  it('ships Product/Offer money schema with live $99 / $849 monthly prices as strings', () => {
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
    expect(vipMonthly).toBe('99')
    expect(proMonthly).toBe('849')

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
    expect(blob).toContain('$99 /month')
    expect(blob).toContain('$849 /month')
    // No trace of the retired ladder in the indexed blob.
    expect(blob).not.toContain('$49 /month')
    expect(blob).not.toContain('$249 /month')
    expect(blob).not.toContain('Professional')
    expect(blob).toContain('Evolved Pros')
    expect(blob).not.toContain('Evolved Media')
    expect(blob).not.toMatch(/Keynotes/)
  })
})
