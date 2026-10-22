// ─────────────────────────────────────────────────────────────
//  __tests__/engine/nakshatramshaAnalysis.test.ts
//  D27 Nakshatramsha — bandwidth, ask themes, D3 layer link
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { analyzeNakshatramsha } from '@/lib/engine/nakshatramshaAnalysis'
import type { ChartOutput, Dignity, GrahaData, GrahaId, Rashi } from '@/types/astrology'

function stubGraha(partial: Partial<GrahaData> & { id: GrahaId; rashi: Rashi }): GrahaData {
  return {
    name: partial.id,
    lonTropical: 0,
    lonSidereal: (partial.rashi - 1) * 30 + 5,
    latitude: 0,
    speed: 1,
    isRetro: false,
    isCombust: false,
    rashiName: String(partial.rashi),
    degree: 5,
    totalDegree: (partial.rashi - 1) * 30 + 5,
    nakshatraIndex: 0,
    nakshatraName: 'Ashwini',
    pada: 1,
    dignity: (partial.dignity ?? 'neutral') as Dignity,
    avastha: { baladi: 'Yuva', jagradadi: 'Jagrat' },
    charaKaraka: null,
    gandanta: {
      isGandanta: false, type: null, severity: 'none', position: null,
      distanceFromJunction: null, rashi: partial.rashi, nakshatraIndex: 0, degreeInNakshatra: 0,
    },
    yuddha: { isWarring: false, planets: [], winner: null, loser: null, degreeDifference: 0, orb: 1 },
    pushkara: {
      isPushkara: false, type: null, rashi: partial.rashi, degreeInSign: 5,
      navamsha: 1, isPushkaraNavamsha: false, remedy: null,
    },
    mrityuBhaga: {
      isMrityuBhaga: false, severity: 'none', rashi: partial.rashi, degreeInSign: 5,
      mrityuDegree: 0, distanceFromMrityu: 15, interpretation: null, remedy: null,
    },
    ...partial,
  }
}

function d27Set(
  asc: Rashi,
  overrides: Partial<Record<GrahaId, Rashi>>,
  dignity: Partial<Record<GrahaId, Dignity>> = {},
): GrahaData[] {
  const defaults: Partial<Record<GrahaId, Rashi>> = {
    Su: (((asc - 1 + 1) % 12) + 1) as Rashi,
    Mo: (((asc - 1 + 2) % 12) + 1) as Rashi,
    Ma: (((asc - 1 + 3) % 12) + 1) as Rashi,
    Me: (((asc - 1 + 4) % 12) + 1) as Rashi,
    Ju: (((asc - 1 + 5) % 12) + 1) as Rashi,
    Ve: (((asc - 1 + 6) % 12) + 1) as Rashi,
    Sa: (((asc - 1 + 8) % 12) + 1) as Rashi,
    Ra: (((asc - 1 + 9) % 12) + 1) as Rashi,
    Ke: (((asc - 1 + 10) % 12) + 1) as Rashi,
  }
  const ids: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']
  return ids.map((id) =>
    stubGraha({ id, rashi: overrides[id] ?? defaults[id]!, dignity: dignity[id] ?? 'neutral' }),
  )
}

function chartOf(
  asc: Rashi,
  grahas: GrahaData[],
  d3?: { asc: Rashi; grahas: GrahaData[] },
): ChartOutput {
  const vargas: Record<string, GrahaData[]> = { D27: grahas }
  const vargaLagnas: Record<string, Rashi> = { D27: asc }
  if (d3) {
    vargas.D3 = d3.grahas
    vargaLagnas.D3 = d3.asc
  }
  return {
    grahas,
    lagnas: { ascRashi: 1 as Rashi, ascDegree: 5, ascDegreeInRashi: 5 },
    vargas,
    vargaLagnas,
    dashas: {},
  } as unknown as ChartOutput
}

describe('analyzeNakshatramsha', () => {
  it('returns null without D27', () => {
    expect(analyzeNakshatramsha({ vargas: {}, vargaLagnas: {} } as ChartOutput)).toBeNull()
  })

  it('scores bandwidth and returns ask themes', () => {
    const asc = 5 as Rashi
    const grahas = d27Set(asc, {}, { Ju: 'exalted', Ve: 'own' })
    const a = analyzeNakshatramsha(chartOf(asc, grahas))
    expect(a!.bandwidth.score).toBeGreaterThanOrEqual(0)
    expect(a!.bandwidth.score).toBeLessThanOrEqual(20)
    expect(a!.askThemes.length).toBe(3)
    expect(a!.askThemes[0].reading).toMatch(/ask|client/i)
  })

  it('notes Scorpio lagna transformation stuckness', () => {
    const asc = 8 as Rashi
    const a = analyzeNakshatramsha(chartOf(asc, d27Set(asc, {})))
    expect(a!.focus.consultationHint).toMatch(/stuck|transformation|Ketu/i)
    expect(a!.focus.signFlavor).toMatch(/stuck|transformation/i)
  })

  it('flags Venus-in-7th repeat across D3 and D27', () => {
    const d27Asc = 1 as Rashi
    const d3Asc = 2 as Rashi
    // D27: Venus in H7 = rashi 7 from Aries
    const d27 = d27Set(d27Asc, { Ve: 7 })
    // D3: Venus in H7 = rashi 8 from Taurus (2+6)
    const d3 = d27Set(d3Asc, { Ve: 8 })
    const a = analyzeNakshatramsha(chartOf(d27Asc, d27, { asc: d3Asc, grahas: d3 }))
    expect(a!.layerLink.d3OverlapNote).toMatch(/Venus|marriage|partnership/i)
  })

  it('includes layering insight', () => {
    const asc = 12 as Rashi
    const a = analyzeNakshatramsha(chartOf(asc, d27Set(asc, {})))
    expect(a!.insights.some((i) => i.title === 'Layering')).toBe(true)
    expect(a!.purpose).toMatch(/bandwidth/i)
  })
})
