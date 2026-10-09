import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LdJson } from '@/components/seo/LdJson'
import { BOOK_COVER_SRC, BOOK_PREORDER_PATH } from '@/lib/book/preorder'
import { CANONICAL_ORIGIN, SITE_NAME, canonicalUrl } from '@/lib/seo/canonical'
import { homeOrganizationJsonLd } from '@/lib/seo/jsonld'
import {
  EVOLVED_AUTHOR_NAME,
  EVOLVED_BOOK_NAME,
  EVOLVED_COVER_ALT,
  EVOLVED_PAGE_DESCRIPTION,
  EVOLVED_PAGE_TITLE,
  GEORGE_LEITH_ID,
  ORGANIZATION_ID,
  PRIVACY_PAGE_DESCRIPTION,
  PRIVACY_PAGE_NAME,
  PRIVACY_PAGE_TITLE,
  TERMS_PAGE_DESCRIPTION,
  TERMS_PAGE_NAME,
  TERMS_PAGE_TITLE,
  WEBSITE_ID,
  evolvedPageJsonLd,
  privacyPageJsonLd,
  termsPageJsonLd,
  type SingleJsonLdGraph,
} from './evolvedLegalJsonLd'

const here = dirname(fileURLToPath(import.meta.url))

function read(rel: string): string {
  return readFileSync(resolve(here, rel), 'utf8')
}

const BANNED_KEYS = [
  'isbn',
  'gtin',
  'sku',
  'price',
  'priceCurrency',
  'offers',
  'datePublished',
  'dateModified',
  'copyrightYear',
  'bookEdition',
  'numberOfPages',
  'aggregateRating',
]

function keysOf(value: unknown, keys = new Set<string>()): Set<string> {
  if (Array.isArray(value)) {
    for (const entry of value) keysOf(entry, keys)
    return keys
  }
  if (value && typeof value === 'object') {
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      keys.add(key)
      keysOf(entry, keys)
    }
  }
  return keys
}

function renderGraph(data: SingleJsonLdGraph): { html: string; graph: SingleJsonLdGraph } {
  const html = renderToStaticMarkup(<LdJson data={data} />)
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([^<]*)<\/script>/g)]
  expect(blocks).toHaveLength(1)
  const graph = JSON.parse(blocks[0][1]) as SingleJsonLdGraph
  expect(graph).toEqual(data)
  return { html, graph }
}

function node(graph: SingleJsonLdGraph, type: string): Record<string, unknown> {
  const found = graph['@graph'].filter(entry => entry['@type'] === type)
  expect(found).toHaveLength(1)
  return found[0]
}

function assertSiteNodes(graph: SingleJsonLdGraph) {
  const org = homeOrganizationJsonLd()
  expect(graph['@context']).toBe('https://schema.org')
  expect(node(graph, 'WebSite')).toEqual({
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: SITE_NAME,
    url: CANONICAL_ORIGIN,
    publisher: { '@id': ORGANIZATION_ID },
  })
  expect(node(graph, 'Organization')).toEqual({
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: org.name,
    url: org.url,
  })
  expect(ORGANIZATION_ID).toBe('https://www.evolvedpros.com/#organization')
  expect(WEBSITE_ID).toBe('https://www.evolvedpros.com/#website')
  expect(org).toEqual({
    '@type': 'Organization',
    name: 'Evolved Pros',
    url: 'https://www.evolvedpros.com',
  })
}

function assertBreadcrumb(graph: SingleJsonLdGraph, pageName: string, pageUrl: string) {
  expect(node(graph, 'BreadcrumbList')).toEqual({
    '@type': 'BreadcrumbList',
    '@id': `${pageUrl}#breadcrumb`,
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: CANONICAL_ORIGIN },
      { '@type': 'ListItem', position: 2, name: pageName, item: pageUrl },
    ],
  })
}

function assertNoInventedCommerce(graph: SingleJsonLdGraph) {
  const keys = keysOf(graph)
  for (const key of BANNED_KEYS) expect(keys.has(key)).toBe(false)
  const blob = JSON.stringify(graph)
  expect(blob).not.toContain('platform.evolvedpros.com')
  expect(blob).not.toContain('Evolved Media')
  expect(blob).not.toContain('isbn')
}

describe('site ids', () => {
  it('joins the homepage Organization and names the WebSite the same way', () => {
    expect(SITE_NAME).toBe('Evolved Pros')
    expect(CANONICAL_ORIGIN).toBe('https://www.evolvedpros.com')
    expect(GEORGE_LEITH_ID).toBe('https://www.evolvedpros.com/about#george-leith')
  })
})

