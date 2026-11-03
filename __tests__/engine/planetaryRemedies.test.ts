// __tests__/engine/planetaryRemedies.test.ts
import { describe, it, expect } from 'vitest'
import type { GrahaData, GrahaId, Rashi, ShadbalaResult } from '@/types/astrology'
import {
  assessRemedyNeed,
  computeDashaLordRemedies,
  computePlanetaryRemedies,
  PLANET_REMEDY_TEACHINGS,
  REMEDY_GRAHAS,
} from '@/lib/engine/planetaryRemedies'

function stubGraha(
  id: GrahaId,
  rashi: Rashi,
  nakshatraIndex: number,
  lonSidereal: number,
  pada = 1,
  extra: Partial<GrahaData> = {},
): GrahaData {
  return {
    id,
    name: id,
    lonTropical: lonSidereal,
    lonSidereal,
    latitude: 0,
    speed: -0.05,
    isRetro: true,
    isCombust: false,
    rashi,
    rashiName: String(rashi),
    degree: lonSidereal % 30,
    totalDegree: lonSidereal,
    nakshatraIndex,
    nakshatraName: String(nakshatraIndex),
    pada,
    dignity: 'neutral',
    avastha: { baladi: 'Yuva', jagradadi: 'Jagrat' },
    charaKaraka: null,
    gandanta: {
      isGandanta: false,
      type: null,
      severity: 'none',
      position: null,
      distanceFromJunction: null,
      rashi,
      nakshatraIndex,
      degreeInNakshatra: 0,
    },
    yuddha: { isWarring: false, planets: [], winner: null, loser: null, degreeDifference: 0, orb: 1 },
    pushkara: {
      isPushkara: false,
      type: null,
      rashi,
      degreeInSign: 5,
      navamsha: 1,
      isPushkaraNavamsha: false,
      remedy: null,
    },
    mrityuBhaga: {
      isMrityuBhaga: false,
      severity: 'none',
      rashi,
      degreeInSign: 5,
      mrityuDegree: 0,
      distanceFromMrityu: 0,
      interpretation: null,
      remedy: null,
    },
    ...extra,
  }
}

function chartGrahas(overrides: Partial<Record<GrahaId, Partial<GrahaData>>> = {}): GrahaData[] {
  return REMEDY_GRAHAS.map((id, i) =>
    stubGraha(id, ((i % 12) + 1) as Rashi, i * 3, i * 40 + 5, 1, {
      isRetro: id === 'Ra' || id === 'Ke',
      ...overrides[id],
    }),
  )
}

describe('PLANET_REMEDY_TEACHINGS', () => {
  it('covers all nine grahas with behavioural remedies', () => {
    for (const id of REMEDY_GRAHAS) {
      expect(PLANET_REMEDY_TEACHINGS[id].grahaId).toBe(id)
      expect(PLANET_REMEDY_TEACHINGS[id].behavioral.length).toBeGreaterThan(0)
    }
  })

  it('keeps the copper-vessel caution for Moon and Sun daan items', () => {
    expect(PLANET_REMEDY_TEACHINGS.Mo.notes.join(' ')).toMatch(/copper/i)
    expect(PLANET_REMEDY_TEACHINGS.Su.donation).toContain('Jaggery (Gur)')
    expect(PLANET_REMEDY_TEACHINGS.Su.duration).toMatch(/40 days/)
  })
})

describe('assessRemedyNeed', () => {
  it('flags debilitated + combust as high affliction', () => {
    const g = stubGraha('Su', 7, 14, 185, 1, { dignity: 'debilitated', isCombust: false, isRetro: false })
    const { score, reasons } = assessRemedyNeed(g)
    expect(score).toBe(3)
    expect(reasons).toContain('Debilitated')
  })

  it('does not count node retrogression', () => {
    const g = stubGraha('Ra', 1, 0, 5)
    expect(assessRemedyNeed(g).score).toBe(0)
  })

  it('uses shadbala weakness for visible grahas', () => {
    const g = stubGraha('Ma', 1, 0, 5, 1, { isRetro: false })
    const shadbala = {
      planets: { Ma: { id: 'Ma', isStrong: false, qualityBand: 'weak' } },
      strongest: 'Ju',
      weakest: 'Ma',
    } as unknown as ShadbalaResult
    const { reasons } = assessRemedyNeed(g, shadbala)
    expect(reasons).toEqual(['Weak Shadbala', 'Weakest graha by Shadbala'])
  })
})

describe('computePlanetaryRemedies', () => {
  it('ranks the most afflicted graha first and attaches its nakshatra deity', () => {
    const res = computePlanetaryRemedies(
      chartGrahas({ Sa: { dignity: 'debilitated', isRetro: true, nakshatraIndex: 21 } }),
    )
    expect(res.planets).toHaveLength(9)
    expect(res.planets[0].grahaId).toBe('Sa')
    expect(res.planets[0].need).toBe('high')
    expect(res.planets[0].nakshatraDeity).toBe('Vishnu')
    expect(res.priority).toEqual(['Sa'])
  })

  it('returns general guidance when nothing is afflicted', () => {
    const res = computePlanetaryRemedies(chartGrahas())
    expect(res.priority).toEqual([])
    expect(res.planets.every((p) => p.need === 'low')).toBe(true)
    expect(res.insight).toMatch(/No significant affliction/)
  })
})

describe('computeDashaLordRemedies', () => {
  it('returns running lords in Maha → Antar → Pratyantar order', () => {
    const res = computeDashaLordRemedies(['Ra', 'Ju', 'Me'], chartGrahas())
    expect(res.map((r) => r.assessment.grahaId)).toEqual(['Ra', 'Ju', 'Me'])
    expect(res.map((r) => r.levels)).toEqual([['Mahadasha'], ['Antardasha'], ['Pratyantardasha']])
  })

  it('merges a lord that runs at several levels', () => {
    const res = computeDashaLordRemedies(['Sa', 'Sa', 'Mo'], chartGrahas({ Sa: { dignity: 'debilitated' } }))
    expect(res).toHaveLength(2)
    expect(res[0].levels).toEqual(['Mahadasha', 'Antardasha'])
    expect(res[0].assessment.need).toBe('high')
  })

  it('skips unknown lords', () => {
    expect(computeDashaLordRemedies(['Ur'], chartGrahas())).toEqual([])
  })
})
