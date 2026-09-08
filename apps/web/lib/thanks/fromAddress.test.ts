import { describe, expect, it } from 'vitest'
import {
  extractEmailAddress,
  isAllowedThanksFromHost,
  resolveThanksFromAddress,
} from './fromAddress'

describe('thank-you from address lock', () => {
  it('allows evolvedpros.com and mail.evolvedpros.com only', () => {
    expect(resolveThanksFromAddress('George <hello@evolvedpros.com>')).toEqual({
      ok: true,
      from: 'George <hello@evolvedpros.com>',
    })
    expect(resolveThanksFromAddress('noreply@mail.evolvedpros.com')).toEqual({
      ok: true,
      from: 'noreply@mail.evolvedpros.com',
    })
    expect(isAllowedThanksFromHost('evolvedpros.com')).toBe(true)
    expect(isAllowedThanksFromHost('mail.evolvedpros.com')).toBe(true)
  })

  it('refuses EVX, Resend onboarding, and missing env', () => {
    expect(resolveThanksFromAddress(undefined).ok).toBe(false)
    expect(resolveThanksFromAddress('').ok).toBe(false)
    expect(resolveThanksFromAddress('Evolved Pros <onboarding@resend.dev>')).toEqual({
      ok: false,
      reason: 'forbidden_host',
    })
    expect(resolveThanksFromAddress('reports@reports.evolvex360.com')).toEqual({
      ok: false,
      reason: 'forbidden_host',
    })
    expect(resolveThanksFromAddress('george@evolvex360.com')).toEqual({
      ok: false,
      reason: 'forbidden_host',
    })
    expect(extractEmailAddress('Evolved Pros <hello@evolvedpros.com>')).toBe('hello@evolvedpros.com')
  })
})
