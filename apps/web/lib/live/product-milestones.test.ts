import { describe, expect, it } from 'vitest'
import { assertNoEmDash } from '@/lib/home/bands'
import {
  BOOK_EVENT_TITLE,
  LAUNCH_EVENT_TITLE,
  MASTERMIND_EVENT_DETAIL,
  MASTERMIND_EVENT_TITLE,
} from '@/lib/events/nextEvent'
import { PRODUCT_MILESTONES } from './product-milestones'

describe('PRODUCT_MILESTONES', () => {
  it('kills Conquer Local and locks George launch, book, and Masterminds copy', () => {
    const titles = PRODUCT_MILESTONES.map(m => m.title)
    expect(titles.some(t => /conquer local/i.test(t))).toBe(false)
    expect(titles).toContain(LAUNCH_EVENT_TITLE)
    expect(titles).toContain(BOOK_EVENT_TITLE)
    expect(titles).toContain(MASTERMIND_EVENT_TITLE)

    const launch = PRODUCT_MILESTONES.find(m => m.title === LAUNCH_EVENT_TITLE)
    const book = PRODUCT_MILESTONES.find(m => m.title === BOOK_EVENT_TITLE)
    const mastermind = PRODUCT_MILESTONES.find(m => m.title === MASTERMIND_EVENT_TITLE)

    expect(launch && [launch.date.getFullYear(), launch.date.getMonth() + 1, launch.date.getDate()]).toEqual([2026, 4, 28])
    expect(book && [book.date.getFullYear(), book.date.getMonth() + 1, book.date.getDate()]).toEqual([2026, 10, 15])
    expect(mastermind && [mastermind.date.getFullYear(), mastermind.date.getMonth() + 1, mastermind.date.getDate()]).toEqual([2026, 10, 2])
    expect(mastermind?.detail).toBe(MASTERMIND_EVENT_DETAIL)

    for (const m of PRODUCT_MILESTONES) {
      expect(assertNoEmDash(m.title)).toBe(true)
      if (m.detail) expect(assertNoEmDash(m.detail)).toBe(true)
    }
  })
})
