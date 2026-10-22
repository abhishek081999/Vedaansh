import { describe, expect, it } from 'vitest'
import { planMeetsGate } from '@/lib/security/planAccess'
import { getChartSaveLimit } from '@/lib/subscription/entitlements'
import { planMeetsUiGate } from '@/lib/ui/planGate'

describe('planMeetsGate', () => {
  it('gold gate accepts gold and platinum', () => {
    expect(planMeetsGate('gold', 'gold')).toBe(true)
    expect(planMeetsGate('platinum', 'gold')).toBe(true)
    expect(planMeetsGate('free', 'gold')).toBe(false)
  })

  it('platinum gate accepts only platinum', () => {
    expect(planMeetsGate('platinum', 'platinum')).toBe(true)
    expect(planMeetsGate('gold', 'platinum')).toBe(false)
    expect(planMeetsGate('free', 'platinum')).toBe(false)
  })
})

describe('Milan / marriage plan matrix alignment', () => {
  it('UI gold gate matches API gold gate for Relationship and Milan depth', () => {
    expect(planMeetsUiGate('free', 'gold')).toBe(false)
    expect(planMeetsUiGate('gold', 'gold')).toBe(true)
    expect(planMeetsGate('free', 'gold')).toBe(false)
    expect(planMeetsGate('gold', 'gold')).toBe(true)
  })

  it('Milan save caps match chart save limits (20 / 200 / unlimited)', () => {
    expect(getChartSaveLimit('free')).toBe(20)
    expect(getChartSaveLimit('gold')).toBe(200)
    expect(getChartSaveLimit('platinum')).toBe(Infinity)
  })
})
