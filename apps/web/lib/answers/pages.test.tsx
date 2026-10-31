import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import SalesBurnoutPage from '@/app/(public)/sales-burnout/page'
import SalesCoachingPage from '@/app/(public)/sales-coaching/page'
import SalesQuotaPage from '@/app/(public)/sales-quota/page'
import { AnswerPage } from '@/components/answers/AnswerPage'
import {
  ANSWER_CTA_HREF,
  ANSWER_CTA_LABEL,
  ANSWER_PAGES,
  SALES_BURNOUT,
  SALES_COACHING,
  SALES_QUOTA,
  answerPageSchemas,
  type AnswerPageCopy,
  type AnswerRun,
} from '@/lib/answers/pages'
import { CANONICAL_ORIGIN, canonicalUrl, publicPageMetadata } from '@/lib/seo/canonical'
import { META_DESCRIPTION_MAX, META_DESCRIPTION_MIN } from '@/lib/seo/metaDescription'
import { PUBLIC_SITEMAP_PATHS, ROBOTS_DISALLOW } from '@/lib/seo/publicRoutes'

const root = resolve(__dirname, '../..')
const read = (rel: string) => readFileSync(resolve(root, rel), 'utf8')

const OMITTED = ['DRAFT', 'Target:', 'DataForSEO', 'Jarvis', '90 searches', '29%', 'competition is LOW']

function runsIn(page: AnswerPageCopy): AnswerRun[] {
  const runs: AnswerRun[] = []
  for (const section of page.sections) {
    for (const block of section.blocks) {
      if (block.type === 'p') runs.push(...block.runs)
    }
  }
  for (const item of page.faqs) {
    if (item.runs) runs.push(...item.runs)
  }
  if (page.afterFaq) runs.push(...page.afterFaq)
  return runs
}

function decodeHtml(html: string): string {
  return html
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
}

function visibleText(page: AnswerPageCopy): string {
  const parts = [page.h1, page.directAnswer]
  for (const section of page.sections) {
    parts.push(section.heading)
    for (const block of section.blocks) {
      if (block.type === 'ol') parts.push(...block.items)
      else parts.push(...block.runs.map(run => run.text))
    }
  }
  parts.push('FAQ')
  for (const item of page.faqs) parts.push(item.question, item.answer)
  if (page.afterFaq) parts.push(...page.afterFaq.map(run => run.text))
  parts.push(ANSWER_CTA_LABEL)
  return parts.join('\n')
}

