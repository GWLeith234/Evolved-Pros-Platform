import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { articleCtaCopy, toArticleCtaState } from './articleCta'

const here = dirname(fileURLToPath(import.meta.url))
const read = (rel: string) => readFileSync(resolve(here, rel), 'utf8')

describe('articleCtaCopy', () => {
  it('sells the free door to a signed-out reader', () => {
    const copy = articleCtaCopy('anon')
    expect(copy?.primary).toEqual({ label: 'Join free', href: '/pricing' })
  })

  it('sells the upgrade to a signed-in free-tier member', () => {
    const copy = articleCtaCopy('free')
    expect(copy?.primary.label).toMatch(/upgrade/i)
    expect(copy?.primary.href).toBe('/pricing')
    expect(copy?.headline).not.toMatch(/join free/i)
  })

  it('sells nothing to someone who already pays', () => {
    expect(articleCtaCopy('member')).toBeNull()
  })

  it('keeps every state free of em dashes and empty copy', () => {
    for (const state of ['anon', 'free'] as const) {
      const copy = articleCtaCopy(state)!
      for (const line of [copy.kicker, copy.headline, copy.body]) {
        expect(line.trim().length, state).toBeGreaterThan(0)
        expect(line, state).not.toContain('—')
      }
    }
  })
})

describe('toArticleCtaState', () => {
  it('falls back to the signed-out door for anything unrecognised', () => {
    expect(toArticleCtaState('free')).toBe('free')
    expect(toArticleCtaState('member')).toBe('member')
    for (const bad of ['admin', '', null, undefined, 1, {}]) {
      expect(toArticleCtaState(bad)).toBe('anon')
    }
  })
})

describe('the CTA is decided server-side', () => {
  const route = read('../../app/api/media/viewer/route.ts')

  it('resolves the tier through the existing helpers, not a new matrix', () => {
    expect(route).toContain('resolveCurrentUser')
    expect(route).toContain("hasTierAccess(profile.tier, 'vip')")
  })

  it('returns a label and nothing else', () => {
    expect(route).toContain('NextResponse.json(\n    { state }')
    expect(route).not.toMatch(/profile\.(id|email|full_name)/)
    expect(route).toContain("'private, no-store'")
  })

  it('fails to the signed-out door, never to a blank article foot', () => {
    expect(route).toMatch(/catch \{[\s\S]*state = 'anon'/)
  })
})
