export function CompoundBoardLocked() {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center"
      style={{ backgroundColor: 'var(--bg-page)' }}
    >
      {/* Lock icon */}
      <div
        className="flex items-center justify-center w-16 h-16 rounded-full mb-6"
        style={{ backgroundColor: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)' }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>

      <h1
        className="font-condensed font-bold uppercase tracking-[0.12em] mb-3"
        style={{ fontSize: '28px', color: '#C9A84C' }}
      >
        Discipline
      </h1>

      <p
        className="font-body max-w-sm mb-8 leading-relaxed"
        style={{ color: 'var(--text-secondary)', fontSize: '15px' }}
      >
        Track daily habits across all 6 EVOLVED pillars. Available on Pro membership.
      </p>

      <a
        href="/membership"
        className="font-condensed font-bold uppercase tracking-[0.12em] px-8 py-3 rounded transition-opacity hover:opacity-90"
        style={{ backgroundColor: '#C9302A', color: '#ffffff', fontSize: '13px', textDecoration: 'none' }}
      >
        Upgrade to Pro
      </a>
    </div>
  )
}
