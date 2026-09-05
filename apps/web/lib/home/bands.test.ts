import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { JUAN_EP010_STILL } from '@/lib/podcast/stillUrl'
import {
  HOME_PILLAR_CHIPS,
  assertNoEmDash,
  computeCheckInStreak,
  formatLagDelta,
  formatQuarterChip,
  homeEpisodeStill,
  isEventHappeningNow,
  isVisibleWin,
  leadingMeasureStatus,
  pickFuelLiveEvent,
  remainingLessonLabel,
  weeklyCommitPulse,
  winChipLabel,
} from './bands'

describe('locked Home IA helpers', () => {
  it('exposes six compact Academy pillar chips', () => {
    expect(HOME_PILLAR_CHIPS).toHaveLength(6)
    expect(HOME_PILLAR_CHIPS.map(p => p.n)).toEqual([1, 2, 3, 4, 5, 6])
    expect(HOME_PILLAR_CHIPS.map(p => p.chip)).toEqual([
      'Found.',
      'Identity',
      'Mental',
      'Strategy',
      'Acct.',
      'Exec.',
    ])
  })

  it('counts a consecutive check-in streak ending today', () => {
    expect(
      computeCheckInStreak(['2026-09-03', '2026-09-04', '2026-09-05'], '2026-09-05'),
    ).toEqual({ days: 3, checkedInToday: true })
  })

  it('keeps yesterday streak when today is still open', () => {
    expect(
      computeCheckInStreak(['2026-09-03', '2026-09-04'], '2026-09-05'),
    ).toEqual({ days: 2, checkedInToday: false })
  })

  it('breaks the streak after a missed day', () => {
    expect(
      computeCheckInStreak(['2026-09-01', '2026-09-03'], '2026-09-05'),
    ).toEqual({ days: 0, checkedInToday: false })
  })

  it('formats lag delta without em dashes', () => {
    expect(formatLagDelta(11)).toEqual({ text: '+11% wk', direction: 'up' })
    expect(formatLagDelta(-3)).toEqual({ text: '-3% wk', direction: 'down' })
    expect(formatLagDelta(0)).toEqual({ text: '0% wk', direction: 'flat' })
    expect(assertNoEmDash(formatLagDelta(11).text)).toBe(true)
    expect(assertNoEmDash(formatLagDelta(0).text)).toBe(true)
  })

  it('reads a quarter chip from stored period strings', () => {
    expect(formatQuarterChip('Q2-2026')).toBe('Q2')
    expect(formatQuarterChip('2026-Q3')).toBe('Q3')
  })

  it('computes weekly commit pulse and leading-measure status', () => {
    expect(weeklyCommitPulse(4, 5)).toBe(80)
    expect(weeklyCommitPulse(0, 0)).toBe(0)
    expect(leadingMeasureStatus(true, 2)).toEqual({ label: 'DONE', fraction: '2/2' })
    expect(leadingMeasureStatus(false, 1)).toEqual({ label: 'NOT YET', fraction: '0/1' })
  })

  it('compacts win chips and remaining-lesson copy without em dashes', () => {
    expect(winChipLabel('$18K closed')).toBe('$18K closed')
    expect(winChipLabel('A much longer win that should truncate for the strip')).toMatch(/…$/)
    expect(remainingLessonLabel(12 * 60, 4)).toBe('12 min left')
    expect(remainingLessonLabel(null, 4)).toBe('4 lessons left')
    expect(assertNoEmDash(winChipLabel('$18K closed'))).toBe(true)
    expect(assertNoEmDash(remainingLessonLabel(720, 1) ?? '')).toBe(true)
  })

  it('detects a live event window', () => {
    const now = new Date('2026-09-11T17:10:00.000Z')
    expect(
      isEventHappeningNow('2026-09-11T17:00:00.000Z', '2026-09-11T18:00:00.000Z', now),
    ).toBe(true)
    expect(
      isEventHappeningNow('2026-09-11T18:00:00.000Z', '2026-09-11T19:00:00.000Z', now),
    ).toBe(false)
    expect(
      isEventHappeningNow('2026-09-11T16:00:00.000Z', null, now),
    ).toBe(false)
    expect(
      isEventHappeningNow('2026-09-11T16:40:00.000Z', null, now),
    ).toBe(true)
  })

  it('does not pin a stale open-ended event over the next session', () => {
    const now = new Date('2026-09-11T17:10:00.000Z')
    const stale = { id: 'old', starts_at: '2026-08-01T17:00:00.000Z', ends_at: null }
    const upcoming = { id: 'next', starts_at: '2026-09-18T17:00:00.000Z', ends_at: null }
    const live = {
      id: 'now',
      starts_at: '2026-09-11T17:00:00.000Z',
      ends_at: '2026-09-11T18:00:00.000Z',
    }
    expect(pickFuelLiveEvent([stale], upcoming, now)?.id).toBe('next')
    expect(pickFuelLiveEvent([live, stale], upcoming, now)?.id).toBe('now')
  })

  it('keeps only visible wins', () => {
    expect(isVisibleWin({ kind: 'win', status: 'published' })).toBe(true)
    expect(isVisibleWin({ post_type: 'win', status: null })).toBe(true)
    expect(isVisibleWin({ kind: 'update', status: null })).toBe(false)
    expect(isVisibleWin({ kind: 'win', status: 'rejected' })).toBe(false)
  })

  it('prefers guest_image_url and keeps Juan on the public guest path', () => {
    expect(
      homeEpisodeStill({
        guest_image_url: 'https://cdn.example/heather.jpg',
        thumbnail_url: 'https://cdn.example/wrong-thumb.jpg',
      }),
    ).toBe('https://cdn.example/heather.jpg')
    expect(
      homeEpisodeStill({
        slug: 'evolved-pros-podcast-ep-010-juan-fernandez',
        episode_number: 10,
        guest_name: 'Juan Fernandez',
        guest_image_url: null,
        thumbnail_url: 'https://d3t3ozftmdmh3i.cloudfront.net/blocked.jpg',
      }),
    ).toBe(JUAN_EP010_STILL)
  })
})

