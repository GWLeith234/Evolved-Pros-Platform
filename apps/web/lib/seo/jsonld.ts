/**
 * Public JSON-LD builders. Podcast and article routes keep their inline
 * schemas. Home ships WebSite + Organization; /pricing ships the
 * membership Product / Offer catalog; /live ships a WebPage plus a
 * keynote/speaking Service with no price; /fit ships one VIP Product / Offer.
 * Media listing pages use mediaCollectionJsonLd.ts (CollectionPage).
 * /about ships AboutPage + BreadcrumbList. /contact ships ContactPage +
 * BreadcrumbList. Both join the homepage publisher by ORGANIZATION_ID.
 *
 * Brand lock: Evolved Pros. Never Evolved Media.
 *
 * homeOrganizationJsonLd() stays without @id. Pricing, live, fit, and media
 * publishers keep that shape so their rendered JSON-LD does not change.
 */

import {
  ABOUT_DESCRIPTION,
  ABOUT_GEORGE,
  ABOUT_GEORGE_NAME,
  ABOUT_HERO_KICKER,
  ABOUT_PATH,
  ABOUT_ROLE,
  ABOUT_TITLE,
  ABOUT_WHAT,
} from '@/lib/about/copy'
import { FIT_PAGE_DESCRIPTION, FIT_PAGE_TITLE, FIT_VIP_MONTHLY } from '@/lib/fit/copy'
import { HOME_SUB } from '@/lib/home/conversion'
import { PUBLIC_FOOTER_LINKS } from '@/lib/layout/publicFooter'
import { TIERS, TIER_DISPLAY_NAMES } from '@/lib/pricing'
import { CANONICAL_ORIGIN, SITE_NAME, canonicalUrl } from '@/lib/seo/canonical'

/** Same node the homepage WebSite publisher and /about Organization share. */
export const ORGANIZATION_ID = `${CANONICAL_ORIGIN}/#organization`

/** George Leith, defined on /about. */
export const GEORGE_LEITH_ID = `${canonicalUrl(ABOUT_PATH)}#george-leith`

export function homeOrganizationJsonLd() {
  return {
    '@type': 'Organization',
    name: SITE_NAME,
    url: CANONICAL_ORIGIN,
  }
}

/**
 * Organization identity with a stable @id. Homepage publisher and /contact
 * use this. /about adds description and founder on the same @id.
 */
export function siteOrganizationJsonLd() {
  const org = homeOrganizationJsonLd()
  return {
    '@type': org['@type'],
    '@id': ORGANIZATION_ID,
    name: org.name,
    url: org.url,
  }
}

/** WebSite + nested Organization for `/`. Publisher @id matches /about. */
export function homeJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: CANONICAL_ORIGIN,
    description: HOME_SUB,
    publisher: siteOrganizationJsonLd(),
  }
}

const PRICING_URL = canonicalUrl('/pricing')
const LIVE_URL = canonicalUrl('/live')
const FIT_URL = canonicalUrl('/fit')

/**
 * Same sentence as the /live document description. The page CTA is
 * "Inquire about booking" and publishes no fee.
 */
export const LIVE_PAGE_DESCRIPTION =
  'High-energy keynotes, workshops, and mastermind formats. Upcoming and past speaking events worldwide — powered by the EVOLVED Architecture™.'

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
 * Community Free / $0, VIP $149 /month, The Evolved Pros 99 $599 /month.
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

/**
 * WebPage + Service for `/live`.
 *
 * Keynotes sell on this URL. The CTA is "Inquire about booking" and the
 * page publishes no fee, so this schema has no Offer, price, or priceCurrency.
 */
