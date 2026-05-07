// First paint while AdminDashboardPage is streaming. Mirrors the page shell so
// there's no layout shift when the real content lands. The shimmer block is
// low-opacity navy because the admin surface is `bg-[#faf9f7]` — the
// platform-default `bg-white/5` token is invisible on that off-white.

export default function AdminDashboardLoading() {
  return (
    <div className="px-8 py-6 max-w-5xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="h-7 w-40 rounded animate-pulse mb-2" style={{ backgroundColor: 'rgba(27,60,90,0.08)' }} />
          <div className="h-3 w-56 rounded animate-pulse" style={{ backgroundColor: 'rgba(27,60,90,0.06)' }} />
        </div>
        <div className="h-9 w-32 rounded animate-pulse" style={{ backgroundColor: 'rgba(27,60,90,0.08)' }} />
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-20 rounded-lg animate-pulse"
            style={{ backgroundColor: 'rgba(27,60,90,0.06)', border: '1px solid rgba(27,60,90,0.08)' }}
          />
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-16 rounded-lg animate-pulse"
            style={{ backgroundColor: 'rgba(27,60,90,0.04)', border: '1px solid rgba(27,60,90,0.08)' }}
          />
        ))}
      </div>

      {/* Recent signups + Vendasta tables */}
      {[5, 3].map((rows, idx) => (
        <div
          key={idx}
          className="rounded-lg overflow-hidden mb-6"
          style={{ backgroundColor: 'white', border: '1px solid rgba(27,60,90,0.1)' }}
        >
          <div className="h-10" style={{ borderBottom: '1px solid rgba(27,60,90,0.08)' }} />
          {Array.from({ length: rows }).map((_, i) => (
            <div
              key={i}
              className="h-12 animate-pulse"
              style={{
                backgroundColor: 'rgba(27,60,90,0.04)',
                borderBottom: i === rows - 1 ? 'none' : '1px solid rgba(27,60,90,0.06)',
              }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
