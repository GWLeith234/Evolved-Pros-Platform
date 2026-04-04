import type { Habit } from '@/types/habits'
import { PILLAR_COLORS } from '@/types/habits'

interface PillarHealthProps {
  habits: Habit[]
  completedIds: Set<string>
}

export function PillarHealth({ habits, completedIds }: PillarHealthProps) {
  // Group habits by pillar
  const pillars = Object.keys(PILLAR_COLORS)
  const pillarData = pillars
    .map(pillar => {
      const group = habits.filter(h => h.pillar === pillar && h.is_active)
      if (group.length === 0) return null
      const done = group.filter(h => completedIds.has(h.id)).length
      const pct = Math.round((done / group.length) * 100)
      return { pillar, color: PILLAR_COLORS[pillar], total: group.length, done, pct }
    })
    .filter(Boolean) as { pillar: string; color: string; total: number; done: number; pct: number }[]

  if (pillarData.length === 0) return null

  return (
    <div
      className="rounded-lg px-4 py-4"
      style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}
    >
      <p
        className="font-condensed font-bold uppercase tracking-[0.18em] mb-4"
        style={{ fontSize: '9px', color: 'var(--text-tertiary)' }}
      >
        Pillar Health
      </p>

      <div className="flex flex-col gap-3">
        {pillarData.map(({ pillar, color, done, total, pct }) => (
          <div key={pillar}>
            <div className="flex items-center justify-between mb-1">
              <span
                className="font-condensed font-semibold uppercase tracking-[0.08em]"
                style={{ fontSize: '11px', color }}
              >
                {pillar}
              </span>
              <span
                className="font-condensed font-bold"
                style={{ fontSize: '11px', color: 'var(--text-secondary)' }}
              >
                {done}/{total}
              </span>
            </div>
            <div
              className="w-full rounded-full overflow-hidden"
              style={{ height: '3px', backgroundColor: 'rgba(255,255,255,0.07)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
