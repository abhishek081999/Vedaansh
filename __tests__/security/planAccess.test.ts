import { describe, expect, it } from 'vitest'
import { planMeetsGate } from '@/lib/security/planAccess'

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
