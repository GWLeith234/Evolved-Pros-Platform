import type { Metadata } from 'next'
import { CrmImportWizard } from '@/components/admin/crm/CrmImportWizard'

export const metadata: Metadata = { title: 'Import CSV — Prospects CRM' }

export const dynamic = 'force-dynamic'

export default function AdminCrmImportPage() {
  return (
    <div className="px-4 sm:px-8 py-6">
      <CrmImportWizard />
    </div>
  )
}
