import { describe, expect, it, vi } from 'vitest'

// episodeExtras imports the pure helpers relatedEpisodes/ytThumb from public.ts,
// which imports adminClient — and lib/supabase/admin.ts builds its Supabase
// client at MODULE SCOPE, so merely importing it throws 'supabaseUrl is
// required' without env. That is the known BUILD-1 defect; it is out of scope
// for this sprint, so stub the module here rather than reshaping admin.ts.
vi.mock('@/lib/supabase/admin', () => ({ adminClient: {} }))

import {
  buildEpisodeExtras,
  buildRelatedEpisodes,
  durationLabel,
  guestHeadline,
  pillarNumbers,
  relatedReason,
  showBookingStrip,
  showLinks,
  type GuestLink,
} from './episodeExtras'
import type { PublicEpisode } from './public'

// ── Fixtures ────────────────────────────────────────────────────────────────

function ep(over: Partial<PublicEpisode> = {}): PublicEpisode {
  return {
    id: over.slug ?? 'id-1',
    slug: 'an-episode',
    episode_number: 1,
    title: 'An Episode',
    guest_name: 'Dennis Yu',
    guest_bio: 'Bio text.',
    guest_title: 'CEO',
    guest_company: 'BlitzMetrics',
    guest_image_url: 'https://cdn.test/dennis.jpg',
    thumbnail_url: null,
    published_at: '2026-01-01T00:00:00.000Z',
    youtube_id: 'OWpbcxVKoGg',
    spotify_url: null,
    apple_url: null,
    duration_seconds: 3296,
    location: 'NAB Show, Las Vegas',
    summary: null,
    tags: [],
    pillar: 'identity',
    pillars: [],
    chapters: [],
    pull_quotes: [],
    transcript_text: null,
    transcript_segments: [],
    ...over,
  }
}

// ── 1. No guest ─────────────────────────────────────────────────────────────

describe('buildEpisodeExtras — no guest', () => {
  it('returns null when guest_name is null (Ep 0, the pilot)', () => {
    expect(buildEpisodeExtras(ep({ guest_name: null }), [])).toBeNull()
  })

  it('still builds a related rail for a guestless episode', () => {
    const pilot = ep({ slug: 'pilot', guest_name: null })
    const other = ep({ slug: 'other', guest_name: 'Someone Else' })
    expect(buildRelatedEpisodes(pilot, [pilot, other]).map(r => r.slug)).toEqual(['other'])
  })
})

// ── 2. Headline ─────────────────────────────────────────────────────────────

describe('guest.headline', () => {
  it('joins title and company with " · "', () => {
    const x = buildEpisodeExtras(ep(), [])
    expect(x?.guest.headline).toBe('CEO · BlitzMetrics')
  })

  it('is an empty string — never a bare " · " — when both are null', () => {
    const x = buildEpisodeExtras(ep({ guest_title: null, guest_company: null }), [])
    expect(x?.guest.headline).toBe('')
    expect(x?.guest.headline).not.toContain('·')
  })

  it('drops just the missing half', () => {
    expect(guestHeadline(null, 'Salem Media')).toBe('Salem Media')
    expect(guestHeadline('Founder', null)).toBe('Founder')
    expect(guestHeadline('  ', '  ')).toBe('')
  })
})

// ── 3. Facts ────────────────────────────────────────────────────────────────

describe('guest.facts', () => {
  it('carries null for a missing location so the row can be omitted', () => {
    const x = buildEpisodeExtras(ep({ location: null }), [])
    expect(x?.guest.facts.location).toBeNull()
  })

  it('never invents books, and never labels published_at as a recording date', () => {
    const x = buildEpisodeExtras(ep(), [])
    expect(x?.guest.facts.books).toEqual([])
    expect(x?.guest.facts.recordedAt).toBeNull()
  })
})

// ── 4. Links gate ───────────────────────────────────────────────────────────

describe('showLinks', () => {
  const link = (n: number): GuestLink => ({ label: `L${n}`, href: `https://x.test/${n}` })

  it('hides the Follow block under 3 links', () => {
    expect(showLinks([])).toBe(false)
    expect(showLinks([link(1), link(2)])).toBe(false)
  })

  it('renders the Follow block at 3 or more', () => {
    expect(showLinks([link(1), link(2), link(3)])).toBe(true)
    expect(showLinks([link(1), link(2), link(3), link(4)])).toBe(true)
  })

  it('produces no links today, so the block never renders', () => {
    const x = buildEpisodeExtras(ep(), [])
    expect(x?.guest.links).toEqual([])
    expect(showLinks(x!.guest.links)).toBe(false)
  })
})

// ── 5. Booking strip ────────────────────────────────────────────────────────

describe('showBookingStrip', () => {
  it('never renders for an internal contact, even with an address', () => {
    const x = buildEpisodeExtras(ep(), [])
    expect(x?.guest.contact.visibility).toBe('internal')
    expect(showBookingStrip(x!.guest.contact)).toBe(false)
    expect(
      showBookingStrip({ email: 'a@b.test', phone: null, visibility: 'internal' }),
    ).toBe(false)
  })

  it('renders only when public AND reachable', () => {
    expect(showBookingStrip({ email: 'a@b.test', phone: null, visibility: 'public' })).toBe(true)
    expect(showBookingStrip({ email: null, phone: null, visibility: 'public' })).toBe(false)
  })
})

