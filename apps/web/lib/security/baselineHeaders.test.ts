/**
 * Baseline response headers from apps/web/next.config.mjs.
 * CSP hosts that auth, Stripe redirects, Vendasta chat, and embeds already
 * rely on stay in place; Clarity's c.bing.com pixel is added, not swapped in.
 */
import { describe, expect, it } from 'vitest'
import nextConfig from '../../next.config.mjs'

type Header = { key: string; value: string }

async function rootHeaders(): Promise<Header[]> {
  if (!nextConfig.headers) throw new Error('headers() missing')
  const groups = await nextConfig.headers()
  const root = groups.find(group => group.source === '/(.*)')
  if (!root) throw new Error('missing /(.*) header group')
  return root.headers
}

function header(headers: Header[], key: string): string {
  const found = headers.find(item => item.key === key)
  if (!found) throw new Error(`missing header ${key}`)
  return found.value
}

describe('baseline security headers', () => {
  it('turns off X-Powered-By and sets the conservative header set', async () => {
    expect(nextConfig.poweredByHeader).toBe(false)
    const headers = await rootHeaders()
    expect(header(headers, 'Strict-Transport-Security')).toBe(
      'max-age=31536000; includeSubDomains',
    )
    expect(header(headers, 'X-Content-Type-Options')).toBe('nosniff')
    expect(header(headers, 'Referrer-Policy')).toBe('strict-origin-when-cross-origin')
    expect(header(headers, 'X-Frame-Options')).toBe('SAMEORIGIN')
    expect(header(headers, 'Permissions-Policy')).toBe(
      'camera=(), microphone=(), geolocation=(), payment=(self)',
    )
  })

  it('keeps embed, auth, and chat sources and allows the Clarity pixel', async () => {
    const csp = header(await rootHeaders(), 'Content-Security-Policy')
    expect(csp).toContain("frame-ancestors 'self'")
    expect(csp).toContain('https://c.bing.com')
    expect(csp).toMatch(/img-src[^;]*https:\/\/c\.bing\.com/)
    expect(csp).toMatch(/connect-src[^;]*https:\/\/c\.bing\.com/)
    for (const host of [
      'https://*.supabase.co',
      'wss://*.supabase.co',
      'https://cdn.apigateway.co',
      'https://*.apigateway.co',
      'wss://*.apigateway.co',
      'https://www.youtube.com',
      'https://www.youtube-nocookie.com',
      'https://*.heygen.com',
      'https://*.clarity.ms',
    ]) {
      expect(csp).toContain(host)
    }
  })
})
