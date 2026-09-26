import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { callerIsAllowlisted, loadReportCaller, readWeeklyPayload } from '@/lib/reports/access'
import { GET } from '@/app/(admin)/admin/reports/[[...asset]]/route'
import {
  REPORT_SLUGS,
  REPORT_VIEWER_IDS,
  anonymousDisposition,
  parseReportPath,
  shapeFixtureEnabled,
  stripTrailingSlashTarget,
} from '@/lib/reports/paths'

vi.mock('@/lib/reports/access', () => ({
  loadReportCaller: vi.fn(),
  callerIsAllowlisted: vi.fn(),
  readWeeklyPayload: vi.fn(),
  weeklyReportsNavHref: vi.fn(),
}))

const GEORGE = REPORT_VIEWER_IDS[0]
const OTHER_ADMIN = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
const webRoot = resolve(__dirname, '../..')
const repoRoot = resolve(webRoot, '../..')

const PAGE_ROUTES = ['/admin/reports', '/admin/reports/adcellerant', '/admin/reports/adcellerant/']
const ASSET_ROUTES = [
  '/admin/reports/adcellerant/manifest.webmanifest',
  '/admin/reports/adcellerant/sw.js',
  '/admin/reports/adcellerant/icon.svg',
  '/admin/reports/adcellerant/icon-192.png',
  '/admin/reports/adcellerant/icon-512.png',
]
const JSON_ROUTES = ['/admin/reports/adcellerant/report.json']
const ALL_ROUTES = [...PAGE_ROUTES, ...ASSET_ROUTES, ...JSON_ROUTES]

function hit(pathname: string) {
  return GET(new Request(`https://platform.evolvedpros.com${pathname}`))
}

function src(rel: string) {
  const base = rel.startsWith('apps/') || rel.startsWith('supabase/') ? repoRoot : webRoot
  return readFileSync(resolve(base, rel), 'utf8')
}

