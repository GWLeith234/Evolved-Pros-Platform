interface PinnedPostProps {
  label: string
  body: string
}

export function PinnedPost({ label, body }: PinnedPostProps) {
  return (
    <div
      className="rounded overflow-hidden"
      style={{
        backgroundColor: 'rgba(27,60,90,0.04)',
        border: '1px solid rgba(27,60,90,0.1)',
        borderLeft: '3px solid #ef0e30',
        padding: '14px 16px',
      }}
    >
      <p
        className="font-condensed font-bold uppercase tracking-[0.18em] text-[9px] mb-2"
        style={{ color: '#ef0e30' }}
      >
        📌 {label}
      </p>
      <p
        className="text-[13px] leading-[1.55] text-[#1b3c5a]"
        dangerouslySetInnerHTML={{ __html: body.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }}
      />
    </div>
  )
}
