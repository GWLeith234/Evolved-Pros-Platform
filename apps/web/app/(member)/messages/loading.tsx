import { Skeleton } from '@/components/shared/Skeleton'

export default function MessagesLoading() {
  return (
    <div className="flex-1 flex" style={{ backgroundColor: 'var(--bg-page)' }}>
      {/* Conversation list rail */}
      <div
        className="w-72 flex-shrink-0 hidden md:block"
        style={{ borderRight: '1px solid rgba(27,60,90,0.08)', background: '#fff' }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            style={{
              padding: '14px 18px',
              borderBottom: '1px solid rgba(27,60,90,0.06)',
              display: 'flex',
              gap: 12,
              alignItems: 'center',
            }}
          >
            <Skeleton width={40} height={40} rounded />
            <div style={{ flex: 1 }}>
              <Skeleton height={12} width="60%" className="mb-1.5" />
              <Skeleton height={10} width="85%" />
            </div>
          </div>
        ))}
      </div>

      {/* Active thread placeholder */}
      <div className="flex-1 flex flex-col" style={{ background: '#fff' }}>
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(27,60,90,0.08)',
            display: 'flex',
            gap: 12,
            alignItems: 'center',
          }}
        >
          <Skeleton width={36} height={36} rounded />
          <Skeleton height={14} width={140} />
        </div>
        <div className="flex-1 px-4 py-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`flex ${i % 2 ? 'justify-end' : 'justify-start'}`}>
              <Skeleton width={`${40 + ((i * 13) % 35)}%`} height={36} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
