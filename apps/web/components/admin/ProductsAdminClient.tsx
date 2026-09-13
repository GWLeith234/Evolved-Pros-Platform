'use client'

import { useMemo, useState } from 'react'
import type { CatalogueProduct } from '@/lib/commerce/catalogue'
import { OwnerOnlyBadge } from '@/components/admin/safety/OwnerOnlyBadge'
import { CONFIRM } from '@/components/admin/safety/confirmCopy'
import { useConfirmDialog } from '@/components/admin/safety/useConfirmDialog'
import { AdminButton, AdminPageHeader } from '@/components/admin/template'

// SPRINT I Phase 2. Admin Products screen driven by our own products/prices
// catalogue (source of truth). Edit amounts / active / Stripe price-id links,
// then mirror the catalogue to Stripe. No legacy-vendor coupling.

interface ProductsAdminClientProps {
  initialProducts: CatalogueProduct[]
  memberCounts: Record<string, number>
  stripeConfigured: boolean
}

interface PriceDraft {
  amount: string // dollars, as typed
  stripe: string
  active: boolean
}

const TIER_ACCENT: Record<string, string> = {
  community: '#0ABFA3',
  vip: '#C9A84C',
  pro: '#C9302A',
}
const NAVY = '#1B2A4A'
const RED = '#C9302A'
const GREEN = '#15803d'

function buildPriceDrafts(products: CatalogueProduct[]): Record<string, PriceDraft> {
  const out: Record<string, PriceDraft> = {}
  for (const p of products) {
    for (const pr of p.prices) {
      out[pr.id] = {
        amount: (pr.unit_amount / 100).toString(),
        stripe: pr.stripe_price_id ?? '',
        active: pr.active,
      }
    }
  }
  return out
}

function toCents(amount: string): number | null {
  const n = Number.parseFloat(amount)
  if (!Number.isFinite(n) || n < 0) return null
  return Math.round(n * 100)
}

