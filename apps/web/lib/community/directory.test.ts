import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  DIRECTORY_DM_LOCKED_COPY,
  DIRECTORY_FULL_COLUMNS,
  DIRECTORY_PUBLIC_COLUMNS,
  directorySearchTerm,
  directorySelect,
  firstNameOf,
  shapeProfileForViewer,
  seatsFilledLine,
  shapeDirectory,
  toFullMember,
  toPublicMember,
  type DirectoryRow,
} from './directory'
import { canAccessNetwork, canSeeDirectory, directoryDetail } from '@/lib/entitlements'

const here = dirname(fileURLToPath(import.meta.url))
const read = (rel: string) => readFileSync(resolve(here, rel), 'utf8')

/**
 * A member whose every withheld field carries a distinctive string, so a leak
 * shows up as a substring of the serialized payload rather than as a missing
 * assertion.
 */
const ROW: DirectoryRow = {
  id: 'u1',
  display_name: 'Dana Whitfield',
  full_name: 'Dana Marie Whitfield',
  avatar_url: 'https://cdn.example.com/dana.png',
  role_title: 'VP Sales',
  current_pillar: 'execution',
  location: 'Saskatoon',
  tier: 'vip',
  points: 420,
  created_at: '2026-05-02T00:00:00.000Z',
  company: 'Northwind Logistics',
  bio: 'Twenty years carrying a number.',
  goal_90day: 'Close the Kestrel renewal',
  goal_visible: true,
  linkedin_url: 'https://linkedin.com/in/danawhitfield',
  twitter_handle: '@danaw',
  website_url: 'https://danawhitfield.example',
}

describe('the directory is open, the detail is not', () => {
  it('lets every signed-in tier browse', () => {
    for (const tier of ['community', 'vip', 'pro']) {
      expect(canSeeDirectory(tier), tier).toBe(true)
    }
  })

  it('still reserves direct messages for The 99', () => {
    expect(canAccessNetwork('community')).toBe(false)
    expect(canAccessNetwork('vip')).toBe(false)
    expect(canAccessNetwork('pro')).toBe(true)
  })

  it('hands community and VIP the public payload, The 99 the full one', () => {
    expect(directoryDetail('community')).toBe('public')
    expect(directoryDetail('vip')).toBe('public')
    expect(directoryDetail('pro')).toBe('full')
  })

  it('drops a lapsed member of The 99 back to the public payload', () => {
    expect(directoryDetail('pro', 'canceled')).toBe('public')
    expect(directoryDetail('pro', 'unpaid')).toBe('public')
    // past_due is a grace window, not a cancellation.
    expect(directoryDetail('pro', 'past_due')).toBe('full')
  })
})

