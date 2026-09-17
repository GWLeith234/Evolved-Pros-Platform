/**
 * Public JSON-LD builders. Podcast and article routes keep their inline
 * schemas. Home ships WebSite + Organization; /pricing ships the
 * membership Product / Offer catalog.
 *
 * Brand lock: Evolved Pros. Never Evolved Media.
 */

import { HOME_SUB } from '@/lib/home/conversion'
import { TIERS } from '@/lib/pricing'
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
 * Amounts are the live membership ladder (Community Free / $0, VIP $49 /month,
 * Professional $249 /month). Keynotes stay off the Offer list: the page says
 * Inquire for fee and we do not invent a dollar price.
 */
export function pricingJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${SITE_NAME} Pricing`,
    url: PRICING_URL,
    description: 'Community, VIP, Professional, and Keynote tiers for high performers.',
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
            membershipOffer('VIP annual', String(TIERS.vip.annual), 'P1Y'),
          ]),
        },
        {
          '@type': 'ListItem',
          position: 3,
          item: membershipProduct(
            'Professional',
            `$${TIERS.professional.monthly} /month`,
            [
              membershipOffer('Professional', String(TIERS.professional.monthly), 'P1M'),
              membershipOffer(
                'Professional annual',
                String(TIERS.professional.annual),
                'P1Y',
              ),
            ],
          ),
        },
      ],
    },
  }
}
