// __tests__/engine/nakshatraTaramandal.test.ts
import { describe, it, expect } from 'vitest'
import type { ChartOutput, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import {
  analyzeTaramandalChart,
  COMPLETE_TARAMANDALS,
  getMandalsForNakshatra,
  TARAMANDALS,
  UNCOVERED_NAKSHATRA_INDICES,
} from '@/lib/engine/nakshatraTaramandal'

function stubGraha(
  id: GrahaId,
  rashi: Rashi,
  nakshatraIndex: number,
  lonSidereal: number,
  pada = 1,
): GrahaData {
  return {
    id,
    name: id,
    lonTropical: lonSidereal,
    lonSidereal,
    latitude: 0,
    speed: 1,
    isRetro: false,
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

describe('TARAMANDALS static table', () => {
  it('defines ten complete mandals plus two pending stubs', () => {
    expect(COMPLETE_TARAMANDALS).toHaveLength(10)
    expect(TARAMANDALS.filter(t => !t.complete)).toHaveLength(2)
  })

  it('assigns the taught kings', () => {
    const kings: Record<string, number> = {
      garuda: 21,      // Shravana
      naga: 8,         // Ashlesha
      deva: 7,         // Pushya
      rakshasa: 2,     // Krittika
      pitru: 9,        // Magha
      marut: 14,       // Swati
      agni: 24,        // Purva Bhadra
      soma: 3,         // Rohini
      vaishya: 16,     // Anuradha
      pashu: 0,        // Ashwini
      mrityu_karma: 18, // Mula
      gyan: 17,        // Jyeshtha
    }
    for (const t of TARAMANDALS) {
      expect(t.kingIndex).toBe(kings[t.id])
    }
  })

  it('marks partial members for Pitru, Marut, Vaishya, and Pashu', () => {
    const partials = COMPLETE_TARAMANDALS.flatMap(t =>
      t.members.filter(m => m.role === 'partial').map(m => `${t.id}:${m.nakshatraIndex}`),
    )
    expect(partials).toEqual(expect.arrayContaining([
      'pitru:20',    // Uttara Ashadha
      'marut:22',    // Dhanishtha
      'vaishya:21',  // Shravana
      'pashu:24',    // Purva Bhadra
    ]))
  })

  it('places Punarvasu in Deva and Vishakha in Agni + Rakshasa', () => {
    expect(UNCOVERED_NAKSHATRA_INDICES).not.toContain(6)
    expect(UNCOVERED_NAKSHATRA_INDICES).not.toContain(15)
    expect(getMandalsForNakshatra(6).map(x => x.mandalId)).toEqual(['deva'])
    expect(getMandalsForNakshatra(15).map(x => x.mandalId).sort()).toEqual(['agni', 'rakshasa'])
  })
})

describe('getMandalsForNakshatra', () => {
  it('puts Shravana in Garuda (king) and Vaishya (partial)', () => {
    const m = getMandalsForNakshatra(21)
    expect(m.find(x => x.mandalId === 'garuda')).toMatchObject({ isKing: true, role: 'full' })
    expect(m.find(x => x.mandalId === 'vaishya')).toMatchObject({ isKing: false, role: 'partial' })
  })

  it('puts Ashlesha as Naga king (not Pushya)', () => {
    const ashlesha = getMandalsForNakshatra(8)
    expect(ashlesha.some(x => x.mandalId === 'naga' && x.isKing)).toBe(true)
    const pushya = getMandalsForNakshatra(7)
    expect(pushya.some(x => x.mandalId === 'deva' && x.isKing)).toBe(true)
    expect(pushya.some(x => x.mandalId === 'naga')).toBe(false)
  })
})

describe('analyzeTaramandalChart', () => {
  it('flags Sun in Garuda with journalism / guidance notes', () => {
    const chart = {
      grahas: [
        stubGraha('Su', 10, 21, 285), // Shravana
        stubGraha('Mo', 4, 7, 105),   // Pushya
      ],
      lagnas: { ascRashi: 1, ascDegree: 10 },
    } as unknown as ChartOutput

    const result = analyzeTaramandalChart(chart)
    expect(result.birthMemberships.some(m => m.mandalId === 'deva')).toBe(true)

    const garuda = result.mandals.find(v => v.mandal.id === 'garuda')!
    expect(garuda.planetHits.some(h => h.grahaId === 'Su' && h.isKing)).toBe(true)
    const sunHit = garuda.planetHits.find(h => h.grahaId === 'Su')!
    expect(sunHit.notes?.summary).toMatch(/journalism/i)
  })

  it('applies Naga Sun notes for Ardra / Ashlesha / Jyeshtha', () => {
    const chart = {
      grahas: [
        stubGraha('Su', 3, 5, 70), // Ardra
        stubGraha('Mo', 1, 2, 35),
      ],
      lagnas: { ascRashi: 5, ascDegree: 120 },
    } as unknown as ChartOutput

    const naga = analyzeTaramandalChart(chart).mandals.find(v => v.mandal.id === 'naga')!
    const sun = naga.planetHits.find(h => h.grahaId === 'Su')!
    expect(sun.notes?.summary).toMatch(/tantric|occult/i)
  })
})
