// Placeholder used in place of Mux video player
export function VideoPlaceholder({ lessonTitle }: { lessonTitle: string }) {
  return (
    <div
      className="relative flex items-center justify-center"
      style={{ aspectRatio: '16/9', maxHeight: '420px', backgroundColor: '#0d1c27' }}
    >
      <div className="text-center px-8">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: 'rgba(104,162,185,0.1)', border: '1px solid rgba(104,162,185,0.2)' }}
        >
          <svg width="20" height="22" viewBox="0 0 20 22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 2l15 9-15 9V2z" fill="#68a2b9"/>
          </svg>
        </div>
        <p className="font-condensed font-bold uppercase tracking-[0.14em] text-[11px] mb-1" style={{ color: '#68a2b9' }}>
          Video coming soon
        </p>
        <p className="font-body text-[13px]" style={{ color: 'rgba(250,249,247,0.4)' }}>
          {lessonTitle}
        </p>
      </div>
    </div>
  )
}
