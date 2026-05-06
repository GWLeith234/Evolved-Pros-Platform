import Link from 'next/link'
import { PartnerForm } from '@/components/admin/PartnerForm'

export default function NewPartnerPage() {
  return (
    <div className="px-8 py-6">
      <Link
        href="/admin/partners"
        className="font-condensed font-semibold uppercase tracking-wide text-[11px] text-[#7a8a96] hover:text-[#1b3c5a]"
      >
        ← All partners
      </Link>
      <h1 className="font-display font-black text-[28px] text-[#112535] mt-2 mb-6">New partner</h1>
      <PartnerForm />
    </div>
  )
}
