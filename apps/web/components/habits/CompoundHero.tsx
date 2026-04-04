interface CompoundHeroProps {
  completedCount: number
  totalCount: number
}

export function CompoundHero({ completedCount, totalCount }: CompoundHeroProps) {
  const pct = totalCount > 0 ? ((completedCount / totalCount) * 100).toFixed(0) : '0'

  return (
    <div
      className="rounded-lg px-6 py-8 flex flex-col items-center text-center"
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid rgba(201,168,76,0.2)',
      }}
    >
      <p
        className="font-condensed font-bold uppercase tracking-[0.2em] mb-2"
        style={{ fontSize: '10px', color: 'rgba(201,168,76,0.6)', letterSpacing: '0.22em' }}
      >
        Today&apos;s Compound Score
      </p>

      <p
        className="font-condensed font-bold leading-none"
        style={{ fontSize: '72px', color: '#C9A84C' }}
      >
        {pct}
        <span style={{ fontSize: '32px', marginLeft: '4px', color: 'rgba(201,168,76,0.7)' }}>%</span>
      </p>

      <p
        className="font-body mt-3"
        style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}
      >
        {completedCount} of {totalCount} habits complete
      </p>

      {/* Progress bar */}
      <div
        className="w-full max-w-xs mt-4 rounded-full overflow-hidden"
        style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.08)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            backgroundColor: '#C9A84C',
          }}
        />
      </div>
    </div>
  )
}
