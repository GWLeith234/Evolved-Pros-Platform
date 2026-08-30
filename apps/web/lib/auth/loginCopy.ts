/**
 * /login copy, keyed by mode (SPRINT DOORS-1).
 *
 * /join and /signup both 308 to /login?mode=signup (next.config.mjs), so the
 * one login screen now serves two audiences: a member coming back, and a
 * first-time visitor who just heard "/join" on stage. Before this, page.tsx
 * exported a STATIC metadata object titled 'Sign In — Evolved Pros' and
 * LoginForm hardcoded 'Sign In →', so a signup arrival was told to sign in.
 *
 * The mapping lives here rather than in the component because vitest only
 * collects lib/** (see vitest.config.ts) — nothing under app/ can be covered,
 * and "does ?mode=signup actually change the button" is the part worth a test.
 *
 * DEPENDENCY-FREE ON PURPOSE — imports nothing, so the page (server) and the
 * form (client) can both read it.
 */

export type LoginMode = 'signin' | 'signup'

export interface LoginCopy {
  /** <h2> above the form. */
  heading: string
  /** Password-form submit button, idle state. */
  submit: string
  /** <title> for this mode. */
  metaTitle: string
}

export const LOGIN_COPY: Record<LoginMode, LoginCopy> = {
  // Both strings ship exactly as they are today — this mode is the default and
  // must not change.
  signin: {
    heading: 'Welcome back.',
    submit: 'Sign In →',
    metaTitle: 'Sign In — Evolved Pros',
  },
  signup: {
    heading: 'Create account',
    submit: 'Create account →',
    metaTitle: 'Create Account — Evolved Pros',
  },
}

/**
 * Resolve ?mode= into a mode.
 *
 * Takes the raw searchParams value, which Next hands over as `string[]` when
 * the param is repeated (`?mode=signup&mode=x`) — typing it as plain string
 * compiles and then misbehaves at request time, the same trap documented on
 * LoginPage's `redirect` param. Only the literal 'signup' opts in; anything
 * else (absent, empty, misspelled, an array whose first value is not 'signup')
 * falls back to the sign-in default, because showing a returning member a
 * "Create account" button is the worse failure.
 */
export function resolveLoginMode(raw: string | string[] | undefined | null): LoginMode {
  const value = Array.isArray(raw) ? raw[0] : raw
  return value === 'signup' ? 'signup' : 'signin'
}

/** Convenience: the copy block for a raw ?mode= value. */
export function loginCopyFor(raw: string | string[] | undefined | null): LoginCopy {
  return LOGIN_COPY[resolveLoginMode(raw)]
}
