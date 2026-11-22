// Business / friendship compatibility (pure engine).
import { describe, expect, it } from 'vitest'
import type { ChartOutput, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { getNakshatra } from '@/lib/engine/nakshatra'
import { partnerCompatibility } from '@/lib/engine/partnerCompat'

function g(id: GrahaId, lon: number): GrahaData {
  return {
    id, lonSidereal: lon, totalDegree: lon, rashi: (Math.floor(lon / 30) + 1) as Rashi,
    nakshatraIndex: getNakshatra(lon).index,
  } as unknown as GrahaData
}
function chart(asc: Rashi, lons: Partial<Record<GrahaId, number>>, name = ''): ChartOutput {
  const ids: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']
  return {
    meta: { name },
    lagnas: { ascRashi: asc, ascDegree: (asc - 1) * 30 + 10 },
    grahas: ids.map((id) => g(id, lons[id] ?? 0)),
  } as unknown as ChartOutput
}

// A: Lagna Aries, Moon Cancer, Jupiter Leo. B: Lagna Leo, Moon Scorpio.
const A = chart(1, { Su: 10, Mo: 95, Ma: 200, Me: 15, Ju: 130, Ve: 40, Sa: 280, Ra: 60, Ke: 240 })
const B = chart(5, { Su: 250, Mo: 215, Ma: 320, Me: 255, Ju: 100, Ve: 230, Sa: 100, Ra: 150, Ke: 330 })

describe('partnerCompatibility', () => {
  for (const mode of ['business', 'friendship'] as const) {
    it(`gives a bounded score and consistent factors (${mode})`, () => {
      const r = partnerCompatibility(A, B, mode)
      expect(r.score).toBeGreaterThanOrEqual(0)
      expect(r.score).toBeLessThanOrEqual(100)
      expect(r.factors.length).toBe(mode === 'business' ? 7 : 8)
      for (const f of r.factors) {
        expect(f.points).toBeLessThanOrEqual(f.max)
        expect(f.reason.length).toBeGreaterThan(5)
      }
      expect(['strong', 'workable', 'care']).toContain(r.band)
    })

    it(`has no English left in Hindi (${mode})`, () => {
      const r = partnerCompatibility(A, B, mode, 'hi')
      for (const f of r.factors) {
        expect(f.label, f.id).not.toMatch(/[A-Za-z]/)
        expect(f.reason, f.id).not.toMatch(/[A-Za-z]/)
      }
      expect(r.verdict + r.summary).not.toMatch(/[A-Za-z]/)
    })
  }

  it('scores the same Moon sign and Lagna higher than a 6/8 pair', () => {
    const twin = partnerCompatibility(A, A, 'friendship')
    const sixEight = partnerCompatibility(A, chart(6, { Mo: 275, Su: 0, Ma: 0, Me: 0, Ju: 0, Ve: 0, Sa: 95, Ra: 0, Ke: 0 }), 'friendship')
    expect(twin.score).toBeGreaterThan(sixEight.score)
    expect(sixEight.factors.find((f) => f.id === 'lagna')?.level).toBe('bad')
    expect(sixEight.factors.find((f) => f.id === 'friction')!.points).toBeLessThan(0)
  })

  it('credits a benefic in the other’s 11th house for business', () => {
    // A's Jupiter is in Leo, the 11th sign from B's Libra Lagna.
    const b = chart(7, { Mo: 10, Su: 0, Ma: 0, Me: 0, Ju: 0, Ve: 0, Sa: 0, Ra: 0, Ke: 0 })
    const r = partnerCompatibility(A, b, 'business')
    expect(r.factors.find((f) => f.id === 'gains')!.points).toBeGreaterThan(0)
  })
})
