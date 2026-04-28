'use client'

import { useState, useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'

const TEAL = '#0ABFA3'

function formatBig(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 10_000) return `${Math.round(n / 1000)}K`
  if (n >= 1_000) return `${(n / 1000).toFixed(1)}K`
  return n.toFixed(n < 10 ? 1 : 0)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ backgroundColor: '#1a2535', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px 12px', fontSize: '11px' }}>
      <p style={{ color: 'rgba(255,255,255,0.4)', margin: '0 0 4px' }}>Month {label}</p>
      {payload.map((p: { name: string; value: number; color: string }, i: number) => (
        <p key={i} style={{ color: p.color, margin: '2px 0' }}>
          <span style={{ color: 'rgba(255,255,255,0.6)' }}>{p.name}: </span>
          {formatBig(p.value)}
        </p>
      ))}
    </div>
  )
}

export function CompoundCalculator() {
  const [habitName, setHabitName] = useState('Discovery calls')
  const [startValue, setStartValue] = useState(10)
  const [improvement, setImprovement] = useState(1)
  const [years, setYears] = useState(3)

  const months = years * 12

  const chartData = useMemo(() => {
    const data = []
    const dailyRate = improvement / 100
    for (let m = 0; m <= months; m++) {
      const days = m * 30
      data.push({
        month: m,
        with: parseFloat((startValue * Math.pow(1 + dailyRate, days)).toFixed(2)),
        without: startValue,
      })
    }
    return data
  }, [startValue, improvement, months])

  const finalValue = chartData[chartData.length - 1]?.with ?? startValue
  const multiplier = startValue > 0 ? ((finalValue - startValue) / startValue) * 100 : 0

  return (
    <div style={{ backgroundColor: '#111926', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '24px 28px' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <p style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: TEAL, margin: '0 0 4px' }}>
          Compound Effect Calculator
        </p>
        <p style={{ color: '#faf9f7', fontSize: '15px', fontWeight: 600, margin: '0 0 4px' }}>
          Small improvements. Extraordinary results.
        </p>
        <p style={{ color: 'rgba(250,249,247,0.4)', fontSize: '13px', margin: 0 }}>
          See what a 1% daily improvement compounds into over time.
        </p>
      </div>

      {/* Inputs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <div>
          <label style={{ display: 'block', fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: '6px' }}>
            Habit name
          </label>
          <input
            type="text"
            value={habitName}
            onChange={e => setHabitName(e.target.value)}
            placeholder="e.g. Discovery calls"
            style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '8px 10px', color: '#faf9f7', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: '6px' }}>
            Starting value / day
          </label>
          <input
            type="number"
            min={1}
            value={startValue}
            onChange={e => setStartValue(Math.max(1, Number(e.target.value)))}
            style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '8px 10px', color: '#faf9f7', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: '6px' }}>
            Daily improvement %
          </label>
          <input
            type="number"
            min={0.1}
            max={10}
            step={0.1}
            value={improvement}
            onChange={e => setImprovement(Math.max(0.1, Math.min(10, Number(e.target.value))))}
            style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '8px 10px', color: '#faf9f7', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      {/* Years slider */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <label style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>
            Timeframe
          </label>
          <span style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '13px', color: TEAL }}>
            {years} {years === 1 ? 'year' : 'years'}
          </span>
        </div>
        <input
          type="range"
          min={1}
          max={5}
          value={years}
          onChange={e => setYears(Number(e.target.value))}
          style={{ width: '100%', accentColor: TEAL }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
          {[1, 2, 3, 4, 5].map(y => (
            <span key={y} style={{ fontFamily: '"Barlow Condensed", sans-serif', fontSize: '10px', color: y === years ? TEAL : 'rgba(255,255,255,0.2)' }}>
              {y}y
            </span>
          ))}
        </div>
      </div>

      {/* Big result number */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <p style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 900, fontSize: 'clamp(36px, 6vw, 52px)', color: TEAL, margin: '0', lineHeight: 1 }}>
          +{multiplier >= 1000 ? Math.round(multiplier).toLocaleString() : multiplier.toFixed(0)}%
        </p>
        <p style={{ color: 'rgba(250,249,247,0.5)', fontSize: '12px', margin: '4px 0 0' }}>
          {habitName ? `${habitName}: ` : ''}{formatBig(startValue)} → {formatBig(finalValue)} in {years} {years === 1 ? 'year' : 'years'}
        </p>
      </div>

      {/* Chart */}
      <div style={{ width: '100%', height: 220 }}>
        <ResponsiveContainer>
          <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <XAxis
              dataKey="month"
              tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
              tickFormatter={v => v % 12 === 0 && v > 0 ? `${v / 12}y` : v === 0 ? 'Now' : ''}
            />
            <YAxis
              tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatBig}
              width={48}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={startValue} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
            <Line
              type="monotone"
              dataKey="without"
              name="Without habit"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth={1.5}
              dot={false}
              strokeDasharray="4 4"
            />
            <Line
              type="monotone"
              dataKey="with"
              name={habitName || 'With habit'}
              stroke={TEAL}
              strokeWidth={2.5}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Tagline */}
      <p style={{ textAlign: 'center', fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', margin: '16px 0 0' }}>
        Tiny daily disciplines compound into extraordinary results.
      </p>
    </div>
  )
}
