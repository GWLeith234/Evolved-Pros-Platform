export function UpgradePrompt() {
  return (
    <div
      className="mt-6 rounded-lg px-6 py-5 flex items-center justify-between gap-4"
      style={{ backgroundColor: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.25)' }}
    >
      <div>
        <p className="font-condensed font-bold uppercase tracking-[0.15em] text-[11px] text-[#c9a84c] mb-1">
          Pro Plan
        </p>
        <p className="font-body text-[14px] text-[#1b3c5a] leading-snug">
          Pillars 4–6 — Strategy, Accountability, and Execution — are unlocked with a Pro membership.
        </p>
      </div>
      <a
        href={process.env.NEXT_PUBLIC_VENDASTA_CHECKOUT_URL ?? '/membership'}
        className="flex-shrink-0 font-condensed font-bold uppercase tracking-wide text-[12px] rounded px-5 py-2.5 transition-all"
        style={{ backgroundColor: '#ef0e30', color: 'white' }}
      >
        Upgrade to Pro →
      </a>
    </div>
  )
}
