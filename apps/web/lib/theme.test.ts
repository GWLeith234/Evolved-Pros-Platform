/**
 * THEME-PERSIST sprint — contracts for the light/dark/system preference.
 *
 * These cover the parts that decide whether the preference survives a reload:
 * coercion of untrusted values (DB text, localStorage, request body), runtime
 * resolution of 'system', and the nav toggle's cycle.
 */
import { describe, it, expect } from 'vitest'
import {
  THEME_PREFERENCES,
  THEME_STORAGE_KEY,
  isThemePreference,
  nextPreference,
  resolveTheme,
  toThemePreference,
  toggleLabel,
} from './theme'
import { themeInitScript, themeSyncScript } from './theme-script'

describe('isThemePreference', () => {
  it('accepts exactly the three stored values', () => {
    expect(THEME_PREFERENCES.every(isThemePreference)).toBe(true)
  })

  it('rejects anything else', () => {
    for (const bad of ['Light', 'DARK', '', 'auto', null, undefined, 0, {}, ['dark']]) {
      expect(isThemePreference(bad)).toBe(false)
    }
  })
})

describe('toThemePreference', () => {
  it('passes valid values through', () => {
    expect(toThemePreference('light')).toBe('light')
    expect(toThemePreference('system')).toBe('system')
  })

  it('falls back to system for junk, matching the column default', () => {
    expect(toThemePreference(null)).toBe('system')
    expect(toThemePreference('nonsense')).toBe('system')
  })

  it('honours an explicit fallback (root layout uses dark)', () => {
    expect(toThemePreference(undefined, 'dark')).toBe('dark')
  })
})

describe('resolveTheme', () => {
  it('never lets an explicit choice be overridden by the OS', () => {
    expect(resolveTheme('light', true)).toBe('light')
    expect(resolveTheme('light', false)).toBe('light')
    expect(resolveTheme('dark', false)).toBe('dark')
    expect(resolveTheme('dark', true)).toBe('dark')
  })

  it("resolves 'system' from prefers-color-scheme at call time", () => {
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
  })
})

describe('nextPreference', () => {
  it('cycles system → light → dark → system', () => {
    expect(nextPreference('system')).toBe('light')
    expect(nextPreference('light')).toBe('dark')
    expect(nextPreference('dark')).toBe('system')
  })

  it('reaches every state within one cycle', () => {
    const seen = new Set<string>()
    let cur = nextPreference('system')
    for (let i = 0; i < 3; i++) {
      seen.add(cur)
      cur = nextPreference(cur)
    }
    expect([...seen].sort()).toEqual(['dark', 'light', 'system'])
  })
})

describe('toggleLabel', () => {
  it('names the current state and the next one', () => {
    expect(toggleLabel('system')).toBe('Theme: System theme. Switch to light mode')
    expect(toggleLabel('dark')).toBe('Theme: Dark mode. Switch to system theme')
  })
})

describe('pre-paint scripts', () => {
  it('inlines the platform default and installs the shared apply hook', () => {
    const src = themeInitScript('dark')
    expect(src).toContain('window.__epApplyTheme')
    expect(src).toContain('prefers-color-scheme: dark')
    expect(src).toContain('light-mode')
    expect(src).toContain(JSON.stringify(THEME_STORAGE_KEY))
    // The default is embedded as a JSON literal, never interpolated raw.
    expect(src).toContain('"dark"')
  })

  it('sync script persists the server value as the next pre-paint hint', () => {
    expect(themeSyncScript('light')).toBe(
      'try{if(window.__epApplyTheme)window.__epApplyTheme("light",true)}catch(e){}',
    )
  })

  it('leaves no unescaped quote break in either script', () => {
    for (const pref of THEME_PREFERENCES) {
      expect(() => new Function(themeSyncScript(pref))).not.toThrow()
      expect(() => new Function(themeInitScript(pref))).not.toThrow()
    }
  })
})
