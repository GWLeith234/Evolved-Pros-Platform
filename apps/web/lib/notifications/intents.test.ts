import { describe, expect, it } from 'vitest'
import {
  contentCopy,
  crossedMilestones,
  dailyActionUrl,
  dailyCopy,
  decideDailyNudge,
  decideWigNudge,
  isEveningUtc,
  isStale,
  isoMondayYmd,
  notificationIntent,
  utcDateYmd,
  wigActionUrl,
  wigCopy,
} from './intents'

const EM_DASH = '\u2014'

const NOW = new Date('2026-09-05T21:00:00Z')

describe('crossedMilestones', () => {
  it('returns marks crossed between prev (exclusive) and next (inclusive)', () => {
    expect(crossedMilestones(20, 50)).toEqual([25, 50])
    expect(crossedMilestones(50, 50)).toEqual([])
    expect(crossedMilestones(0, 100)).toEqual([25, 50, 75, 100])
    expect(crossedMilestones(90, 80)).toEqual([])
  })
})

describe('isStale', () => {
  it('treats missing or unparseable dates as stale', () => {
    expect(isStale(null, NOW)).toBe(true)
    expect(isStale('not-a-date', NOW)).toBe(true)
  })

  it('is stale at or after 7 days', () => {
    expect(isStale('2026-08-29T21:00:00Z', NOW)).toBe(true)
    expect(isStale('2026-08-30T21:00:00Z', NOW)).toBe(false)
  })
})

describe('isEveningUtc / date helpers', () => {
  it('matches the WelcomeBanner 17:00 evening cutoff', () => {
    expect(isEveningUtc(new Date('2026-09-05T16:59:00Z'))).toBe(false)
    expect(isEveningUtc(new Date('2026-09-05T17:00:00Z'))).toBe(true)
  })

  it('formats UTC dates and ISO Mondays', () => {
    expect(utcDateYmd(NOW)).toBe('2026-09-05')
    expect(isoMondayYmd(NOW)).toBe('2026-08-31')
  })
})

describe('decideWigNudge', () => {
  it('asks a member with no goal to complete one', () => {
    expect(decideWigNudge({ hasActiveGoal: false, now: NOW })).toEqual({ kind: 'complete' })
  })

  it('nudges an update when the goal is stale', () => {
    expect(decideWigNudge({
      hasActiveGoal: true,
      goalTitle: 'Close $80k',
      updatedAt: '2026-08-20T00:00:00Z',
      now: NOW,
    })).toEqual({ kind: 'update', title: 'Close $80k' })
  })

  it('stays quiet when the goal was updated this week', () => {
    expect(decideWigNudge({
      hasActiveGoal: true,
      goalTitle: 'Close $80k',
      updatedAt: '2026-09-03T00:00:00Z',
      now: NOW,
    })).toBeNull()
  })
})

describe('decideDailyNudge', () => {
  it('skips before evening and when there is nothing to track', () => {
    expect(decideDailyNudge({
      habitsTotal: 3, habitsDone: 1, commitsTotal: 2, commitsDone: 0, hourUtc: 16,
    })).toBeNull()
    expect(decideDailyNudge({
      habitsTotal: 0, habitsDone: 0, commitsTotal: 0, commitsDone: 0, hourUtc: 21,
    })).toBeNull()
  })

  it('counts leftover habits + commits after 17:00 UTC', () => {
    expect(decideDailyNudge({
      habitsTotal: 3, habitsDone: 1, commitsTotal: 2, commitsDone: 2, hourUtc: 21,
    })).toEqual({ incomplete: 2 })
  })

  it('stays quiet when the day is closed', () => {
    expect(decideDailyNudge({
      habitsTotal: 2, habitsDone: 2, commitsTotal: 1, commitsDone: 1, hourUtc: 21,
    })).toBeNull()
  })
})

describe('copy + urls', () => {
  it('stamps WIG / daily action URLs so dedupe keys stay unique', () => {
    expect(wigActionUrl('complete')).toContain('wig=complete')
    expect(wigActionUrl('update')).toContain('wig=update')
    expect(wigActionUrl('weekly', { weekStart: '2026-08-31' })).toBe('/home?wig=weekly&w=2026-08-31')
    expect(wigActionUrl('milestone', { milestone: 50 })).toBe('/home?wig=milestone-50')
    expect(dailyActionUrl('2026-09-05')).toBe('/home?nudge=daily&d=2026-09-05')
  })

  it('writes member-facing copy without inventing a new engine', () => {
    expect(wigCopy('complete').title).toMatch(/WIG/)
    expect(dailyCopy(3).body).toContain('**3**')
    expect(contentCopy('academy', 'Lead measures').title).toBe('New Academy lesson')
    expect(contentCopy('media', 'Field note').title).toBe('New Media story')
    expect(contentCopy('live', 'Mastermind', 'live').title).toBe('New LIVE event')
    expect(contentCopy('live', 'Workshop', 'virtual').title).toBe('New event')
  })

  it('keeps WIG / daily / content copy free of em dashes', () => {
    const blobs = [
      wigCopy('complete'),
      wigCopy('update', { title: 'Close $80k' }),
      wigCopy('weekly', { title: 'Close $80k' }),
      wigCopy('milestone', { title: 'Close $80k', milestone: 50 }),
      dailyCopy(1),
      dailyCopy(3),
      contentCopy('academy', 'Lead measures'),
      contentCopy('media', 'Field note'),
      contentCopy('live', 'Mastermind', 'live'),
    ]
    for (const copy of blobs) {
      expect(copy.title, copy.title).not.toContain(EM_DASH)
      expect(copy.body, copy.body).not.toContain(EM_DASH)
    }
  })
})

describe('notificationIntent', () => {
  it('labels the three wired intents from existing type + URL/title', () => {
    expect(notificationIntent({
      type: 'system_general', title: 'Set your quarterly WIG', actionUrl: '/academy/strategic-approach?wig=complete',
    })).toBe('wig')
    expect(notificationIntent({
      type: 'system_general', title: 'Log today’s leading measures', actionUrl: '/home?nudge=daily&d=2026-09-05',
    })).toBe('progress')
    expect(notificationIntent({
      type: 'course_unlock', title: 'New Academy lesson', actionUrl: '/academy/foundation/foo',
    })).toBe('content')
    expect(notificationIntent({
      type: 'system_general', title: 'New Media story', actionUrl: '/media/general/bar',
    })).toBe('content')
    expect(notificationIntent({
      type: 'event_reminder', title: 'New LIVE event', actionUrl: '/events/abc',
    })).toBe('content')
    expect(notificationIntent({
      type: 'community_reply', title: 'New reply on your post', actionUrl: '/community/general',
    })).toBe('other')
  })
})
