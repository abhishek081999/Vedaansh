// ─────────────────────────────────────────────────────────────
//  __tests__/engine/dashamsaAnalysis.test.ts
//  Dashamsha Digpala helpers + analysis shape
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import {
  analyzeDashamsa,
  dashamshaPart,
  dashamshaRashi,
  digpalaForPlacement,
  DIGPALA_ORDER,
  signCount,
} from '@/lib/engine/dashamsaAnalysis'
import { buildDashamsaPractical } from '@/lib/engine/dashamsaPractical'
import { D10 } from '@/lib/engine/vargas'
import type { ChartOutput, GrahaData, Rashi } from '@/types/astrology'

function stubGraha(partial: Partial<GrahaData> & { id: GrahaData['id']; rashi: Rashi }): GrahaData {
  return {
    name: partial.id,
    lonTropical: 0,
    lonSidereal: (partial.rashi - 1) * 30 + (partial.degree ?? 5),
    latitude: 0,
    speed: 1,
    isRetro: false,
    isCombust: false,
    rashiName: String(partial.rashi),
    degree: partial.degree ?? 5,
    totalDegree: (partial.rashi - 1) * 30 + (partial.degree ?? 5),
    nakshatraIndex: 0,
    nakshatraName: 'Ashwini',
    pada: 1,
    dignity: partial.dignity ?? 'neutral',
    avastha: { baladi: 'Yuva', jagradadi: 'Jagrat' },
    charaKaraka: partial.charaKaraka ?? null,
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
    pushkara: partial.pushkara ?? {
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

describe('Dashamsha helpers', () => {
  it('dashamshaRashi matches engine D10', () => {
    for (let lon = 0; lon < 360; lon += 3) {
      expect(dashamshaRashi(lon)).toBe(D10(lon))
    }
  })

  it('dashamshaPart is 1–10', () => {
    expect(dashamshaPart(0.1)).toBe(1)
    expect(dashamshaPart(2.9)).toBe(1)
    expect(dashamshaPart(3)).toBe(2)
    expect(dashamshaPart(29.9)).toBe(10)
  })

  it('odd-sign Digpala: part 1 = Indra, part 10 = Ananta', () => {
    expect(digpalaForPlacement(1, 1).id).toBe('indra')
    expect(digpalaForPlacement(1, 28).id).toBe('ananta')
    expect(digpalaForPlacement(1, 7).id).toBe('yama')
  })

  it('even-sign Digpala reverses order', () => {
    expect(digpalaForPlacement(2, 1).id).toBe('ananta')
    expect(digpalaForPlacement(2, 28).id).toBe('indra')
  })

  it('DIGPALA_ORDER has ten deities', () => {
    expect(DIGPALA_ORDER).toHaveLength(10)
    expect(signCount(1, 10)).toBe(10)
  })
})

describe('analyzeDashamsa', () => {
  it('returns null without D10 data', () => {
    const chart = {
      vargas: {},
      vargaLagnas: {},
    } as unknown as ChartOutput
    expect(analyzeDashamsa(chart)).toBeNull()
  })

  it('maps planets D1→D10 with Digpalas and key lords', () => {
    const d1Asc = 1 as Rashi
    const d10Asc = 11 as Rashi
    const grahas = [
      stubGraha({ id: 'Su', rashi: 1, degree: 1, dignity: 'own' }),
      stubGraha({ id: 'Mo', rashi: 9, degree: 12 }),
      stubGraha({ id: 'Ma', rashi: 12, degree: 14 }),
      stubGraha({ id: 'Me', rashi: 10, degree: 8 }),
      stubGraha({ id: 'Ju', rashi: 6, degree: 15, dignity: 'enemy' }),
      stubGraha({ id: 'Ve', rashi: 3, degree: 10 }),
      stubGraha({ id: 'Sa', rashi: 10, degree: 22 }),
      stubGraha({ id: 'Ra', rashi: 9, degree: 3 }),
      stubGraha({ id: 'Ke', rashi: 10, degree: 3 }),
    ]
    const d10 = grahas.map((g) => {
      if (g.id === 'Su') return stubGraha({ id: 'Su', rashi: 1, degree: 10, dignity: 'own' })
      if (g.id === 'Sa') return stubGraha({ id: 'Sa', rashi: 10, degree: 12, dignity: 'own' })
      return stubGraha({ id: g.id, rashi: (((g.rashi + 3 - 1) % 12) + 1) as Rashi, degree: 5 })
    })

    const now = Date.now()
    const chart = {
      grahas,
      lagnas: { ascRashi: d1Asc, ascDegree: 5, ascDegreeInRashi: 5 },
      vargas: { D10: d10 },
      vargaLagnas: { D10: d10Asc },
      dashas: {
        vimshottari: [{
          lord: 'Ju',
          start: new Date(now - 86400000),
          end: new Date(now + 86400000 * 365),
          durationMs: 86400000 * 365,
          level: 1,
          isCurrent: true,
          children: [],
        }],
      },
    } as unknown as ChartOutput

    const result = analyzeDashamsa(chart)
    expect(result).not.toBeNull()
    expect(result!.d10Lagna).toBe(11)
    expect(result!.planets).toHaveLength(9)
    expect(result!.houses).toHaveLength(12)
    expect(result!.digpalaBuckets).toHaveLength(10)
    expect(result!.keyLords).toHaveLength(4)
    expect(result!.planets.find((p) => p.id === 'Su')?.digpala.id).toBe('indra')
    expect(result!.vargottama.map((p) => p.id).sort()).toEqual(['Sa', 'Su'])
    expect(result!.insights.length).toBeGreaterThan(2)
    expect(result!.purpose.primary).toMatch(/Karma|livelihood|occupation/i)
    expect(result!.dashaOverlay).not.toBeNull()
    expect(result!.dashaOverlay!.lords[0]!.lord).toBe('Ju')
    expect(result!.direction.primaryDigpala.id).toBeTruthy()
    expect(result!.profession.fields.length).toBeGreaterThan(0)
    expect(result!.ethics.headline).toBeTruthy()
    expect(result!.fame.scale).toBeTruthy()
    expect(result!.advanced.protocol.length).toBeGreaterThanOrEqual(4)
    expect(result!.keyLords[1]!.predictionNote.length).toBeGreaterThan(10)
    expect(result!.houses[0]!.detail).toMatch(/foundation|livelihood|mental/i)

    const practical = buildDashamsaPractical(result!, chart)
    expect(practical.karma.verticals).toHaveLength(3)
    expect(practical.karma.recognition.factors).toHaveLength(4)
    expect(practical.karma.desireFear.desire.house).toBe(11)
    expect(practical.karma.moonMind.moonAscName).toBeTruthy()
    expect(practical.sectors.lagnaSector.rashi).toBe(11)
    expect(practical.sectors.combos.length).toBeGreaterThan(3)
    expect(practical.pending.axisRule).toMatch(/PENDING KARMA/i)
    expect(practical.pending.flags.length).toBeGreaterThan(5)
    expect(practical.pending.remedies.length).toBeGreaterThanOrEqual(4)
    expect(practical.pending.methodSteps.length).toBeGreaterThanOrEqual(5)
    expect(practical.bondage.goldenOrder[0]).toMatch(/HOUSE/i)
    expect(practical.bondage.inherited.length).toBeGreaterThanOrEqual(8)
    expect(practical.bondage.layered).toHaveLength(3)
    expect(practical.bondage.principles.length).toBeGreaterThan(4)
    expect(practical.karmaYoga.framing).toMatch(/Karma Yoga|Gītā/i)
    expect(practical.karmaYoga.sync.d10LagnaName).toBeTruthy()
    expect(practical.karmaYoga.sync.statusLabel).toBeTruthy()
    expect(practical.karmaYoga.sync.headline.length).toBeGreaterThan(10)
    expect(practical.karmaYoga.sync.bridge.length).toBeGreaterThan(20)
    expect(practical.karmaYoga.sync.recharge.length).toBeGreaterThanOrEqual(2)
    expect(practical.karmaYoga.triads).toHaveLength(4)
    expect(practical.karmaYoga.ethics.length).toBeGreaterThan(4)
    expect(practical.karmaYoga.multiChart.length).toBeGreaterThanOrEqual(6)
    expect(practical.karmaYoga.dashaEvents.length).toBeGreaterThan(0)
    expect(practical.circuit.framing).toMatch(/D3|circuit/i)
    expect(practical.circuit.sequence.length).toBeGreaterThanOrEqual(5)
    expect(practical.circuit.layers).toHaveLength(5)
    expect(practical.circuit.layers.find((l) => l.code === 'D10')?.available).toBe(true)
    expect(practical.circuit.jobDisruption.flavors).toHaveLength(4)
    expect(practical.circuit.practiceAdvice.length).toBeGreaterThan(4)
    expect(practical.survival.framing).toMatch(/Survival|practical/i)
    expect(practical.survival.distinctions.length).toBeGreaterThanOrEqual(4)
    expect(practical.survival.energyDrain.flags.length).toBeGreaterThanOrEqual(4)
    expect(practical.survival.partnership.rules.length).toBe(5)
    expect(practical.survival.helpability.good.length).toBeGreaterThan(2)
    expect(practical.survival.extraCombos.length).toBeGreaterThan(5)
    expect(practical.sectors.combos.length).toBeGreaterThan(12)
  })
})