export function ProductsAdminClient({
  initialProducts,
  memberCounts,
  stripeConfigured,
}: ProductsAdminClientProps) {
  const [products, setProducts] = useState(initialProducts)
  const [priceDrafts, setPriceDrafts] = useState<Record<string, PriceDraft>>(() =>
    buildPriceDrafts(initialProducts),
  )
  const [productActive, setProductActive] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(initialProducts.map(p => [p.id, p.active])),
  )
  const [busy, setBusy] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [flash, setFlash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { confirm, dialog } = useConfirmDialog()

  function reset(next: CatalogueProduct[]) {
    setProducts(next)
    setPriceDrafts(buildPriceDrafts(next))
    setProductActive(Object.fromEntries(next.map(p => [p.id, p.active])))
  }

  const dirty = useMemo(() => {
    for (const p of products) {
      if ((productActive[p.id] ?? p.active) !== p.active) return true
      for (const pr of p.prices) {
        const d = priceDrafts[pr.id]
        if (!d) continue
        if (toCents(d.amount) !== pr.unit_amount) return true
        if (d.stripe.trim() !== (pr.stripe_price_id ?? '')) return true
        if (d.active !== pr.active) return true
      }
    }
    return false
  }, [products, priceDrafts, productActive])

  async function save() {
    if (!(await confirm(CONFIRM.saveCatalogue()))) return
    setBusy(true)
    setError(null)
    setFlash(null)
    try {
      const priceUpdates: Array<{ id: string; unit_amount?: number; active?: boolean; stripe_price_id?: string | null }> = []
      for (const p of products) {
        for (const pr of p.prices) {
          const d = priceDrafts[pr.id]
          if (!d) continue
          const cents = toCents(d.amount)
          const patch: { id: string; unit_amount?: number; active?: boolean; stripe_price_id?: string | null } = { id: pr.id }
          let changed = false
          if (cents != null && cents !== pr.unit_amount) { patch.unit_amount = cents; changed = true }
          if (d.active !== pr.active) { patch.active = d.active; changed = true }
          if (d.stripe.trim() !== (pr.stripe_price_id ?? '')) { patch.stripe_price_id = d.stripe.trim() || null; changed = true }
          if (changed) priceUpdates.push(patch)
        }
      }
      const productUpdates = products
        .filter(p => (productActive[p.id] ?? p.active) !== p.active)
        .map(p => ({ id: p.id, active: productActive[p.id] }))

      if (priceUpdates.length === 0 && productUpdates.length === 0) {
        setBusy(false)
        return
      }

      const res = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceUpdates, productUpdates }),
      })
      const json = (await res.json().catch(() => ({}))) as { error?: string; products?: CatalogueProduct[] }
      if (!res.ok) {
        setError(json.error ?? 'Save failed')
        return
      }
      if (json.products) reset(json.products)
      setFlash('Catalogue saved')
      window.setTimeout(() => setFlash(null), 2200)
    } catch {
      setError('Network error')
    } finally {
      setBusy(false)
    }
  }

  async function syncStripe() {
    if (!(await confirm(CONFIRM.syncStripe()))) return
    setSyncing(true)
    setError(null)
    setFlash(null)
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync-stripe' }),
      })
      const json = (await res.json().catch(() => ({}))) as {
        error?: string
        products?: CatalogueProduct[]
        result?: { productsCreated: number; pricesCreated: number }
      }
      if (!res.ok) {
        setError(json.error ?? 'Sync failed')
        return
      }
      if (json.products) reset(json.products)
      const r = json.result
      setFlash(
        r ? `Stripe sync: ${r.productsCreated} product(s), ${r.pricesCreated} price(s) created` : 'Synced to Stripe',
      )
      window.setTimeout(() => setFlash(null), 3200)
    } catch {
      setError('Network error')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div>
      {dialog}
      <AdminPageHeader
        title="Products & Membership"
        subline="Our own catalogue. Source of truth, mirrored to Stripe. Amounts in USD."
        secondary={
          <span className="inline-flex flex-wrap items-center gap-2">
            {flash && (
              <span
                className="font-condensed font-bold uppercase text-[11px] tracking-wider px-3 py-1.5"
                style={{ background: 'rgba(21,128,61,0.12)', color: GREEN }}
              >
                {flash}
              </span>
            )}
            <span
              className={`ep-admin-el-chip ${stripeConfigured ? 'ep-admin-el-chip--teal' : 'ep-admin-el-chip--pink'}`}
              title={stripeConfigured ? 'STRIPE_SECRET_KEY is set' : 'STRIPE_SECRET_KEY is not set'}
            >
              {stripeConfigured ? 'Stripe connected' : 'Stripe not configured'}
            </span>
            <OwnerOnlyBadge />
          </span>
        }
        primary={
          <AdminButton
            type="button"
            disabled={syncing || !stripeConfigured}
            onClick={() => void syncStripe()}
          >
            {syncing ? 'Syncing…' : 'Sync to Stripe'}
          </AdminButton>
        }
      />

      {/* Product cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {products.map(p => {
          const accent = p.tier ? TIER_ACCENT[p.tier] ?? NAVY : NAVY
          const count = p.tier ? memberCounts[p.tier] ?? 0 : null
          const isActive = productActive[p.id] ?? p.active
          return (
            <div
              key={p.id}
              className="rounded-lg overflow-hidden"
              style={{
                background: 'var(--admin-card)',
                border: '1px solid var(--admin-border)',
                borderTop: `3px solid ${accent}`,
                opacity: isActive ? 1 : 0.6,
              }}
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="font-condensed font-bold uppercase tracking-[0.16em] text-[11px]" style={{ color: accent, margin: 0 }}>
                      {p.name}
                    </p>
                    <p className="font-body text-[13px]" style={{ color: 'var(--admin-text-2)', margin: '4px 0 0' }}>
                      {p.description ?? p.kind}
                    </p>
                  </div>
                  {count != null && (
                    <span className="font-condensed font-bold text-[11px] px-2 py-0.5 rounded whitespace-nowrap" style={{ background: `${accent}18`, color: accent }}>
                      {count} {count === 1 ? 'member' : 'members'}
                    </span>
                  )}
                </div>

                {/* Prices */}
                {p.prices.length === 0 ? (
                  <p className="font-display font-black text-[28px] leading-none" style={{ color: 'var(--admin-text-strong)', margin: '8px 0 4px' }}>
                    Free
                  </p>
                ) : (
                  <div className="space-y-3">
                    {p.prices.map(pr => {
                      const d = priceDrafts[pr.id] ?? { amount: '', stripe: '', active: pr.active }
                      return (
                        <div key={pr.id} className="pt-3" style={{ borderTop: '1px solid var(--admin-border)' }}>
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="font-condensed font-bold uppercase tracking-[0.12em] text-[10px]" style={{ color: 'var(--admin-text-2)' }}>
                              {pr.interval === 'one_time' ? 'One-time' : pr.interval === 'year' ? 'Annual' : 'Monthly'}
                            </span>
                            <label className="flex items-center gap-1.5 font-condensed text-[11px]" style={{ color: 'var(--admin-text-2)' }}>
                              <input
                                type="checkbox"
                                checked={d.active}
                                onChange={e => setPriceDrafts(s => ({ ...s, [pr.id]: { ...d, active: e.target.checked } }))}
                              />
                              Active
                            </label>
                          </div>
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span className="font-display font-black text-[20px]" style={{ color: 'var(--admin-text-strong)' }}>$</span>
                            <input
                              type="number"
                              min={0}
                              step="1"
                              value={d.amount}
                              onChange={e => setPriceDrafts(s => ({ ...s, [pr.id]: { ...d, amount: e.target.value } }))}
                              className="w-28 font-body text-[14px] rounded px-2 py-1.5"
                              style={{ border: '1px solid var(--admin-border)', color: 'var(--admin-text)', background: 'var(--admin-card)' }}
                            />
                            <span className="font-condensed text-[11px]" style={{ color: 'var(--admin-text-2)' }}>
                              /{pr.interval === 'year' ? 'yr' : pr.interval === 'one_time' ? 'once' : 'mo'}
                            </span>
                          </div>
                          <input
                            type="text"
                            value={d.stripe}
                            placeholder="Stripe price id (price_…)"
                            onChange={e => setPriceDrafts(s => ({ ...s, [pr.id]: { ...d, stripe: e.target.value } }))}
                            className="w-full font-condensed text-[11px] rounded px-2 py-1.5"
                            style={{ border: '1px solid var(--admin-border)', color: 'var(--admin-text)', background: 'var(--admin-card)' }}
                          />
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Product active toggle */}
                <label className="flex items-center gap-2 mt-4 pt-3 font-condensed text-[12px]" style={{ borderTop: '1px solid var(--admin-border)', color: 'var(--admin-text-2)' }}>
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={e => setProductActive(s => ({ ...s, [p.id]: e.target.checked }))}
                  />
                  Product active
                </label>
                {p.stripe_product_id && (
                  <p className="font-condensed text-[10px] mt-1.5 break-all" style={{ color: 'var(--admin-text-2)' }}>
                    Stripe: {p.stripe_product_id}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Save bar */}
      <div className="flex flex-wrap items-center gap-3">
        <AdminButton
          variant="primary"
          type="button"
          disabled={busy || !dirty}
          onClick={() => void save()}
        >
          {busy ? 'Saving…' : 'Save catalogue'}
        </AdminButton>
        <p className="font-condensed text-[12px]" style={{ color: 'var(--admin-text-2)' }}>
          {dirty ? 'Dirty. Save enabled. Sync still asks for confirm.' : 'Disabled until a price or active flag changes.'}
        </p>
        {error && <span className="font-body text-[13px]" style={{ color: RED }}>{error}</span>}
      </div>
    </div>
  )
}
