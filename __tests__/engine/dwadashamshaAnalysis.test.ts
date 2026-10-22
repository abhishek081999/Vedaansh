// ─────────────────────────────────────────────────────────────
//  __tests__/engine/dwadashamshaAnalysis.test.ts
//  D12 Dwadashamsha — thirst, isolation, Ketu release, contrasts
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { analyzeDwadashamsha } from '@/lib/engine/dwadashamshaAnalysis'
import type { ChartOutput, Dignity, GrahaData, GrahaId, Rashi } from '@/types/astrology'

function stubGraha(partial: Partial<GrahaData> & { id: GrahaId; rashi: Rashi }): GrahaData {
  return {
    name: partial.id,
    lonTropical: 0,
    lonSidereal: (partial.rashi - 1) * 30 + (partial.degree ?? 5),
    latitude: 0,
    speed: partial.isRetro ? -1 : 1,
    isRetro: partial.isRetro ?? false,
    isCombust: false,
    rashiName: String(partial.rashi),
    degree: partial.degree ?? 5,
    totalDegree: (partial.rashi - 1) * 30 + (partial.degree ?? 5),
    nakshatraIndex: 0,
    nakshatraName: 'Ashwini',
    pada: 1,
    dignity: (partial.dignity ?? 'neutral') as Dignity,
    avastha: { baladi: 'Yuva', jagradadi: 'Jagrat' },
    charaKaraka: null,
    gandanta: {
      isGandanta: false,
      type: null,
      severity: 'none',
      position: null,
      distanceFromJunction: null,
      rashi: partial.rashi,
      nakshatraIndex: 0,
      degreeInNakshatra: 0,
    },
    yuddha: {
      isWarring: false,
      planets: [],
      winner: null,
      loser: null,
      degreeDifference: 0,
      orb: 1,
    },
    pushkara: {
      isPushkara: false,
      type: null,
      rashi: partial.rashi,
      degreeInSign: partial.degree ?? 5,
      navamsha: 1,
      isPushkaraNavamsha: false,
      remedy: null,
    },
    mrityuBhaga: {
      isMrityuBhaga: false,
      severity: 'none',
      rashi: partial.rashi,
      degreeInSign: partial.degree ?? 5,
      mrityuDegree: 0,
      distanceFromMrityu: 15,
      interpretation: null,
      remedy: null,
    },
    ...partial,
  }
}

function d12Set(
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
    stubGraha({
      id,
      rashi: overrides[id] ?? defaults[id] ?? (((asc - 1 + 1) % 12) + 1) as Rashi,
      dignity: dignity[id] ?? 'neutral',
    }),
  )
}

function chartOf(
  asc: Rashi,
  grahas: GrahaData[],
  extras?: Partial<{ D3: GrahaData[]; D4: GrahaData[]; D2: GrahaData[]; D6: GrahaData[] }>,
): ChartOutput {
  const vargas: Record<string, GrahaData[]> = { D12: grahas }
  const vargaLagnas: Record<string, Rashi> = { D12: asc }
  if (extras?.D3) {
    vargas.D3 = extras.D3
    vargaLagnas.D3 = 1
  }
  if (extras?.D4) {
    vargas.D4 = extras.D4
    vargaLagnas.D4 = 1
  }
  if (extras?.D2) {
    vargas.D2 = extras.D2
    vargaLagnas.D2 = 1
  }
  if (extras?.D6) {
    vargas.D6 = extras.D6
    vargaLagnas.D6 = 1
  }
  return {
    grahas,
    lagnas: { ascRashi: 1 as Rashi, ascDegree: 5, ascDegreeInRashi: 5 },
    vargas,
    vargaLagnas,
    dashas: {},
  } as unknown as ChartOutput
}

describe('analyzeDwadashamsha', () => {
  it('returns null without D12 data', () => {
    const chart = {
      grahas: [],
      lagnas: { ascRashi: 1, ascDegree: 0, ascDegreeInRashi: 0 },
      vargas: {},
      vargaLagnas: {},
    } as unknown as ChartOutput
    expect(analyzeDwadashamsha(chart)).toBeNull()
  })

  it('flags debilitated Jupiter as primary thirst', () => {
    const asc = 8 as Rashi // Scorpio
    // Jupiter debilitated in Capricorn = H3 from Scorpio
    const grahas = d12Set(asc, { Ju: 10 }, { Ju: 'debilitated' })
    const a = analyzeDwadashamsha(chartOf(asc, grahas))
    expect(a).not.toBeNull()
    expect(a!.thirst?.id).toBe('Ju')
    expect(a!.thirst?.reading).toMatch(/sweetness|appreciation|closure/i)
    expect(a!.insights.some((i) => i.title.includes('Thirst'))).toBe(true)
  })

  it('marks alone-in-dreams when kendras are mostly empty', () => {
    const asc = 12 as Rashi // Pisces
    // Non-kendra rashis from Pisces (H2,3,5,6,8,9,11,12): 1,2,4,5,7,8,10,11
    const alone = d12Set(asc, {
      Su: 1,
      Mo: 2,
      Ma: 4,
      Me: 5,
      Ju: 7,
      Ve: 8,
      Sa: 10,
      Ra: 11,
      Ke: 1,
    })
    const a = analyzeDwadashamsha(chartOf(asc, alone))
    expect(a!.isolation.aloneInDreams).toBe(true)
    expect(a!.isolation.emptyKendras).toEqual([1, 4, 7, 10])
  })

  it('treats Ketu in 12th as supportive release', () => {
    const asc = 1 as Rashi
    const grahas = d12Set(asc, { Ke: 12 }, { Ke: 'own' })
    const a = analyzeDwadashamsha(chartOf(asc, grahas))
    expect(a!.ketuRelease.house).toBe(12)
    expect(a!.ketuRelease.tone).toBe('supportive')
    expect(a!.ketuRelease.reading).toMatch(/release|letting go|12th/i)
  })

  it('adds D4×D3 cross note when both vargas exist', () => {
    const asc = 5 as Rashi
    const grahas = d12Set(asc, {})
    const a = analyzeDwadashamsha(
      chartOf(asc, grahas, {
        D3: d12Set(1 as Rashi, {}),
        D4: d12Set(1 as Rashi, {}),
      }),
    )
    expect(a!.crossNotes.some((n) => n.id === 'd4xd3')).toBe(true)
    expect(a!.contrasts).toHaveLength(3)
    expect(a!.contrasts.map((c) => c.id)).toEqual(['d4', 'd8', 'd12'])
  })

  it('reads Scorpio lagna isolation flavor', () => {
    const asc = 8 as Rashi
    const grahas = d12Set(asc, { Mo: 8 }) // Moon on lagna
    const a = analyzeDwadashamsha(chartOf(asc, grahas))
    expect(a!.d12Lagna).toBe(8)
    expect(a!.isolation.signFlavor).toMatch(/not being heard|restlessness|bottled/i)
    expect(a!.isolation.occupants.some((o) => o.id === 'Mo')).toBe(true)
  })
})
