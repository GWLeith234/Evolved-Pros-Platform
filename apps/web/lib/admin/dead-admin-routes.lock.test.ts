import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const webRoot = resolve(__dirname, '../..')

describe('dead admin API leftovers stay gone', () => {
  it('does not keep the stale /api/admin/stats route ($79 MRR delta)', () => {
    expect(existsSync(resolve(webRoot, 'app/api/admin/stats'))).toBe(false)
  })

  it('does not keep the singular /api/admin/image tree', () => {
    expect(existsSync(resolve(webRoot, 'app/api/admin/image'))).toBe(false)
  })

  it('points the admin ImagePicker at /api/admin/images/* only', () => {
    const src = readFileSync(resolve(webRoot, 'components/admin/ImagePicker.tsx'), 'utf8')
    expect(src).toContain('/api/admin/images/unsplash')
    expect(src).toContain('/api/admin/images/generate')
    expect(src).toContain('/api/admin/images/upload')
    expect(src).not.toMatch(/\/api\/admin\/image\//)
  })

  it('keeps the live Stripe-backed /api/admin/revenue route', () => {
    expect(existsSync(resolve(webRoot, 'app/api/admin/revenue/route.ts'))).toBe(true)
    const src = readFileSync(resolve(webRoot, 'app/api/admin/revenue/route.ts'), 'utf8')
    expect(src).toContain('getRevenueSnapshot')
    expect(src).not.toMatch(/\b79\b/)
  })
})
