'use client'

import type { CrmProspect, CrmStage } from '@/lib/admin/crm'
import { CRM_STAGE_META, nextUpgradeStage } from '@/lib/admin/crm'

export type { CrmProspect }

interface CrmCardProps {
  prospect: CrmProspect
  onMarkContacted: (id: string) => void
  onUpgrade: (id: string, to: CrmStage) => void
  onEdit: (prospect: CrmProspect) => void
  busy?: boolean
}

function relativeContact(iso: string | null): string {
  if (!iso) return 'Never contacted'
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return 'Never contacted'
  const days = Math.floor((Date.now() - t) / 86_400_000)
  if (days <= 0) return 'Contacted today'
  if (days === 1) return 'Contacted yesterday'
  if (days < 14) return `Contacted ${days}d ago`
  return `Contacted ${new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
}

export function CrmCard({
  prospect,
  onMarkContacted,
  onUpgrade,
  onEdit,
  busy = false,
}: CrmCardProps) {
  const meta = CRM_STAGE_META[prospect.stage]
  const upgradeTo = nextUpgradeStage(prospect.stage)
  const mailto = `mailto:${encodeURIComponent(prospect.email)}?subject=${encodeURIComponent(
    `Evolved Pros — following up with ${prospect.full_name.split(' ')[0] ?? ''}`,
  )}`

  return (
    <article
      className="rounded-md mb-2 transition-shadow"
      style={{
        background: 'var(--bg-surface, #fff)',
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
              style={{ color: 'var(--text-primary, #1b3c5a)', margin: 0 }}
            >
              {prospect.full_name}
            </p>
            {prospect.company && (
              <p
                className="font-condensed text-[11px] truncate mt-0.5"
                style={{ color: 'var(--text-tertiary, #7a8a96)', margin: 0 }}
              >
                {prospect.company}
              </p>
            )}
          </button>
          {prospect.status !== 'active' && (
            <span
              className="font-condensed font-bold uppercase text-[9px] tracking-wider px-1.5 py-0.5 rounded shrink-0"
              style={{
                background: meta.accentSoft,
                color: meta.accent,
              }}
            >
              {prospect.status}
            </span>
          )}
        </div>

        <a
          href={mailto}
          className="font-condensed text-[12px] block truncate mb-1.5 hover:underline"
          style={{ color: 'var(--text-secondary, #5a6a76)' }}
          onClick={e => e.stopPropagation()}
        >
          {prospect.email}
        </a>

        {prospect.notes && (
          <p
            className="font-body text-[12px] leading-snug mb-2 line-clamp-2"
            style={{ color: 'var(--text-tertiary, #7a8a96)', margin: '0 0 8px' }}
          >
            {prospect.notes}
          </p>
        )}

        <p
          className="font-condensed text-[10px] uppercase tracking-wider mb-2"
          style={{ color: 'var(--text-tertiary, #7a8a96)', margin: '0 0 8px' }}
        >
          {relativeContact(prospect.last_contacted_at)}
        </p>

        {/* Quick actions */}
        <div
          className="flex flex-wrap gap-1.5 pt-2"
          style={{ borderTop: '1px solid var(--border-color, rgba(27,60,90,0.08))' }}
          onClick={e => e.stopPropagation()}
          onPointerDown={e => e.stopPropagation()}
        >
          <a
            href={mailto}
            className="crm-qa"
            style={qaStyle(meta.accent)}
            title="Send email"
          >
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
          {upgradeTo && (
            <button
              type="button"
              className="crm-qa"
              style={qaStyle('#C9A84C')}
              disabled={busy}
              onClick={() => onUpgrade(prospect.id, upgradeTo)}
              title={`Move to ${CRM_STAGE_META[upgradeTo].label}`}
            >
              Upgrade
            </button>
          )}
        </div>
      </div>
    </article>
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