// ── 6. Pillars ──────────────────────────────────────────────────────────────

describe('guest.pillars', () => {
  it('dedups a primary that is repeated in the secondary array', () => {
    const x = buildEpisodeExtras(
      ep({ pillar: 'mental-toughness', pillars: ['mental-toughness'] }),
      [],
    )
    expect(x?.guest.pillars).toEqual([3])
  })

  it('puts the primary first and keeps distinct secondaries', () => {
    expect(pillarNumbers({ pillar: 'execution', pillars: ['foundation'] })).toEqual([6, 1])
  })

  it('maps every pillar slug to its program number', () => {
    expect(pillarNumbers({ pillar: 'foundation', pillars: [] })).toEqual([1])
    expect(pillarNumbers({ pillar: 'identity', pillars: [] })).toEqual([2])
    expect(pillarNumbers({ pillar: 'strategy', pillars: [] })).toEqual([4])
    expect(pillarNumbers({ pillar: 'accountability', pillars: [] })).toEqual([5])
  })

  it('drops unknown slugs rather than emitting a bogus id', () => {
    expect(pillarNumbers({ pillar: 'not-a-pillar', pillars: [] })).toEqual([])
  })
})

// ── 7. Related selection ────────────────────────────────────────────────────

describe('related', () => {
  const current = ep({ slug: 'current', guest_name: 'Host', tags: ['sales'] })
  const pool = [
    current,
    ep({ slug: 'a', guest_name: 'Repeat Guest', tags: ['sales'] }),
    ep({ slug: 'b', guest_name: 'Repeat Guest', tags: ['sales'] }),
    ep({ slug: 'c', guest_name: 'Other Guest', tags: [] }),
  ]

  it('never includes the current episode', () => {
    const out = buildRelatedEpisodes(current, pool)
    expect(out.map(r => r.slug)).not.toContain('current')
  })

  it('never repeats a guestName', () => {
    const names = buildRelatedEpisodes(current, pool).map(r => r.guestName)
    expect(new Set(names).size).toBe(names.length)
  })

  it('uses maxresdefault (true 16:9), never hqdefault', () => {
    const [first] = buildRelatedEpisodes(current, pool)
    expect(first.thumbnail).toContain('maxresdefault.jpg')
    expect(first.thumbnail).not.toContain('hqdefault')
  })

  it('formats duration as mm:ss', () => {
    expect(durationLabel(3296)).toBe('54:56')
    expect(durationLabel(647)).toBe('10:47')
    expect(durationLabel(59)).toBe('00:59')
    expect(durationLabel(null)).toBe('')
  })
})

// ── 8. Reason is never blank ────────────────────────────────────────────────

describe('reason', () => {
  it('names the shared tag', () => {
    expect(relatedReason(ep({ tags: ['sales'] }), ep({ tags: ['sales'] }))).toBe('Same theme — sales')
  })

  it('falls back to the shared pillar, using the display label', () => {
    expect(
      relatedReason(
        ep({ tags: [], pillar: 'mental-toughness' }),
        ep({ tags: [], pillar: 'mental-toughness' }),
      ),
    ).toBe('Same pillar — Mental Toughness')
  })

  it('matches a pillar carried only in the secondary array', () => {
    expect(
      relatedReason(
        ep({ tags: [], pillar: 'identity', pillars: ['strategy'] }),
        ep({ tags: [], pillar: 'strategy', pillars: [] }),
      ),
    ).toBe('Same pillar — Strategy')
  })

  it('is honest when nothing matched', () => {
    expect(relatedReason(ep({ tags: [], pillar: 'identity' }), ep({ tags: [], pillar: 'execution' })))
      .toBe('More from the show')
  })

  it('is never an empty string across a spread of inputs', () => {
    const variants = [
      ep({ tags: [], pillar: null, pillars: [] }),
      ep({ tags: ['a'], pillar: 'identity' }),
      ep({ tags: [], pillar: 'execution', pillars: ['foundation'] }),
      ep({ tags: ['z'], pillar: null, pillars: [] }),
    ]
    for (const a of variants) {
      for (const b of variants) {
        expect(relatedReason(a, b).length).toBeGreaterThan(0)
      }
    }
  })

  it('is never blank on any card the adapter emits', () => {
    const current = ep({ slug: 'current', tags: [], pillar: null, pillars: [] })
    const pool = [
      current,
      ep({ slug: 'x', guest_name: 'A', tags: [], pillar: null, pillars: [] }),
      ep({ slug: 'y', guest_name: 'B', tags: [], pillar: 'execution' }),
    ]
    for (const card of buildRelatedEpisodes(current, pool)) {
      expect(card.reason.trim()).not.toBe('')
    }
  })
})
