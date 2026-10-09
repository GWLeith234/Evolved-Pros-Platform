/**
 * One JSON-LD graph each for /evolved, /privacy, and /terms.
 *
 * Home and /media identify the site as a WebSite and an Organization with
 * name "Evolved Pros" and url https://www.evolvedpros.com, and they do not
 * set @id. PR #219 gives that same Organization the id
 * https://www.evolvedpros.com/#organization. These graphs use that id, and
 * the matching WebSite id https://www.evolvedpros.com/#website, so a page
 * can point at the site without copying the homepage description.
 *
 * /evolved is the EVOLVED book preorder (h1 EVOLVED, byline George Leith).
 * The graph's main entity is a Book. No ISBN, date, or price: the page
 * publishes none. "No charge" is the preorder list, not a book price.
 *
 * /privacy and /terms are WebPages. Breadcrumbs match the media ListItem
 * shape: Home, then the visible h1, item as a www canonical URL.
 */

import { BOOK_COVER_SRC, BOOK_PREORDER_PATH } from '@/lib/book/preorder'
import { CANONICAL_ORIGIN, SITE_NAME, canonicalUrl } from '@/lib/seo/canonical'
import { homeOrganizationJsonLd } from '@/lib/seo/jsonld'

/** Same Organization @id PR #219 puts on the homepage publisher. */
export const ORGANIZATION_ID = `${CANONICAL_ORIGIN}/#organization`

/**
 * WebSite counterpart of ORGANIZATION_ID. Home's WebSite node is the same
 * name and url and has no @id yet.
 */
export const WEBSITE_ID = `${CANONICAL_ORIGIN}/#website`

/** Same person @id PR #219 publishes on /about. This page only supplies the name. */
export const GEORGE_LEITH_ID = `${canonicalUrl('/about')}#george-leith`

export const EVOLVED_BOOK_NAME = 'EVOLVED'
export const EVOLVED_AUTHOR_NAME = 'George Leith'
export const EVOLVED_COVER_ALT = 'EVOLVED by George Leith'
export const EVOLVED_PAGE_TITLE = 'EVOLVED \u2014 George Leith'
export const EVOLVED_PAGE_DESCRIPTION =
  'Get the book. Leave your name for the EVOLVED preorder list. No charge, no membership.'

export const PRIVACY_PAGE_NAME = 'Privacy Policy'
export const PRIVACY_PAGE_TITLE = 'Privacy Policy \u2014 Evolved Pros'
export const PRIVACY_PAGE_DESCRIPTION =
  'What Evolved Pros collects, how it is used, who processes it, and how to reach us about your data.'

export const TERMS_PAGE_NAME = 'Terms of Service'
export const TERMS_PAGE_TITLE = 'Terms of Service \u2014 Evolved Pros'
export const TERMS_PAGE_DESCRIPTION =
  'The terms that govern membership and use of the Evolved Pros platform, operated by GWLeith Revenue Growth Solutions.'

const PRIVACY_PATH = '/privacy'
const TERMS_PATH = '/terms'

type IdRef = { '@id': string }

type GraphNode = Record<string, unknown>

export type SingleJsonLdGraph = {
  '@context': 'https://schema.org'
  '@graph': GraphNode[]
}

function organizationNode(): GraphNode {
  const org = homeOrganizationJsonLd()
  return {
    '@type': org['@type'],
    '@id': ORGANIZATION_ID,
    name: org.name,
    url: org.url,
  }
}

function websiteNode(): GraphNode {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: SITE_NAME,
    url: CANONICAL_ORIGIN,
    publisher: { '@id': ORGANIZATION_ID } satisfies IdRef,
  }
}

function breadcrumbNode(pageName: string, pageUrl: string): GraphNode {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${pageUrl}#breadcrumb`,
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: canonicalUrl('/'),
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: pageName,
        item: pageUrl,
      },
    ],
  }
}

function graph(...nodes: GraphNode[]): SingleJsonLdGraph {
  return {
    '@context': 'https://schema.org',
    '@graph': [websiteNode(), organizationNode(), ...nodes],
  }
}

/**
 * WebPage for the preorder URL, Book for EVOLVED by George Leith, and
 * Home > EVOLVED. One @graph, one script.
 */
export function evolvedPageJsonLd(): SingleJsonLdGraph {
  const url = canonicalUrl(BOOK_PREORDER_PATH)
  const webpageId = `${url}#webpage`
  const bookId = `${url}#book`
  const breadcrumbId = `${url}#breadcrumb`
  const image = canonicalUrl(BOOK_COVER_SRC)

  return graph(
    {
      '@type': 'WebPage',
      '@id': webpageId,
      name: EVOLVED_BOOK_NAME,
      description: EVOLVED_PAGE_DESCRIPTION,
      url,
      image,
      isPartOf: { '@id': WEBSITE_ID } satisfies IdRef,
      publisher: { '@id': ORGANIZATION_ID } satisfies IdRef,
      mainEntity: { '@id': bookId } satisfies IdRef,
      breadcrumb: { '@id': breadcrumbId } satisfies IdRef,
    },
    {
      '@type': 'Book',
      '@id': bookId,
      name: EVOLVED_BOOK_NAME,
      url,
      image,
      author: {
        '@type': 'Person',
        '@id': GEORGE_LEITH_ID,
        name: EVOLVED_AUTHOR_NAME,
      },
      mainEntityOfPage: { '@id': webpageId } satisfies IdRef,
    },
    breadcrumbNode(EVOLVED_BOOK_NAME, url),
  )
}

function policyPageJsonLd(input: {
  path: string
  name: string
  description: string
}): SingleJsonLdGraph {
  const url = canonicalUrl(input.path)
  const webpageId = `${url}#webpage`
  const breadcrumbId = `${url}#breadcrumb`
  return graph(
    {
      '@type': 'WebPage',
      '@id': webpageId,
      name: input.name,
      description: input.description,
      url,
      isPartOf: { '@id': WEBSITE_ID } satisfies IdRef,
      publisher: { '@id': ORGANIZATION_ID } satisfies IdRef,
      about: { '@id': ORGANIZATION_ID } satisfies IdRef,
      breadcrumb: { '@id': breadcrumbId } satisfies IdRef,
    },
    breadcrumbNode(input.name, url),
  )
}

/** WebPage + Home > Privacy Policy. */
export function privacyPageJsonLd(): SingleJsonLdGraph {
  return policyPageJsonLd({
    path: PRIVACY_PATH,
    name: PRIVACY_PAGE_NAME,
    description: PRIVACY_PAGE_DESCRIPTION,
  })
}

/** WebPage + Home > Terms of Service. */
export function termsPageJsonLd(): SingleJsonLdGraph {
  return policyPageJsonLd({
    path: TERMS_PATH,
    name: TERMS_PAGE_NAME,
    description: TERMS_PAGE_DESCRIPTION,
  })
}
