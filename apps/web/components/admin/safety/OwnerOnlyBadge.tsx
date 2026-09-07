/** Visual M1 owner-only marker. Admin routes are already role-gated. */
export function OwnerOnlyBadge({ className = '' }: { className?: string }) {
  return (
    <span
      data-testid="owner-only-badge"
      className={`inline-flex items-center bg-navy px-2 py-0.5 font-condensed text-[9px] font-bold uppercase tracking-[0.14em] text-white ${className}`}
    >
      Owner-only
    </span>
  )
}
