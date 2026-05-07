// First paint while AdminMediaPage streams the media_stories list. Mirrors
// the masthead row + 3-column card grid so the real content lands without
// layout shift. Navy-tinted shimmer on the light admin surface (`bg-[#faf9f7]`).

export default function AdminMediaLoading() {
  return (
    <div className="px-8 py-6">
      {/* Masthead — eyebrow + title + 2 CTAs */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-3 w-20 rounded animate-pulse mb-2" style={{ backgroundColor: 'rgba(104,162,185,0.15)' }} />
          <div className="h-7 w-44 rounded animate-pulse" style={{ backgroundColor: 'rgba(27,60,90,0.08)' }} />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-28 rounded animate-pulse" style={{ backgroundColor: 'rgba(201,168,76,0.18)' }} />
          <div className="h-10 w-32 rounded animate-pulse" style={{ backgroundColor: 'rgba(27,60,90,0.18)' }} />
        </div>
      </div>

      {/* 3-column card grid (6 placeholders) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg overflow-hidden animate-pulse"
            style={{ backgroundColor: 'white', border: '1px solid rgba(27,60,90,0.1)' }}
          >
            <div className="h-32" style={{ backgroundColor: 'rgba(27,60,90,0.06)' }} />
            <div className="p-4 space-y-2">
              <div className="h-3 w-20 rounded" style={{ backgroundColor: 'rgba(27,60,90,0.08)' }} />
              <div className="h-4 w-full rounded" style={{ backgroundColor: 'rgba(27,60,90,0.08)' }} />
              <div className="h-4 w-3/4 rounded" style={{ backgroundColor: 'rgba(27,60,90,0.06)' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
