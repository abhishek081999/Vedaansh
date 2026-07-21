// ─────────────────────────────────────────────────────────────
//  Ashtakavarga — Jagannatha Hora / PyJHora golden tests
//  PVR Chart 7 (Vedic Astrology: An Integrated Approach)
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import {
  calculateAshtakavarga,
  applyTrikonaSodhana,
  applyEkadhipatyaSodhana,
  toHousesFromLagna,
  BAV_TOTALS,
} from '@/lib/engine/ashtakavarga'
import {
  kakshyaIndexFromDegree,
  kakshyaLordFromDegree,
  resolveKakshyaPosition,
} from '@/lib/engine/ashtakavargaKakshya'
import { analyzeSodhyaPindas } from '@/lib/engine/ashtakavargaSodhyaGuide'
import type { GrahaData, LagnaData, Rashi } from '@/types/astrology'

function g(id: string, rashi: number): GrahaData {
  const totalDegree = (rashi - 1) * 30 + 15
  return {
    id: id as GrahaData['id'],
    name: id,
    lonTropical: totalDegree,
    lonSidereal: totalDegree,
    latitude: 0,
    speed: 1,
    isRetro: false,
    isCombust: false,
    rashi: rashi as Rashi,
    rashiName: '',
    degree: 15,
    totalDegree,
    nakshatraIndex: 0,
    nakshatraName: '',
    pada: 1,
    dignity: 'neutral',
    avastha: { baladi: '', jagradadi: '' },
    charaKaraka: null,
    declination: 0,
    gandanta: {
      isGandanta: false, type: null, severity: 'none', position: null,
      distanceFromJunction: null, rashi: 1 as Rashi, nakshatraIndex: 0, degreeInNakshatra: 0,
    },
    yuddha: { isWarring: false, planets: [], winner: null, loser: null, degreeDifference: 0, orb: 1 },
    pushkara: {
      isPushkara: false, type: null, rashi: 1 as Rashi, degreeInSign: 0,
      navamsha: 1, isPushkaraNavamsha: false, remedy: null,
    },
    mrityuBhaga: {
      isMrityuBhaga: false, severity: 'none', rashi: 1 as Rashi, degreeInSign: 0,
      mrityuDegree: 0, distanceFromMrityu: 0, interpretation: null, remedy: null,
    },
  }
}

/**
 * PVR Chart 7 house_to_planet:
 * ['6/1/7','','','','','','8/4','L','3/2','0','5','']
 * → Aries: Sa,Mo,Ra | Libra: Ke,Ju | Scorpio: Lagna |
 *   Sag: Me,Ma | Cap: Su | Aq: Ve
 */
const CHART7_GRAHAS = [
  g('Su', 10), // Capricorn
  g('Mo', 1),  // Aries
  g('Ma', 9),  // Sagittarius
  g('Me', 9),  // Sagittarius
  g('Ju', 7),  // Libra
  g('Ve', 11), // Aquarius
  g('Sa', 1),  // Aries
  g('Ra', 1),  // Aries
  g('Ke', 7),  // Libra
]