describe('answer page copy', () => {
  it('publishes the three root slugs with the supplied titles and descriptions', () => {
    expect(ANSWER_PAGES.map(page => page.path)).toEqual([
      '/sales-coaching',
      '/sales-quota',
      '/sales-burnout',
    ])
    expect(SALES_COACHING.title).toBe(
      'Sales Coaching That Actually Changes Your Number | Evolved Pros',
    )
    expect(SALES_QUOTA.title).toBe(
      "Sales Quota: What It Is, How It's Set, and What to Do When It's Unrealistic | Evolved Pros",
    )
    expect(SALES_BURNOUT.title).toBe(
      'Sales Burnout: Signs, Causes, and How to Recover Without Quitting Sales | Evolved Pros',
    )
    expect(SALES_COACHING.h1).toBe('Sales Coaching That Actually Changes Your Number')
    expect(SALES_COACHING.description).toBe(
      "Most reps get pipeline reviews, not coaching. See what sales coaching looks like, how to tell if it's working, and where to get it if your manager can't.",
    )
    expect(SALES_QUOTA.description).toBe(
      "A sales quota is the revenue or activity target you're paid against. Here's how to check if yours is realistic, how to push back and recover a miss.",
    )
    expect(SALES_BURNOUT.description).toBe(
      "Burned out in sales? Most of it comes from quota pressure, churn-and-burn culture and nonstop prospecting. See how to tell which one and what to do next.",
    )
    for (const page of ANSWER_PAGES) {
      expect(page.description.length).toBeGreaterThanOrEqual(META_DESCRIPTION_MIN)
      expect(page.description.length).toBeLessThanOrEqual(META_DESCRIPTION_MAX)
      expect(page.description.endsWith('.')).toBe(true)
      expect(page.title.endsWith(' | Evolved Pros')).toBe(true)
      expect(page.h1).toBe(page.title.replace(/ \| Evolved Pros$/, ''))
      const meta = publicPageMetadata(page.path, {
        title: page.title,
        description: page.description,
      })
      expect(meta.description).toBe(page.description)
    }
  })

  it('drops the draft, target, and DataForSEO lines and does not invent figures', () => {
    for (const page of ANSWER_PAGES) {
      const text = visibleText(page)
      for (const phrase of OMITTED) {
        expect(text, page.path).not.toContain(phrase)
      }
    }
    const coaching = visibleText(SALES_COACHING)
    expect(coaching).toContain('1,246')
    expect(coaching).toContain('85th-95th percentile')
    const quota = visibleText(SALES_QUOTA)
    expect(quota).toContain('1.1m')
    expect(quota).toContain('My quota: 3m')
    expect(quota).toContain('almost 6x')
    expect(quota).toContain('20-25%')
    const burnout = visibleText(SALES_BURNOUT)
    expect(burnout).toContain('20-25%')
    expect(burnout).toContain('200 cold calls everyday')
    expect(burnout).not.toContain('searches a month')
  })

  it('keeps the burnout medical note out of the FAQ schema', () => {
    expect(SALES_BURNOUT.afterFaq?.map(run => run.text).join('')).toBe(
      "Not medical advice. If it's affecting your health, see a professional.",
    )
    expect(SALES_COACHING.afterFaq).toBeUndefined()
    expect(SALES_QUOTA.afterFaq).toBeUndefined()
    const faq = answerPageSchemas(SALES_BURNOUT)[1]
    const blob = JSON.stringify(faq)
    expect(blob).not.toContain('Not medical advice')
    expect(faq.mainEntity).toHaveLength(3)
    expect(answerPageSchemas(SALES_COACHING)[1].mainEntity).toHaveLength(4)
    expect(answerPageSchemas(SALES_QUOTA)[1].mainEntity).toHaveLength(5)
  })
})

describe('answer page JSON-LD', () => {
  it('emits Article and FAQPage on the www host', () => {
    for (const page of ANSWER_PAGES) {
      const [article, faq] = answerPageSchemas(page)
      const url = canonicalUrl(page.path)
      expect(url.startsWith('https://www.evolvedpros.com/')).toBe(true)
      expect(article['@type']).toBe('Article')
      expect(article.headline).toBe(page.h1)
      expect(article.description).toBe(page.description)
      expect(article.url).toBe(url)
      expect(article.mainEntityOfPage).toEqual({ '@type': 'WebPage', '@id': url })
      expect(article.publisher).toEqual({
        '@type': 'Organization',
        name: 'Evolved Pros',
        url: CANONICAL_ORIGIN,
      })
      expect(faq['@type']).toBe('FAQPage')
      expect(faq.url).toBe(url)
      expect(faq.mainEntity.map(item => item.name)).toEqual(page.faqs.map(item => item.question))
      expect(faq.mainEntity.map(item => item.acceptedAnswer.text)).toEqual(
        page.faqs.map(item => item.answer),
      )
      const blob = JSON.stringify([article, faq])
      expect(blob).not.toContain('platform.evolvedpros.com')
      expect(blob).not.toContain('Evolved Media')
    }
  })
})

