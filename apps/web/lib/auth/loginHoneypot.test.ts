/**
 * Login honeypot wiring. The server already checks `website` on
 * /api/auth/magic-link, /api/auth/signup, and /api/auth/provision; the form
 * has to send it. Password signup must not call supabase.auth.signUp — that
 * PKCE email returns access_denied in a fresh browser.
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
    expect(loginForm).toContain("fetch('/api/auth/signup'")
    expect(loginForm).toContain('requestJoinProvision(emailNorm, trap)')
    expect(loginForm).not.toContain('supabase.auth.signUp')
    expect(loginForm.indexOf("trap.trim() !== ''")).toBeLessThan(
      loginForm.indexOf("fetch('/api/auth/signup'"),
    )
  })
})
