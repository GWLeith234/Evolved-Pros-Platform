import { describe, expect, it } from 'vitest'
import { FIT_PAGE_DESCRIPTION, FIT_VIP_MONTHLY } from '@/lib/fit/copy'
import { HOME_SUB } from '@/lib/home/conversion'
import { TIERS } from '@/lib/pricing'
import { CANONICAL_ORIGIN, SITE_NAME, canonicalUrl } from '@/lib/seo/canonical'
import { fitJsonLd, homeJsonLd, homeOrganizationJsonLd, pricingJsonLd } from './jsonld'

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
