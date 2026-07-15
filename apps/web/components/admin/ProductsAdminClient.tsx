'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { MembershipProduct } from '@/lib/admin/products'
import { PRODUCT_SETTING_KEYS } from '@/lib/admin/products'
import { TIERS } from '@/lib/pricing'

interface ProductsAdminClientProps {
  initialProducts: MembershipProduct[]
  memberCounts: Record<string, number>
  initialSettings: Record<string, string>
  vendastaCrm: string
  vendastaMarketplace: string
}

export function ProductsAdminClient({
  initialProducts,
  memberCounts,
  initialSettings,
  vendastaCrm,
  vendastaMarketplace,
}: ProductsAdminClientProps) {
  const [products, setProducts] = useState(initialProducts)
  const [vipPrice, setVipPrice] = useState(
    initialSettings[PRODUCT_SETTING_KEYS.vipPrice] ?? String(initialProducts.find(p => p.key === 'vip')?.priceMonthly ?? TIERS.vip.monthly),
  )
  const [proPrice, setProPrice] = useState(
    initialSettings[PRODUCT_SETTING_KEYS.proPrice] ?? String(initialProducts.find(p => p.key === 'pro')?.priceMonthly ?? TIERS.professional.monthly),
  )
  const [vipSkuM, setVipSkuM] = useState(
    initialSettings[PRODUCT_SETTING_KEYS.vipSkuM] ?? initialProducts.find(p => p.key === 'vip')?.skuMonthly ?? '',
  )
  const [vipSkuY, setVipSkuY] = useState(
    initialSettings[PRODUCT_SETTING_KEYS.vipSkuY] ?? initialProducts.find(p => p.key === 'vip')?.skuAnnual ?? '',
  )
  const [proSkuM, setProSkuM] = useState(
    initialSettings[PRODUCT_SETTING_KEYS.proSkuM] ?? initialProducts.find(p => p.key === 'pro')?.skuMonthly ?? '',
  )
  const [proSkuY, setProSkuY] = useState(
    initialSettings[PRODUCT_SETTING_KEYS.proSkuY] ?? initialProducts.find(p => p.key === 'pro')?.skuAnnual ?? '',
  )
  const [communitySku, setCommunitySku] = useState(
    initialSettings[PRODUCT_SETTING_KEYS.communitySku] ?? initialProducts.find(p => p.key === 'community')?.skuMonthly ?? '',
  )
  const [busy, setBusy] = useState(false)
  const [flash, setFlash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            [PRODUCT_SETTING_KEYS.vipPrice]: vipPrice,
            [PRODUCT_SETTING_KEYS.proPrice]: proPrice,
            [PRODUCT_SETTING_KEYS.vipSkuM]: vipSkuM,
            [PRODUCT_SETTING_KEYS.vipSkuY]: vipSkuY,
            [PRODUCT_SETTING_KEYS.proSkuM]: proSkuM,
            [PRODUCT_SETTING_KEYS.proSkuY]: proSkuY,
            [PRODUCT_SETTING_KEYS.communitySku]: communitySku,
          },
        }),
      })
      const json = (await res.json().catch(() => ({}))) as {
        error?: string
        products?: MembershipProduct[]
      }
      if (!res.ok) {
        setError(json.error ?? 'Save failed')
        return
      }
      if (json.products) setProducts(json.products)
      setFlash('Membership catalog saved')
      window.setTimeout(() => setFlash(null), 2200)
    } catch {
      setError('Network error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display font-black text-[28px]" style={{ color: 'var(--admin-text-strong)', margin: 0 }}>
            Products & Membership
          </h1>
          <p className="font-condensed text-[12px] mt-0.5" style={{ color: 'var(--admin-text-2)', margin: 0 }}>
            Community FREE · VIP ${TIERS.vip.monthly}/mo · Professional ${TIERS.professional.monthly}/mo — linked to Vendasta SKUs
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {flash && (
            <span
              className="font-condensed font-bold uppercase text-[11px] tracking-wider px-3 py-1.5 rounded"
              style={{ background: 'rgba(10,191,163,0.12)', color: '#0ABFA3' }}
            >
              {flash}
            </span>
          )}
          <a
            href={vendastaMarketplace}
            target="_blank"
            rel="noopener noreferrer"
            className="font-condensed font-bold uppercase text-[11px] tracking-wider px-3 py-2 rounded"
            style={{ border: '1px solid rgba(27,60,90,0.14)', color: 'var(--admin-text)', textDecoration: 'none', minHeight: 40, display: 'inline-flex', alignItems: 'center' }}
          >
            Vendasta marketplace ↗
          </a>
          <a
            href={vendastaCrm}
            target="_blank"
            rel="noopener noreferrer"
            className="font-condensed font-bold uppercase text-[11px] tracking-wider px-3 py-2 rounded"
            style={{ border: '1px solid rgba(27,60,90,0.14)', color: 'var(--admin-text)', textDecoration: 'none', minHeight: 40, display: 'inline-flex', alignItems: 'center' }}
          >
            Vendasta CRM ↗
          </a>
          <Link
            href="/admin/crm"
            className="font-condensed font-bold uppercase text-[11px] tracking-wider px-3 py-2 rounded"
            style={{ background: '#1b3c5a', color: '#fff', textDecoration: 'none', minHeight: 40, display: 'inline-flex', alignItems: 'center' }}
          >
            Prospects CRM →
          </Link>
        </div>
      </div>

      {/* Tier cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {products.map(p => {
          const count = memberCounts[p.key] ?? 0
          return (
            <div
              key={p.key}
              className="rounded-lg overflow-hidden"
              style={{
                background: 'var(--admin-card)',
                border: '1px solid rgba(27,60,90,0.10)',
                borderTop: `3px solid ${p.accent}`,
              }}
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p
                      className="font-condensed font-bold uppercase tracking-[0.16em] text-[11px]"
                      style={{ color: p.accent, margin: 0 }}
                    >
                      {p.label}
                    </p>
                    <p className="font-body text-[13px]" style={{ color: 'var(--admin-text-2)', margin: '4px 0 0' }}>
                      {p.tagline}
                    </p>
                  </div>
                  <span
                    className="font-condensed font-bold text-[11px] px-2 py-0.5 rounded"
                    style={{ background: `${p.accent}18`, color: p.accent }}
                  >
                    {count} members
                  </span>
                </div>
                <p className="font-display font-black text-[36px] leading-none" style={{ color: 'var(--admin-text-strong)', margin: '12px 0 4px' }}>
                  {p.priceMonthly === 0 ? 'Free' : `$${p.priceMonthly}`}
                  {p.priceMonthly > 0 && (
                    <span className="font-condensed font-bold text-[12px] tracking-wider" style={{ color: 'var(--admin-text-2)' }}>/mo</span>
                  )}
                </p>
                {p.priceAnnual != null && p.priceAnnual > 0 && (
                  <p className="font-condensed text-[11px]" style={{ color: 'var(--admin-text-2)', margin: '0 0 12px' }}>
                    Annual option: ${p.priceAnnual}/yr
                  </p>
                )}
                <ul className="mb-4" style={{ margin: '0 0 16px', padding: '0 0 0 16px' }}>
                  {p.features.map(f => (
                    <li key={f} className="font-body text-[13px]" style={{ color: 'var(--admin-text)', marginBottom: 4 }}>
                      {f}
                    </li>
                  ))}
                </ul>
                <div
                  className="pt-3"
                  style={{ borderTop: '1px solid rgba(27,60,90,0.08)' }}
                >
                  <p className="font-condensed font-bold uppercase tracking-[0.12em] text-[10px]" style={{ color: 'var(--admin-text-2)', margin: '0 0 6px' }}>
                    Vendasta SKUs
                  </p>
                  <p className="font-condensed text-[12px] break-all" style={{ color: 'var(--admin-text)', margin: 0 }}>
                    Monthly: {p.skuMonthly || <em style={{ color: 'var(--admin-text-2)' }}>not configured</em>}
                  </p>
                  {p.key !== 'community' && (
                    <p className="font-condensed text-[12px] break-all" style={{ color: 'var(--admin-text)', margin: '4px 0 0' }}>
                      Annual: {p.skuAnnual || <em style={{ color: 'var(--admin-text-2)' }}>not configured</em>}
                    </p>
                  )}
                  <a
                    href={p.vendastaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-condensed font-bold uppercase text-[11px] tracking-wider inline-block mt-2"
                    style={{ color: p.accent, textDecoration: 'none' }}
                  >
                    Open in Vendasta ↗
                  </a>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Edit form */}
      <div
        className="rounded-lg p-5"
        style={{ background: 'var(--admin-card)', border: '1px solid rgba(27,60,90,0.10)' }}
      >
        <h2 className="font-display font-black text-[20px]" style={{ color: 'var(--admin-text-strong)', margin: '0 0 4px' }}>
          Manage pricing & SKUs
        </h2>
        <p className="font-body text-[13px]" style={{ color: 'var(--admin-text-2)', margin: '0 0 16px' }}>
          Overrides save to <code>platform_settings</code>. Empty SKU fields fall back to Railway env vars
          (<code>NEXT_PUBLIC_VENDASTA_MP_*</code>).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Field label="VIP monthly price ($)" value={vipPrice} onChange={setVipPrice} type="number" />
          <Field label="Professional monthly price ($)" value={proPrice} onChange={setProPrice} type="number" />
          <Field label="Community SKU (optional)" value={communitySku} onChange={setCommunitySku} placeholder="VENDASTA_MP_COMMUNITY" />
          <div />
          <Field label="VIP monthly SKU" value={vipSkuM} onChange={setVipSkuM} placeholder="NEXT_PUBLIC_VENDASTA_MP_VIP_M" />
          <Field label="VIP annual SKU" value={vipSkuY} onChange={setVipSkuY} placeholder="NEXT_PUBLIC_VENDASTA_MP_VIP_Y" />
          <Field label="Pro monthly SKU" value={proSkuM} onChange={setProSkuM} placeholder="NEXT_PUBLIC_VENDASTA_MP_PRO_M" />
          <Field label="Pro annual SKU" value={proSkuY} onChange={setProSkuY} placeholder="NEXT_PUBLIC_VENDASTA_MP_PRO_Y" />
        </div>

        {error && (
          <p className="font-body text-[13px] mb-3" style={{ color: '#ef0e30' }}>{error}</p>
        )}

        <button
          type="button"
          disabled={busy}
          onClick={() => void save()}
          className="font-condensed font-bold uppercase tracking-[0.12em] text-[12px] rounded px-5 py-2.5"
          style={{
            background: '#1b3c5a',
            color: '#fff',
            border: 'none',
            cursor: busy ? 'wait' : 'pointer',
            minHeight: 44,
            opacity: busy ? 0.7 : 1,
          }}
        >
          {busy ? 'Saving…' : 'Save membership catalog'}
        </button>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
}) {
  return (
    <div>
      <label
        className="font-condensed font-bold uppercase tracking-[0.14em] text-[10px] block mb-1.5"
        style={{ color: 'var(--admin-text-2)' }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        min={type === 'number' ? 0 : undefined}
        className="w-full font-body text-[13px] rounded px-3 py-2"
        style={{
          minHeight: 40,
          border: '1px solid rgba(27,60,90,0.14)',
          color: 'var(--admin-text)',
          background: 'var(--admin-card)',
        }}
      />
    </div>
  )
}
