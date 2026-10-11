// ─────────────────────────────────────────────────────────────
//  __tests__/engine/navamshaAnalysis.test.ts
//  Navamsha mapping helpers + analysis shape
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import {
  analyzeNavamsha,
  buildD1D9Relation,
  isVargottama,
  navamshaPada,
  navamshaRashi,
  signCount,
} from '@/lib/engine/navamshaAnalysis'
import { D9 } from '@/lib/engine/vargas'
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
      navamsha: Math.floor((partial.degree ?? 5) / (30 / 9)) + 1,
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

describe('Navamsha helpers', () => {
  it('navamshaRashi matches engine D9', () => {
    for (let lon = 0; lon < 360; lon += 7.5) {
      expect(navamshaRashi(lon)).toBe(D9(lon))
    }
  })

  it('navamshaPada is 1–9', () => {
    expect(navamshaPada(0.1)).toBe(1)
    expect(navamshaPada(3.4)).toBe(2)
    expect(navamshaPada(29.9)).toBe(9)
  })

  it('isVargottama when signs match', () => {
    expect(isVargottama(1, 1)).toBe(true)
    expect(isVargottama(1, 2)).toBe(false)
  })

  it('D1↔D9 relation: Aries→Taurus is 2/12', () => {
    expect(signCount(1, 2)).toBe(2)
    expect(signCount(2, 1)).toBe(12)
    const rel = buildD1D9Relation(1, 2)
    expect(rel.pair).toBe('2/12')
    expect(rel.kind).toBe('dwirdwadasa')
    expect(rel.forward).toBe(2)
    expect(rel.reverse).toBe(12)
  })

  it('D1↔D9 relation: same sign is 1/1 vargottama', () => {
    const rel = buildD1D9Relation(5, 5)
    expect(rel.pair).toBe('1/1')
    expect(rel.kind).toBe('vargottama')
  })

  it('D1↔D9 relation: Aries→Leo is 5/9 trikona', () => {
    const rel = buildD1D9Relation(1, 5)
    expect(rel.pair).toBe('5/9')
    expect(rel.kind).toBe('trikona')
  })
})

describe('analyzeNavamsha', () => {
  it('returns null without D9 data', () => {
    const chart = {
      vargas: {},
      vargaLagnas: {},
    } as unknown as ChartOutput
    expect(analyzeNavamsha(chart)).toBeNull()
  })

  it('maps planets D1→D9 and flags vargottama', () => {
    const d1Asc = 1 as Rashi
    const d9Asc = 5 as Rashi
    const grahas = [
      stubGraha({ id: 'Su', rashi: 1, degree: 5, dignity: 'own', charaKaraka: 'AK' }),
      stubGraha({ id: 'Mo', rashi: 4, degree: 12 }),
      stubGraha({ id: 'Ma', rashi: 1, degree: 20 }),
      stubGraha({ id: 'Me', rashi: 2, degree: 8 }),
      stubGraha({ id: 'Ju', rashi: 9, degree: 15, dignity: 'own' }),
      stubGraha({ id: 'Ve', rashi: 7, degree: 10 }),
      stubGraha({ id: 'Sa', rashi: 10, degree: 22 }),
      stubGraha({ id: 'Ra', rashi: 3, degree: 3 }),
      stubGraha({ id: 'Ke', rashi: 9, degree: 3 }),
    ]
    // D9 copies: Sun vargottama in Aries; Venus in Libra vargottama
    const d9 = grahas.map((g) => {
      if (g.id === 'Su') return stubGraha({ id: 'Su', rashi: 1, degree: 10, dignity: 'own' })
      if (g.id === 'Ve') return stubGraha({ id: 'Ve', rashi: 7, degree: 12, dignity: 'own' })
      if (g.id === 'Mo') return stubGraha({ id: 'Mo', rashi: 8, degree: 5 })
      return stubGraha({ id: g.id, rashi: (((g.rashi + 2 - 1) % 12) + 1) as Rashi, degree: 5 })
    })

    const now = Date.now()
    const chart = {
      meta: { gender: 'male' },
      grahas,
      lagnas: { ascRashi: d1Asc, ascDegree: 5 },
      karakas: { AK: 'Su', DK: 'Ve' },
      vargas: { D9: d9 },
      vargaLagnas: { D9: d9Asc },
      dashas: {
        vimshottari: [{
          lord: 'Su',
          start: new Date(now - 86400000),
          end: new Date(now + 86400000 * 365),
          durationMs: 86400000 * 365,
          level: 1,
          isCurrent: true,
          children: [{
            lord: 'Ve',
            start: new Date(now - 86400000),
            end: new Date(now + 86400000 * 30),
            durationMs: 86400000 * 30,
            level: 2,
            isCurrent: true,
            children: [],
          }],
        }],
      },
    } as unknown as ChartOutput

    const result = analyzeNavamsha(chart)
    expect(result).not.toBeNull()
    expect(result!.d9Lagna).toBe(5)
    expect(result!.planets).toHaveLength(9)
    expect(result!.vargottama.map((p) => p.id).sort()).toEqual(['Su', 'Ve'])
    expect(result!.atmakaraka).toBe('Su')
    expect(result!.karakamsha).toBe(1)
    expect(result!.seventhHouse.house).toBe(7)
    expect(result!.marriageNotes.length).toBeGreaterThan(2)
    expect(result!.insights.some((i) => i.title.includes('Vargottama'))).toBe(true)
    expect(result!.spouseSketch.headline).toContain('7th')
    expect(result!.spouseSketch.traits.length).toBeGreaterThan(0)
    expect(result!.dashaOverlay).not.toBeNull()
    expect(result!.dashaOverlay!.pathLabel).toContain('Sun')
    expect(result!.dashaOverlay!.lords[0]!.lord).toBe('Su')
    expect(result!.variants.planets).toHaveLength(9)
    expect(result!.variants.matchRates.D9_Pada.total).toBe(9)
    expect(result!.advanced.lagnaRelation.pair).toBeTruthy()
    expect(result!.planets.every((p) => p.d1d9Relation.pair)).toBe(true)
    expect(result!.advanced.dispositors).toHaveLength(9)
    expect(result!.advanced.relationBuckets.length).toBeGreaterThan(0)
  })
})
