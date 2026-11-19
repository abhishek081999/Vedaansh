// Lal Kitab Teva correction: Nishaniyan ticks score a ±2h Lagna window.

import { describe, expect, it } from 'vitest'
import type { ChartOutput, Rashi } from '@/types/astrology'
import {
  LK_NEECH,
  buildTeva, buildTevaWithLagna, lkSignedFromTicks, lkSuspectHouses, lkTevaCorrection,
  type LkGraha,
} from '@/lib/engine/lalKitab'

function fakeChart(asc: Rashi, signs: Partial<Record<LkGraha, Rashi>>, ascDegree?: number): ChartOutput {
  const grahas = (Object.entries(signs) as [LkGraha, Rashi][]).map(([id, rashi]) => ({ id, rashi, isRetro: false }))
  const deg = ascDegree ?? (asc - 1) * 30 + 15
  return { grahas, lagnas: { ascRashi: asc, ascDegree: deg } } as unknown as ChartOutput
}

const chart = fakeChart(5, { Su: 5, Mo: 8, Ma: 12, Me: 6, Ju: 9, Ve: 5, Sa: 11, Ra: 2, Ke: 8 })

describe('lkSignedFromTicks', () => {
  it('groups ticks by planet and marks expectHard at two ticks', () => {
    const signed = lkSignedFromTicks(['Sa.1', 'Sa.2', 'Ju.1'])
    expect(signed.find((s) => s.planet === 'Sa')).toMatchObject({ ticks: 2, expectHard: true })
    expect(signed.find((s) => s.planet === 'Ju')).toMatchObject({ ticks: 1, expectHard: false })
  })
})

describe('buildTevaWithLagna', () => {
  it('rotates houses when the Lagna changes by one rashi', () => {
    expect(buildTeva(chart).house.Su).toBe(1)
    expect(buildTevaWithLagna(chart, 4).house.Su).toBe(2)
  })
})

describe('lkTevaCorrection', () => {
  it('asks for more signs when almost nothing is ticked', () => {
    expect(lkTevaCorrection(chart, ['Sa.1']).needsMoreSigns).toBe(true)
  })

  it('scores Lagna candidates and keeps the current birth Lagna', () => {
    const r = lkTevaCorrection(chart, ['Sa.1', 'Sa.2', 'Sa.3', 'Ju.1', 'Ju.2'])
    expect(r.candidates.length).toBeGreaterThanOrEqual(2)
    expect(r.current).not.toBeNull()
    expect(r.current!.ascRashi).toBe(5)
    expect(r.best).not.toBeNull()
    expect(r.best!.score).toBe(r.candidates[0]!.score)
  })

  it('scores a neech Saturn Lagna higher than a safer one for Saturn signs', () => {
    const ticks = ['Sa.1', 'Sa.2', 'Sa.3']
    // Sa in Aries (1). Aries lagna → Sa house 1 (neech). Capricorn lagna → Sa house 4.
    const atAri = lkTevaCorrection(
      fakeChart(1, { Su: 4, Mo: 5, Ma: 6, Me: 7, Ju: 8, Ve: 9, Sa: 1, Ra: 11, Ke: 5 }, 15),
      ticks,
      { offsetsHours: [0] },
    )
    const atCap = lkTevaCorrection(
      fakeChart(10, { Su: 4, Mo: 5, Ma: 6, Me: 7, Ju: 8, Ve: 9, Sa: 1, Ra: 11, Ke: 5 }, (10 - 1) * 30 + 15),
      ticks,
      { offsetsHours: [0] },
    )
    expect(atAri.current!.teva.house.Sa).toBe(1)
    expect(atCap.current!.teva.house.Sa).toBe(4)
    expect(atAri.current!.sides.Sa === 'hard' || atAri.current!.sides.Sa === 'mixed').toBe(true)
    expect(atAri.current!.score).toBeGreaterThan(atCap.current!.score)
  })

  it('lists neech first among suspect houses', () => {
    expect(lkSuspectHouses('Sa')[0]).toBe(LK_NEECH.Sa[0])
  })
})
