import Link from 'next/link'
import { PartnerForm } from '@/components/admin/PartnerForm'

export default function NewPartnerPage() {
  return (
    <div className="px-8 py-6">
      <Link
        href="/admin/partners"
        className="font-condensed font-semibold uppercase tracking-wide text-[11px] text-[color:var(--admin-text-2)] hover:text-[color:var(--admin-text)]"
      >
        ← All partners
      </Link>
      <h1 className="font-display font-black text-[28px] text-[color:var(--admin-text-strong)] mt-2 mb-6">New partner</h1>
      <PartnerForm />
    </div>
  )
}
