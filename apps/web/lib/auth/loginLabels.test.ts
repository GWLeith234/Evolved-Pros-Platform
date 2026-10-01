import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const here = dirname(fileURLToPath(import.meta.url))
const login = readFileSync(resolve(here, '../../app/(auth)/login/LoginForm.tsx'), 'utf8')
const cards = readFileSync(
  resolve(here, '../../app/(public)/pricing/PricingTierCards.tsx'),
  'utf8',
)
const redeem = readFileSync(
  resolve(here, '../../app/(public)/pricing/RedeemCodeForm.tsx'),
  'utf8',
)

describe('auth and pricing input labels', () => {
  it('gives every login and signup input a label, plus a screen-reader h1', () => {
    expect(login).toContain('<h1 className="sr-only">')
    expect(login).toContain('htmlFor="login-email"')
    expect(login).toContain('id="login-email"')
    expect(login).toContain('htmlFor="login-password"')
    expect(login).toContain('id="login-password"')
    expect(login).toContain('htmlFor="login-magic-email"')
    expect(login).toContain('id="login-magic-email"')
    expect(login).toContain('aria-label="Website"')
  })

  it('names the pricing billing radios and the access code', () => {
    expect(cards).toContain('aria-label="Monthly billing"')
    expect(cards).toContain('aria-label="Annual billing"')
    expect(redeem).toContain('aria-label="Access code"')
  })
})
