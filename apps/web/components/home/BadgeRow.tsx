import { PILLAR_CONFIG } from '@/lib/pillar-colors'

interface BadgeRowProps {
  earnedBadges: number[]
}

const BADGE_ICONS: Record<number, React.ReactNode> = {
  1: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2 L22 20 L2 20 Z" />
    </svg>
  ),
  2: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2 L22 12 L12 22 L2 12 Z" />
    </svg>
  ),
  3: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2 L20 6 L20 13 C20 17.5 16.5 21 12 22 C7.5 21 4 17.5 4 13 L4 6 Z" />
    </svg>
  ),
  4: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="3" x2="12" y2="21" />
      <line x1="3" y1="12" x2="21" y2="12" />
    </svg>
  ),
  5: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <rect x="2" y="11" width="20" height="2" rx="1" />
      <rect x="6" y="6" width="2" height="5" rx="1" />
      <rect x="16" y="13" width="2" height="5" rx="1" />
    </svg>
  ),
  6: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2 L5 13 L11 13 L11 22 L19 11 L13 11 Z" />
    </svg>
  ),
}

export function BadgeRow({ earnedBadges }: BadgeRowProps) {
  const earned = new Set(earnedBadges)

  return (
    <div
      className="rounded-lg px-6 py-5"
      style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}
    >
      <p className="font-condensed font-bold uppercase tracking-[0.14em] text-[10px] text-[#7a8a96] mb-4">
        Pillar Badges
      </p>
      <div className="flex items-start justify-between gap-2">
        {[1, 2, 3, 4, 5, 6].map(pillar => {
          const config = PILLAR_CONFIG[pillar]
          const isEarned = earned.has(pillar)
          return (
            <div key={pillar} className="flex flex-col items-center gap-1.5 flex-1">
              {/* Badge circle */}
              <div
                className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-300"
                style={
                  isEarned
                    ? { backgroundColor: config.color, color: '#ffffff' }
                    : {
                        backgroundColor: 'transparent',
                        border: `1.5px solid ${config.color}33`,
                        color: `${config.color}40`,
                      }
                }
              >
                {BADGE_ICONS[pillar]}
              </div>
              {/* Pillar name */}
              <p
                className="font-condensed font-bold uppercase text-center leading-tight"
                style={{
                  fontSize: '8px',
                  letterSpacing: '0.06em',
                  color: isEarned ? config.color : 'rgba(122,138,150,0.45)',
                  maxWidth: '44px',
                }}
              >
                {config.label.toUpperCase()}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
