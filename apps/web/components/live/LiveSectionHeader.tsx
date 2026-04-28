const FBC = 'Barlow Condensed, sans-serif'
const FBN = 'Bebas Neue, sans-serif'
const FP = 'Playfair Display, Georgia, serif'

interface LiveSectionHeaderProps {
  eyebrow: string
  title: string
  kicker?: string
}

export function LiveSectionHeader({ eyebrow, title, kicker }: LiveSectionHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 24,
        flexWrap: 'wrap',
      }}
    >
      <div>
        <p
          style={{
            margin: 0,
            fontFamily: FBC,
            fontWeight: 700,
            fontSize: 11,
            letterSpacing: '0.42em',
            textTransform: 'uppercase',
            color: 'rgba(201,168,76,0.85)',
          }}
        >
          {eyebrow}
        </p>
        <h3
          style={{
            margin: '6px 0 0',
            fontFamily: FBN,
            fontSize: 40,
            lineHeight: 1,
            letterSpacing: '0.04em',
            color: 'var(--text-strong)',
            textTransform: 'uppercase',
          }}
        >
          {title}
        </h3>
      </div>
      {kicker && (
        <p
          style={{
            margin: 0,
            maxWidth: 360,
            fontFamily: FP,
            fontStyle: 'italic',
            fontSize: 16,
            lineHeight: 1.4,
            color: 'var(--text-2)',
          }}
        >
          {kicker}
        </p>
      )}
    </div>
  )
}