const CHART7_LAGNA: LagnaData = {
  ascDegree: 210,
  ascRashi: 8 as Rashi, // Scorpio
  ascDegreeInRashi: 0,
  mcDegree: 0,
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

const EXPECTED_BAV: Record<string, number[]> = {
  Su: [4, 2, 3, 4, 6, 5, 5, 3, 2, 6, 6, 2],
  Mo: [6, 3, 5, 3, 5, 5, 6, 3, 3, 4, 4, 2],
  Ma: [3, 2, 3, 4, 2, 5, 4, 3, 3, 4, 3, 3],
  Me: [4, 6, 4, 3, 4, 7, 4, 5, 6, 3, 5, 3],
  Ju: [4, 4, 3, 5, 6, 5, 6, 4, 6, 4, 3, 6],
  Ve: [3, 5, 5, 4, 6, 2, 3, 6, 5, 2, 7, 4],
  Sa: [3, 2, 2, 3, 5, 6, 3, 4, 1, 3, 6, 1],
}

const EXPECTED_SAV = [27, 24, 25, 26, 34, 35, 31, 28, 26, 26, 34, 21]

describe('Ashtakavarga — JHora / PVR Chart 7', () => {
  const av = calculateAshtakavarga(CHART7_GRAHAS, CHART7_LAGNA)

  it('each planet BAV matches classical totals', () => {
    for (const [p, total] of Object.entries(BAV_TOTALS)) {
      expect(av.bav[p]?.total).toBe(total)
    }
  })

  it('each planet BAV matches JHora Chart 7', () => {
    for (const [p, bindus] of Object.entries(EXPECTED_BAV)) {
      expect(av.bav[p].bindus).toEqual(bindus)
    }
  })

  it('SAV is 337 with JHora Chart 7 distribution', () => {
    expect(av.sav).toEqual(EXPECTED_SAV)
    expect(av.savTotal).toBe(337)
  })

  it('Lagna BAV totals 49', () => {
    expect(av.bav.As.total).toBe(49)
  })

  it('Trikona: any zero in group skips reduction (JHora)', () => {
    // Fire trikona Ar/Le/Sg = indices 0,4,8 → values 5,4,0 → skip (Cap-style zero rule)
    const input = [5, 1, 1, 1, 4, 1, 1, 1, 0, 1, 1, 1]
    const out = applyTrikonaSodhana(input)
    expect(out[0]).toBe(5)
    expect(out[4]).toBe(4)
    expect(out[8]).toBe(0)
  })

  it('prastara exposes contributor flags', () => {
    expect(av.prastara.Su.byContributor.Su).toHaveLength(12)
    const flagsSum = Object.values(av.prastara.Su.byContributor)
      .reduce((s, row) => s + row.reduce((a, b) => a + b, 0), 0)
    expect(flagsSum).toBe(48)
  })

  it('sodhya pindas exist for all 7 planets', () => {
    for (const p of ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa']) {
      expect(av.sodhyaPindas[p].sodhyaPinda).toBe(
        av.sodhyaPindas[p].rasiPinda + av.sodhyaPindas[p].grahaPinda,
      )
    }
  })

  it('toHousesFromLagna rotates Aries-indexed array to houses from Asc', () => {
    // Asc Scorpio (8): house1 = Sc, house2 = Sg, …
    const byHouse = toHousesFromLagna(EXPECTED_SAV, 8)
    expect(byHouse[0]).toBe(EXPECTED_SAV[7]) // Sc
    expect(byHouse[1]).toBe(EXPECTED_SAV[8]) // Sg
    expect(byHouse[4]).toBe(EXPECTED_SAV[11]) // Pi = H5 from Sc
  })

  it('sodhita SAV equals sum of reduced planet BAVs', () => {
    const manual = Array(12).fill(0)
    for (const p of ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa']) {
      for (let i = 0; i < 12; i++) manual[i] += av.bavReduced[p].bindus[i]
    }
    expect(av.savReduced).toEqual(manual)
  })

  it('mandala SAV reduction is computed', () => {
    expect(av.savMandalaReduced).toHaveLength(12)
    expect(av.savMandalaReducedTotal).toBeGreaterThan(0)
    expect(av.savMandalaReducedTotal).not.toBe(av.savTotal)
  })

  it('ekadhipatya: both signs empty and equal zeros both', () => {
    const input = Array(12).fill(0)
    input[0] = 4 // Aries
    input[7] = 4 // Scorpio (Mars pair)
    const out = applyEkadhipatyaSodhana(input, new Set())
    expect(out[0]).toBe(0)
    expect(out[7]).toBe(0)
  })

  it('ekadhipatya: occupied sign keeps higher when other empty', () => {
    const input = Array(12).fill(0)
    input[0] = 5 // Aries occupied
    input[7] = 3 // Scorpio empty
    const out = applyEkadhipatyaSodhana(input, new Set([1]))
    expect(out[0]).toBe(5)
    expect(out[7]).toBe(0)
  })

  it('sodhya pinda golden values for Chart 7', () => {
    const guide = analyzeSodhyaPindas(av)
    expect(guide).not.toBeNull()
    expect(av.sodhyaPindas.Su).toEqual({ planet: 'Su', rasiPinda: 147, grahaPinda: 81, sodhyaPinda: 228 })
    expect(av.sodhyaPindas.Mo).toEqual({ planet: 'Mo', rasiPinda: 78, grahaPinda: 55, sodhyaPinda: 133 })
    expect(av.sodhyaPindas.Ma).toEqual({ planet: 'Ma', rasiPinda: 55, grahaPinda: 43, sodhyaPinda: 98 })
    expect(av.sodhyaPindas.Me).toEqual({ planet: 'Me', rasiPinda: 99, grahaPinda: 33, sodhyaPinda: 132 })
    expect(av.sodhyaPindas.Ju).toEqual({ planet: 'Ju', rasiPinda: 93, grahaPinda: 56, sodhyaPinda: 149 })
    expect(av.sodhyaPindas.Ve).toEqual({ planet: 'Ve', rasiPinda: 154, grahaPinda: 54, sodhyaPinda: 208 })
    expect(av.sodhyaPindas.Sa).toEqual({ planet: 'Sa', rasiPinda: 158, grahaPinda: 63, sodhyaPinda: 221 })
  })

  it('kakshya index and lord from degree', () => {
    expect(kakshyaIndexFromDegree(0)).toBe(0)
    expect(kakshyaLordFromDegree(0)).toBe('Sa')
    expect(kakshyaIndexFromDegree(3.75)).toBe(1)
    expect(kakshyaLordFromDegree(3.75)).toBe('Ju')
  })

  it('kakshya position uses prastara bindu flag', () => {
    const pos = resolveKakshyaPosition(av, 'Su', 1, 0)
    expect(pos.kakshyaLord).toBe('Sa')
    expect(typeof pos.hasBindu).toBe('boolean')
  })
})
