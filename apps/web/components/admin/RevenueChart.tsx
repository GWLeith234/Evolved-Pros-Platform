import { TIERS } from '@/lib/pricing'

interface MonthBar {
  label: string
  mrr: number
  isCurrent: boolean
}

interface RevenueChartProps {
  months: MonthBar[]
  currentMrr: number
  communityCount: number
  vipCount: number
  proCount: number
  communityMrr: number
  vipMrr: number
  proMrr: number
  churnThisMonth: number
}

export function RevenueChart({
  months,
  currentMrr,
  communityCount,
  vipCount,
  proCount,
  communityMrr,
  vipMrr,
  proMrr,
  churnThisMonth,
}: RevenueChartProps) {
  const maxMrr = Math.max(...months.map(m => m.mrr), 1)

  // Prices come from lib/pricing so the card labels can't drift from the
  // canonical table. Total MRR = Community + VIP + Pro card MRRs.
  const stats = [
    { label: 'Total MRR',                    value: `$${currentMrr.toLocaleString('en-US')}`, color: '#68a2b9' },
    { label: `VIP × $${TIERS.vip.monthly}`,          value: `$${vipMrr.toLocaleString('en-US')} / ${vipCount} members`,             color: '#c9a84c' },
    { label: `Pro × $${TIERS.professional.monthly}`, value: `$${proMrr.toLocaleString('en-US')} / ${proCount} members`,             color: '#C9302A' },
    { label: 'Community (Free)',             value: `$${communityMrr.toLocaleString('en-US')} / ${communityCount} members`, color: 'var(--admin-text)' },
    { label: 'Churn (month)',                value: `${churnThisMonth} cancelled`,            color: '#ef0e30' },
  ]

  return (
    <div>
      {/* Bar chart */}
      <div
        className="rounded-lg p-6 mb-6"
        style={{ backgroundColor: 'var(--admin-card)', border: '1px solid rgba(27,60,90,0.1)' }}
      >
        <p className="font-condensed font-bold uppercase tracking-[0.16em] text-[12px] text-[color:var(--admin-text-2)] mb-5">
          MRR — Last 6 Months
        </p>

        {/* Bars */}
        <div className="flex items-end gap-3 h-[120px]">
          {months.map(month => {
            const heightPct = maxMrr > 0 ? (month.mrr / maxMrr) * 100 : 0
            return (
              <div key={month.label} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="font-condensed font-bold text-[12px]" style={{ color: 'var(--admin-text)' }}>
                  ${month.mrr > 999 ? `${(month.mrr / 1000).toFixed(1)}k` : month.mrr}
                </span>
                <div
                  className="w-full rounded-sm transition-all duration-300"
                  style={{
                    height: `${Math.max(4, heightPct)}px`,
                    backgroundColor: month.isCurrent ? '#ef0e30' : '#68a2b9',
                    maxHeight: '80px',
                  }}
                />
                <span className="font-condensed text-[12px] text-[color:var(--admin-text-2)]">{month.label}</span>
              </div>
            )
          })}
        </div>

        <p className="font-condensed text-[12px] text-[color:var(--admin-text-2)] mt-3">
          Red bar = current month · Based on active tier counts × price
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map(s => (
          <div
            key={s.label}
            className="rounded-lg p-4"
            style={{ backgroundColor: 'var(--admin-card)', border: '1px solid rgba(27,60,90,0.1)' }}
          >
            <p
              className="font-condensed font-bold uppercase tracking-[0.16em] text-[12px] mb-2"
              style={{ color: s.color }}
            >
              {s.label}
            </p>
            <p className="font-display font-black text-[22px] leading-none text-[color:var(--admin-text-strong)]">
              {s.value.split(' ')[0]}
            </p>
            {s.value.includes(' ') && (
              <p className="font-condensed text-[12px] text-[color:var(--admin-text-2)] mt-0.5">
                {s.value.slice(s.value.indexOf(' ') + 1)}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
