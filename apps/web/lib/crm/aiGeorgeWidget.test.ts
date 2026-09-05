import { describe, expect, it } from 'vitest'
import {
  AI_GEORGE_ASK_QUERY,
  AI_GEORGE_ASK_VALUE,
  AI_GEORGE_PLATFORM_ORIGIN,
  AI_GEORGE_SURFACE_PATH,
  AI_GEORGE_WEBCHAT_WIDGET_ID,
  askGeorgeSurfaceHref,
  askGeorgeSurfaceUrl,
  shouldOpenAskGeorgeFromSearch,
} from './aiGeorgeWidget'

describe('AI George widget surface', () => {
  it('locks the platform drawer URL, not a standalone /ask-george route', () => {
    expect(AI_GEORGE_SURFACE_PATH).toBe('/home')
    expect(askGeorgeSurfaceHref()).toBe('/home?ask=george')
    expect(askGeorgeSurfaceUrl()).toBe('https://platform.evolvedpros.com/home?ask=george')
    expect(askGeorgeSurfaceUrl()).not.toContain('/ask-george')
    expect(askGeorgeSurfaceUrl()).not.toContain('/api/ask-george')
    expect(askGeorgeSurfaceUrl()).not.toContain('www.evolvedpros.com')
    expect(AI_GEORGE_PLATFORM_ORIGIN).toBe('https://platform.evolvedpros.com')
    expect(AI_GEORGE_ASK_QUERY).toBe('ask')
    expect(AI_GEORGE_ASK_VALUE).toBe('george')
  })

  it('keeps the live webchat widget id', () => {
    expect(AI_GEORGE_WEBCHAT_WIDGET_ID).toBe('96dd7dbb-2a14-11f1-93eb-72103b668f62')
  })

  it('opens only for ?ask=george', () => {
    expect(shouldOpenAskGeorgeFromSearch('?ask=george')).toBe(true)
    expect(shouldOpenAskGeorgeFromSearch('ask=george')).toBe(true)
    expect(shouldOpenAskGeorgeFromSearch('?tab=home&ask=george')).toBe(true)
    expect(shouldOpenAskGeorgeFromSearch('?ask=George')).toBe(false)
    expect(shouldOpenAskGeorgeFromSearch('?ask=1')).toBe(false)
    expect(shouldOpenAskGeorgeFromSearch('')).toBe(false)
  })
})
