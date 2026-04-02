'use client'

import { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

const TEAL = '#0ABFA3'

interface DayData {
  date: string
  completed: number
  total: number
  pct: number
}

interface HistoryResponse {
  daily: DayData[]
  totalHabits: number
  overallPct: number
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  // Show every 5th label to avoid crowding
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as DayData
  return (
    <div style={{ backgroundColor: '#1a2535', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px 12px', fontSize: '11px' }}>
      <p style={{ color: 'rgba(255,255,255,0.5)', margin: '0 0 3px' }}>{formatDate(d.date)}</p>
      {d.total > 0 ? (
        <p style={{ color: d.completed > 0 ? TEAL : 'rgba(255,255,255,0.3)', margin: 0, fontWeight: 600 }}>
          {d.completed}/{d.total} habits completed
        </p>
      ) : (
        <p style={{ color: 'rgba(255,255,255,0.3)', margin: 0 }}>{d.completed} completed</p>
      )}
    </div>
  )
}

interface Props {
  habitId?: string
  userId: string
}

export function HabitHistoryChart({ userId }: Props) {
  const [data, setData] = useState<HistoryResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/habits/history?days=30')
      .then(r => r.ok ? r.json() : null)
      .then((d: HistoryResponse | null) => { if (d) setData(d) })
      .finally(() => setLoading(false))
  // userId is stable — only run on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  if (loading) {
    return (
      <div style={{ backgroundColor: '#111926', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '24px 28px' }}>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', textAlign: 'center' }}>Loading habit history…</p>
      </div>
    )
  }

  if (!data || data.daily.length === 0) return null

  const daysWithAny = data.daily.filter(d => d.completed > 0).length
  const maxVal = Math.max(...data.daily.map(d => d.completed), 1)

  // Show X-axis labels only every 5 days to avoid crowding
  const tickFormatter = (dateStr: string, index: number) =>
    index % 5 === 0 ? formatShort(dateStr) : ''

  return (
    <div style={{ backgroundColor: '#111926', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '24px 28px' }}>
      {/* Header */}
      <div style={{ marginBottom: '16px' }}>
        <p style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: TEAL, margin: '0 0 4px' }}>
          Habit History
        </p>
        <p style={{ color: '#faf9f7', fontSize: '15px', fontWeight: 600, margin: '0 0 4px' }}>
          Last 30 days
        </p>
        <p style={{ color: 'rgba(250,249,247,0.4)', fontSize: '13px', margin: 0 }}>
          You&apos;ve completed your stack{' '}
          <span style={{ color: TEAL, fontWeight: 600 }}>{daysWithAny} of 30 days</span>
          {data.totalHabits > 0 && (
            <> &mdash; overall completion rate <span style={{ color: TEAL, fontWeight: 600 }}>{data.overallPct}%</span></>
          )}
        </p>
      </div>

      {/* Bar chart */}
      <div style={{ width: '100%', height: 160 }}>
        <ResponsiveContainer>
          <BarChart data={data.daily} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barCategoryGap="20%">
            <XAxis
              dataKey="date"
              tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 9 }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
              tickFormatter={tickFormatter}
              interval={0}
            />
            <YAxis
              tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 9 }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              domain={[0, maxVal]}
              width={24}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Bar dataKey="completed" radius={[2, 2, 0, 0]}>
              {data.daily.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.completed > 0 ? TEAL : 'rgba(255,255,255,0.06)'}
                  fillOpacity={entry.completed > 0 ? 0.85 : 1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: TEAL }} />
          <span style={{ fontFamily: '"Barlow Condensed", sans-serif', fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>Habits completed</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'rgba(255,255,255,0.06)' }} />
          <span style={{ fontFamily: '"Barlow Condensed", sans-serif', fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>No completions</span>
        </div>
      </div>
    </div>
  )
}
