/**
 * Public JSON-LD builders. Podcast and article routes keep their inline
 * schemas. Home ships WebSite + Organization; /pricing ships the
 * membership Product / Offer catalog.
 *
 * Brand lock: Evolved Pros. Never Evolved Media.
 */

import { HOME_SUB } from '@/lib/home/conversion'
import { TIERS, TIER_DISPLAY_NAMES } from '@/lib/pricing'
import { CANONICAL_ORIGIN, SITE_NAME, canonicalUrl } from '@/lib/seo/canonical'

export function homeOrganizationJsonLd() {
  return {
    '@type': 'Organization',
    name: SITE_NAME,
    url: CANONICAL_ORIGIN,
  }
}

/** WebSite + nested Organization for `/`. Matches article publisher naming. */
export function homeJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: CANONICAL_ORIGIN,
    description: HOME_SUB,
    publisher: homeOrganizationJsonLd(),
  }
}

const PRICING_URL = canonicalUrl('/pricing')

function membershipOffer(name: string, price: string, billingDuration: 'P1M' | 'P1Y') {
  return {
    '@type': 'Offer',
    name,
    url: PRICING_URL,
    price,
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
    priceSpecification: {
      '@type': 'UnitPriceSpecification',
      price,
      priceCurrency: 'USD',
      billingDuration,
    },
  }
}

function membershipProduct(
  name: string,
  description: string,
  offers: ReturnType<typeof membershipOffer> | ReturnType<typeof membershipOffer>[],
) {
  return {
    '@type': 'Product',
    name,
    description,
    brand: { '@type': 'Brand', name: SITE_NAME },
    url: PRICING_URL,
    offers,
  }
}

/**
 * WebPage + Product / Offer catalog for `/pricing`.
 *
 * Amounts come from the TIERS constants, so this cannot drift from the page:
 * Community Free / $0, VIP $99 /month, The Evolved Pros 99 $849 /month.
 *
 * SPRINT K — annual Offers are emitted ONLY when a tier actually has an annual
 * price. Annual is undecided, so today none are. This block used to publish
 * $490 and $2,490 as structured data, which is how dead prices end up in a
 * search result long after the page stops showing them. Keynotes stay off the
 * Offer list: the page says Inquire for fee and we do not invent a price.
 */
/** An annual Offer, or nothing at all when the tier has no annual price. */
function annualOffers(name: string, annual: number | null) {
  return typeof annual === 'number' && annual > 0
    ? [membershipOffer(`${name} annual`, String(annual), 'P1Y')]
    : []
}

export function pricingJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${SITE_NAME} Pricing`,
    url: PRICING_URL,
    description: 'Community, VIP, The Evolved Pros 99, and Keynote tiers for high performers.',
    publisher: homeOrganizationJsonLd(),
    mainEntity: {
      '@type': 'ItemList',
      name: `${SITE_NAME} membership offers`,
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          item: membershipProduct('Community', 'Free forever', [
            membershipOffer('Community', String(TIERS.community.monthly), 'P1M'),
          ]),
        },
        {
          '@type': 'ListItem',
          position: 2,
          item: membershipProduct('VIP', `$${TIERS.vip.monthly} /month`, [
            membershipOffer('VIP', String(TIERS.vip.monthly), 'P1M'),
            ...annualOffers('VIP', TIERS.vip.annual),
          ]),
        },
        {
          '@type': 'ListItem',
          position: 3,
          item: membershipProduct(
            TIER_DISPLAY_NAMES.professional,
            `$${TIERS.professional.monthly} /month`,
            [
              membershipOffer(
                TIER_DISPLAY_NAMES.professional,
                String(TIERS.professional.monthly),
                'P1M',
              ),
              ...annualOffers(TIER_DISPLAY_NAMES.professional, TIERS.professional.annual),
            ],
          ),
        },
      ],
    },
  }
}
