import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { GET, POST } from '@/app/api/dev-login/route'

const here = dirname(fileURLToPath(import.meta.url))
const page = readFileSync(resolve(here, '../../app/dev-login/page.tsx'), 'utf8')

describe('dev-login production gate', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('calls notFound on the page when NODE_ENV is production', () => {
    expect(page).toContain("process.env.NODE_ENV === 'production'")
    expect(page).toContain('notFound()')
    expect(page).not.toContain('<p>404</p>')
    // A route-level loading.tsx prerenders a 200 shell and swallows notFound().
    expect(existsSync(resolve(here, '../../app/dev-login/loading.tsx'))).toBe(false)
  })

  it('returns a real 404 for GET and POST in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const getRes = await GET()
    const postRes = await POST()
    expect(getRes.status).toBe(404)
    expect(postRes.status).toBe(404)
    expect(await getRes.text()).toBe('Not Found')
    expect(postRes.headers.get('set-cookie')).toBeNull()
  })

  it('keeps the dev POST workflow outside production', async () => {
    vi.stubEnv('NODE_ENV', 'test')
    const postRes = await POST()
    expect(postRes.status).toBe(200)
    const body = await postRes.json() as { url?: string }
    expect(body.url).toBe('/home')
    expect(postRes.headers.get('set-cookie')).toContain('dev_session=')

    const getRes = await GET()
    expect(getRes.status).toBe(405)
  })
})
