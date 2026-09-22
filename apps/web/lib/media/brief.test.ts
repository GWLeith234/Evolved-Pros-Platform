import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  BRIEF_COPY,
  BRIEF_EMAIL_MAX,
  normalizeBriefEmail,
  normalizeBriefPath,
  normalizeBriefSource,
} from './brief'

const here = dirname(fileURLToPath(import.meta.url))
const read = (rel: string) => readFileSync(resolve(here, rel), 'utf8')

describe('normalizeBriefEmail', () => {
  it('trims and lowercases so the table holds one row per human', () => {
    expect(normalizeBriefEmail('  George@EvolvedPros.COM ')).toBe('george@evolvedpros.com')
  })

  it('accepts the addresses tighter regexes get wrong', () => {
    expect(normalizeBriefEmail('george+media@evolvedpros.com')).toBe('george+media@evolvedpros.com')
    expect(normalizeBriefEmail('a@b.co.uk')).toBe('a@b.co.uk')
    expect(normalizeBriefEmail("o'brien@example.marketing")).toBe("o'brien@example.marketing")
  })

  it('rejects anything it will not store', () => {
    for (const bad of [
      '',
      '   ',
      'george',
      'george@',
      '@evolvedpros.com',
      'george@localhost',
      'george @evolvedpros.com',
      'two@at@example.com',
      null,
      undefined,
      42,
      { email: 'george@evolvedpros.com' },
    ]) {
      expect(normalizeBriefEmail(bad), String(bad)).toBeNull()
    }
  })

  it('caps length at the RFC 5321 path limit', () => {
    const long = `${'a'.repeat(BRIEF_EMAIL_MAX)}@evolvedpros.com`
    expect(normalizeBriefEmail(long)).toBeNull()
    expect(BRIEF_EMAIL_MAX).toBe(254)
  })
})

describe('normalizeBriefSource', () => {
  it('keeps known capture surfaces and flattens everything else', () => {
    expect(normalizeBriefSource('media-rail')).toBe('media-rail')
    expect(normalizeBriefSource('media-article')).toBe('media-article')
    expect(normalizeBriefSource('drop table')).toBe('media')
    expect(normalizeBriefSource(undefined)).toBe('media')
  })
})

describe('normalizeBriefPath', () => {
  it('stores same-origin paths only', () => {
    expect(normalizeBriefPath('/media/accountability/some-story')).toBe(
      '/media/accountability/some-story',
    )
  })

  it('refuses absolute and protocol-relative URLs', () => {
    expect(normalizeBriefPath('https://evil.example/x')).toBeNull()
    expect(normalizeBriefPath('//evil.example/x')).toBeNull()
    expect(normalizeBriefPath('media/x')).toBeNull()
    expect(normalizeBriefPath(null)).toBeNull()
  })

  it('bounds the stored path', () => {
    expect(normalizeBriefPath(`/${'a'.repeat(900)}`)).toHaveLength(512)
  })
})

describe('the brief actually captures', () => {
  const route = read('../../app/api/media/brief/route.ts')
  const form = read('../../components/media/BriefSignup.tsx')

  it('writes the address to a real table through the service-role client', () => {
    expect(route).toContain("from('media_brief_subscribers')")
    expect(route).toContain('adminClient')
    expect(route).toContain('.upsert(')
  })

  it('validates server-side and never trusts the browser', () => {
    expect(route).toContain('normalizeBriefEmail(body.email)')
    expect(route).toContain('invalid_email')
    expect(route).toContain('422')
  })

  it('drops honeypot submissions without telling the bot', () => {
    expect(route).toContain('body.website')
    expect(route).toContain('{ ok: true }')
  })

  it('never logs the address or a provider message', () => {
    expect(route).toContain('error.code')
    expect(route).not.toMatch(/console\.(error|log|warn)\([^)]*email/)
    expect(route).not.toContain('error.message')
  })

  it('posts a real form, not a link to the podcast', () => {
    expect(form).toContain('<form')
    expect(form).toContain('type="email"')
    expect(form).toContain("'/api/media/brief'")
    // Comments stripped: the file explains the /podcast link it replaced.
    expect(form.replace(/\/\*[\s\S]*?\*\//g, '')).not.toContain('/podcast')
  })

  it('keeps one copy deck so the rail and the article foot cannot drift', () => {
    expect(BRIEF_COPY.pitch).toContain('Evolved Pros Media')
    expect(BRIEF_COPY.submit).toBe('Get the brief')
    // No em dashes: Media copy hygiene applies to the strings too.
    for (const line of Object.values(BRIEF_COPY)) {
      expect(line).not.toContain('—')
    }
  })
})