describe('weekly report gate', () => {
  beforeEach(() => {
    vi.mocked(loadReportCaller).mockReset()
    vi.mocked(callerIsAllowlisted).mockReset()
    vi.mocked(readWeeklyPayload).mockReset()
    vi.mocked(readWeeklyPayload).mockResolvedValue({
      business: 'EXAMPLE',
      week: 'EXAMPLE DATA',
    })
  })

  it('sends a logged-out visitor to login for pages and 401 for JSON and assets', async () => {
    vi.mocked(loadReportCaller).mockResolvedValue(null)

    for (const pathname of PAGE_ROUTES) {
      const res = await hit(pathname)
      expect(res.status, pathname).toBeGreaterThanOrEqual(300)
      expect(res.status, pathname).toBeLessThan(400)
      expect(res.headers.get('location'), pathname).toContain('/login')
      expect(res.headers.get('cache-control')).toContain('no-store')
    }

    for (const pathname of [...ASSET_ROUTES, ...JSON_ROUTES]) {
      const res = await hit(pathname)
      expect(res.status, pathname).toBe(401)
      expect(await res.json()).toEqual({ error: 'Unauthorized' })
      expect(res.headers.get('cache-control')).toContain('no-store')
      expect(res.headers.get('vary')).toBe('Cookie')
    }

    expect(readWeeklyPayload).not.toHaveBeenCalled()
  })

  it('returns 404 for an authenticated admin who is not on the allowlist', async () => {
    vi.mocked(loadReportCaller).mockResolvedValue({ ids: [OTHER_ADMIN], role: 'admin' })
    vi.mocked(callerIsAllowlisted).mockResolvedValue(false)

    for (const pathname of ALL_ROUTES) {
      const res = await hit(pathname)
      expect(res.status, pathname).toBe(404)
      const body = await res.text()
      expect(body).not.toContain('EXAMPLE')
      expect(body).not.toContain('AdCellerant')
      expect(body).not.toContain(OTHER_ADMIN)
    }

    expect(readWeeklyPayload).not.toHaveBeenCalled()
    expect(callerIsAllowlisted).toHaveBeenCalled()
  })

  it('returns 200 for an allowlisted user without consulting the admin role', async () => {
    vi.mocked(loadReportCaller).mockResolvedValue({ ids: [GEORGE], role: 'member' })
    vi.mocked(callerIsAllowlisted).mockResolvedValue(true)

    const index = await hit('/admin/reports')
    expect(index.status).toBe(200)
    expect(index.headers.get('content-type')).toContain('text/html')
    expect(index.headers.get('cache-control')).toContain('private, no-store')
    const indexHtml = await index.text()
    expect(indexHtml).toContain('href="/admin/reports/adcellerant/"')
    expect(indexHtml).toContain('href="/admin/reports/evolved-pros/"')
    expect(indexHtml).toContain('href="/admin/reports/evolvex360/"')
    expect(indexHtml).toContain('href="/admin/reports/gwleith-money/"')

    const bare = await hit('/admin/reports/adcellerant')
    expect(bare.status).toBe(307)
    expect(bare.headers.get('location')).toBe('https://platform.evolvedpros.com/admin/reports/adcellerant/')

    const shell = await hit('/admin/reports/adcellerant/')
    expect(shell.status).toBe(200)
    expect(shell.headers.get('cache-control')).toContain('private, no-store')
    expect(shell.headers.get('vary')).toBe('Cookie')
    const shellHtml = await shell.text()
    expect(shellHtml).toMatch(/crossorigin=(['"])use-credentials\1/)
    expect(shellHtml).toContain('/admin/reports/adcellerant/sw.js')
    expect(shellHtml).toContain("scope:'/admin/reports/adcellerant/'")

    const manifestRes = await hit('/admin/reports/adcellerant/manifest.webmanifest')
    expect(manifestRes.status).toBe(200)
    const manifest = await manifestRes.json()
    expect(manifest.name).toBe('AdCellerant Weekly')
    expect(manifest.display).toBe('standalone')
    expect(manifest.start_url).toBe('/admin/reports/adcellerant/')
    expect(manifest.scope).toBe('/admin/reports/adcellerant/')
    expect(manifest.icons.map((icon: { src: string }) => icon.src)).toEqual([
      '/admin/reports/adcellerant/icon.svg',
      '/admin/reports/adcellerant/icon-192.png',
      '/admin/reports/adcellerant/icon-512.png',
    ])

    const worker = await hit('/admin/reports/adcellerant/sw.js')
    expect(worker.status).toBe(200)
    expect(worker.headers.get('service-worker-allowed')).toBe('/admin/reports/adcellerant/')
    const workerText = await worker.text()
    expect(workerText).toContain("endsWith('/report.json')")
    expect(workerText).toContain("redirect: 'manual'")
    expect(workerText).toContain('function cacheable')
    expect(workerText).toContain('caches.match(BASE + \'report.json\')')

    for (const pathname of ASSET_ROUTES.filter(route => route.includes('/icon'))) {
      const res = await hit(pathname)
      expect(res.status, pathname).toBe(200)
      expect((await res.arrayBuffer()).byteLength).toBeGreaterThan(32)
      expect(res.headers.get('cache-control')).toContain('no-store')
    }

    const report = await hit('/admin/reports/adcellerant/report.json')
    expect(report.status).toBe(200)
    expect(report.headers.get('cache-control')).toBe('private, no-store')
    expect(report.headers.get('vary')).toBe('Cookie')
    expect(await report.json()).toEqual({ business: 'EXAMPLE', week: 'EXAMPLE DATA' })
    expect(readWeeklyPayload).toHaveBeenCalledTimes(1)
    expect(readWeeklyPayload).toHaveBeenCalledWith('adcellerant')

    for (const slug of REPORT_SLUGS) {
      const res = await hit(`/admin/reports/${slug}/`)
      expect(res.status, slug).toBe(200)
      const manifestForSlug = await hit(`/admin/reports/${slug}/manifest.webmanifest`)
      const body = await manifestForSlug.json()
      expect(body.scope).toBe(`/admin/reports/${slug}/`)
      expect(body.start_url).toBe(`/admin/reports/${slug}/`)
      expect(body.display).toBe('standalone')
    }
  })
})

describe('weekly report privacy locks', () => {
  it('does not treat the admin role as the gate', () => {
    const serve = src('lib/reports/serve.ts')
    const access = src('lib/reports/access.ts')
    expect(serve).not.toMatch(/role/)
    expect(access).not.toMatch(/role\s*===/)
    expect(access).not.toMatch(/['"]admin['"]/)
    expect(serve).not.toMatch(/console\./)
    expect(access).not.toMatch(/console\./)
    const nav = src('lib/admin/nav.ts')
    expect(nav).not.toContain('/admin/reports')
    const middleware = src('middleware.ts')
    const dev = middleware.indexOf("process.env.NODE_ENV === 'development'")
    const devWeekly = middleware.indexOf('isWeeklyReportPath(pathname)', dev)
    const devAdmin = middleware.indexOf("profile.role !== 'admin'", dev)
    expect(devWeekly).toBeGreaterThan(dev)
    expect(devWeekly).toBeLessThan(devAdmin)
    const allowReturn = middleware.indexOf('Weekly reports skip the admin-role gate')
    const adminGate = middleware.indexOf("profile?.role !== 'admin'")
    expect(allowReturn).toBeGreaterThan(-1)
    expect(allowReturn).toBeLessThan(adminGate)
  })

  it('keeps migration 105 private and seeded with the platform user ids', () => {
    const sql = src('supabase/migrations/105_private_weekly_reports.sql').toLowerCase()
    expect(sql).toContain('create table if not exists private.report_viewers')
    expect(sql).toContain('create table if not exists private.weekly_reports')
    expect(sql).toContain('enable row level security')
    expect(sql).not.toContain('create policy')
    expect(sql).toContain('revoke all on table private.weekly_reports from public, anon, authenticated')
    expect(sql).toContain('revoke all on table private.report_viewers from public, anon, authenticated')
    expect(sql).toContain('revoke all on function public.weekly_report_upsert(text, jsonb) from public, anon, authenticated')
    expect(sql).toContain('grant execute on function public.weekly_report_read(text) to service_role')
    for (const id of REPORT_VIEWER_IDS) expect(sql).toContain(id)
    expect(sql).not.toContain('grant select on table private.weekly_reports to anon')
    expect(sql).not.toContain('grant select on table private.weekly_reports to authenticated')
  })

  it('refuses the shape fixture in production and keeps PWA directory slashes', () => {
    expect(shapeFixtureEnabled({ NODE_ENV: 'production', WEEKLY_REPORTS_SHAPE_FIXTURE: '1' })).toBe(false)
    expect(shapeFixtureEnabled({ NODE_ENV: 'development', WEEKLY_REPORTS_SHAPE_FIXTURE: '1' })).toBe(true)
    expect(shapeFixtureEnabled({ NODE_ENV: 'development' })).toBe(false)
    expect(stripTrailingSlashTarget('/admin/reports/adcellerant/')).toBeNull()
    expect(stripTrailingSlashTarget('/home/')).toBe('/home')
    expect(anonymousDisposition('/admin/reports/adcellerant/report.json')).toBe(401)
    expect(anonymousDisposition('/admin/reports')).toBe('redirect')
    expect(parseReportPath('/admin/reports/adcellerant/../../.env').kind).toBe('unknown')
  })
})
