import { adminClient } from '@/lib/supabase/admin'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { PartnerForm } from '@/components/admin/PartnerForm'

export const dynamic = 'force-dynamic'

const SURFACES = ['home', 'rail', 'events', 'podcast', 'academy'] as const
type Surface = typeof SURFACES[number]

export default async function EditPartnerPage({ params }: { params: { id: string } }) {
  const h = headers()
  if (h.get('Next-Router-Prefetch') === '1') return null

  const [{ data: sponsor }, { data: placements }] = await Promise.all([
    adminClient
      .from('sponsors')
      .select('id, name, url, logo_url, brand_color, type, tagline, body_copy, cta_text, cta_url, status, contract_start, contract_end, impression_cap, commission_pct, tracking_id')
      .eq('id', params.id)
      .single(),
    adminClient
      .from('sponsor_placements')
      .select('surface, enabled')
      .eq('sponsor_id', params.id),
  ])

  if (!sponsor) notFound()

  const surfaces: Surface[] = (placements ?? [])
    .filter(p => p.enabled)
    .map(p => p.surface as Surface)
    .filter((s): s is Surface => (SURFACES as readonly string[]).includes(s))

  const initial = {
    id:             sponsor.id,
    name:           sponsor.name ?? '',
    url:            sponsor.url ?? '',
    logo_url:       sponsor.logo_url ?? '',
    brand_color:    sponsor.brand_color ?? '#1b3c5a',
    type:           (sponsor.type === 'affiliate' ? 'affiliate' : 'sponsor') as 'sponsor' | 'affiliate',
    tagline:        sponsor.tagline ?? '',
    body_copy:      sponsor.body_copy ?? '',
    cta_text:       sponsor.cta_text ?? 'Learn more',
    cta_url:        sponsor.cta_url ?? '',
    status:         (['active', 'paused', 'expired'].includes(sponsor.status)
                     ? sponsor.status
                     : 'active') as 'active' | 'paused' | 'expired',
    contract_start: sponsor.contract_start ?? '',
    contract_end:   sponsor.contract_end ?? '',
    impression_cap: sponsor.impression_cap != null ? String(sponsor.impression_cap) : '',
    commission_pct: sponsor.commission_pct != null ? String(sponsor.commission_pct) : '',
    tracking_id:    sponsor.tracking_id ?? '',
    surfaces,
  }

  return (
    <div className="px-8 py-6">
      <Link
        href="/admin/partners"
        className="font-condensed font-semibold uppercase tracking-wide text-[11px] text-[#7a8a96] hover:text-[#1b3c5a]"
      >
        ← All partners
      </Link>
      <h1 className="font-display font-black text-[28px] text-[#112535] mt-2 mb-6">{sponsor.name}</h1>
      <PartnerForm initial={initial} />
    </div>
  )
}