describe('answer page render', () => {
  it('renders the body, one red CTA, the navy logo, and the right link rels', () => {
    for (const page of ANSWER_PAGES) {
      const html = decodeHtml(renderToStaticMarkup(<AnswerPage page={page} />))
      expect(html).toContain(`data-answer-page="${page.path}"`)
      expect(html).toContain(page.h1)
      expect(html).toContain('Direct answer:')
      expect(html).toContain(page.directAnswer)
      expect(html).toContain('src="/logo_horizontal_navy.png"')
      expect(html).toContain('aria-label="Evolved Pros home"')
      const ctas = html.match(/class="ep-answer-cta"/g) ?? []
      expect(ctas, page.path).toHaveLength(1)
      expect(html).toContain(`>${ANSWER_CTA_LABEL}</a>`)
      expect(html).toContain(`href="${ANSWER_CTA_HREF}"`)

      for (const phrase of OMITTED) expect(html, page.path).not.toContain(phrase)

      for (const run of runsIn(page)) {
        if (run.type !== 'link') continue
        expect(html, run.href).toContain(`href="${run.href}"`)
        if (run.kind === 'external') {
          expect(run.href.startsWith('https://www.reddit.com/') || run.href.startsWith('https://doi.org/')).toBe(true)
          expect(html).toContain('rel="nofollow noopener"')
          expect(html).toContain('target="_blank"')
        } else {
          expect(run.href.startsWith('/')).toBe(true)
          expect(run.href).not.toContain('evolvedpros.com')
        }
      }
    }
  })

  it('links the answer pages to each other with relative paths', () => {
    const burnout = decodeHtml(renderToStaticMarkup(<AnswerPage page={SALES_BURNOUT} />))
    expect(burnout).toContain('href="/sales-quota"')
    expect(burnout).toContain('href="/sales-coaching"')
    expect(burnout).toContain('Not medical advice. If it\'s affecting your health, see a professional.')
    expect(burnout).not.toContain('https://www.evolvedpros.com/sales-')

    const coaching = decodeHtml(renderToStaticMarkup(<AnswerPage page={SALES_COACHING} />))
    expect(coaching).toContain('href="https://doi.org/10.1111/peps.12123"')
    expect(coaching).toContain('href="/media/execution/call-review-coaching-loop-20-minutes"')
    expect(coaching).toContain('href="/about"')
    expect(coaching).not.toContain('href="https://www.evolvedpros.com')
  })
})

describe('answer route documents', () => {
  const routes = [
    { page: SALES_COACHING, Route: SalesCoachingPage },
    { page: SALES_QUOTA, Route: SalesQuotaPage },
    { page: SALES_BURNOUT, Route: SalesBurnoutPage },
  ] as const

  it('mounts Article and FAQPage JSON-LD and no robots meta', () => {
    for (const { page, Route } of routes) {
      const html = renderToStaticMarkup(<Route />)
      expect(html).toContain('application/ld+json')
      expect(html).toContain('"@type":"Article"')
      expect(html).toContain('"@type":"FAQPage"')
      expect(html).toContain(canonicalUrl(page.path))
      expect(html).not.toContain('noindex')
      expect(html).not.toContain('platform.evolvedpros.com')
    }
  })
})

describe('answer pages stay public and indexable', () => {
  it('is in the sitemap, absent from robots disallow, and not noindexed', () => {
    for (const page of ANSWER_PAGES) {
      expect([...PUBLIC_SITEMAP_PATHS]).toContain(page.path)
      expect([...ROBOTS_DISALLOW]).not.toContain(page.path)
      const meta = publicPageMetadata(page.path, {
        title: page.title,
        description: page.description,
      })
      expect(meta.robots).toBeUndefined()
      expect(meta.alternates?.canonical).toBe(canonicalUrl(page.path))
      expect(String(meta.openGraph && 'url' in meta.openGraph ? meta.openGraph.url : '')).toBe(
        canonicalUrl(page.path),
      )
    }

    const middleware = read('middleware.ts')
    const matcher = middleware.slice(middleware.indexOf('matcher:'))
    for (const page of ANSWER_PAGES) {
      expect(matcher).not.toContain(`'${page.path}'`)
      expect(matcher).not.toContain(`"${page.path}"`)
      const source = read(`app/(public)${page.path}/page.tsx`)
      expect(source).toContain('publicPageMetadata')
      expect(source).not.toContain('noindex')
      expect(source).not.toContain('robots:')
    }
  })
})
