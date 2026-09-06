import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { assertNoEmDash } from '@/lib/home/bands'
import {
  BOOK_EVENT_TITLE,
  LAUNCH_EVENT_TITLE,
  MASTERMIND_EVENT_DETAIL,
  MASTERMIND_EVENT_TITLE,
} from '@/lib/events/nextEvent'
import {
  AMAZON_BOOK_SEARCH_URL,
  formatMilestoneDate,
  milestoneDateTime,
  PRODUCT_LAUNCHES_EYEBROW,
  PRODUCT_LAUNCHES_KICKER,
  PRODUCT_LAUNCHES_TITLE,
  PRODUCT_MILESTONES,
  sortedProductMilestones,
} from './product-milestones'

describe('PRODUCT_MILESTONES', () => {
  it('locks four rows: Vegas launch, platform, Masterminds, book', () => {
    expect(PRODUCT_MILESTONES).toHaveLength(4)

    const titles = PRODUCT_MILESTONES.map(m => m.title)
    expect(titles.some(t => /conquer local/i.test(t))).toBe(false)
    expect(titles).toContain(LAUNCH_EVENT_TITLE)
    expect(titles).toContain('EVOLVED Platform goes live')
    expect(titles).toContain(MASTERMIND_EVENT_TITLE)
    expect(titles).toContain(BOOK_EVENT_TITLE)

    const launch = PRODUCT_MILESTONES.find(m => m.title === LAUNCH_EVENT_TITLE)
    const platform = PRODUCT_MILESTONES.find(m => m.title === 'EVOLVED Platform goes live')
    const book = PRODUCT_MILESTONES.find(m => m.title === BOOK_EVENT_TITLE)
    const mastermind = PRODUCT_MILESTONES.find(m => m.title === MASTERMIND_EVENT_TITLE)

    expect(launch && [launch.date.getFullYear(), launch.date.getMonth() + 1, launch.date.getDate()]).toEqual([
      2026, 4, 28,
    ])
    expect(platform && [platform.date.getFullYear(), platform.date.getMonth() + 1, platform.date.getDate()]).toEqual([
      2026, 5, 15,
    ])
    expect(book && [book.date.getFullYear(), book.date.getMonth() + 1, book.date.getDate()]).toEqual([2026, 10, 15])
    expect(mastermind && [mastermind.date.getFullYear(), mastermind.date.getMonth() + 1, mastermind.date.getDate()]).toEqual([
      2026, 10, 2,
    ])
    expect(book && [book.date.getFullYear(), book.date.getMonth() + 1, book.date.getDate()]).not.toEqual([
      2026, 7, 15,
    ])

    expect(mastermind?.detail).toBe(MASTERMIND_EVENT_DETAIL)
    expect(`${mastermind?.title}. ${mastermind?.detail}`).toBe(
      'AI Masterminds for Senior Execs. Starts Oct 2, every Friday after at 2pm CST (America/Chicago). Professional Tier only.',
    )
  })

  it('locks CTAs to existing routes and Amazon search (no invented ASIN)', () => {
    const byId = Object.fromEntries(PRODUCT_MILESTONES.map(m => [m.id, m]))

    expect(byId['launch-vegas-2026']?.linkLabel).toBe('Listen')
    expect(byId['launch-vegas-2026']?.linkUrl).toBe('/podcast')

    expect(byId['platform-live-2026']?.linkLabel).toBe('Enter the platform')
    expect(byId['platform-live-2026']?.linkUrl).toBe('/home')

    expect(byId['masterminds-execs-2026']?.linkLabel).toBe('See events')
    expect(byId['masterminds-execs-2026']?.linkUrl).toBe('/events')

    expect(byId['book-evolved-2026']?.linkLabel).toBe('Find on Amazon')
    expect(byId['book-evolved-2026']?.linkUrl).toBe(AMAZON_BOOK_SEARCH_URL)
    expect(AMAZON_BOOK_SEARCH_URL).toBe('https://www.amazon.com/s?k=Evolved+by+George+Leith')
    expect(AMAZON_BOOK_SEARCH_URL).not.toMatch(/\/dp\//)
    expect(new Set(PRODUCT_MILESTONES.map(m => m.id)).size).toBe(PRODUCT_MILESTONES.length)
  })

  it('keeps header copy and every dek free of em dashes', () => {
    expect(PRODUCT_LAUNCHES_EYEBROW).toBe('Milestones')
    expect(PRODUCT_LAUNCHES_TITLE).toBe('Product launches')
    expect(PRODUCT_LAUNCHES_KICKER).toBe('Platform and media moments. Not stage dates.')

    for (const copy of [
      PRODUCT_LAUNCHES_EYEBROW,
      PRODUCT_LAUNCHES_TITLE,
      PRODUCT_LAUNCHES_KICKER,
      ...PRODUCT_MILESTONES.flatMap(m => [m.title, m.detail ?? '', m.linkLabel ?? '']),
    ]) {
      expect(assertNoEmDash(copy), copy).toBe(true)
    }
  })

  it('sorts by date so a later append still lands last', () => {
    const shuffled = [PRODUCT_MILESTONES[3], PRODUCT_MILESTONES[1], PRODUCT_MILESTONES[0], PRODUCT_MILESTONES[2]]
    expect(sortedProductMilestones(shuffled).map(m => m.id)).toEqual([
      'launch-vegas-2026',
      'platform-live-2026',
      'masterminds-execs-2026',
      'book-evolved-2026',
    ])
    expect(formatMilestoneDate(PRODUCT_MILESTONES[0].date)).toBe('APR 28, 2026')
    expect(milestoneDateTime(PRODUCT_MILESTONES[0].date)).toBe('2026-04-28')
  })
})

describe('LiveProductMilestones Timeline wiring (source)', () => {
  const root = resolve(__dirname, '../..')
  const component = readFileSync(resolve(root, 'components/live/LiveProductMilestones.tsx'), 'utf8')
  const css = readFileSync(resolve(root, 'app/globals.css'), 'utf8')

  it('renders a Timeline, not the old card list', () => {
    expect(component).toContain('live-milestones-timeline')
    expect(component).toContain('PRODUCT_LAUNCHES_KICKER')
    expect(component).toContain('sortedProductMilestones')
    expect(component).not.toContain('Platform and media moments —')
    expect(css).toContain('.live-milestones-timeline')
    expect(css).toContain('.live-milestones-node')
    expect(css).toContain('.live-milestones[data-preview="light"]')
  })
})
