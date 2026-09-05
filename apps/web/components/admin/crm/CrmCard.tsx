'use client'

import type { CrmProspect, CrmStage } from '@/lib/admin/crm'
import {
  CRM_STAGE_META,
  CRM_TAG_DISPLAY_LIMIT,
  communityUpgradeTargets,
  followUpLabel,
  formatMoney,
  nextUpgradeStage,
  prospectInitials,
  prospectValue,
  relativeContact,
} from '@/lib/admin/crm'

export type { CrmProspect }

interface CrmCardProps {
  prospect: CrmProspect
  onMarkContacted: (id: string) => void
  onUpgrade: (id: string, to: CrmStage) => void
  onEdit: (prospect: CrmProspect) => void
  busy?: boolean
}

export function CrmCard({
  prospect,
  onMarkContacted,
  onUpgrade,
  onEdit,
  busy = false,
}: CrmCardProps) {
  const meta = CRM_STAGE_META[prospect.stage]
  const value = prospectValue(prospect)
  const follow = followUpLabel(prospect.next_follow_up_at)
  const genericUpgrade = nextUpgradeStage(prospect.stage)
  const communityUpgrades =
    prospect.stage === 'community' ? communityUpgradeTargets() : []

  const mailto = `mailto:${encodeURIComponent(prospect.email)}?subject=${encodeURIComponent(
    `Evolved Pros — following up with ${prospect.full_name.split(' ')[0] ?? ''}`,
  )}`

  // Suppressed prospects stay visible (they're still pipeline) but read as
  // inert, so nobody reaches for Email on a contact they must not email.
  const unsubscribed = !!prospect.unsubscribed_at
  // title · company — either half may be missing.
  const subtitle = [prospect.title, prospect.company].filter(Boolean).join(' · ')
  const shownTags = prospect.tags.slice(0, CRM_TAG_DISPLAY_LIMIT)
  const overflowTags = prospect.tags.length - shownTags.length

  return (
    <article
      className="rounded-md mb-2 transition-shadow"
      style={{
        background: 'var(--admin-card)',
        border: '1px solid var(--border-color, rgba(27,60,90,0.10))',
        borderLeft: `3px solid ${unsubscribed ? 'var(--admin-border)' : meta.accent}`,
        opacity: busy ? 0.55 : unsubscribed ? 0.72 : 1,
        boxShadow: '0 1px 0 rgba(17,37,53,0.04)',
      }}
    >
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <button
            type="button"
            onClick={() => onEdit(prospect)}
            className="text-left min-w-0 flex items-start gap-2"
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
          >
            <ProspectAvatar prospect={prospect} accent={meta.accent} muted={unsubscribed} />
            <span className="min-w-0">
              <p
                className="font-body font-semibold text-[13px] leading-snug truncate"
                style={{
                  color: unsubscribed ? 'var(--admin-text-2)' : 'var(--admin-text)',
                  margin: 0,
                  textDecoration: unsubscribed ? 'line-through' : 'none',
                }}
              >
                {prospect.full_name}
              </p>
              {subtitle && (
                <p
                  className="font-condensed text-[11px] truncate mt-0.5"
                  style={{ color: 'var(--admin-text-2)', margin: 0 }}
                >
                  {subtitle}
                </p>
              )}
            </span>
          </button>
          <span className="flex flex-col items-end gap-1 shrink-0">
            {prospect.status !== 'active' && (
              <span
                className="font-condensed font-bold uppercase text-[9px] tracking-wider px-1.5 py-0.5 rounded"
                style={{ background: meta.accentSoft, color: meta.accent }}
              >
                {prospect.status}
              </span>
            )}
            {prospect.keynote_interest && (
              <span
                className="font-condensed font-bold uppercase text-[9px] tracking-wider px-1.5 py-0.5 rounded inline-flex items-center gap-1"
                style={{
                  background: 'var(--admin-subtle)',
                  color: 'var(--brand-gold)',
                  border: '1px solid var(--admin-border)',
                }}
                title="Interested in a keynote"
              >
                <MicIcon />
                Keynote
              </span>
            )}
            {unsubscribed && (
              <span
                className="font-condensed font-bold uppercase text-[9px] tracking-wider px-1.5 py-0.5 rounded"
                style={{
                  background: 'var(--admin-subtle)',
                  color: 'var(--admin-text-2)',
                  border: '1px solid var(--admin-border)',
                }}
                title="Suppressed — do not email"
              >
                Unsubscribed
              </span>
            )}
          </span>
        </div>

        {prospect.email ? (
          <a
            href={mailto}
            className="font-condensed text-[12px] block truncate mb-2 hover:underline"
            style={{ color: 'var(--admin-text-2)' }}
            onClick={e => e.stopPropagation()}
          >
            {prospect.email}
          </a>
        ) : prospect.phone ? (
          <p
            className="font-condensed text-[12px] truncate mb-2"
            style={{ color: 'var(--admin-text-2)', margin: '0 0 8px' }}
          >
            {prospect.phone}
          </p>
        ) : null}

        {prospect.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {shownTags.map(tag => (
              <span
                key={tag}
                className="font-condensed uppercase text-[9px] tracking-wider px-1.5 py-0.5 rounded"
                style={{
                  background: 'var(--admin-subtle)',
                  color: 'var(--admin-text-2)',
                  border: '1px solid var(--admin-border)',
                }}
              >
                {tag}
              </span>
            ))}
            {overflowTags > 0 && (
              <span
                className="font-condensed font-bold uppercase text-[9px] tracking-wider px-1.5 py-0.5 rounded"
                style={{ color: 'var(--admin-text-2)' }}
                title={prospect.tags.join(', ')}
              >
                +{overflowTags}
              </span>
            )}
          </div>
        )}

        {/* Field grid: Stage · Value · Last Contacted · Next Follow-up */}
        <div
          className="grid grid-cols-2 gap-x-2 gap-y-1.5 mb-2"
          style={{
            padding: '8px 0',
            borderTop: '1px solid var(--border-color, rgba(27,60,90,0.08))',
            borderBottom: '1px solid var(--border-color, rgba(27,60,90,0.08))',
          }}
        >
          <Field label="Stage" value={meta.label} color={meta.accent} />
          <Field
            label="Value"
            value={value === 0 ? 'Free' : `${formatMoney(value)}/mo`}
            color={value > 0 ? '#C9A84C' : undefined}
          />
          <Field label="Last contacted" value={relativeContact(prospect.last_contacted_at)} />
          <Field
            label="Next follow-up"
            value={follow.text}
            color={follow.overdue ? '#ef0e30' : undefined}
          />
        </div>

        {prospect.notes && (
          <p
            className="font-body text-[12px] leading-snug mb-2 line-clamp-2"
            style={{ color: 'var(--admin-text-2)', margin: '0 0 8px' }}
          >
            {prospect.notes}
          </p>
        )}

        {/* Quick actions */}
        <div
          className="flex flex-wrap gap-1.5"
          onClick={e => e.stopPropagation()}
          onPointerDown={e => e.stopPropagation()}
        >
          {unsubscribed ? (
            <span
              className="crm-qa"
              style={{
                ...qaStyle('var(--admin-text-2)', 'var(--admin-border)'),
                cursor: 'not-allowed',
                opacity: 0.7,
              }}
              title="Suppressed — this prospect has unsubscribed"
              aria-disabled="true"
            >
              No email
            </span>
          ) : (
            <a href={mailto} className="crm-qa" style={qaStyle(meta.accent)} title="Send email">
              Email
            </a>
          )}
          <button
            type="button"
            className="crm-qa"
            style={qaStyle('#68a2b9')}
            disabled={busy}
            onClick={() => onMarkContacted(prospect.id)}
            title="Mark as contacted"
          >
            Contacted
          </button>

          {/* Community → VIP / Professional quick upgrades */}
          {communityUpgrades.length > 0 ? (
            communityUpgrades.map(to => (
              <button
                key={to}
                type="button"
                className="crm-qa"
                style={qaStyle(CRM_STAGE_META[to].accent)}
                disabled={busy}
                onClick={() => onUpgrade(prospect.id, to)}
                title={`Upgrade to ${CRM_STAGE_META[to].label} (${CRM_STAGE_META[to].desc})`}
              >
                → {CRM_STAGE_META[to].label}
              </button>
            ))
          ) : (
            genericUpgrade && (
              <button
                type="button"
                className="crm-qa"
                style={qaStyle('#C9A84C')}
                disabled={busy}
                onClick={() => onUpgrade(prospect.id, genericUpgrade)}
                title={`Move to ${CRM_STAGE_META[genericUpgrade].label}`}
              >
                Upgrade
              </button>
            )
          )}
        </div>
      </div>
    </article>
  )
}

