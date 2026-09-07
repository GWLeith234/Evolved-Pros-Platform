import { describe, expect, it } from 'vitest'
import { parseThanksRecipients, previewThanksBatch } from './batch'

describe('parseThanksRecipients', () => {
  it('parses paste and drops invalid tokens without inventing emails', () => {
    const parsed = parseThanksRecipients('Alex@Example.com, not-an-email\nsam@example.com')
    expect(parsed.rows).toEqual([
      { email: 'alex@example.com', firstName: '' },
      { email: 'sam@example.com', firstName: '' },
    ])
    expect(parsed.invalidRaw).toEqual(['not-an-email'])
    expect(parsed.rows.every(r => r.email.includes('@'))).toBe(true)
  })

  it('reads first_name from a CSV and does not invent missing addresses', () => {
    const csv = `email,first_name
ada@example.com,Ada
,Ghost
not-valid,Nope
grace@example.com,Grace`
    const parsed = parseThanksRecipients(csv)
    expect(parsed.rows).toEqual([
      { email: 'ada@example.com', firstName: 'Ada' },
      { email: 'grace@example.com', firstName: 'Grace' },
    ])
    expect(parsed.invalidRaw).toEqual(['not-valid'])
  })
})

describe('previewThanksBatch', () => {
  it('excludes paid, members, FOG, and existing thanks rows', () => {
    const preview = previewThanksBatch({
      raw: 'new@example.com, paid@example.com, member@example.com, fog@example.com, dup@example.com',
      membersByEmail: new Map([
        [
          'paid@example.com',
          {
            email: 'paid@example.com',
            tier: 'pro',
            tier_status: 'active',
            stripe_subscription_id: 'sub_1',
          },
        ],
        ['member@example.com', { email: 'member@example.com', tier: 'community', tier_status: 'active' }],
      ]),
      fogByEmail: new Map([['fog@example.com', { email: 'fog@example.com', status: 'invited' }]]),
      existingThanksEmails: new Set(['dup@example.com']),
      fogOverride: false,
      fogOverrideReason: '',
    })
    expect(preview.inviteable.map(r => r.email)).toEqual(['new@example.com'])
    expect(preview.rows.find(r => r.email === 'paid@example.com')?.disposition).toBe('already_paid')
    expect(preview.rows.find(r => r.email === 'member@example.com')?.disposition).toBe('already_member')
    expect(preview.rows.find(r => r.email === 'fog@example.com')?.disposition).toBe('fog_excluded')
    expect(preview.rows.find(r => r.email === 'dup@example.com')?.disposition).toBe('duplicate')
  })
})
