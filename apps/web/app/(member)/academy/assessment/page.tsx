import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { fetchUserProfile } from '@/lib/academy/fetchers'
import { fetchPillarAssessment } from '@/lib/academy/assessment'
import { hasTierAccess } from '@/lib/tier'
import {
  buildUpgradeHref,
  overallScore,
  selectWeakestPillar,
  tierBadgeLabel,
  tierPlanName,
} from '@/lib/academy/gating'
import { PILLAR_CONFIG } from '@/lib/pillar-colors'

export const metadata: Metadata = { title: 'Pillar Assessment — Evolved Pros' }
export const dynamic = 'force-dynamic'

/**
 * SPRINT TIER-1 — the six-pillar assessment results.
 *
 * The scores were being written (PillarAudit → POST /api/pillar-audit) with no
 * surface that read them back together, so nobody ever saw their own shape
 * across the six pillars. This is that read view — a minimal results page fed
 * by the existing pillar_audits data. No new assessment was built.
 *
 * The tier line, per the approved model:
 *   - EVERY member, free included, sees their REAL six scores and overall.
 *     The assessment is the free tier's headline feature; a fake or blurred
 *     number here would poison the one thing that has to be trustworthy.
 *   - The prescription (the personal pillar plan) is VIP+. It renders as a
 *     labelled, visible-but-locked section — a member can see exactly what
 *     they are not getting, which is the point.
 *
 * The audits themselves are taken on the pillar pages, which are tier-gated.
 * Free members can therefore only score Pillar 1 today; the un-scored pillars
 * render as "Not taken yet" and link to the pillar (locked pillars land on
 * their upgrade panel). That is the funnel working as intended, not a bug.
 */
