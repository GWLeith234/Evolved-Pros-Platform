import { PILLARS } from '@/lib/pillars'
import type { GatedIntent } from '@/lib/auth/gatedIntent'

/**
 * Next-aware login wall. Sits on the always-light login card (navy page chrome
 * is pinned; this card does not follow html theme). Brand navy/muted stay
 * readable on that card in both theme preferences.
 */
export function GatedIntentWall({ intent }: { intent: GatedIntent }) {
  return (
    <div
      role="status"
      data-gated-intent={intent.id}
      className="mb-6 rounded px-3 py-3"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--navy) 5%, transparent)',
        border: '1px solid color-mix(in srgb, var(--navy) 12%, transparent)',
      }}
    >
      <p
        className="text-[color:var(--navy)] text-sm font-bold"
        style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
      >
        {intent.headline}
      </p>
      <p className="text-muted text-xs mt-1 leading-relaxed">{intent.body}</p>
      {intent.id === 'academy' ? (
        <p
          className="text-[10px] mt-2 leading-relaxed"
          style={{ color: 'color-mix(in srgb, var(--navy) 55%, transparent)' }}
        >
          {PILLARS.map(p => p.name).join(' · ')}
        </p>
      ) : null}
    </div>
  )
}