describe('Home surfaces wire guest stills', () => {
  it('episode cards and the Home fetcher read guest_image_url', () => {
    const page = readFileSync(resolve(__dirname, '../../app/(member)/home/page.tsx'), 'utf8')
    expect(page).toMatch(/guest_image_url/)
    expect(page).toMatch(/homeEpisodeStill|allowedEpisodeStillUrl/)
    const card = readFileSync(
      resolve(__dirname, '../../components/home/HomeEpisodeCard.tsx'),
      'utf8',
    )
    expect(card).toMatch(/guestImageUrl|guest still/)
    const fuel = readFileSync(
      resolve(__dirname, '../../components/home/HomeFuelBand.tsx'),
      'utf8',
    )
    expect(fuel).toMatch(/ACADEMY_STILL_LIGHT/)
    expect(fuel).toMatch(/eventCardImageUrl/)
  })

  it('does not mount the Architecture ad grid or WelcomeBanner on Home', () => {
    const page = readFileSync(resolve(__dirname, '../../app/(member)/home/page.tsx'), 'utf8')
    expect(page).not.toMatch(/<WelcomeBanner/)
    expect(page).not.toMatch(/AcademyArchitectureCard/)
    expect(page).toMatch(/HomeBannerBand/)
    expect(page).toMatch(/HomeAccountabilityBand/)
    expect(page).toMatch(/HomeFuelBand/)
    expect(page).toMatch(/PublicFooter/)
    expect(page).toMatch(/kind\.eq\.win,post_type\.eq\.win/)
    expect(page).toMatch(/pickFuelLiveEvent/)
    expect(page).toMatch(/isVisibleWin/)
    expect(page).toMatch(/image_url, city/)
  })

  it('keeps new Home band copy free of em dashes', () => {
    const files = [
      'bands.ts',
      'cardImagery.ts',
      '../events/cityStock.ts',
      '../../components/home/HomeBannerBand.tsx',
      '../../components/home/HomeAccountabilityBand.tsx',
      '../../components/home/HomeFuelBand.tsx',
      '../../components/home/HomeEpisodeCard.tsx',
    ]
    for (const file of files) {
      const src = readFileSync(resolve(__dirname, file), 'utf8')
      expect(src, file).not.toMatch(/\u2014|\u2013/)
    }
  })
})
