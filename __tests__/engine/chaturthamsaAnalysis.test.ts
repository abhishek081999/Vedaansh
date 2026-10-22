// ─────────────────────────────────────────────────────────────
//  __tests__/engine/chaturthamsaAnalysis.test.ts
//  D4 Chaturthamsha — lagna hierarchy, key triad, relocation
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import {
  analyzeChaturthamsa,
  signCount,
} from '@/lib/engine/chaturthamsaAnalysis'
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

/** Spread nine grahas so only listed lagna occupants sit on asc. */
function d4Set(
  asc: Rashi,
  overrides: Partial<Record<GrahaId, Rashi>>,
  retro: GrahaId[] = [],
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
      isRetro: retro.includes(id),
      dignity: id === 'Ju' ? 'own' : 'neutral',
    }),
  )
}

function chartOf(asc: Rashi, grahas: GrahaData[], dashas?: ChartOutput['dashas']): ChartOutput {
  return {
    grahas,
    lagnas: { ascRashi: 1 as Rashi, ascDegree: 5, ascDegreeInRashi: 5 },
    vargas: { D4: grahas },
    vargaLagnas: { D4: asc },
    dashas: dashas ?? {},
  } as unknown as ChartOutput
}

describe('signCount', () => {
  it('counts whole-sign steps', () => {
    expect(signCount(1, 1)).toBe(1)
    expect(signCount(1, 6)).toBe(6)
    expect(signCount(1, 8)).toBe(8)
    expect(signCount(5, 3)).toBe(11)
  })
})