export default async function AssessmentResultsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await fetchUserProfile(supabase, user.id)

  // pillar_audits.user_id stores the AUTH uuid (it FKs auth.users), unlike
  // lesson_progress which stores public.users.id. See lib/academy/assessment.
  const pillars = await fetchPillarAssessment(user.id)

  const overall = overallScore(pillars)
  const weakest = selectWeakestPillar(pillars)
  const weakestPillar = weakest ? pillars.find(p => p.pillarNumber === weakest.pillarNumber) : null
  const scoredCount = pillars.filter(p => p.score != null).length

  // The plan section is VIP+. hasTierAccess, never a string compare.
  const canSeePlan = hasTierAccess(profile?.tier, 'vip')

  return (
    <div className="ep-surface-mobile" style={{ backgroundColor: 'var(--bg-page)', minHeight: '100%' }}>
      {/* Header */}
      <div
        className="px-4 md:px-8 py-5 sm:py-6"
        style={{ borderBottom: '1px solid var(--border-color)' }}
      >
        <p
          className="font-condensed font-bold uppercase tracking-[0.14em] text-[10px] mb-1"
          /* --pillar-6-ink is the light-mode-safe teal (AA on parchment); it is
             undefined in dark, where the fallback --brand-teal applies. Raw
             --brand-teal alone reads at roughly 2.4:1 in light mode. */
          style={{ color: 'var(--pillar-6-ink, var(--brand-teal))' }}
        >
          The Evolved Architecture™
        </p>
        <h1 className="font-display font-black leading-tight ep-fluid-title" style={{ color: 'var(--text-primary)' }}>
          Your Pillar Assessment
        </h1>
        <p className="font-body text-[14px] mt-1" style={{ color: 'var(--text-secondary)' }}>
          Where you stand across the six pillars — scored from your own audits.
        </p>
      </div>

      <div className="px-4 md:px-8 py-5 sm:py-6" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* ── Overall ────────────────────────────────────────────────── */}
        <section
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'baseline',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <p
              className="font-condensed font-bold uppercase tracking-[0.18em] text-[10px]"
              style={{ color: 'var(--text-tertiary)', margin: 0 }}
            >
              Overall
            </p>
            <p
              className="font-condensed font-black leading-none"
              style={{ fontSize: 48, color: 'var(--text-primary)', margin: '4px 0 0' }}
            >
              {overall ?? '—'}
              {overall != null && (
                <span className="font-condensed font-bold" style={{ fontSize: 18, color: 'var(--text-tertiary)' }}>
                  {' '}/ 100
                </span>
              )}
            </p>
          </div>
          <p className="font-body text-[13px]" style={{ color: 'var(--text-secondary)', margin: 0 }}>
            {scoredCount === 0
              ? 'No pillars scored yet. Take the audit at the bottom of any pillar page to start.'
              : `Averaged across ${scoredCount} of 6 pillars you have audited.`}
          </p>
        </section>

        {/* ── Six pillar scores — every member, every tier ───────────── */}
        <section>
          <h2
            className="font-condensed font-bold uppercase tracking-[0.18em] text-[10px] mb-3"
            style={{ color: 'var(--text-tertiary)' }}
          >
            The Six Pillars
          </h2>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
            {pillars.map(p => {
              const color = PILLAR_CONFIG[p.pillarNumber]?.color ?? 'var(--brand-teal)'
              const accessible = hasTierAccess(profile?.tier, p.requiredTier)
              const badge = tierBadgeLabel(p.requiredTier)
              return (
                <li
                  key={p.pillarNumber}
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    borderLeft: `3px solid ${color}`,
                    padding: '14px 16px',
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    gap: 12,
                    alignItems: 'center',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <p
                      className="font-condensed font-bold uppercase tracking-[0.12em] text-[13px]"
                      style={{ color: 'var(--text-primary)', margin: 0 }}
                    >
                      <span style={{ color: `var(--pillar-${p.pillarNumber}-ink, var(--pillar-${p.pillarNumber}))` }}>
                        {String(p.pillarNumber).padStart(2, '0')}
                      </span>{' '}
                      {p.label}
                      {!accessible && badge && (
                        <span
                          className="font-condensed font-bold uppercase tracking-[0.16em] text-[9px]"
                          style={{
                            marginLeft: 8,
                            padding: '2px 6px',
                            color: `var(--pillar-${p.pillarNumber}-ink, var(--pillar-${p.pillarNumber}))`,
                            border: '1px solid var(--border-color)',
                          }}
                        >
                          {badge}
                        </span>
                      )}
                    </p>
                    {/* Score bar */}
                    <div
                      style={{
                        marginTop: 8,
                        height: 4,
                        backgroundColor: 'var(--bg-elevated)',
                        overflow: 'hidden',
                      }}
                      role="progressbar"
                      aria-valuenow={p.score ?? 0}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${p.label} score`}
                    >
                      <div style={{ height: '100%', width: `${p.score ?? 0}%`, backgroundColor: color }} />
                    </div>
                  </div>
                  <p
                    className="font-condensed font-black leading-none"
                    style={{ fontSize: 24, color: p.score == null ? 'var(--text-tertiary)' : 'var(--text-primary)', margin: 0 }}
                  >
                    {p.score ?? '—'}
                  </p>
                </li>
              )
            })}
          </ul>
        </section>

        {/* ── Weakest-pillar CTA banner ──────────────────────────────── */}
        {weakestPillar && (
          <section
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderTop: `3px solid ${PILLAR_CONFIG[weakestPillar.pillarNumber]?.color ?? 'var(--brand-teal)'}`,
              padding: '20px 24px',
              display: 'flex',
              gap: 16,
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ minWidth: 0 }}>
              <p
                className="font-condensed font-bold uppercase tracking-[0.18em] text-[10px]"
                style={{ color: 'var(--text-tertiary)', margin: '0 0 4px' }}
              >
                Your weakest pillar
              </p>
              <p
                className="font-condensed font-black uppercase"
                style={{ fontSize: 22, letterSpacing: '0.02em', color: 'var(--text-primary)', margin: 0 }}
              >
                {weakestPillar.label} — {weakestPillar.score}
              </p>
              <p className="font-body text-[13px]" style={{ color: 'var(--text-secondary)', margin: '6px 0 0' }}>
                {hasTierAccess(profile?.tier, weakestPillar.requiredTier)
                  ? 'This pillar is already open to you. Start there.'
                  : `Pillar ${weakestPillar.pillarNumber} opens with ${tierPlanName(weakestPillar.requiredTier)}.`}
              </p>
            </div>
            <Link
              href={
                hasTierAccess(profile?.tier, weakestPillar.requiredTier)
                  ? '/academy'
                  : buildUpgradeHref({
                      from: 'assessment',
                      tier: weakestPillar.requiredTier,
                      pillar: weakestPillar.pillarNumber,
                    })
              }
              className="font-condensed font-bold uppercase ep-pressable ep-touch-target"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 12,
                letterSpacing: '0.14em',
                padding: '12px 24px',
                minHeight: 44,
                textDecoration: 'none',
                color: 'var(--text-primary)',
                backgroundColor: 'var(--bg-elevated)',
                border: `1px solid ${PILLAR_CONFIG[weakestPillar.pillarNumber]?.color ?? 'var(--brand-teal)'}`,
              }}
            >
              {hasTierAccess(profile?.tier, weakestPillar.requiredTier)
                ? `Go to ${weakestPillar.label} →`
                : `Unlock with ${tierPlanName(weakestPillar.requiredTier)} →`}
            </Link>
          </section>
        )}

        {/* ── Personal pillar plan — VIP+ ────────────────────────────── */}
        <section
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            padding: '20px 24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h2
              className="font-condensed font-bold uppercase tracking-[0.18em] text-[10px]"
              style={{ color: 'var(--text-tertiary)', margin: 0 }}
            >
              Your Personal Pillar Plan
            </h2>
            {!canSeePlan && (
              <span
                className="font-condensed font-black uppercase tracking-[0.16em] text-[9px]"
                style={{
                  padding: '2px 6px',
                  color: 'var(--pillar-5-ink, var(--pillar-5))',
                  border: '1px solid var(--border-color)',
                }}
              >
                VIP
              </span>
            )}
          </div>

          {canSeePlan ? (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {scoredCount === 0 ? (
                <p className="font-body text-[14px]" style={{ color: 'var(--text-secondary)', margin: 0 }}>
                  Take the audit on any pillar page and your plan builds itself from the scores.
                </p>
              ) : (
                // Full breakdown, ordered weakest-first: the prescription is
                // "work these in this order", which is exactly the score
                // ordering. Ties resolve to the earlier pillar (same rule as
                // selectWeakestPillar) so the order is stable between visits.
                [...pillars]
                  .filter(p => p.score != null)
                  .sort((a, b) => (a.score! - b.score!) || (a.pillarNumber - b.pillarNumber))
                  .map((p, i) => (
                    <div
                      key={p.pillarNumber}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'auto 1fr',
                        gap: 12,
                        alignItems: 'baseline',
                        paddingBottom: 10,
                        borderBottom: '1px solid var(--border-color)',
                      }}
                    >
                      <span
                        className="font-condensed font-black"
                        style={{ fontSize: 18, color: `var(--pillar-${p.pillarNumber}-ink, var(--pillar-${p.pillarNumber}))` }}
                      >
                        {i + 1}
                      </span>
                      <p className="font-body text-[14px]" style={{ color: 'var(--text-secondary)', margin: 0 }}>
                        <strong style={{ color: 'var(--text-primary)' }}>{p.label}</strong> — scored {p.score}.
                        {i === 0
                          ? ' Start here: this is the constraint holding the rest back.'
                          : ' Work this after the pillar above it.'}
                      </p>
                    </div>
                  ))
              )}
            </div>
          ) : (
            /* Visible-but-gated: the member sees the section exists and what
               it contains, not a blank space or a 404. */
            <div style={{ marginTop: 12 }}>
              <p className="font-body text-[14px]" style={{ color: 'var(--text-secondary)', margin: '0 0 12px' }}>
                VIP turns these six numbers into an ordered plan: the full assessment breakdown,
                which pillar is the real constraint, and what to work in what order.
              </p>
              <Link
                href={buildUpgradeHref({ from: 'assessment', tier: 'vip' })}
                className="font-condensed font-bold uppercase ep-pressable ep-touch-target"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 12,
                  letterSpacing: '0.14em',
                  padding: '12px 24px',
                  minHeight: 44,
                  textDecoration: 'none',
                  color: 'var(--text-primary)',
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-color)',
                }}
              >
                Unlock with VIP →
              </Link>
            </div>
          )}
        </section>

        <Link
          href="/academy"
          className="font-condensed font-bold uppercase"
          style={{ fontSize: 12, letterSpacing: '0.15em', color: 'var(--text-tertiary)', textDecoration: 'none' }}
        >
          ← Back to the Academy
        </Link>
      </div>
    </div>
  )
}
