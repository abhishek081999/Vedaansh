// __tests__/engine/yogas.test.ts
// Classical yoga detection — whole-sign houses, pure logic only

import { describe, it, expect } from 'vitest'
import { detectYogas } from '@/lib/engine/yogas'
import type { GrahaData, LagnaData, Dignity, Rashi, GrahaId } from '@/types/astrology'

function stubGraha(
  id: GrahaId,
  rashi: Rashi,
  dignity: Dignity = 'neutral',
  extras: Partial<GrahaData> = {},
): GrahaData {
  const lon = (rashi - 1) * 30 + 15
  return {
    id,
    name: id,
    lonTropical: lon,
    lonSidereal: lon,
    latitude: 0,
    speed: 1,
    isRetro: false,
    isCombust: false,
    rashi,
    rashiName: String(rashi),
    degree: 15,
    totalDegree: lon,
    nakshatraIndex: 0,
    nakshatraName: '',
    pada: 1,
    dignity,
    avastha: { baladi: 'Yuva', jagradadi: 'Jagrat' },
    charaKaraka: null,
    gandanta: {
      isGandanta: false, type: null, severity: 'none', position: null,
      distanceFromJunction: null, rashi: 1 as Rashi, nakshatraIndex: 0, degreeInNakshatra: 0,
    },
    yuddha: { isWarring: false, planets: [], winner: null, loser: null, degreeDifference: 0, orb: 0 },
    pushkara: {
      isPushkara: false, type: null, rashi: 1 as Rashi, degreeInSign: 0,
      navamsha: 1, isPushkaraNavamsha: false, remedy: null,
    },
    mrityuBhaga: {
      isMrityuBhaga: false, severity: 'none', rashi: 1 as Rashi, degreeInSign: 0,
      mrityuDegree: 0, distanceFromMrityu: 0, interpretation: null, remedy: null,
    },
    ...extras,
  }
}

function stubLagna(ascRashi: Rashi, ascDegreeInRashi = 10): LagnaData {
  const ascDegree = (ascRashi - 1) * 30 + ascDegreeInRashi
  return {
    ascDegree,
    ascRashi,
    ascDegreeInRashi,
    horaLagna: 0,
    ghatiLagna: 0,
    bhavaLagna: 0,
    vighatiLagna: 0,
    pranapada: 0,
    sriLagna: 0,
    varnadaLagna: 0,
    induLagna: 0,
    bhriguBindu: 0,
    cusps: [],
  }
}

/** Minimal 9-graha set; override positions via map. */
function chart(
  ascRashi: Rashi,
  positions: Partial<Record<GrahaId, { rashi: Rashi; dignity?: Dignity }>>,
): { grahas: GrahaData[]; lagnas: LagnaData } {
  const defaults: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']
  const grahas = defaults.map((id, i) => {
    const p = positions[id]
    return stubGraha(id, p?.rashi ?? (((i % 12) + 1) as Rashi), p?.dignity ?? 'neutral')
  })
  return { grahas, lagnas: stubLagna(ascRashi) }
}