describe('redaction happens in the SELECT', () => {
  it('never asks the database for a withheld column', () => {
    const select = directorySelect('public')
    for (const column of ['company', 'bio', 'goal_90day', 'linkedin_url', 'twitter_handle', 'website_url']) {
      expect(select, column).not.toContain(column)
    }
  })

  it('asks for all of them on the full payload', () => {
    const select = directorySelect('full')
    for (const column of ['company', 'bio', 'goal_90day', 'goal_visible', 'linkedin_url', 'twitter_handle', 'website_url']) {
      expect(select, column).toContain(column)
    }
  })

  it('keeps the public list a strict subset of the full one', () => {
    for (const column of DIRECTORY_PUBLIC_COLUMNS) {
      expect(DIRECTORY_FULL_COLUMNS as readonly string[]).toContain(column)
    }
  })

  it('the route selects by detail and resolves detail server-side', () => {
    const route = read('../../app/api/members/route.ts')
    expect(route).toContain('directorySelect(detail)')
    expect(route).toContain('directoryDetail(')
    // The tier must come from the resolved profile, never from the request.
    expect(route).toContain('resolveCurrentUser')
    expect(route).not.toMatch(/searchParams\.get\(['"]detail['"]\)/)
  })
})

/**
 * THE TEST THE CARD ASKED FOR. A field-presence check on props passes even
 * when the value is sitting in the response body one devtools tab away, so
 * this asserts against the SERIALIZED payload: the exact bytes a community
 * viewer's browser receives.
 */
describe('the serialized public payload leaks nothing', () => {
  const payload = JSON.stringify({
    members: shapeDirectory([ROW], 'public'),
    hasMore: false,
    detail: 'public',
  })

  it('contains no company, bio, goal or social string anywhere in the bytes', () => {
    expect(payload).not.toContain('Northwind Logistics')
    expect(payload).not.toContain('Twenty years carrying a number.')
    expect(payload).not.toContain('Close the Kestrel renewal')
    expect(payload).not.toContain('linkedin.com')
    expect(payload).not.toContain('danaw')
    expect(payload).not.toContain('danawhitfield.example')
  })

  it('contains no surname, only the first name', () => {
    expect(payload).toContain('Dana')
    expect(payload).not.toContain('Whitfield')
    expect(payload).not.toContain('Marie')
  })

  it('carries no key for a withheld field either', () => {
    for (const key of ['company', 'bio', 'goal90day', 'linkedinUrl', 'twitterHandle', 'websiteUrl', 'fullName']) {
      expect(payload, key).not.toContain(`"${key}"`)
    }
  })

  it('still carries everything the public card renders', () => {
    for (const value of ['Dana', 'VP Sales', 'execution', 'Saskatoon', 'cdn.example.com']) {
      expect(payload, value).toContain(value)
    }
  })

  it('serializes the full payload with all of it, for The 99', () => {
    const full = JSON.stringify(shapeDirectory([ROW], 'full'))
    expect(full).toContain('Northwind Logistics')
    expect(full).toContain('Close the Kestrel renewal')
    expect(full).toContain('linkedin.com')
    expect(full).toContain('Whitfield')
  })
})

describe('goal_visible outranks the viewer', () => {
  it('withholds a hidden goal even from The 99', () => {
    const hidden = toFullMember({ ...ROW, goal_visible: false })
    expect(hidden.goal90day).toBeNull()
    expect(JSON.stringify(hidden)).not.toContain('Close the Kestrel renewal')
  })

  it('treats a null goal_visible as hidden, not as consent', () => {
    expect(toFullMember({ ...ROW, goal_visible: null }).goal90day).toBeNull()
  })
})

describe('firstNameOf', () => {
  it('prefers the display name, then the full name', () => {
    expect(firstNameOf('Dana Whitfield', 'Ignored Name')).toBe('Dana')
    expect(firstNameOf(null, 'Dana Marie Whitfield')).toBe('Dana')
    expect(firstNameOf('   ', 'Dana Whitfield')).toBe('Dana')
  })

  it('falls back to Member rather than rendering an empty chip', () => {
    expect(firstNameOf(null, null)).toBe('Member')
    expect(firstNameOf('', '')).toBe('Member')
  })

  it('handles a single-word name', () => {
    expect(firstNameOf('Prince', null)).toBe('Prince')
  })
})

describe('shaping', () => {
  it('defaults points to zero rather than undefined', () => {
    expect(toPublicMember({ id: 'x' }).points).toBe(0)
    expect(toPublicMember({ id: 'x' }).firstName).toBe('Member')
  })
})

describe('seats line and DM copy', () => {
  it('reads as the card specifies', () => {
    expect(seatsFilledLine(0, 99)).toBe('0 of 99 seats filled')
    expect(seatsFilledLine(41, 99)).toBe('41 of 99 seats filled')
  })

  it('uses the same live count the seat cap enforces', () => {
    const page = read('../../app/(member)/community/directory/page.tsx')
    expect(page).toContain('seatStatusForTier')
    expect(page).toContain('seatsFilledLine')
  })

  it('keeps one string for the locked Message button', () => {
    expect(DIRECTORY_DM_LOCKED_COPY).toBe('Members of The 99 can reach each other directly.')
    expect(DIRECTORY_DM_LOCKED_COPY).not.toContain('—')
  })
})

describe('the DM gate is server-side, not just a disabled button', () => {
  it('refuses the conversations API for anyone below The 99', () => {
    const route = read('../../app/api/conversations/route.ts')
    expect(route).toContain('canAccessNetwork')
    expect(route).toContain('403')
    // Both the read and the write, since opening a conversation is a POST.
    expect(route.match(/refuseWithoutNetwork\(\)/g)?.length).toBeGreaterThanOrEqual(3)
  })

  it('refuses the thread API too, which is where a message is actually sent', () => {
    const thread = read('../../app/api/conversations/[id]/messages/route.ts')
    expect(thread).toContain('canAccessNetwork')
    expect(thread.match(/requireNetworkMember\(\)/g)?.length).toBeGreaterThanOrEqual(3)
    const unread = read('../../app/api/conversations/unread-count/route.ts')
    expect(unread).toContain('canAccessNetwork')
  })

  it('redacts the profile page the directory links to', () => {
    const page = read('../../app/(member)/profile/[userId]/page.tsx')
    expect(page).toContain('shapeProfileForViewer')
    expect(page).toContain('directoryDetail')
  })

  it('strips PostgREST syntax out of directory search', () => {
    expect(directorySearchTerm('Dana')).toBe('Dana')
    expect(directorySearchTerm('a%,id.eq.b')).toBe('a id eq b')
    expect(directorySearchTerm('%%%')).toBeNull()
    const route = read('../../app/api/members/route.ts')
    expect(route).toContain('directorySearchTerm')
    expect(route).not.toContain('${search}')
  })

  it('withholds bio, surname and socials on a public profile view', () => {
    const shaped = shapeProfileForViewer(ROW, { detail: 'public', isSelf: false })
    const payload = JSON.stringify(shaped)
    expect(shaped.display_name).toBe('Dana')
    expect(payload).not.toContain('Whitfield')
    expect(payload).not.toContain('Twenty years carrying a number.')
    expect(payload).not.toContain('Northwind')
    expect(payload).not.toContain('linkedin.com')
    expect(payload).not.toContain('Close the Kestrel')
    const self = shapeProfileForViewer(ROW, { detail: 'public', isSelf: true })
    expect(self.bio).toContain('Twenty years')
    const full = shapeProfileForViewer(ROW, { detail: 'full', isSelf: false })
    expect(full.company).toBe('Northwind Logistics')
  })

  it('shows an upgrade state at /messages, never a 404', () => {
    const page = read('../../app/(member)/messages/page.tsx')
    expect(page).toContain('canAccessNetwork')
    expect(page).toContain('MessagesUpgradeState')
    expect(page).not.toContain('notFound')
  })

  it('renders the Message control disabled rather than hiding it', () => {
    const button = read('../../app/(member)/community/directory/DirectoryMessageButton.tsx')
    expect(button).toContain('aria-disabled="true"')
    expect(button).toContain('lockedCopy')
  })
})
