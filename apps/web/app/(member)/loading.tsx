export default function MemberLoading() {
  return (
    <div
      className="flex-1 flex items-center justify-center"
      style={{ backgroundColor: '#faf9f7', minHeight: '100%' }}
    >
      <div className="flex flex-col items-center gap-4">
        <svg
          className="animate-spin"
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          style={{ color: '#ef0e30' }}
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        <p
          className="font-condensed font-bold uppercase tracking-[0.18em] text-[10px]"
          style={{ color: 'rgba(27,60,90,0.4)' }}
        >
          Loading
        </p>
      </div>
    </div>
  )
}
