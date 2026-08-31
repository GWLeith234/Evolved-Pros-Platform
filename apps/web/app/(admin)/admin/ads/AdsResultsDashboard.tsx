import { formatCtr, type AdResults } from '@/lib/ads/results'

const GA4_LABEL = 'House ad results (also sent to GA4 G-LLQZZBWWKS)'

function formatAsOf(iso: string | null): string {
  if (!iso) return 'No events yet'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'As of —'
  return `As of ${d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  })}`
}

function Cell({
  children,
  align = 'left',
  strong = false,
}: {
  children?: React.ReactNode
  align?: 'left' | 'right'
  strong?: boolean
}) {
  return (
    <td
      className="px-4 py-3 font-body text-[13px]"
      style={{
        textAlign: align,
        color: 'var(--admin-text)',
        fontWeight: strong ? 700 : 400,
      }}
    >
      {children}
    </td>
  )
}

/**
 * First-party house-ad results. Reads ad_events (not the GA4 Data API).
 * Empty when there are no events — never invents impressions, CTR, or revenue.
 */
export function AdsResultsDashboard({ results }: { results: AdResults }) {
  const empty = results.rows.length === 0

  return (
    <section
      className="rounded-lg mb-8 overflow-hidden"
      style={{
        backgroundColor: 'var(--admin-card)',
        border: '1px solid rgba(27,60,90,0.12)',
      }}
      aria-label={GA4_LABEL}
    >
      <div
        className="px-5 py-4 flex flex-wrap items-end justify-between gap-3"
        style={{ borderBottom: '1px solid rgba(27,60,90,0.08)' }}
      >
        <div>
          <p
            className="font-condensed font-bold uppercase tracking-[0.16em] text-[10px] m-0"
            style={{ color: '#68a2b9' }}
          >
            Dashboard
          </p>
          <h2
            className="font-display font-black text-[18px] m-0 mt-0.5"
            style={{ color: 'var(--admin-text-strong)' }}
          >
            {GA4_LABEL}
          </h2>
          <p className="font-body text-[12px] m-0 mt-1" style={{ color: 'var(--admin-text-2)' }}>
            First-party <code className="font-condensed text-[11px]">ad_events</code>
            {' '}· gtag <code className="font-condensed text-[11px]">view_promotion</code>
            {', '}
            <code className="font-condensed text-[11px]">select_promotion</code>
            {' + '}
            <code className="font-condensed text-[11px]">house_ad_click</code>
            {' · promotion_name='}
            <code className="font-condensed text-[11px]">academy_house</code>
          </p>
        </div>
        <p
          className="font-condensed font-bold uppercase tracking-[0.12em] text-[11px] m-0"
          style={{ color: 'var(--admin-text-2)' }}
        >
          {formatAsOf(results.asOf)}
        </p>
      </div>

      {empty ? (
        <div className="px-8 py-12 text-center">
          <p className="font-condensed font-bold uppercase tracking-widest text-[11px] m-0" style={{ color: 'var(--admin-text-2)' }}>
            No house ad events yet
          </p>
          <p className="font-body text-[13px] mt-2 mb-0 mx-auto max-w-md" style={{ color: 'var(--admin-text-2)' }}>
            Impressions, clicks, and CTR appear here after a house Academy unit
            is seen or clicked. This panel does not invent numbers.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: 'var(--admin-subtle)', borderBottom: '1px solid rgba(27,60,90,0.1)' }}>
                {['Creative', 'Slot', 'Impressions', 'Clicks', 'CTR', 'Last click'].map(h => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 font-condensed font-bold uppercase tracking-[0.16em] text-[9px]"
                    style={{
                      color: 'var(--admin-text-2)',
                      textAlign: h === 'Creative' || h === 'Slot' || h === 'Last click' ? 'left' : 'right',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.rows.map(row => (
                <tr key={row.key} style={{ borderBottom: '1px solid rgba(27,60,90,0.06)' }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-10 rounded overflow-hidden flex-shrink-0"
                        style={{ backgroundColor: 'var(--admin-subtle)', border: '1px solid rgba(27,60,90,0.08)' }}
                      >
                        {row.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={row.imageUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : null}
                      </div>
                      <p className="font-body font-semibold text-[13px] m-0" style={{ color: 'var(--admin-text)' }}>
                        {row.creativeName}
                      </p>
                    </div>
                  </td>
                  <Cell>
                    <span className="font-condensed font-bold tracking-wide">{row.creativeSlot}</span>
                  </Cell>
                  <Cell align="right">{row.impressions.toLocaleString('en-US')}</Cell>
                  <Cell align="right">{row.clicks.toLocaleString('en-US')}</Cell>
                  <Cell align="right">{formatCtr(row.ctr)}</Cell>
                  <Cell>
                    {row.lastClickAt
                      ? new Date(row.lastClickAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })
                      : '—'}
                  </Cell>
                </tr>
              ))}
              <tr style={{ backgroundColor: 'var(--admin-subtle)' }}>
                <Cell strong>Totals</Cell>
                <Cell />
                <Cell align="right" strong>{results.totals.impressions.toLocaleString('en-US')}</Cell>
                <Cell align="right" strong>{results.totals.clicks.toLocaleString('en-US')}</Cell>
                <Cell align="right" strong>{formatCtr(results.totals.ctr)}</Cell>
                <Cell />
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
