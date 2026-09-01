import Link from 'next/link'
import { buildUpgradeHref, tierBadgeLabel, tierPlanName } from '@/lib/academy/gating'

interface PillarLockPanelProps {
  pillarNumber: number
  /** Pillar display name, e.g. "Mental Toughness". */
  pillarLabel: string
  /** courses.required_tier for this pillar. */
  requiredTier: string
  /** Pillar accent color token, e.g. var(--pillar-3). */
  pillarColor: string
  /** One-line pillar promise, reused from the pillar page hero. */
  tagline?: string
  /** Published lesson count, when known — proof there is something behind the gate. */
  lessonCount?: number | null
}

/**
 * SPRINT TIER-1 — what a member sees when they open a pillar above their tier.
 *
 * This is a STOREFRONT, not a 404 and not a redirect. The previous behaviour
 * (redirect('/pricing')) threw away the context of which pillar was wanted,
 * landing everyone on the same generic ladder. Here the member sees the pillar
 * name, its color, what it covers, and exactly which plan opens it.
 *
 * Server component — no interactivity beyond two links, so nothing ships to
 * the client. Colors are tokens only; readable in both themes.
 */
export function PillarLockPanel({
  pillarNumber,
  pillarLabel,
  requiredTier,
  pillarColor,
  tagline,
  lessonCount,
}: PillarLockPanelProps) {
  const badge = tierBadgeLabel(requiredTier)
  const planName = tierPlanName(requiredTier)
  const href = buildUpgradeHref({ from: 'academy', tier: requiredTier, pillar: pillarNumber })

  return (
    <section
      style={{
        backgroundColor: 'var(--bg-surface)',
        padding: '72px clamp(24px, 8vw, 96px)',
        borderTop: '1px solid var(--border-color)',
      }}
    >
      <div
        style={{
          maxWidth: 560,
          margin: '0 auto',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 18,
        }}
      >
        {/* Tier chip — the answer to "what opens this?" */}
        {badge && (
          <span
            className="font-condensed font-bold uppercase"
            style={{
              fontSize: 12,
              letterSpacing: '0.2em',
              padding: '6px 14px',
              color: 'var(--text-primary)',
              backgroundColor: 'var(--bg-elevated)',
              border: `1px solid ${pillarColor}`,
            }}
          >
            {badge} Pillar
          </span>
        )}

        <h2
          className="font-condensed font-black uppercase"
          style={{
            fontSize: 'clamp(26px, 4vw, 36px)',
            lineHeight: 1.05,
            letterSpacing: '0.02em',
            color: 'var(--text-primary)',
            margin: 0,
          }}
        >
          Pillar {pillarNumber} — {pillarLabel}
        </h2>

        {tagline && (
          <p
            className="font-body"
            style={{ fontSize: 15, lineHeight: 1.65, color: 'var(--text-secondary)', margin: 0 }}
          >
            {tagline}
          </p>
        )}

        <p
          className="font-body"
          style={{ fontSize: 15, lineHeight: 1.65, color: 'var(--text-secondary)', margin: 0 }}
        >
          {typeof lessonCount === 'number' && lessonCount > 0
            ? `${lessonCount} ${lessonCount === 1 ? 'lesson' : 'lessons'} in this pillar, unlocked with `
            : 'This pillar is unlocked with '}
          <strong style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{planName}</strong>.
        </p>

        <Link
          href={href}
          className="font-condensed font-bold uppercase ep-pressable ep-touch-target"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 13,
            letterSpacing: '0.14em',
            padding: '14px 28px',
            minHeight: 48,
            textDecoration: 'none',
            color: 'var(--text-primary)',
            backgroundColor: 'var(--bg-elevated)',
            border: `1px solid ${pillarColor}`,
          }}
        >
          Unlock with {planName} →
        </Link>

        <Link
          href="/academy"
          className="font-condensed font-bold uppercase"
          style={{
            fontSize: 12,
            letterSpacing: '0.15em',
            textDecoration: 'none',
            color: 'var(--text-tertiary)',
          }}
        >
          ← All pillars
        </Link>
      </div>
    </section>
  )
}
