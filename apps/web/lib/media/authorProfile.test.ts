import { describe, expect, it } from 'vitest'
import {
  normalizePersonName,
  pickAuthorProfile,
  type AuthorProfileRow,
} from './authorProfile'

function row(partial: Partial<AuthorProfileRow>): AuthorProfileRow {
  return {
    full_name: null,
    display_name: null,
    first_name: null,
    last_name: null,
    avatar_url: null,
    role: null,
    current_pillar: null,
    ...partial,
  }
}

describe('normalizePersonName', () => {
  it('collapses case and inner whitespace', () => {
    expect(normalizePersonName('  George   Leith ')).toBe('george leith')
  })

  it('treats blank as empty', () => {
    expect(normalizePersonName('   ')).toBe('')
    expect(normalizePersonName(null)).toBe('')
  })
})

describe('pickAuthorProfile', () => {
  it('matches full_name case-insensitively', () => {
    const george = row({ full_name: 'George Leith', avatar_url: '/g.jpg' })
    expect(pickAuthorProfile('GEORGE LEITH', [george])).toBe(george)
  })

  it('matches display_name when full_name differs', () => {
    const george = row({ display_name: 'George Leith', full_name: 'G. Leith' })
    expect(pickAuthorProfile('George Leith', [george])).toBe(george)
  })

  it('matches first + last', () => {
    const george = row({ first_name: 'George', last_name: 'Leith', avatar_url: '/g.jpg' })
    expect(pickAuthorProfile('George Leith', [george])).toBe(george)
  })

  it('prefers a row that has an avatar when names collide', () => {
    const bare = row({ full_name: 'George Leith' })
    const withPhoto = row({ full_name: 'George Leith', avatar_url: '/g.jpg' })
    expect(pickAuthorProfile('George Leith', [bare, withPhoto])).toBe(withPhoto)
  })

  it('returns null when nothing matches — photo is optional', () => {
    expect(pickAuthorProfile('George Leith', [row({ full_name: 'Dana Whitfield' })])).toBeNull()
    expect(pickAuthorProfile('George Leith', [])).toBeNull()
    expect(pickAuthorProfile(null, [row({ full_name: 'George Leith' })])).toBeNull()
  })
})
