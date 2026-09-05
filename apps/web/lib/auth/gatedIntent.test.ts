import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { EM_DASH, hasEmDash } from '@/lib/home/conversion'
import {
  ACADEMY_LOGIN_BODY,
  ACADEMY_LOGIN_HEADLINE,
  ACADEMY_NAV_TOOLTIP,
  EVENTS_LOGIN_BODY,
  EVENTS_LOGIN_HEADLINE,
  EVENTS_NAV_TOOLTIP,
  LOGIN_NEW_HERE,
  SIGNUP_ALREADY_MEMBER,
  gatedIntentCopyStrings,
  gatedIntentFor,
  loginHrefFor,
  loginSwitchHref,
  returnPathFromRequest,
} from './gatedIntent'

const EM = '\u2014'

describe('loginHrefFor', () => {
  it('sends Academy and events through /login with a preserved return path', () => {
    expect(loginHrefFor('/academy')).toBe('/login?redirect=%2Facademy')
    expect(loginHrefFor('/events')).toBe('/login?redirect=%2Fevents')
  })

  it('keeps signup mode and the return path on the same URL', () => {
    expect(loginHrefFor('/academy', 'signup')).toBe(
      '/login?mode=signup&redirect=%2Facademy',
    )
  })

  it('refuses off-origin return paths', () => {
    expect(loginHrefFor('https://evil.com')).toBe('/login?redirect=%2Fhome')
    expect(loginHrefFor('//evil.com')).toBe('/login?redirect=%2Fhome')
  })
})

describe('loginSwitchHref', () => {
  it('keeps the return path when flipping signup ↔ signin', () => {
    expect(loginSwitchHref('/events', 'signin')).toBe('/login?redirect=%2Fevents')
    expect(loginSwitchHref('/events', 'signup')).toBe(
      '/login?mode=signup&redirect=%2Fevents',
    )
  })
})

describe('gatedIntentFor', () => {
  it('names Academy as member curriculum', () => {
    const intent = gatedIntentFor('/academy')
    expect(intent).toEqual({
      id: 'academy',
      headline: ACADEMY_LOGIN_HEADLINE,
      body: ACADEMY_LOGIN_BODY,
    })
    expect(intent?.headline).toBe('Academy is member curriculum')
    expect(gatedIntentFor('/academy/foundation')?.id).toBe('academy')
  })

  it('names events as member event details that return after auth', () => {
    const intent = gatedIntentFor('/events')
    expect(intent).toEqual({
      id: 'events',
      headline: EVENTS_LOGIN_HEADLINE,
      body: EVENTS_LOGIN_BODY,
    })
    expect(intent?.body).toMatch(/return to this event list/)
    expect(gatedIntentFor('/events/1')?.id).toBe('events')
  })

  it('stays silent for generic returns like /home', () => {
    expect(gatedIntentFor('/home')).toBeNull()
    expect(gatedIntentFor('/pricing')).toBeNull()
    expect(gatedIntentFor(undefined)).toBeNull()
  })
})

describe('returnPathFromRequest', () => {
  it('keeps a same-origin path and query', () => {
    expect(returnPathFromRequest('/academy')).toBe('/academy')
    expect(returnPathFromRequest('/events', '?tab=upcoming')).toBe(
      '/events?tab=upcoming',
    )
  })
})

describe('S4 auth copy lock', () => {
  it('uses the locked reciprocal lines with no em dash', () => {
    expect(LOGIN_NEW_HERE).toBe('New here? Create a free account. No card required.')
    expect(SIGNUP_ALREADY_MEMBER).toBe('Already a member? Sign in')
    expect(ACADEMY_NAV_TOOLTIP).toBe(
      'Academy curriculum is for members. Preview the pillars or sign in to continue.',
    )
    expect(EVENTS_NAV_TOOLTIP).toBe(
      'Member event details. Sign in to continue and return to this event list.',
    )
    for (const value of gatedIntentCopyStrings()) {
      expect(hasEmDash(value), value).toBe(false)
      expect(value).not.toContain(EM)
      expect(value).not.toContain(EM_DASH)
    }
  })
})

describe('S4 auth wiring (source)', () => {
  const root = resolve(__dirname, '../..')
  const middleware = readFileSync(resolve(root, 'middleware.ts'), 'utf8')
  const memberLayout = readFileSync(resolve(root, 'app/(member)/layout.tsx'), 'utf8')
  const loginForm = readFileSync(resolve(root, 'app/(auth)/login/LoginForm.tsx'), 'utf8')
  const academyPage = readFileSync(resolve(root, 'app/(member)/academy/page.tsx'), 'utf8')

  it('middleware and member layout preserve the return path', () => {
    expect(middleware).toContain('loginHrefFor')
    expect(middleware).toContain('RETURN_PATH_HEADER')
    expect(memberLayout).toContain('loginHrefFor')
    expect(memberLayout).toContain('RETURN_PATH_HEADER')
    expect(academyPage).toContain("loginHrefFor('/academy')")
  })

  it('hides Forgot password on signup and shows reciprocal links', () => {
    expect(loginForm).toContain('LOGIN_NEW_HERE')
    expect(loginForm).toContain('SIGNUP_ALREADY_MEMBER')
    expect(loginForm).toMatch(/mode !== 'signup'[\s\S]+Forgot password\?/)
    expect(loginForm).toContain('gatedIntentFor')
  })
})
