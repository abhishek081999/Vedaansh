// ─────────────────────────────────────────────────────────────
//  __tests__/engine/jaiminiMarriageAnalysis.test.ts
//  Jaimini marriage framework — DK / UL / D9 / red flags / timing
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import {
  analyzeJaiminiMarriage,
  DK_PLANET_PROFILES,
} from '@/lib/engine/jaiminiMarriageAnalysis'
import { getRashiDrishti, getSignType, rashiAspectsOrOccupies } from '@/lib/engine/jaimini/aspects'
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

describe('Jaimini rashi drishti helpers', () => {
  it('classifies sign motion types', () => {
    expect(getSignType(1)).toBe('Movable')
    expect(getSignType(2)).toBe('Fixed')
    expect(getSignType(3)).toBe('Dual')
  })

  it('dual signs aspect 4th/7th/10th (other duals)', () => {
    // Gemini → Virgo (4), Sagittarius (7), Pisces (10)
    expect(getRashiDrishti(3).slice().sort((a, b) => a - b)).toEqual([6, 9, 12])
  })

  it('movable does not aspect adjacent fixed', () => {
    // Aries aspects Fixed except Taurus
    expect(getRashiDrishti(1)).toEqual([5, 8, 11])
  })

  it('rashiAspectsOrOccupies includes conjunction', () => {
    expect(rashiAspectsOrOccupies(6, 6)).toBe(true)
    expect(rashiAspectsOrOccupies(3, 6)).toBe(true)
    expect(rashiAspectsOrOccupies(1, 2)).toBe(false)
  })
})

