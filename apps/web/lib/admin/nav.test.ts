import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ADMIN_NAV_HOME, ADMIN_NAV_SECTIONS, flattenAdminNav } from './nav'
import { AI_GEORGE_TAG } from './crm'

const root = resolve(__dirname, '../..')

function src(rel: string) {
  return readFileSync(resolve(root, rel), 'utf8')
}

describe('admin nav IA (George lock 2026-09-11)', () => {
  it('keeps Home at /admin and does not label it Dashboard', () => {
    expect(ADMIN_NAV_HOME.href).toBe('/admin')
    expect(ADMIN_NAV_HOME.label).toBe('Home')
  })

  it('regroups like Kajabi: People, Sales, Marketing, Products, Website', () => {
    expect(ADMIN_NAV_SECTIONS.map(s => s.title)).toEqual([
      'People',
      'Sales',
      'Marketing',
      'Products',
      'Website',
    ])
  })

  it('renames Pipeline to Member upgrades without moving the route', () => {
    const item = flattenAdminNav().find(i => i.href === '/admin/pipeline')
    expect(item?.label).toBe('Member upgrades')
    expect(item?.label).not.toBe('Pipeline')
  })

  it('keeps Prospects CRM at /admin/crm', () => {
    const item = flattenAdminNav().find(i => i.href === '/admin/crm')
    expect(item?.label).toBe('Prospects CRM')
  })

  it('puts Friends and Thank-you Community under People', () => {
    const people = ADMIN_NAV_SECTIONS.find(s => s.title === 'People')
    expect(people?.items.map(i => i.label)).toEqual([
      'Members',
      'Member upgrades',
      'Friends',
      'Thank-you Community',
    ])
  })
})

describe('admin chrome copy locks', () => {
  it('does not hardcode dark navy chrome on sidebar or top nav', () => {
    expect(src('components/admin/AdminSidebar.tsx')).not.toContain('#0d1c27')
    expect(src('components/admin/AdminTopNav.tsx')).not.toContain('#0d1c27')
  })

  it('uses CSS vars in new admin chrome, no new raw hex', () => {
    const HEX = /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/
    expect(src('components/admin/AdminSidebar.tsx')).not.toMatch(HEX)
    expect(src('components/admin/AdminTopNav.tsx')).not.toMatch(HEX)
    const tokens = src('app/globals.css')
    expect(tokens).toContain('--admin-overlay')
    expect(tokens).toContain('--admin-on-accent')
  })

  it('uses LogoMark in admin chrome and branding previews, never CSS EVOLVED·PROS', () => {
    expect(src('components/admin/AdminTopNav.tsx')).toContain('LogoMark')
    const branding = src('app/(admin)/admin/branding/BrandingPortalClient.tsx')
    expect(branding).toContain('<LogoMark')
    expect(branding).not.toContain('EVOLVED·PROS')
  })

  it('strips developer TODO and AI writer chrome without renaming AI George data', () => {
    expect(src('app/(admin)/admin/page.tsx')).not.toContain('TODO VENDASTA')
    expect(src('app/(admin)/admin/page.tsx')).toContain('Billing not connected')
    expect(src('app/(admin)/admin/page.tsx')).not.toMatch(/label:\s*'Pipeline'/)
    expect(src('app/(admin)/admin/episodes/EpisodeForm.tsx')).not.toContain('Write with AI')
    expect(src('app/(admin)/admin/episodes/EpisodeForm.tsx')).not.toContain('AI image prompt')
    expect(src('app/(admin)/admin/events/EventForm.tsx')).not.toContain('Write with AI')
    expect(src('app/(admin)/admin/events/EventForm.tsx')).not.toContain('AI image prompt')
    expect(src('components/admin/crm/CrmProspectModal.tsx')).not.toContain('Conversations AI')
    expect(src('components/admin/crm/CrmProspectModal.tsx')).toContain('Conversation notes')
    expect(AI_GEORGE_TAG).toBe('AI George')
    expect(src('lib/admin/crm.ts')).not.toContain('displayCrmTag')
    expect(src('components/admin/crm/CrmCard.tsx')).not.toContain('Ask George')
  })

  it('keeps dashboard to four tiles and Members / CRM / Revenue quick links', () => {
    const page = src('app/(admin)/admin/page.tsx')
    expect(page).toContain("label: 'Active members'")
    expect(page).toContain("label: 'MRR'")
    expect(page).toContain("label: 'Retention rate'")
    expect(page).toContain("label: 'Pro members'")
    expect(page).not.toContain("label: 'Total posts'")
    expect(page).not.toContain("label: 'Published episodes'")
    expect(page).toContain("href: '/admin/members'")
    expect(page).toContain("href: '/admin/crm'")
    expect(page).toContain("href: '/admin/revenue'")
    expect(page).not.toContain("href: '/admin/pipeline'")
  })

  it('labels Media as Pros Media and Careers as Careers', () => {
    expect(src('app/(admin)/admin/media/page.tsx')).toContain('Pros Media')
    expect(src('app/(admin)/admin/media/page.tsx')).not.toContain('Evolved Media')
    expect(src('app/(admin)/admin/media/new/page.tsx')).toContain('Pros Media')
    expect(src('app/(admin)/admin/media/[id]/edit/page.tsx')).toContain('Pros Media')
    expect(src('app/(admin)/admin/careers/page.tsx')).toContain('>Careers<')
    expect(src('app/(admin)/admin/careers/page.tsx')).not.toContain('Job Listings')
  })

  it('does not invent Member upgrades ARR from stale $79/$39 or monthly * 12', () => {
    const page = src('app/(admin)/admin/pipeline/page.tsx')
    const api = src('app/api/admin/pipeline/route.ts')
    for (const text of [page, api]) {
      expect(text).not.toMatch(/79 \* 12/)
      expect(text).not.toMatch(/39 \* 12/)
      expect(text).not.toMatch(/249 \* 12/)
    }
    expect(page).not.toContain('Upgrade value')
    expect(page).toContain('Member upgrades')
    expect(page).toContain('Dollar totals appear when billing is connected')
  })
})