function Field({
  label,
  value,
  color,
}: {
  label: string
  value: string
  color?: string
}) {
  return (
    <div style={{ minWidth: 0 }}>
      <p
        className="font-condensed font-bold uppercase tracking-[0.12em]"
        style={{
          margin: 0,
          fontSize: 9,
          color: 'var(--admin-text-2)',
        }}
      >
        {label}
      </p>
      <p
        className="font-condensed font-semibold truncate"
        style={{
          margin: '2px 0 0',
          fontSize: 12,
          // Token, not a literal navy — the old fallback was invisible on the
          // dark admin surface.
          color: color ?? 'var(--admin-text)',
        }}
      >
        {value}
      </p>
    </div>
  )
}

/**
 * Round 28px avatar with an initials fallback. Only http(s) URLs reach this —
 * the API rejects anything else — so the src is always a safe scheme.
 */
function ProspectAvatar({
  prospect,
  accent,
  muted,
}: {
  prospect: CrmProspect
  accent: string
  muted: boolean
}) {
  const base: React.CSSProperties = {
    width: 28,
    height: 28,
    borderRadius: '50%',
    flexShrink: 0,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    border: '1px solid var(--admin-border)',
    filter: muted ? 'grayscale(1)' : undefined,
  }

  if (prospect.avatar_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={prospect.avatar_url}
        alt=""
        aria-hidden="true"
        loading="lazy"
        style={{ ...base, objectFit: 'cover', display: 'block' }}
      />
    )
  }

  return (
    <span
      aria-hidden="true"
      style={{
        ...base,
        background: 'var(--admin-subtle)',
        color: muted ? 'var(--admin-text-2)' : accent,
        fontFamily: '"Barlow Condensed", sans-serif',
        fontWeight: 700,
        fontSize: 11,
        letterSpacing: '0.04em',
      }}
    >
      {prospectInitials(prospect.full_name)}
    </span>
  )
}

function MicIcon() {
  return (
    <svg
      aria-hidden="true"
      width="8"
      height="8"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
    </svg>
  )
}

function qaStyle(color: string, borderColor?: string): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 28,
    padding: '4px 8px',
    fontFamily: '"Barlow Condensed", sans-serif',
    fontWeight: 700,
    fontSize: 10,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color,
    background: 'transparent',
    border: `1px solid ${borderColor ?? `${color}55`}`,
    borderRadius: 3,
    cursor: 'pointer',
    textDecoration: 'none',
  }
}