describe('/evolved JSON-LD', () => {
  it('renders one graph: WebPage, Book, and Home > EVOLVED', () => {
    const { html, graph } = renderGraph(evolvedPageJsonLd())
    const url = canonicalUrl(BOOK_PREORDER_PATH)
    expect(html.match(/<script/g)).toHaveLength(1)
    expect(graph['@graph'].map(entry => entry['@type'])).toEqual([
      'WebSite',
      'Organization',
      'WebPage',
      'Book',
      'BreadcrumbList',
    ])
    assertSiteNodes(graph)
    assertBreadcrumb(graph, EVOLVED_BOOK_NAME, url)
    assertNoInventedCommerce(graph)

    expect(node(graph, 'WebPage')).toEqual({
      '@type': 'WebPage',
      '@id': `${url}#webpage`,
      name: 'EVOLVED',
      description: EVOLVED_PAGE_DESCRIPTION,
      url: 'https://www.evolvedpros.com/evolved',
      image: canonicalUrl(BOOK_COVER_SRC),
      isPartOf: { '@id': WEBSITE_ID },
      publisher: { '@id': ORGANIZATION_ID },
      mainEntity: { '@id': `${url}#book` },
      breadcrumb: { '@id': `${url}#breadcrumb` },
    })
    expect(node(graph, 'Book')).toEqual({
      '@type': 'Book',
      '@id': `${url}#book`,
      name: 'EVOLVED',
      url: 'https://www.evolvedpros.com/evolved',
      image: 'https://www.evolvedpros.com/ads/book-cover.png',
      author: {
        '@type': 'Person',
        '@id': GEORGE_LEITH_ID,
        name: 'George Leith',
      },
      mainEntityOfPage: { '@id': `${url}#webpage` },
    })
    expect(EVOLVED_BOOK_NAME).toBe('EVOLVED')
    expect(EVOLVED_AUTHOR_NAME).toBe('George Leith')
    expect(EVOLVED_COVER_ALT).toBe('EVOLVED by George Leith')
    expect(EVOLVED_PAGE_TITLE).toBe('EVOLVED \u2014 George Leith')
    expect(EVOLVED_PAGE_DESCRIPTION).toBe(
      'Get the book. Leave your name for the EVOLVED preorder list. No charge, no membership.',
    )
  })
})

describe('/privacy JSON-LD', () => {
  it('renders one WebPage graph and Home > Privacy Policy', () => {
    const { html, graph } = renderGraph(privacyPageJsonLd())
    const url = 'https://www.evolvedpros.com/privacy'
    expect(html.match(/<script/g)).toHaveLength(1)
    expect(graph['@graph'].map(entry => entry['@type'])).toEqual([
      'WebSite',
      'Organization',
      'WebPage',
      'BreadcrumbList',
    ])
    assertSiteNodes(graph)
    assertBreadcrumb(graph, PRIVACY_PAGE_NAME, url)
    assertNoInventedCommerce(graph)
    expect(node(graph, 'WebPage')).toEqual({
      '@type': 'WebPage',
      '@id': `${url}#webpage`,
      name: 'Privacy Policy',
      description: PRIVACY_PAGE_DESCRIPTION,
      url,
      isPartOf: { '@id': WEBSITE_ID },
      publisher: { '@id': ORGANIZATION_ID },
      about: { '@id': ORGANIZATION_ID },
      breadcrumb: { '@id': `${url}#breadcrumb` },
    })
    expect(graph['@graph'].some(entry => entry['@type'] === 'Book')).toBe(false)
    expect(JSON.stringify(graph)).not.toContain('GWLeith')
  })
})

describe('/terms JSON-LD', () => {
  it('renders one WebPage graph and Home > Terms of Service', () => {
    const { html, graph } = renderGraph(termsPageJsonLd())
    const url = 'https://www.evolvedpros.com/terms'
    expect(html.match(/<script/g)).toHaveLength(1)
    expect(graph['@graph'].map(entry => entry['@type'])).toEqual([
      'WebSite',
      'Organization',
      'WebPage',
      'BreadcrumbList',
    ])
    assertSiteNodes(graph)
    assertBreadcrumb(graph, TERMS_PAGE_NAME, url)
    assertNoInventedCommerce(graph)
    expect(node(graph, 'WebPage')).toEqual({
      '@type': 'WebPage',
      '@id': `${url}#webpage`,
      name: 'Terms of Service',
      description: TERMS_PAGE_DESCRIPTION,
      url,
      isPartOf: { '@id': WEBSITE_ID },
      publisher: { '@id': ORGANIZATION_ID },
      about: { '@id': ORGANIZATION_ID },
      breadcrumb: { '@id': `${url}#breadcrumb` },
    })
    expect(TERMS_PAGE_TITLE).toBe('Terms of Service \u2014 Evolved Pros')
    expect(TERMS_PAGE_DESCRIPTION).toBe(
      'The terms that govern membership and use of the Evolved Pros platform, operated by GWLeith Revenue Growth Solutions.',
    )
    expect(PRIVACY_PAGE_TITLE).toBe('Privacy Policy \u2014 Evolved Pros')
  })
})

describe('page wiring', () => {
  it('mounts one LdJson graph and keeps the visible copy', () => {
    const evolved = read('../../app/evolved/page.tsx')
    const privacy = read('../../app/(public)/privacy/page.tsx')
    const terms = read('../../app/(public)/terms/page.tsx')

    for (const src of [evolved, privacy, terms]) {
      expect(src.match(/<LdJson\b/g)).toHaveLength(1)
      expect(src).not.toContain('LdJsonGraph')
      expect(src).not.toContain('application/ld+json')
    }

    expect(evolved).toContain('evolvedPageJsonLd()')
    expect(evolved).toContain('title: EVOLVED_PAGE_TITLE')
    expect(evolved).toContain('description: EVOLVED_PAGE_DESCRIPTION')
    expect(evolved).toContain('alt={EVOLVED_COVER_ALT}')
    expect(evolved).toContain('{EVOLVED_BOOK_NAME}')
    expect(evolved).toContain('{EVOLVED_AUTHOR_NAME}')
    expect(evolved).toContain('New book')
    expect(evolved).toContain('No charge. No membership.')

    expect(privacy).toContain('privacyPageJsonLd()')
    expect(privacy).toContain('title: PRIVACY_PAGE_TITLE')
    expect(privacy).toContain('description: PRIVACY_PAGE_DESCRIPTION')
    expect(privacy).toContain('title={PRIVACY_PAGE_NAME}')

    expect(terms).toContain('termsPageJsonLd()')
    expect(terms).toContain('title: TERMS_PAGE_TITLE')
    expect(terms).toContain('description: TERMS_PAGE_DESCRIPTION')
    expect(terms).toContain('title={TERMS_PAGE_NAME}')
  })
})