export function liveJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${SITE_NAME} LIVE`,
    url: LIVE_URL,
    description: LIVE_PAGE_DESCRIPTION,
    publisher: homeOrganizationJsonLd(),
    mainEntity: {
      '@type': 'Service',
      name: `${SITE_NAME} Live keynotes and workshops`,
      url: LIVE_URL,
      brand: { '@type': 'Brand', name: SITE_NAME },
    },
  }
}

/**
 * WebPage + one Product / Offer for `/fit`.
 *
 * The page shows VIP $99 (Upgrade to VIP). The offer price is that VIP
 * monthly amount. The offer URL is /pricing, where the money lives.
 * The WebPage and Product URLs stay on /fit. No other tiers. No Keynotes.
 */
export function fitJsonLd() {
  const price = String(FIT_VIP_MONTHLY)
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: FIT_PAGE_TITLE,
    url: FIT_URL,
    description: FIT_PAGE_DESCRIPTION,
    publisher: homeOrganizationJsonLd(),
    mainEntity: {
      '@type': 'Product',
      name: FIT_PAGE_TITLE,
      description: FIT_PAGE_DESCRIPTION,
      brand: { '@type': 'Brand', name: SITE_NAME },
      url: FIT_URL,
      offers: membershipOffer('VIP', price, 'P1M'),
    },
  }
}

/**
 * JSON-LD script body. Same JSON.stringify the article, home, pricing,
 * live, and fit routes use, with `<` escaped so a title cannot close the
 * script tag (`</script>` becomes `\u003c/script>`).
 */
export function jsonLdScriptHtml(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

type BreadcrumbCrumb = {
  name: string
  path: string
}

/**
 * Home > page. Same ListItem shape media listing pages emit:
 * position, name, and item as a www canonical URL.
 */
export function breadcrumbListJsonLd(crumbs: readonly BreadcrumbCrumb[]) {
  return {
    '@context': 'https://schema.org' as const,
    '@type': 'BreadcrumbList' as const,
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem' as const,
      position: index + 1,
      name: crumb.name,
      item: canonicalUrl(crumb.path),
    })),
  }
}

function footerLinkLabel(href: string): string {
  const label = PUBLIC_FOOTER_LINKS.find(link => link.href === href)?.label
  if (!label) throw new Error(`No public footer label for ${href}`)
  return label
}

/**
 * George Leith as published on /about: name, Founder, and the bio paragraph.
 * worksFor points at ORGANIZATION_ID so the person joins that node.
 */
function georgeLeithJsonLd() {
  return {
    '@type': 'Person' as const,
    '@id': GEORGE_LEITH_ID,
    name: ABOUT_GEORGE_NAME,
    jobTitle: ABOUT_ROLE,
    description: ABOUT_GEORGE[0],
    worksFor: { '@id': ORGANIZATION_ID },
  }
}

/**
 * AboutPage whose subject is the Evolved Pros Organization, plus the
 * founder Person on that same @id. Breadcrumb is Home > About.
 */
export function aboutPageSchemas() {
  const organization = {
    ...siteOrganizationJsonLd(),
    description: ABOUT_WHAT[0],
    founder: georgeLeithJsonLd(),
  }
  const page = {
    '@context': 'https://schema.org' as const,
    '@type': 'AboutPage' as const,
    name: ABOUT_TITLE,
    description: ABOUT_DESCRIPTION,
    url: canonicalUrl(ABOUT_PATH),
    mainEntity: organization,
    about: { '@id': ORGANIZATION_ID },
  }
  const breadcrumb = breadcrumbListJsonLd([
    { name: 'Home', path: '/' },
    { name: ABOUT_HERO_KICKER, path: ABOUT_PATH },
  ])
  return [page, breadcrumb] as const
}

/**
 * ContactPage linked to the same Organization @id as the homepage publisher.
 * No inboxes, phones, or addresses: those stay in the page HTML only.
 * Breadcrumb is Home > Contact.
 */
export function contactPageSchemas() {
  const page = {
    '@context': 'https://schema.org' as const,
    '@type': 'ContactPage' as const,
    name: footerLinkLabel('/contact'),
    url: canonicalUrl('/contact'),
    mainEntity: siteOrganizationJsonLd(),
    about: { '@id': ORGANIZATION_ID },
  }
  const breadcrumb = breadcrumbListJsonLd([
    { name: 'Home', path: '/' },
    { name: footerLinkLabel('/contact'), path: '/contact' },
  ])
  return [page, breadcrumb] as const
}