describe('analyzeChaturthamsa', () => {
  it('returns null without D4 data', () => {
    const chart = { vargas: {}, vargaLagnas: {} } as unknown as ChartOutput
    expect(analyzeChaturthamsa(chart)).toBeNull()
  })

  it('fires planet-in-lagna reading when lagna is occupied', () => {
    const asc = 8 as Rashi // Scorpio
    const grahas = d4Set(asc, { Ke: asc })
    const result = analyzeChaturthamsa(chartOf(asc, grahas))
    expect(result).not.toBeNull()
    expect(result!.heart.lagnaEmpty).toBe(false)
    expect(result!.heart.occupants.map((o) => o.id)).toContain('Ke')
    expect(result!.heart.primarySignal.strength).toBe('occupation')
    expect(result!.heart.nodesOnLagna).toBe(true)
    expect(result!.heart.heartDisturbed).toBe(true)
    expect(result!.conflictFlags.some((f) => f.id === 'nodes-lagna')).toBe(true)
    expect(result!.heart.occupants[0]!.reading).toMatch(/Ketu|binary|personal space/i)
    expect(result!.heart.occupants[0]!.signExtras.some((s) => /ghuna|Scorpio|persistent/i.test(s))).toBe(true)
  })

  it('uses lagna lord when D4 lagna is empty (Saturn–Moon Vish-style)', () => {
    // Gemini lagna → lord Mercury; put Me with Sa+Mo in 4th (Virgo from Gemini = H4)
    const asc = 3 as Rashi
    const fourth = 6 as Rashi
    const grahas = d4Set(asc, {
      Me: fourth,
      Sa: fourth,
      Mo: fourth,
      Ma: 11 as Rashi, // keep Mars off the 4th (default asc+3 lands on Virgo)
    })
    // Ensure nothing on lagna
    for (const g of grahas) {
      if (g.rashi === asc) g.rashi = (((asc - 1 + 2) % 12) + 1) as Rashi
    }
    grahas.find((g) => g.id === 'Me')!.rashi = fourth
    grahas.find((g) => g.id === 'Sa')!.rashi = fourth
    grahas.find((g) => g.id === 'Mo')!.rashi = fourth
    grahas.find((g) => g.id === 'Ma')!.rashi = 11 as Rashi

    const result = analyzeChaturthamsa(chartOf(asc, grahas))
    expect(result).not.toBeNull()
    expect(result!.heart.lagnaEmpty).toBe(true)
    expect(result!.heart.primarySignal.strength).toBe('lord')
    expect(result!.heart.lagnaLord.id).toBe('Me')
    expect(result!.heart.lagnaLord.house).toBe(4)
    expect(result!.heart.lagnaLord.conjunctIds.sort()).toEqual(['Mo', 'Sa'])
    expect(result!.heart.lagnaLord.reading).toMatch(/Saturn|overthinking|insecurity|Vish/i)
    expect(result!.insights.some((i) => /Empty D4 lagna/i.test(i.title))).toBe(true)
  })

  it('records aspects on empty lagna as partial influence', () => {
    // Aries lagna empty; Mercury in Libra (7th) aspects lagna
    const asc = 1 as Rashi
    const grahas = d4Set(asc, { Me: 7 as Rashi })
    for (const g of grahas) {
      if (g.rashi === asc && g.id !== 'Me') {
        // leave non-Me off lagna — defaults already offset
      }
    }
    // Force no one on lagna
    for (const g of grahas) {
      if (houseOf(g.rashi, asc) === 1) {
        g.rashi = 2 as Rashi
      }
    }
    grahas.find((g) => g.id === 'Me')!.rashi = 7 as Rashi

    const result = analyzeChaturthamsa(chartOf(asc, grahas))
    expect(result).not.toBeNull()
    expect(result!.heart.lagnaEmpty).toBe(true)
    expect(result!.heart.primarySignal.strength).toBe('lord')
    expect(result!.heart.aspectsOnLagna.some((a) => a.id === 'Me')).toBe(true)
    expect(result!.heart.aspectsOnLagna.find((a) => a.id === 'Me')!.relativeStrength).toBe('partial')
    expect(result!.insights.some((i) => /Aspects on empty lagna/i.test(i.title))).toBe(true)
  })

  it('flags relocation on 8th / 6–8 dasha links', () => {
    const asc = 1 as Rashi
    // Ketu in 8th (Scorpio), Mercury in 6th from Ketu → Gemini if Ke in Sc? 
    // Ke in house 8 = rashi 8. Me in 6th from Ke = signCount 6 → rashi ((8-1+5)%12)+1 = 1? 
    // signCount(from,to)=6 means to = from+5 mod. from 8 → 1 is signCount 6? 
    // (1-8+12)%12+1 = 6 yes.
    const grahas = d4Set(asc, { Ke: 8 as Rashi, Me: 1 as Rashi })
    for (const g of grahas) {
      if (g.rashi === asc && g.id !== 'Me') g.rashi = 2 as Rashi
    }
    grahas.find((g) => g.id === 'Ke')!.rashi = 8 as Rashi
    grahas.find((g) => g.id === 'Me')!.rashi = 1 as Rashi

    const now = Date.now()
    const dashas = {
      vimshottari: [{
        lord: 'Ke',
        start: new Date(now - 86400000),
        end: new Date(now + 86400000 * 365),
        durationMs: 86400000 * 365,
        level: 1,
        isCurrent: true,
        children: [{
          lord: 'Me',
          start: new Date(now - 86400000),
          end: new Date(now + 86400000 * 30),
          durationMs: 86400000 * 30,
          level: 2,
          isCurrent: true,
          children: [],
        }],
      }],
    }

    const result = analyzeChaturthamsa(chartOf(asc, grahas, dashas as unknown as ChartOutput['dashas']))
    expect(result).not.toBeNull()
    expect(result!.relocation).not.toBeNull()
    expect(result!.relocation!.eighthOccupants.some((o) => o.id === 'Ke')).toBe(true)
    expect(result!.relocation!.eighthLordPeriodActive).toBe(true)
    expect(result!.relocation!.sixthEighthDashaLink).toBe(true)
    expect(result!.relocation!.tone).toBe('challenging')
  })

  it('notes retrograde intensity on lagna', () => {
    const asc = 2 as Rashi
    const grahas = d4Set(asc, { Ma: asc }, ['Ma'])
    const result = analyzeChaturthamsa(chartOf(asc, grahas))
    expect(result).not.toBeNull()
    expect(result!.heart.occupants[0]!.isRetro).toBe(true)
    expect(result!.retrogradeNotes.some((n) => /Mars|obsessive/i.test(n))).toBe(true)
  })

  it('exposes key triad and focused houses', () => {
    const asc = 5 as Rashi
    const grahas = d4Set(asc, { Su: asc })
    const result = analyzeChaturthamsa(chartOf(asc, grahas))
    expect(result).not.toBeNull()
    expect(result!.keyTriad).toHaveLength(3)
    expect(result!.keyTriad.map((t) => t.role).sort()).toEqual(['fourthLord', 'jupiter', 'moon'])
    expect(result!.focusedHouses.map((h) => h.house)).toEqual([3, 4, 6, 8, 9, 11])
    expect(result!.purpose).toMatch(/contentment|4th/i)
    expect(result!.affinityGuide.length).toBeGreaterThan(0)
  })
})

function houseOf(planetRashi: Rashi, ascRashi: Rashi): number {
  return ((planetRashi - ascRashi + 12) % 12) + 1
}
