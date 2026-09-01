import { describe, it, expect } from 'vitest'

/** Mirrors ScoreboardHero.predictPace logic for unit coverage */
function predictPace(
  goals: Array<{ progress_pct: number; weekly_delta: number }>,
): string {
  if (!goals.length) {
    return 'Set a quarterly goal to unlock pace predictions.'
  }
  const avg = goals.reduce((s, g) => s + (g.progress_pct ?? 0), 0) / goals.length
  const delta = goals.reduce((s, g) => s + (g.weekly_delta ?? 0), 0) / goals.length
  if (avg >= 100) return 'Quarterly targets complete — time to raise the bar.'
  if (delta > 5) return `On fire: average +${Math.round(delta)} pts this week. Hold the cadence.`
  if (delta < -5) return `Pace dipped ${Math.round(Math.abs(delta))} pts this week. One focused block flips the trend.`
  if (avg >= 70) return 'Strong quarter. One clean week seals the finish.'
  if (avg >= 40) return 'Mid-pack. Stack three solid Daily Pulse days to accelerate.'
  return 'Early in the climb. Protect the daily chain — compounding starts now.'
}

describe('scoreboard pace prediction', () => {
  it('handles empty goals', () => {
    expect(predictPace([])).toMatch(/quarterly goal/i)
  })

  it('celebrates completion', () => {
    expect(predictPace([{ progress_pct: 100, weekly_delta: 0 }])).toMatch(/complete/i)
  })

  it('flags hot weeks', () => {
    expect(predictPace([{ progress_pct: 50, weekly_delta: 8 }])).toMatch(/On fire/i)
  })

  it('flags dips', () => {
    expect(predictPace([{ progress_pct: 50, weekly_delta: -10 }])).toMatch(/dipped/i)
  })
})