describe('detectYogas — whole-sign houses', () => {
  it('detects Hamsa (Jupiter exalted in kendra) for Cancer lagna', () => {
    // Cancer lagna: H1=Cancer. Jupiter exalted in Cancer = H1 kendra + exalted → Hamsa
    const { grahas, lagnas } = chart(4, {
      Ju: { rashi: 4, dignity: 'exalted' },
      Mo: { rashi: 10 },
      Su: { rashi: 1 },
      Ma: { rashi: 2 },
      Me: { rashi: 3 },
      Ve: { rashi: 5 },
      Sa: { rashi: 6 },
      Ra: { rashi: 7 },
      Ke: { rashi: 1 },
    })
    const yogas = detectYogas(grahas, lagnas)
    expect(yogas.some(y => y.name === 'Hamsa Yoga')).toBe(true)
  })

  it('does NOT claim Mahapurusha when planet is own-sign but NOT in kendra', () => {
    // Aries lagna: Jupiter own in Sagittarius = H9 (trikona, not kendra) → no Hamsa
    const { grahas, lagnas } = chart(1, {
      Ju: { rashi: 9, dignity: 'own' },
      Mo: { rashi: 2 },
      Su: { rashi: 3 },
      Ma: { rashi: 4 },
      Me: { rashi: 5 },
      Ve: { rashi: 6 },
      Sa: { rashi: 7 },
      Ra: { rashi: 8 },
      Ke: { rashi: 2 },
    })
    const yogas = detectYogas(grahas, lagnas)
    expect(yogas.some(y => y.name === 'Hamsa Yoga')).toBe(false)
  })

  it('detects Gajakesari when Jupiter is kendra from Moon by sign', () => {
    // Moon in Aries (1), Jupiter in Cancer (4) = 4th from Moon
    const { grahas, lagnas } = chart(1, {
      Mo: { rashi: 1 },
      Ju: { rashi: 4 },
      Su: { rashi: 2 },
      Ma: { rashi: 3 },
      Me: { rashi: 5 },
      Ve: { rashi: 6 },
      Sa: { rashi: 7 },
      Ra: { rashi: 8 },
      Ke: { rashi: 2 },
    })
    const yogas = detectYogas(grahas, lagnas)
    const gk = yogas.find(y => y.name === 'Gajakesari Yoga')
    expect(gk).toBeTruthy()
    expect(gk!.description).toMatch(/4th from|kendra/i)
    expect(gk!.description).not.toMatch(/\d+°/)
  })

  it('does not form Gajakesari when Jupiter is 6th from Moon (Shakata instead)', () => {
    // Moon Aries (1), Jupiter Virgo (6) = 6th → Shakata, not Gajakesari
    const { grahas, lagnas } = chart(1, {
      Mo: { rashi: 1 },
      Ju: { rashi: 6 },
      Su: { rashi: 2 },
      Ma: { rashi: 3 },
      Me: { rashi: 4 },
      Ve: { rashi: 5 },
      Sa: { rashi: 7 },
      Ra: { rashi: 8 },
      Ke: { rashi: 2 },
    })
    const yogas = detectYogas(grahas, lagnas)
    expect(yogas.some(y => y.name === 'Gajakesari Yoga')).toBe(false)
    expect(yogas.some(y => y.name === 'Shakata Yoga')).toBe(true)
  })

  it('forms Raja Yoga on true kendra–trikona lord conjunction', () => {
    // Aries lagna: H1 lord Ma, H5 lord Su. Put both in H1 (Aries).
    const { grahas, lagnas } = chart(1, {
      Ma: { rashi: 1 },
      Su: { rashi: 1 },
      Mo: { rashi: 2 },
      Me: { rashi: 3 },
      Ju: { rashi: 4 },
      Ve: { rashi: 5 },
      Sa: { rashi: 6 },
      Ra: { rashi: 7 },
      Ke: { rashi: 1 },
    })
    const yogas = detectYogas(grahas, lagnas)
    expect(yogas.some(y => y.name === 'Raja Yoga' && y.planets.includes('Ma') && y.planets.includes('Su'))).toBe(true)
  })

  it('forms Raja Yoga on mutual aspect, not only conjunction', () => {
    // Aries: H1 Ma in Aries, H9 Ju in Libra → 7th aspect between them
    const { grahas, lagnas } = chart(1, {
      Ma: { rashi: 1 },
      Ju: { rashi: 7 },
      Su: { rashi: 2 },
      Mo: { rashi: 3 },
      Me: { rashi: 4 },
      Ve: { rashi: 5 },
      Sa: { rashi: 6 },
      Ra: { rashi: 8 },
      Ke: { rashi: 2 },
    })
    const yogas = detectYogas(grahas, lagnas)
    expect(yogas.some(y =>
      y.name === 'Raja Yoga' &&
      y.planets.includes('Ma') &&
      y.planets.includes('Ju') &&
      /aspect/i.test(y.description)
    )).toBe(true)
  })

  it('does not invent Raja Yoga from broken indexOf-style house checks', () => {
    // Planets unrelated by house/aspect; should not spam false Raja yogas
    // Capricorn lagna: Sa lords 1+2, Ju lords 3+12 — place them with no association
    const { grahas, lagnas } = chart(10, {
      Sa: { rashi: 1 },  // H4 from Cap
      Ju: { rashi: 3 },  // H6 from Cap — no conj, no mutual aspect for Raja pair carelessly
      Su: { rashi: 4 },
      Mo: { rashi: 5 },
      Ma: { rashi: 6 },
      Me: { rashi: 7 },
      Ve: { rashi: 8 },
      Ra: { rashi: 9 },
      Ke: { rashi: 3 },
    })
    const yogas = detectYogas(grahas, lagnas)
    const falseRaja = yogas.filter(y =>
      y.name === 'Raja Yoga' && y.description.includes('Parivartana') && !y.description.includes('⇄')
    )
    expect(falseRaja).toHaveLength(0)
  })

  it('uses sign count for Nabhasa Sankhya (not equal-house cusps)', () => {
    // Seven planets in four distinct rashis → Kedara
    const { grahas, lagnas } = chart(1, {
      Su: { rashi: 1 },
      Mo: { rashi: 1 },
      Ma: { rashi: 2 },
      Me: { rashi: 2 },
      Ju: { rashi: 3 },
      Ve: { rashi: 3 },
      Sa: { rashi: 4 },
      Ra: { rashi: 5 },
      Ke: { rashi: 11 },
    })
    const yogas = detectYogas(grahas, lagnas)
    expect(yogas.some(y => y.name === 'Kedara Yoga')).toBe(true)
  })

  it('lists Durudhara instead of both Sunapha and Anapha', () => {
    // Moon in H1 (Aries), Mars in H2, Venus in H12
    const { grahas, lagnas } = chart(1, {
      Mo: { rashi: 1 },
      Ma: { rashi: 2 },
      Ve: { rashi: 12 },
      Su: { rashi: 3 },
      Me: { rashi: 4 },
      Ju: { rashi: 5 },
      Sa: { rashi: 6 },
      Ra: { rashi: 7 },
      Ke: { rashi: 1 },
    })
    const yogas = detectYogas(grahas, lagnas)
    expect(yogas.some(y => y.name === 'Durudhara Yoga')).toBe(true)
    expect(yogas.some(y => y.name === 'Sunapha Yoga')).toBe(false)
    expect(yogas.some(y => y.name === 'Anapha Yoga')).toBe(false)
  })

  it('ignores equal-degree house boundaries that would misplace planets', () => {
    // Asc at 28° Aries (rashi 1). Mars at 2° Taurus.
    // Equal-house from degree: Mars still in H1 (within 30° of asc).
    // Whole-sign: Mars in H2. Budhaditya needs Su+Me same house — use Ma in H2 for Amala check.
    // Put only Jupiter in H10 by whole-sign (Capricorn = rashi 10) → Amala.
    // If equal-house were used with asc at 28° Ari, H10 starts at 28° Cap — different.
    const lagnas = stubLagna(1, 28)
    const grahas = [
      stubGraha('Su', 2),
      stubGraha('Mo', 3),
      stubGraha('Ma', 2), // early Taurus → whole-sign H2
      stubGraha('Me', 4),
      stubGraha('Ju', 10, 'own'), // Capricorn = H10 whole-sign → Amala
      stubGraha('Ve', 5),
      stubGraha('Sa', 6),
      stubGraha('Ra', 7),
      stubGraha('Ke', 1),
    ]
    // Override totalDegree so equal-house math would put Mars in H1 with asc at 28° Ari:
    // ascDeg=28, Mars lon=32 → floor((32-28)/30)+1 = H1 under equal houses
    grahas[2] = { ...grahas[2], totalDegree: 32, degree: 2 }
    lagnas.ascDegree = 28

    const yogas = detectYogas(grahas, lagnas)
    const amala = yogas.find(y => y.name === 'Amala Yoga')
    expect(amala).toBeTruthy()
    expect(amala!.planets).toContain('Ju')
    // Mars must not be reported in H1 for yogas (whole-sign H2)
    expect(yogas.every(y => !(y.planets.includes('Ma') && y.houses.length === 1 && y.houses[0] === 1 && y.name.includes('Ruchaka')))).toBe(true)
  })
})