describe('analyzeJaiminiMarriage', () => {
  it('returns null without UL or D9', () => {
    expect(analyzeJaiminiMarriage({
      grahas: [],
      lagnas: { ascRashi: 1 },
      arudhas: {},
      vargas: {},
      vargaLagnas: {},
    } as unknown as ChartOutput)).toBeNull()
  })

  it('identifies Mercury as DK (lowest degree) and builds UL / D9 marriage frame', () => {
    const asc = 4 as Rashi // Cancer lagna → 7th Capricorn
    // Degrees: Me lowest → DK; Su highest → AK
    const grahas = [
      stubGraha({ id: 'Su', rashi: 6, degree: 28, charaKaraka: 'AK' }),
      stubGraha({ id: 'Mo', rashi: 11, degree: 18 }),
      stubGraha({ id: 'Ma', rashi: 6, degree: 22 }),
      stubGraha({ id: 'Me', rashi: 6, degree: 2.5, isRetro: true, charaKaraka: 'DK', dignity: 'own' }),
      stubGraha({ id: 'Ju', rashi: 12, degree: 14, dignity: 'own' }),
      stubGraha({ id: 'Ve', rashi: 7, degree: 16 }),
      stubGraha({ id: 'Sa', rashi: 11, degree: 12 }),
      stubGraha({ id: 'Ra', rashi: 3, degree: 8 }),
      stubGraha({ id: 'Ke', rashi: 9, degree: 8 }),
    ]

    const d9 = [
      stubGraha({ id: 'Su', rashi: 5, degree: 10 }),
      stubGraha({ id: 'Mo', rashi: 2, degree: 8 }),
      stubGraha({ id: 'Ma', rashi: 1, degree: 12 }),
      // DK Mercury in Pisces D9 H9 from Leo lagna: Leo=1 → Pisces=8? 
      // D9 asc Leo (5): Pisces (12) is house ((12-5+12)%12)+1 = 8 — use Sagittarius for H9
      // From Leo (5): H9 = houseSign = ((5-1+8)%12)+1 = 1 → Aries
      // Want H9 for blessing: from d9Asc=5, H9 = ((5-1+8)%12)+1 = 1 (Aries)
      // Wait: house n from asc: (((asc-1)+(n-1))%12)+1
      // H9 from Leo: ((4+8)%12)+1 = 13%12+1 = 1+1 = 2? 
      // ((5-1) + (9-1)) % 12 + 1 = (4+8)%12+1 = 12%12+1 = 1 → Aries
      stubGraha({ id: 'Me', rashi: 1, degree: 5, dignity: 'enemy' }),
      stubGraha({ id: 'Ju', rashi: 9, degree: 10 }),
      stubGraha({ id: 'Ve', rashi: 7, degree: 11 }),
      stubGraha({ id: 'Sa', rashi: 10, degree: 9 }),
      stubGraha({ id: 'Ra', rashi: 4, degree: 4 }),
      stubGraha({ id: 'Ke', rashi: 10, degree: 4 }),
    ]

    const now = Date.now()
    const chart = {
      meta: {
        name: 'Test',
        birthDate: '1989-09-25',
        birthTime: '22:28',
        timezone: 'Asia/Kolkata',
        gender: 'male',
      },
      grahas,
      lagnas: { ascRashi: asc, ascDegree: 10 },
      // UL Aquarius (11) — matches session notes style
      arudhas: {
        AL: 10,
        A2: 2,
        A3: 3,
        A4: 4,
        A5: 5,
        A6: 6,
        A7: 7,
        A8: 8,
        A9: 9,
        A10: 10,
        A11: 1,
        A12: 11,
        grahaArudhas: {},
        suryaArudhas: {},
        chandraArudhas: {},
      },
      karakas: { scheme: 7, AK: 'Su', AmK: 'Ma', BK: 'Mo', MK: 'Ve', PK: 'Ju', GK: 'Sa', DK: 'Me', PiK: null },
      vargas: { D9: d9 },
      vargaLagnas: { D9: 5 as Rashi },
      dashas: {
        chara: [{
          lord: 'Vi',
          start: new Date(now - 86400000),
          end: new Date(now + 86400000 * 365),
          durationMs: 86400000 * 365,
          level: 1,
          isCurrent: true,
          children: [],
        }],
        vimshottari: [{
          lord: 'Sa',
          start: new Date(now - 86400000),
          end: new Date(now + 86400000 * 365),
          durationMs: 86400000 * 365,
          level: 1,
          isCurrent: true,
          children: [],
        }],
      },
    } as unknown as ChartOutput

    const result = analyzeJaiminiMarriage(chart)
    expect(result).not.toBeNull()
    expect(result!.darakaraka.id).toBe('Me')
    expect(result!.darakaraka.isRetro).toBe(true)
    expect(result!.darakaraka.sign.rashi).toBe(6)
    expect(result!.darakaraka.companions.map(c => c.id).sort()).toEqual(['Ma', 'Su'])
    expect(result!.darakaraka.profile.nature).toBe(DK_PLANET_PROFILES.Me.nature)
    expect(result!.darakaraka.influenceAreas.length).toBe(3) // dual → 3 aspects

    expect(result!.upapada.sign.rashi).toBe(11)
    expect(result!.upapada.seventhFromUl.rashi).toBe(5) // Leo
    expect(result!.upapada.secondFromUl.rashi).toBe(12) // Pisces

    expect(result!.dkNavamsha.rashi).toBe(1)
    expect(result!.dkNavamsha.trinalBlessing).toBe(true) // H9 from Leo lagna = Aries
    expect(result!.dkNavamsha.houseFromD9Lagna).toBe(9)

    expect(result!.redFlags).toHaveLength(6)
    expect(result!.timing.some(t => t.id === 'dk_sign')).toBe(true)
    expect(result!.timing.find(t => t.id === 'dk_sign')!.isActiveNow).toBe(true) // Vi active
    expect(result!.checklist).toHaveLength(10)
    expect(result!.quotes.length).toBeGreaterThan(3)
    expect(result!.marriagePath.type).toBeTruthy()
    expect(result!.summary).toContain('Mercury')
    expect(result!.summary).toContain('Aquarius')
  })

  it('flags Rahu–DK and UL node axis as active red flags', () => {
    const grahas = [
      stubGraha({ id: 'Su', rashi: 1, degree: 25 }),
      stubGraha({ id: 'Mo', rashi: 2, degree: 20 }),
      stubGraha({ id: 'Ma', rashi: 3, degree: 18 }),
      stubGraha({ id: 'Me', rashi: 4, degree: 15 }),
      stubGraha({ id: 'Ju', rashi: 5, degree: 12 }),
      stubGraha({ id: 'Ve', rashi: 6, degree: 10 }),
      stubGraha({ id: 'Sa', rashi: 8, degree: 8 }), // DK lowest
      stubGraha({ id: 'Ra', rashi: 8, degree: 4 }), // with DK
      stubGraha({ id: 'Ke', rashi: 2, degree: 4 }),
    ]
    const d9 = grahas.map(g => stubGraha({
      id: g.id,
      rashi: (((g.rashi + 3 - 1) % 12) + 1) as Rashi,
      degree: g.degree,
    }))
    // Put DK Saturn in D9 dusthana H8
    const d9Asc = 1 as Rashi
    const d9Fixed = d9.map(g =>
      g.id === 'Sa' ? stubGraha({ id: 'Sa', rashi: 8, degree: 8 }) : g,
    )

    const chart = {
      meta: { birthDate: '1992-10-22', birthTime: '22:15', timezone: 'Asia/Kolkata', gender: 'male' },
      grahas,
      lagnas: { ascRashi: 1 as Rashi, ascDegree: 5 },
      arudhas: {
        AL: 1, A2: 2, A3: 3, A4: 4, A5: 5, A6: 6, A7: 7, A8: 8, A9: 9, A10: 10, A11: 11,
        A12: 8, // UL Scorpio — with Rahu
        grahaArudhas: {}, suryaArudhas: {}, chandraArudhas: {},
      },
      karakas: { scheme: 7, AK: 'Su', DK: 'Sa', AmK: 'Mo', BK: 'Ma', MK: 'Me', PK: 'Ju', GK: 'Ve', PiK: null },
      vargas: { D9: d9Fixed },
      vargaLagnas: { D9: d9Asc },
      dashas: { chara: [], vimshottari: [] },
    } as unknown as ChartOutput

    const result = analyzeJaiminiMarriage(chart)
    expect(result).not.toBeNull()
    expect(result!.darakaraka.rahuInfluence).toBe(true)
    expect(result!.upapada.ulOnRahuKetuAxis).toBe(true)
    expect(result!.redFlags.find(f => f.id === 'rahu_dk')!.active).toBe(true)
    expect(result!.redFlags.find(f => f.id === 'dk_d9_dusthana')!.active).toBe(true)
    expect(result!.activeRedFlagCount).toBeGreaterThanOrEqual(2)
  })
})
