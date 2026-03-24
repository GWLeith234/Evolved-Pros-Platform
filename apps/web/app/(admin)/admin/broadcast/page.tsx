import { BroadcastForm } from '@/components/admin/BroadcastForm'

export const dynamic = 'force-dynamic'

export default function AdminBroadcastPage() {
  return (
    <div className="px-8 py-6">
      <div className="mb-6">
        <h1 className="font-display font-black text-[28px] text-[#112535]">Broadcast</h1>
        <p className="font-condensed text-[12px] text-[#7a8a96] mt-0.5">
          Send a notification to all members or a specific tier
        </p>
      </div>

      <BroadcastForm />
    </div>
  )
}
