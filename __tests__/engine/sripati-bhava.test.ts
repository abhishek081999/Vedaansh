// __tests__/engine/sripati-bhava.test.ts
// Sripati Bhava Madhya / Sandhi / Dasham Madhya — pure logic

import { describe, it, expect } from 'vitest'
import { calcSripatiBhava, planetInSripatiHouse } from '@/lib/engine/sripatiBhava'

describe('calcSripatiBhava', () => {
  it('anchors Lagna Madhya to Asc and Dasham Madhya to MC', () => {
    const asc = 14.2 // 0S 14°12'
    const mc = 284.1 // 9S 14°06'
    const r = calcSripatiBhava(asc, mc)

    expect(r.lagnaMadhya).toBeCloseTo(asc, 6)
    expect(r.dashamMadhya).toBeCloseTo(mc, 6)
    expect(r.madhyas[0]).toBeCloseTo(asc, 6)
    expect(r.madhyas[9]).toBeCloseTo(mc, 6)
    expect(r.saptamaMadhya).toBeCloseTo((asc + 180) % 360, 6)
    expect(r.chaturthaMadhya).toBeCloseTo((mc + 180) % 360, 6)
  })

  it('returns 12 madhyas and 12 sandhis', () => {
    const r = calcSripatiBhava(10, 280)
    expect(r.madhyas).toHaveLength(12)
    expect(r.sandhis).toHaveLength(12)
  })

  it('matches successive +arc/6 from MC toward Lagna (classroom method)', () => {
    // Class example shape: Asc 0S14°12', MC 9S14°06'
    const asc = 14 + 12 / 60
    const mc = 9 * 30 + 14 + 6 / 60
    const r = calcSripatiBhava(asc, mc)

    const q4 = (asc - mc + 360) % 360
    const step = q4 / 6

    // From Dasham Madhya, +1 step = 10–11 sandhi, +2 = 11th madhya, …
    expect(r.sandhis[9]).toBeCloseTo((mc + step) % 360, 5)       // end of H10 / start of H11
    expect(r.madhyas[10]).toBeCloseTo((mc + 2 * step) % 360, 5)   // 11th madhya
    expect(r.sandhis[10]).toBeCloseTo((mc + 3 * step) % 360, 5)
    expect(r.madhyas[11]).toBeCloseTo((mc + 4 * step) % 360, 5)   // 12th madhya
    expect(r.sandhis[11]).toBeCloseTo((mc + 5 * step) % 360, 5)
    expect(r.madhyas[0]).toBeCloseTo((mc + 6 * step) % 360, 5)    // back to Lagna
  })

  it('places a planet at madhya inside that house', () => {
    const r = calcSripatiBhava(14.2, 284.1)
    expect(planetInSripatiHouse(r.madhyas[0], r.sandhis)).toBe(1)
    expect(planetInSripatiHouse(r.madhyas[9], r.sandhis)).toBe(10)
    expect(planetInSripatiHouse(r.madhyas[3], r.sandhis)).toBe(4)
  })

  it('places a planet near sandhi into the following house range consistently', () => {
    const r = calcSripatiBhava(30, 300)
    // Just inside sandhi end of house 1 → still house 1; just at/after → house 2
    const end1 = r.sandhis[0]
    const justBefore = (end1 - 0.01 + 360) % 360
    const justAfter = (end1 + 0.01) % 360
    expect(planetInSripatiHouse(justBefore, r.sandhis)).toBe(1)
    expect(planetInSripatiHouse(justAfter, r.sandhis)).toBe(2)
  })
})
