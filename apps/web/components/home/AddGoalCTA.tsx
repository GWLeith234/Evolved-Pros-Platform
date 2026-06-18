import Link from 'next/link'

interface AddGoalCTAProps {
  /**
   * Where the CTA points. There is no goal-create modal yet, so default to
   * the settings/goals route which is the existing surface for managing
   * quarterly_goals. When a dedicated modal lands, swap to onClick → open.
   */
  href?: string
}

export function AddGoalCTA({ href = '/settings#goals' }: AddGoalCTAProps) {
  return (
    <Link
      href={href}
      className="block px-4 py-3 text-center transition-colors"
      style={{
        border: '1px dashed rgba(27,60,90,0.25)',
        backgroundColor: 'rgba(27,60,90,0.02)',
        color: '#1b3c5a',
      }}
    >
      <span className="font-condensed font-bold uppercase tracking-[0.18em] text-[12px]">
        + Add Goal
      </span>
    </Link>
  )
}
