import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GatedIntentWall } from '@/components/auth/GatedIntentWall'
import {
  ACADEMY_LOGIN_BODY,
  ACADEMY_LOGIN_HEADLINE,
  EVENTS_LOGIN_BODY,
  EVENTS_LOGIN_HEADLINE,
  gatedIntentFor,
} from './gatedIntent'

describe('GatedIntentWall', () => {
  it('names member event details and asks the visitor to sign in', () => {
    const intent = gatedIntentFor('/events')
    expect(intent).not.toBeNull()
    const html = renderToStaticMarkup(<GatedIntentWall intent={intent!} />)
    expect(html).toContain('data-gated-intent="events"')
    expect(html).toContain(EVENTS_LOGIN_HEADLINE)
    expect(html).toContain(EVENTS_LOGIN_BODY)
    expect(html).toContain('Member event details')
    expect(html).toContain('Sign in to continue')
    expect(html).not.toContain('Foundation')
  })

  it('keeps Academy pillars on the academy wall only', () => {
    const intent = gatedIntentFor('/academy')
    const html = renderToStaticMarkup(<GatedIntentWall intent={intent!} />)
    expect(html).toContain('data-gated-intent="academy"')
    expect(html).toContain(ACADEMY_LOGIN_HEADLINE)
    expect(html).toContain(ACADEMY_LOGIN_BODY)
    expect(html).toContain('Foundation')
    expect(html).toContain('Execution')
  })
})
