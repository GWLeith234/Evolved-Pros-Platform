'use client'

import type { CrmProspect, CrmStage } from '@/lib/admin/crm'
import {
  CRM_STAGE_META,
  communityUpgradeTargets,
  followUpLabel,
  formatMoney,
  nextUpgradeStage,
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

  return (
    <article
      className="rounded-md mb-2 transition-shadow"
      style={{
        background: '#fff',
        border: '1px solid var(--border-color, rgba(27,60,90,0.10))',
        borderLeft: `3px solid ${meta.accent}`,
        opacity: busy ? 0.55 : 1,
        boxShadow: '0 1px 0 rgba(17,37,53,0.04)',
      }}
    >
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <button
            type="button"
            onClick={() => onEdit(prospect)}
            className="text-left min-w-0"
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
          >
            <p
              className="font-body font-semibold text-[13px] leading-snug truncate"
              style={{ color: '#1b3c5a', margin: 0 }}
            >
              {prospect.full_name}
            </p>
            {prospect.company && (
              <p
                className="font-condensed text-[11px] truncate mt-0.5"
                style={{ color: '#7a8a96', margin: 0 }}
              >
                {prospect.company}
              </p>
            )}
          </button>
          {prospect.status !== 'active' && (
            <span
              className="font-condensed font-bold uppercase text-[9px] tracking-wider px-1.5 py-0.5 rounded shrink-0"
              style={{ background: meta.accentSoft, color: meta.accent }}
            >
              {prospect.status}
            </span>
          )}
        </div>

        <a
          href={mailto}
          className="font-condensed text-[12px] block truncate mb-2 hover:underline"
          style={{ color: '#5a6a76' }}
          onClick={e => e.stopPropagation()}
        >
          {prospect.email}
        </a>

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
            style={{ color: '#7a8a96', margin: '0 0 8px' }}
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
          <a href={mailto} className="crm-qa" style={qaStyle(meta.accent)} title="Send email">
            Email
          </a>
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
          color: '#7a8a96',
        }}
      >
        {label}
      </p>
      <p
        className="font-condensed font-semibold truncate"
        style={{
          margin: '2px 0 0',
          fontSize: 12,
          color: color ?? '#1b3c5a',
        }}
      >
        {value}
      </p>
    </div>
  )
}

function qaStyle(color: string): React.CSSProperties {
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
    border: `1px solid ${color}55`,
    borderRadius: 3,
    cursor: 'pointer',
    textDecoration: 'none',
  }
}
