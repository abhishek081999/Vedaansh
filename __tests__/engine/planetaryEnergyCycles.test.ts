// __tests__/engine/planetaryEnergyCycles.test.ts
import { describe, it, expect } from 'vitest'
import type { GrahaData, GrahaId, Rashi } from '@/types/astrology'
import {
  ageFromBirthDate,
  computePlanetaryEnergyCycles,
} from '@/lib/engine/planetaryEnergyCycles'

function stubGraha(id: GrahaId, rashi: Rashi, nakshatraIndex: number, pada = 1): GrahaData {
  return {
    id,
    name: id,
    lonTropical: 0,
    lonSidereal: (rashi - 1) * 30,
    latitude: 0,
    speed: 1,
    isRetro: false,
    isCombust: false,
    rashi,
    rashiName: String(rashi),
    degree: 5,
    totalDegree: (rashi - 1) * 30 + 5,
    nakshatraIndex,
    nakshatraName: String(nakshatraIndex),
    pada,
    dignity: 'neutral',
    avastha: { baladi: 'Yuva', jagradadi: 'Jagrat' },
    charaKaraka: null,
    gandanta: { isGandanta: false, type: null, severity: 'none', position: null, distanceFromJunction: null, rashi, nakshatraIndex, degreeInNakshatra: 0 },
    yuddha: { isWarring: false, planets: [], winner: null, loser: null, degreeDifference: 0, orb: 1 },
    pushkara: { isPushkara: false, type: null, rashi, degreeInSign: 5, navamsha: 1, isPushkaraNavamsha: false, remedy: null },
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
  }
}

const SAMPLE: GrahaData[] = [
  stubGraha('Su', 3, 5),   // Gemini (air)
  stubGraha('Mo', 4, 7),
  stubGraha('Ma', 1, 13),  // Chitra → Creative Fire
  stubGraha('Me', 6, 12),  // Virgo + Hasta → logical
  stubGraha('Ju', 9, 18),
  stubGraha('Ve', 2, 3, 2), // 2nd pada → Prem
  stubGraha('Sa', 10, 21),
  stubGraha('Ra', 11, 23),
  stubGraha('Ke', 5, 10),
]

describe('ageFromBirthDate', () => {
  it('computes completed age', () => {
    expect(ageFromBirthDate('1990-06-15', new Date(2024, 5, 15))).toBe(34)
    expect(ageFromBirthDate('1990-06-15', new Date(2024, 5, 14))).toBe(33)
  })
})

describe('computePlanetaryEnergyCycles', () => {
  it('returns nine classical planet cycles', () => {
    const result = computePlanetaryEnergyCycles(SAMPLE, '1990-01-01', new Date(2024, 0, 1))
    expect(result.cycles).toHaveLength(9)
    expect(result.age).toBe(34)
    expect(result.insight).toMatch(/energy forms/i)
    expect(result.insight).not.toMatch(/Sukshma|Prana/i)
  })

  it('marks Sun air authority only for air-sign Sun at listed ages', () => {
    const air = computePlanetaryEnergyCycles(SAMPLE, '1982-01-01', new Date(2024, 0, 1))
    const sun = air.cycles.find(c => c.grahaId === 'Su')!
    expect(sun.kind).toBe('sun_air_authority')
    expect(air.age).toBe(42)
    expect(sun.status).toBe('active')

    const fireSun = [
      stubGraha('Su', 5, 9), // Leo — not air
      ...SAMPLE.filter(g => g.id !== 'Su'),
    ]
    const nonAir = computePlanetaryEnergyCycles(fireSun, '1982-01-01', new Date(2024, 0, 1))
    expect(nonAir.cycles.find(c => c.grahaId === 'Su')!.status).toBe('not_applicable')
  })

  it('flags Saturn lock and release windows exactly', () => {
    const lock = computePlanetaryEnergyCycles(SAMPLE, '1994-01-01', new Date(2024, 0, 1))
    expect(lock.age).toBe(30)
    expect(lock.cycles.find(c => c.grahaId === 'Sa')!.statusLabel).toMatch(/2nd Lock/)

    const release = computePlanetaryEnergyCycles(SAMPLE, '1986-01-01', new Date(2024, 0, 1))
    expect(release.age).toBe(38)
    expect(release.cycles.find(c => c.grahaId === 'Sa')!.statusLabel).toMatch(/2nd Release/)
  })

  it('maps Venus by pada only — no invented 6-year switch', () => {
    const result = computePlanetaryEnergyCycles(SAMPLE, '2000-01-01', new Date(2024, 0, 1))
    const ve = result.cycles.find(c => c.grahaId === 'Ve')!
    expect(ve.status).toBe('natal')
    expect(ve.statusLabel).toMatch(/Prem/)
    expect(ve.cyclePeriod).toMatch(/pada/i)
    expect(ve.windows.some(w => /6/.test(w.ages))).toBe(false)
    expect(ve.summary).not.toMatch(/6 year|6-year/i)
  })

  it('maps Mars in Chitra to Creative Fire', () => {
    const result = computePlanetaryEnergyCycles(SAMPLE, '2000-01-01', new Date(2024, 0, 1))
    const ma = result.cycles.find(c => c.grahaId === 'Ma')!
    expect(ma.statusLabel).toMatch(/Creative Fire/)
  })

  it('marks Mercury logical circuit for Hasta in Virgo', () => {
    const result = computePlanetaryEnergyCycles(SAMPLE, '2000-01-01', new Date(2024, 0, 1))
    const me = result.cycles.find(c => c.grahaId === 'Me')!
    expect(me.statusLabel).toMatch(/Logical/)
    expect(me.manifestations.some(m => /Ketu/i.test(m))).toBe(true)
    expect(me.manifestations.some(m => /combust/i.test(m))).toBe(true)
  })

  it('activates Jupiter peace ages only at 12/24/36/48/60', () => {
    const at36 = computePlanetaryEnergyCycles(SAMPLE, '1988-01-01', new Date(2024, 0, 1))
    expect(at36.age).toBe(36)
    expect(at36.cycles.find(c => c.grahaId === 'Ju')!.status).toBe('active')

    const off = computePlanetaryEnergyCycles(SAMPLE, '1990-01-01', new Date(2024, 0, 1))
    expect(off.age).toBe(34)
    expect(off.cycles.find(c => c.grahaId === 'Ju')!.status).not.toBe('active')
  })

  it('surfaces Ketu every 7 years without inventing year-sliced phases', () => {
    const hit = computePlanetaryEnergyCycles(SAMPLE, '2003-01-01', new Date(2024, 0, 1))
    expect(hit.age).toBe(21)
    const ke = hit.cycles.find(c => c.grahaId === 'Ke')!
    expect(ke.status).toBe('active')
    expect(ke.statusLabel).not.toMatch(/Confusion|Isolation|Realization/)
    expect(ke.phases.map(p => p.label)).toEqual(['Confusion', 'Isolation', 'Realization'])
  })

  it('applies Moon 7y / 14y regardless of air sign', () => {
    const at14 = computePlanetaryEnergyCycles(SAMPLE, '2010-01-01', new Date(2024, 0, 1))
    expect(at14.age).toBe(14)
    const mo = at14.cycles.find(c => c.grahaId === 'Mo')!
    expect(mo.status).toBe('active')
    expect(mo.statusLabel).toMatch(/Negative nakshatra/)
  })
})
