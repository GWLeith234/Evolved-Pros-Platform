interface MonthBar {
  label: string
  mrr: number
  isCurrent: boolean
}

interface RevenueChartProps {
  months: MonthBar[]
  currentMrr: number
  proCount: number
  communityCount: number
  proMrr: number
  communityMrr: number
  churnThisMonth: number
}

export function RevenueChart({
  months,
  currentMrr,
  proCount,
  communityCount,
  proMrr,
  communityMrr,
  churnThisMonth,
}: RevenueChartProps) {
  const maxMrr = Math.max(...months.map(m => m.mrr), 1)

  const stats = [
    { label: 'Total MRR',       value: `$${currentMrr.toLocaleString()}`,     color: '#68a2b9' },
    { label: `Pro × $79`,       value: `$${proMrr.toLocaleString()} / ${proCount} members`,  color: '#c9a84c' },
    { label: `Community × $39`, value: `$${communityMrr.toLocaleString()} / ${communityCount} members`, color: '#1b3c5a' },
    { label: 'Churn (month)',   value: `${churnThisMonth} cancelled`,           color: '#ef0e30' },
  ]

  return (
    <div>
      {/* Bar chart */}
      <div
        className="rounded-lg p-6 mb-6"
        style={{ backgroundColor: 'white', border: '1px solid rgba(27,60,90,0.1)' }}
      >
        <p className="font-condensed font-bold uppercase tracking-[0.16em] text-[10px] text-[#7a8a96] mb-5">
          MRR — Last 6 Months
        </p>

        {/* Bars */}
        <div className="flex items-end gap-3 h-[120px]">
          {months.map(month => {
            const heightPct = maxMrr > 0 ? (month.mrr / maxMrr) * 100 : 0
            return (
              <div key={month.label} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="font-condensed font-bold text-[10px]" style={{ color: '#1b3c5a' }}>
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
                <span className="font-condensed text-[10px] text-[#7a8a96]">{month.label}</span>
              </div>
            )
          })}
        </div>

        <p className="font-condensed text-[10px] text-[#7a8a96] mt-3">
          Red bar = current month · Based on active tier counts × price
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div
            key={s.label}
            className="rounded-lg p-4"
            style={{ backgroundColor: 'white', border: '1px solid rgba(27,60,90,0.1)' }}
          >
            <p
              className="font-condensed font-bold uppercase tracking-[0.16em] text-[9px] mb-2"
              style={{ color: s.color }}
            >
              {s.label}
            </p>
            <p className="font-display font-black text-[22px] leading-none text-[#112535]">
              {s.value.split(' ')[0]}
            </p>
            {s.value.includes(' ') && (
              <p className="font-condensed text-[10px] text-[#7a8a96] mt-0.5">
                {s.value.slice(s.value.indexOf(' ') + 1)}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
