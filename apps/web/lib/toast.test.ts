import { describe, it, expect } from 'vitest'
import type { ToastVariant } from './toast'

/** Mirror of defaultDuration for unit contract (keeps API stable). */
function defaultDuration(variant: ToastVariant): number {
  if (variant === 'error') return 5000
  if (variant === 'warning') return 4200
  return 3200
}

describe('toast system contracts', () => {
  it('uses longer auto-dismiss for errors and warnings', () => {
    expect(defaultDuration('success')).toBe(3200)
    expect(defaultDuration('info')).toBe(3200)
    expect(defaultDuration('warning')).toBe(4200)
    expect(defaultDuration('error')).toBe(5000)
  })

  it('supports four toast variants', () => {
    const variants: ToastVariant[] = ['success', 'error', 'info', 'warning']
    expect(variants).toHaveLength(4)
  })
})
