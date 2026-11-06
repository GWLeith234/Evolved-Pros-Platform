import { describe, expect, it } from 'vitest'
import { GUEST_TOKEN_MAX_LENGTH } from './token'
import {
  GUEST_LINK_LABEL_MAX,
  GUEST_LINK_URL_MAX,
  GUEST_LINKS_MAX,
  GUEST_TOPIC_MAX,
  GUEST_TOPICS_MAX,
  parseGuestLinks,
  parseGuestToken,
  parseGuestTopics,
} from './intakePayload'

const TOKEN = 'a'.repeat(GUEST_TOKEN_MAX_LENGTH)

describe('parseGuestToken', () => {
  it('accepts a token of the minted length and treats a missing token as empty', () => {
    expect(parseGuestToken(`  ${TOKEN}  `)).toBe(TOKEN)
    expect(parseGuestToken(undefined)).toBe('')
    expect(parseGuestToken(1)).toBe('')
  })

  it('rejects a token longer than the minted shape', () => {
    expect(parseGuestToken(`${TOKEN}x`)).toBeNull()
    expect(parseGuestToken('a'.repeat(10_000))).toBeNull()
  })
})

describe('parseGuestTopics', () => {
  it('trims, drops blanks, and keeps a normal list', () => {
    expect(parseGuestTopics(null)).toEqual([])
    expect(parseGuestTopics(['  pricing  ', '', '  '])).toEqual(['pricing'])
    expect(parseGuestTopics(['x'.repeat(GUEST_TOPIC_MAX)])).toEqual(['x'.repeat(GUEST_TOPIC_MAX)])
    expect(parseGuestTopics(Array.from({ length: GUEST_TOPICS_MAX }, (_, i) => `t${i}`))).toHaveLength(
      GUEST_TOPICS_MAX,
    )
  })

  it('rejects unbounded or mistyped topics', () => {
    expect(parseGuestTopics(['x'.repeat(GUEST_TOPIC_MAX + 1)])).toBeNull()
    expect(parseGuestTopics(Array.from({ length: GUEST_TOPICS_MAX + 1 }, () => 't'))).toBeNull()
    expect(parseGuestTopics(['ok', 1])).toBeNull()
    expect(parseGuestTopics('pricing')).toBeNull()
  })
})

describe('parseGuestLinks', () => {
  it('accepts string urls and {label,url} pairs', () => {
    expect(parseGuestLinks(undefined)).toEqual([])
    expect(parseGuestLinks(['  https://example.com/about  ', ''])).toEqual([
      { label: '', url: 'https://example.com/about' },
    ])
    expect(parseGuestLinks([{ label: '  Site  ', url: ' https://example.com/about ' }])).toEqual([
      { label: 'Site', url: 'https://example.com/about' },
    ])
    expect(parseGuestLinks([{ url: 'https://example.com/about' }])).toEqual([
      { label: '', url: 'https://example.com/about' },
    ])
  })

  it('rejects javascript, protocol-relative, credentialed, and private link URLs', () => {
    expect(parseGuestLinks(['javascript:alert(1)'])).toBeNull()
    expect(parseGuestLinks(['//evil.com'])).toBeNull()
    expect(parseGuestLinks([{ label: 'Site', url: 'data:text/html,hi' }])).toBeNull()
    expect(parseGuestLinks([{ label: 'Site', url: 'https://user:pass@example.com' }])).toBeNull()
    expect(parseGuestLinks(['http://127.0.0.1/secret'])).toBeNull()
    expect(parseGuestLinks(['http://169.254.169.254/latest/meta-data'])).toBeNull()
  })

  it('rejects oversized lists, oversized strings, and non-strings', () => {
    expect(parseGuestLinks([{ label: 'Site', url: 'x'.repeat(GUEST_LINK_URL_MAX + 1) }])).toBeNull()
    expect(parseGuestLinks([{ label: 'x'.repeat(GUEST_LINK_LABEL_MAX + 1), url: 'https://example.com' }])).toBeNull()
    expect(parseGuestLinks(Array.from({ length: GUEST_LINKS_MAX + 1 }, () => 'https://example.com'))).toBeNull()
    expect(parseGuestLinks([{ label: 'Site', url: 1 }])).toBeNull()
    expect(parseGuestLinks([{ label: 1, url: 'https://example.com' }])).toBeNull()
    expect(parseGuestLinks([null])).toBeNull()
  })
})
