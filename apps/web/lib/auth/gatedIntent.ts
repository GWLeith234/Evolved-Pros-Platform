/**
 * S4 — auth intent for gated public doors (Academy, member events).
 *
 * Anonymous /academy and /events used to bounce to a generic /login with no
 * return path and no reason. Middleware, the member layout, and the login
 * screen all read this module so the redirect query, the banner, and the
 * post-auth return cannot drift apart.
 *
 * DEPENDENCY-LIGHT: safeRedirectPath only. No next, no supabase.
 */

import { safeRedirectPath } from './safeRedirect'

export const ACADEMY_LOGIN_HEADLINE = 'Academy is member curriculum'
export const ACADEMY_LOGIN_BODY =
  'Sign in to continue. You will return to the Academy.'
export const ACADEMY_NAV_TOOLTIP =
  'Academy curriculum is for members. Preview the pillars or sign in to continue.'

export const EVENTS_LOGIN_HEADLINE = 'Member event details'
export const EVENTS_LOGIN_BODY =
  'Sign in to continue. You will return to this event list.'
export const EVENTS_NAV_TOOLTIP =
  'Member event details. Sign in to continue and return to this event list.'

export const LOGIN_NEW_HERE = 'New here? Create a free account. No card required.'
export const SIGNUP_ALREADY_MEMBER_PROMPT = 'Already a member?'
export const SIGNUP_ALREADY_MEMBER_ACTION = 'Sign in'
export const SIGNUP_ALREADY_MEMBER = `${SIGNUP_ALREADY_MEMBER_PROMPT} ${SIGNUP_ALREADY_MEMBER_ACTION}`

export const RETURN_PATH_HEADER = 'x-ep-return-path'

export type GatedIntent = {
  id: 'academy' | 'events'
  headline: string
  body: string
}

export function returnPathFromRequest(pathname: string, search = ''): string {
  const combined = `${pathname}${search}`
  return safeRedirectPath(combined)
}

export function loginHrefFor(
  returnPath: unknown,
  mode?: 'signin' | 'signup',
): string {
  const safe = safeRedirectPath(returnPath)
  const params = new URLSearchParams()
  if (mode === 'signup') params.set('mode', 'signup')
  params.set('redirect', safe)
  return `/login?${params.toString()}`
}

export function loginSwitchHref(
  currentRedirect: unknown,
  targetMode: 'signin' | 'signup',
): string {
  return loginHrefFor(currentRedirect, targetMode === 'signup' ? 'signup' : undefined)
}

export function gatedIntentFor(redirectPath: unknown): GatedIntent | null {
  const path = safeRedirectPath(redirectPath, '')
  if (!path) return null
  if (path === '/academy' || path.startsWith('/academy/')) {
    return {
      id: 'academy',
      headline: ACADEMY_LOGIN_HEADLINE,
      body: ACADEMY_LOGIN_BODY,
    }
  }
  if (path === '/events' || path.startsWith('/events/')) {
    return {
      id: 'events',
      headline: EVENTS_LOGIN_HEADLINE,
      body: EVENTS_LOGIN_BODY,
    }
  }
  return null
}

export function gatedIntentCopyStrings(): string[] {
  return [
    ACADEMY_LOGIN_HEADLINE,
    ACADEMY_LOGIN_BODY,
    ACADEMY_NAV_TOOLTIP,
    EVENTS_LOGIN_HEADLINE,
    EVENTS_LOGIN_BODY,
    EVENTS_NAV_TOOLTIP,
    LOGIN_NEW_HERE,
    SIGNUP_ALREADY_MEMBER,
  ]
}
