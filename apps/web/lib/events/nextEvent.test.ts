import { describe, expect, it } from 'vitest'
import { assertNoEmDash } from '@/lib/home/bands'
import {
  BOOK_EVENT_TITLE,
  LAUNCH_EVENT_TITLE,
  MASTERMIND_EVENT_DETAIL,
  MASTERMIND_EVENT_TITLE,
  isConquerLocalTitle,
  pickNextBannerEvent,
  pickUpcomingLockedEvent,
  withoutConquerLocal,
} from './nextEvent'

const now = new Date('2026-09-05T12:00:00.000Z')

describe('George-locked event copy', () => {
  it('uses the locked titles without Conquer Local or em dashes', () => {
    expect(LAUNCH_EVENT_TITLE).toBe(
      'Evolved Pros launches April 28 in Las Vegas with special guest Dennis Yu',
    )
    expect(BOOK_EVENT_TITLE).toBe('EVOLVED book launches October 15')
    expect(MASTERMIND_EVENT_TITLE).toBe('AI Masterminds for Senior Execs')
    expect(MASTERMIND_EVENT_DETAIL).toMatch(/Professional Tier only/)
    expect(MASTERMIND_EVENT_DETAIL).toMatch(/America\/Chicago/)
    expect(isConquerLocalTitle(LAUNCH_EVENT_TITLE)).toBe(false)
    expect(isConquerLocalTitle('Conquer Local Podcast launches')).toBe(true)
    for (const copy of [LAUNCH_EVENT_TITLE, BOOK_EVENT_TITLE, MASTERMIND_EVENT_TITLE, MASTERMIND_EVENT_DETAIL]) {
      expect(assertNoEmDash(copy)).toBe(true)
    }
  })
})

const catalog = [
  {
    title: 'Conquer Local Podcast launches',
    starts_at: '2026-09-10T00:00:00.000Z',
  },
  {
    title: 'GTM 2026 — Pavilion Annual Conference',
    starts_at: '2026-09-29T21:00:00.000Z',
  },
  {
    title: MASTERMIND_EVENT_TITLE,
    starts_at: '2026-10-02T19:00:00.000Z',
  },
  {
    title: BOOK_EVENT_TITLE,
    starts_at: '2026-10-15T12:00:00.000Z',
  },
  {
    title: LAUNCH_EVENT_TITLE,
    starts_at: '2026-04-28T19:00:00.000Z',
  },
]

describe('pickNextBannerEvent', () => {
  it('paints the April 28 launch on NEXT EVENT and never Conquer Local', () => {
    const picked = pickNextBannerEvent(catalog, now)
    expect(picked?.title).toBe(LAUNCH_EVENT_TITLE)
  })

  it('puts the October 15 book on upcoming after the launch date', () => {
    const upcoming = pickUpcomingLockedEvent(catalog, now)
    expect(upcoming?.title).toBe(MASTERMIND_EVENT_TITLE)
    const afterMasterminds = pickUpcomingLockedEvent(
      catalog.filter(e => e.title !== MASTERMIND_EVENT_TITLE),
      now,
    )
    expect(afterMasterminds?.title).toBe(BOOK_EVENT_TITLE)
  })

  it('strips Conquer Local from any upcoming list', () => {
    expect(withoutConquerLocal(catalog).map(e => e.title)).not.toContain(
      'Conquer Local Podcast launches',
    )
    expect(withoutConquerLocal(catalog).some(e => e.title === BOOK_EVENT_TITLE)).toBe(true)
  })

  it('falls through to the soonest non-Conquer upcoming when no lock is future', () => {
    const picked = pickNextBannerEvent(
      [
        { title: 'Conquer Local Podcast launches', starts_at: '2026-10-01T00:00:00.000Z' },
        { title: 'OAB Connection 2026', starts_at: '2026-10-28T20:00:00.000Z' },
      ],
      now,
    )
    expect(picked?.title).toBe('OAB Connection 2026')
  })
})
