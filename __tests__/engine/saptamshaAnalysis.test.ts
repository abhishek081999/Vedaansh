// ─────────────────────────────────────────────────────────────
//  __tests__/engine/saptamshaAnalysis.test.ts
//  D7 Saptamsha — pillars, progeny, desire, relating clutch
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { analyzeSaptamsha } from '@/lib/engine/saptamshaAnalysis'
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

function d7Set(
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
  roles: Partial<Record<GrahaId, string>> = {},
  opts: { d3Asc?: Rashi; d3?: GrahaData[] } = {},
): ChartOutput {
  const d1 = grahas.map((g) => stubGraha({
    id: g.id,
    rashi: g.rashi,
    dignity: g.dignity,
    charaKaraka: roles[g.id] ?? null,
  }))
  return {
    grahas: d1,
    lagnas: { ascRashi: 1 as Rashi, ascDegree: 5, ascDegreeInRashi: 5 },
    vargas: {
      D7: grahas,
      ...(opts.d3 ? { D3: opts.d3 } : {}),
    },
    vargaLagnas: {
      D7: asc,
      ...(opts.d3Asc != null ? { D3: opts.d3Asc } : {}),
    },
    dashas: {},
  } as unknown as ChartOutput
}

describe('analyzeSaptamsha', () => {
  it('returns null without D7 data', () => {
    const chart = {
      grahas: [],
      lagnas: { ascRashi: 1, ascDegree: 0, ascDegreeInRashi: 0 },
      vargas: {},
      vargaLagnas: {},
    } as unknown as ChartOutput
    expect(analyzeSaptamsha(chart)).toBeNull()
  })

  it('builds four purva-punya pillars', () => {
    const asc = 5 as Rashi // Leo
    const a = analyzeSaptamsha(chartOf(asc, d7Set(asc, { Ju: 2, Su: 5 })))
    expect(a).not.toBeNull()
    expect(a!.pillars.map((p) => p.id)).toEqual(['dharma', 'artha', 'kama', 'moksha'])
    expect(a!.pillars.find((p) => p.id === 'kama')!.reading).toMatch(/Taurus|kama|fertility/i)
    expect(a!.d7Lagna).toBe(5)
  })

  it('flags weak Sun for progeny conception pressure', () => {
    const asc = 1 as Rashi
    const a = analyzeSaptamsha(chartOf(asc, d7Set(asc, { Su: 8 }, { Su: 'debilitated' })))
    expect(a!.progeny.tone).toBe('challenging')
    expect(a!.progeny.conceptionNote).toMatch(/debilitated|8th|friction|delay/i)
  })

  it('reads Venus sign as preference and Moon sign as attachment', () => {
    const asc = 7 as Rashi
    const a = analyzeSaptamsha(chartOf(asc, d7Set(asc, { Ve: 4, Mo: 1 })))
    expect(a!.desire.venus?.rashi).toBe(4)
    expect(a!.desire.venus?.reading).toMatch(/caring|home/i)
    expect(a!.desire.moon?.reading).toMatch(/Narasimha|Durga|Hanuman|guardian/i)
  })

  it('marks lagna lord in 7th as other-held clutch', () => {
    const asc = 1 as Rashi // Mars rules Aries; put Mars in Libra = H7
    const a = analyzeSaptamsha(chartOf(asc, d7Set(asc, { Ma: 7 })))
    expect(a!.relating.clutch).toBe('other')
    expect(a!.relating.patterns.some((p) => p.id === 'l1-h7')).toBe(true)
  })

  it('detects Saturn–Ketu in 7th as one-sided pattern', () => {
    const asc = 1 as Rashi
    const a = analyzeSaptamsha(chartOf(asc, d7Set(asc, { Sa: 7, Ke: 7 })))
    expect(a!.relating.patterns.some((p) => p.id === 'sa-ke')).toBe(true)
    expect(a!.relating.patterns.find((p) => p.id === 'sa-ke')!.text).toMatch(/one-sided|delay|filter/i)
  })

  it('flags Venus in Sagittarius trust/boundary pattern', () => {
    const asc = 2 as Rashi
    const a = analyzeSaptamsha(chartOf(asc, d7Set(asc, { Ve: 9 })))
    expect(a!.relating.patterns.some((p) => p.id === 'venus-sag')).toBe(true)
  })

  it('includes past-life friend hint from D7 lagna', () => {
    const asc = 11 as Rashi
    const a = analyzeSaptamsha(chartOf(asc, d7Set(asc, {})))
    expect(a!.relating.pastLifeFriendHint).toMatch(/past-life friend|Aquarius|trine/i)
    expect(a!.relating.signFlavor).toMatch(/unexpected|friendship|past-life/i)
  })

  it('maps Moon–Ketu in Sagittarius to Krishna devotion', () => {
    const asc = 1 as Rashi
    const a = analyzeSaptamsha(chartOf(asc, d7Set(asc, { Mo: 9, Ke: 9 })))
    expect(a!.devotion.reading).toMatch(/Krishna/i)
  })

  it('flags Aquarius / Rahu unconventional relating pattern', () => {
    const asc = 2 as Rashi
    const a = analyzeSaptamsha(chartOf(asc, d7Set(asc, { Ra: 11 })))
    expect(a!.relating.patterns.some((p) => p.id === 'aq-ra')).toBe(true)
  })

  it('reads strong BK on D7 lagna as recognition', () => {
    const asc = 1 as Rashi
    const grahas = d7Set(asc, { Ju: 1 }, { Ju: 'exalted' })
    const a = analyzeSaptamsha(chartOf(asc, grahas, { Ju: 'BK', Su: 'AK', Ve: 'DK' }))
    expect(a!.recognition.bhratriId).toBe('Ju')
    expect(a!.recognition.strong).toBe(true)
    expect(a!.recognition.bhratriReading).toMatch(/medals|fame|recognition|BK/i)
  })

  it('flags Mercury papa-kartari youth imprint', () => {
    const asc = 1 as Rashi
    // Mercury in Gemini (H3); malefics in Taurus (H2) and Cancer (H4)
    const a = analyzeSaptamsha(chartOf(asc, d7Set(asc, { Me: 3, Ma: 2, Sa: 4 })))
    expect(a!.relating.patterns.some((p) => p.id === 'me-papa')).toBe(true)
  })

  it('flags Taurus Jupiter as age-growing attraction', () => {
    const asc = 5 as Rashi
    const a = analyzeSaptamsha(chartOf(asc, d7Set(asc, { Ju: 2 })))
    expect(a!.relating.patterns.some((p) => p.id === 'tau-ju-me')).toBe(true)
  })

  it('flags Moon on D7 lagna as multiple-bond tendency', () => {
    const asc = 4 as Rashi
    const a = analyzeSaptamsha(chartOf(asc, d7Set(asc, { Mo: 4 })))
    expect(a!.loveLife.playboyFlag).toBe(true)
    expect(a!.loveLife.patterns.some((p) => p.id === 'playboy-moon')).toBe(true)
  })

  it('flags Ketu in 12th as partner-exit tone', () => {
    const asc = 1 as Rashi
    const a = analyzeSaptamsha(chartOf(asc, d7Set(asc, { Ke: 12 })))
    expect(a!.loveLife.departureReading).toMatch(/exit|gone|finished|Ketu/i)
    expect(a!.loveLife.patterns.some((p) => p.id === 'depart-ke')).toBe(true)
  })

  it('flags 8th house load as hidden-bond pressure', () => {
    const asc = 1 as Rashi
    const a = analyzeSaptamsha(chartOf(asc, d7Set(asc, { Ma: 8, Ra: 8 })))
    expect(a!.loveLife.hiddenReading).toMatch(/hidden|private|8th/i)
  })

  it('flags Mars–Ketu conjunct for miscarriage pressure note', () => {
    const asc = 1 as Rashi
    const a = analyzeSaptamsha(chartOf(asc, d7Set(asc, { Ma: 5, Ke: 5 })))
    expect(a!.progeny.miscarriageNote).toMatch(/Mars|Ketu|miscarriage|incomplete/i)
  })

  it('flags Moon–Mercury conjunct for adoption / another’s-child note', () => {
    const asc = 1 as Rashi
    const a = analyzeSaptamsha(chartOf(asc, d7Set(asc, { Mo: 4, Me: 4 })))
    expect(a!.progeny.adoptionNote).toMatch(/Moon|Mercury|adoption|another/i)
  })

  it('cross-reads D3 Libra / 12th and Venus–Rahu for mind timing', () => {
    const asc = 1 as Rashi
    const d3Asc = 1 as Rashi
    const d3 = d7Set(d3Asc, { Ve: 7, Ra: 7, Ju: 12 })
    const a = analyzeSaptamsha(chartOf(asc, d7Set(asc, {}), {}, { d3Asc, d3 }))
    expect(a!.loveLife.d3Notes.some((n) => n.id === 'd3-mind')).toBe(true)
    expect(a!.loveLife.d3Notes.some((n) => n.id === 'd3-libra12')).toBe(true)
    expect(a!.loveLife.d3Notes.some((n) => n.id === 'd3-ve-ra')).toBe(true)
  })

  it('notes missing D3 when Drekkana is absent', () => {
    const asc = 1 as Rashi
    const a = analyzeSaptamsha(chartOf(asc, d7Set(asc, {})))
    expect(a!.loveLife.d3Notes.some((n) => n.id === 'd3-missing')).toBe(true)
  })

  it('flags Ju/Sa on D7 lagna as steadiness / fewer cheating options', () => {
    const asc = 1 as Rashi
    const a = analyzeSaptamsha(chartOf(asc, d7Set(asc, { Ju: 1, Sa: 1 })))
    expect(a!.loveLife.fidelityReading).toMatch(/steadiness|cheating|Strong Jupiter|Saturn/i)
  })
})
