import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(__dirname, '../..')
const EM = /\u2014|\u2013/

function src(rel: string) {
  return readFileSync(resolve(root, rel), 'utf8')
}

function uiCopy(rel: string) {
  return src(rel)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
}

const TOUCHED = [
  'app/(admin)/admin/page.tsx',
  'app/(admin)/admin/pipeline/page.tsx',
  'components/admin/PipelineBoard.tsx',
  'components/admin/crm/CrmBoard.tsx',
  'app/(admin)/admin/media/page.tsx',
  'app/(admin)/admin/media/MediaListClient.tsx',
  'app/(admin)/admin/media/new/page.tsx',
  'app/(admin)/admin/media/MediaStoryForm.tsx',
  'app/(admin)/admin/fit/FitAdminClient.tsx',
  'app/(admin)/admin/branding/BrandingPortalClient.tsx',
  'components/admin/ProductsAdminClient.tsx',
  'components/admin/template/AdminPageHeader.tsx',
  'components/admin/safety/confirmCopy.ts',
]

describe('admin element template (George 2026-09-12)', () => {
  it('locks navy and red on admin chrome tokens', () => {
    const css = src('app/globals.css')
    expect(css).toContain('--admin-navy:        #1B2A4A')
    expect(css).toContain('--admin-red:         #C9302A')
    expect(css).toContain('--admin-text:        #1B2A4A')
    expect(css).toContain('.ep-admin-el-title')
    expect(css).toContain('.ep-admin-el-btn--primary')
    expect(css).toContain('min-height: 44px')
  })

  it('fixes residual page gutters to px-4 sm:px-8', () => {
    expect(src('components/admin/MemberDetailClient.tsx')).toContain('px-4 sm:px-8 py-6')
    expect(src('components/admin/MemberDetailClient.tsx')).not.toMatch(/className="px-8 py-6/)
  })

  it('keeps touched admin copy free of em dashes', () => {
    for (const file of TOUCHED) {
      const text = uiCopy(file)
      expect(text, file).not.toMatch(EM)
      expect(text, file).not.toContain('\\u2014')
      expect(text, file).not.toContain('\\u2013')
    }
  })

  it('uses FO55 letter O on Fit admin rows', () => {
    const fit = src('app/(admin)/admin/fit/FitAdminClient.tsx')
    expect(fit).toContain('AdminPageHeader')
    expect(fit).toContain('FIT_ADMIN_TITLE')
    expect(src('lib/fit/moves.ts')).toContain("FIT_SAMPLE_CODE = 'FO55-035'")
    expect(src('lib/fit/moves.ts')).not.toContain('F055-')
  })

  it('makes Pros Media status a chip and keeps New Story Cancel', () => {
    const list = src('app/(admin)/admin/media/MediaListClient.tsx')
    expect(list).toContain('AdminStatusChip')
    expect(list).not.toContain('togglePublish')
    expect(src('app/(admin)/admin/media/page.tsx')).toContain('Pros Media')
    expect(src('app/(admin)/admin/media/new/page.tsx')).toContain('Pros Media')
    const form = src('app/(admin)/admin/media/MediaStoryForm.tsx')
    expect(form).toContain('Cancel')
    expect(form).toContain('Save as Draft')
    expect(form).toContain('Publish Now')
    expect(form).toContain('ep-admin-el-btn--ghost')
  })

  it('gates Products save on dirty and keeps Stripe confirm', () => {
    const products = src('components/admin/ProductsAdminClient.tsx')
    expect(products).toContain('disabled={busy || !dirty}')
    expect(products).toContain('CONFIRM.saveCatalogue')
    expect(products).toContain('CONFIRM.syncStripe')
    expect(products).toContain('Save catalogue')
    expect(uiCopy('components/admin/ProductsAdminClient.tsx')).not.toMatch(EM)
  })

  it('wires CRM QA cleanup and prospect delete through ConfirmDialog', () => {
    const crm = src('components/admin/crm/CrmBoard.tsx')
    expect(crm).toContain('CONFIRM.cleanupQa')
    expect(crm).toContain('CONFIRM.deleteProspect')
    expect(crm).toContain('Test Mode')
    expect(crm).toContain('AdminPageHeader')
  })

  it('keeps M3 empty-state copy on Revenue, Speaking, and Careers', () => {
    expect(src('app/(admin)/admin/revenue/page.tsx')).toContain('No billing events yet')
    expect(src('app/(admin)/admin/revenue/page.tsx')).toContain('M3 KEEP AS BAR')
    expect(src('app/(admin)/admin/speaking/page.tsx')).toContain(
      'No speaking dates yet. Add a confirmed or hold date when a stage is locked.',
    )
    expect(src('app/(admin)/admin/careers/page.tsx')).toContain('No job listings yet.')
    expect(src('app/(admin)/admin/careers/page.tsx')).toContain('CONFIRM.deleteListing')
  })
})
