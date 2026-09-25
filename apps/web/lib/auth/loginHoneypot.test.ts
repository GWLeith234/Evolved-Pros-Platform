/**
 * Login honeypot wiring. The server already checks `website` on
 * /api/auth/magic-link and /api/auth/provision; the form has to send it.
 */
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const here = dirname(fileURLToPath(import.meta.url))
const loginForm = readFileSync(resolve(here, '../../app/(auth)/login/LoginForm.tsx'), 'utf8')

describe('login honeypot', () => {
  it('renders a hidden website field and posts it to both auth endpoints', () => {
    expect(loginForm).toContain('name="website"')
    expect(loginForm).toContain('tabIndex={-1}')
    expect(loginForm).toContain('autoComplete="off"')
    expect(loginForm).toContain('aria-hidden="true"')
    expect(loginForm).toContain('website: trap')
    expect(loginForm).toContain('requestJoinProvision(emailNorm, trap)')
    expect(loginForm).toMatch(/trap\.trim\(\) !== ''[\s\S]*signUp/)
    expect(loginForm.indexOf("trap.trim() !== ''")).toBeLessThan(loginForm.indexOf('supabase.auth.signUp'))
  })
})
