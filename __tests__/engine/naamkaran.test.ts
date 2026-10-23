// __tests__/engine/naamkaran.test.ts
// Classical janma-naam — pure logic, no redis/mongoose/next-auth

import { describe, it, expect } from 'vitest'
import type { ChartOutput, GrahaData, GrahaId, Rashi, ShadbalaPlanet } from '@/types/astrology'
import {
  AKSHAR_CHAKRA,
  PLANET_VARGA,
  analyzeNaamkaran,
  applyGenderSyllableParity,
  naamkaranHouseOf,
  rashiMotion,
  syllableForMotion,
} from '@/lib/engine/naamkaran'
import { suggestSahasranamaNames } from '@/lib/engine/naamkaranNames'

function stubGraha(partial: Partial<GrahaData> & { id: GrahaId; rashi: Rashi; degree: number }): GrahaData {
  return {
    name: partial.id,
    lonTropical: 0,
    lonSidereal: (partial.rashi - 1) * 30 + partial.degree,
    latitude: 0,
    speed: 1,
    isRetro: false,
    isCombust: false,
    rashiName: String(partial.rashi),
    totalDegree: (partial.rashi - 1) * 30 + partial.degree,
    nakshatraIndex: 0,
    nakshatraName: 'Ashwini',
    pada: 1,
    dignity: 'neutral' as GrahaData['dignity'],
    avastha: { baladi: 'Yuva', jagradadi: 'Jagrat' },
    charaKaraka: null,
    gandanta: { isGandanta: false } as unknown as GrahaData['gandanta'],
    yuddha: { inYuddha: false } as unknown as GrahaData['yuddha'],
    pushkara: { isPushkara: false } as unknown as GrahaData['pushkara'],
    mrityuBhaga: { inMrityuBhaga: false } as unknown as GrahaData['mrityuBhaga'],
    ...partial,
  }
}

function stubShadbala(id: string, total: number): ShadbalaPlanet {
  return {
    id,
    sthanaBala: total / 6,
    digBala: total / 6,
    kalaBala: total / 6,
    chestaBala: total / 6,
    naisargikaBala: total / 6,
    drikBala: total / 6,
    total,
    totalShash: total,
    required: 300,
    ratio: total / 300,
    isStrong: total >= 300,
  }
}

function stubChart(overrides?: Partial<ChartOutput>): ChartOutput {
  const grahas: GrahaData[] = [
    stubGraha({ id: 'Su', rashi: 10, degree: 12 }),
    stubGraha({ id: 'Mo', rashi: 5, degree: 8, nakshatraIndex: 0, nakshatraName: 'Ashwini', pada: 1 }),
    stubGraha({ id: 'Ma', rashi: 8, degree: 18.4 }),
    stubGraha({ id: 'Me', rashi: 7, degree: 22 }),
    stubGraha({ id: 'Ju', rashi: 12, degree: 5 }),
    stubGraha({ id: 'Ve', rashi: 11, degree: 14 }),
    stubGraha({ id: 'Sa', rashi: 4, degree: 3 }),
    stubGraha({ id: 'Ra', rashi: 3, degree: 10 }),
    stubGraha({ id: 'Ke', rashi: 9, degree: 10 }),
  ]

  const base = {
    meta: {
      name: 'Demo',
      birthDate: '2025-01-18',
      birthTime: '10:32',
      birthPlace: 'Merta Road',
      latitude: 26.65,
      longitude: 74.03,
      timezone: 'Asia/Kolkata',
      gender: 'female' as const,
      settings: {} as ChartOutput['meta']['settings'],
      calculatedAt: new Date(),
      ayanamshaValue: 24,
      julianDay: 2460680,
    },
    grahas,
    lagnas: { ascRashi: 12 as Rashi, ascDegree: 10 } as ChartOutput['lagnas'],
    arudhas: {} as ChartOutput['arudhas'],
    karakas: {
      AK: 'Me',
      AmK: 'Ve',
      BK: 'Su',
      MK: 'Mo',
      PK: 'Ma',
      GK: 'Ju',
      DK: 'Sa',
      PiK: null,
      roleOf: {} as ChartOutput['karakas']['roleOf'],
    },
    vargas: {
      D9: [
        stubGraha({ id: 'Me', rashi: 7, degree: 10 }), // Karakamsha Libra
      ],
    },
    vargaLagnas: { D9: 8 as Rashi },
    dashas: {} as ChartOutput['dashas'],
    panchang: {} as ChartOutput['panchang'],
    upagrahas: {},
    shadbala: {
      strongest: 'Su',
      weakest: 'Ve',
      planets: {
        Su: stubShadbala('Su', 480),
        Mo: stubShadbala('Mo', 350),
        Ma: stubShadbala('Ma', 320),
        Me: stubShadbala('Me', 340),
        Ju: stubShadbala('Ju', 310),
        Ve: stubShadbala('Ve', 400),
        Sa: stubShadbala('Sa', 280),
      },
    },
    vimsopaka: {} as ChartOutput['vimsopaka'],
    interpretation: {
      headline: '',
      strengths: [],
      cautions: [],
      special: [],
      topInsights: [],
    },
    yogiPoint: {} as ChartOutput['yogiPoint'],
  } as unknown as ChartOutput

  return { ...base, ...overrides }
}

describe('Naamkaran helpers', () => {
  it('maps rashi motion to syllable counts', () => {
    expect(syllableForMotion(rashiMotion(1))).toBe(2)
    expect(syllableForMotion(rashiMotion(2))).toBe(4)
    expect(syllableForMotion(rashiMotion(12))).toBe(3)
  })

  it('applies Gṛhya gender parity on top of rashi count', () => {
    expect(applyGenderSyllableParity(4, 'female')).toEqual({ count: 3, adjusted: true, parity: 'odd' })
    expect(applyGenderSyllableParity(2, 'female')).toEqual({ count: 3, adjusted: true, parity: 'odd' })
    expect(applyGenderSyllableParity(3, 'female')).toEqual({ count: 3, adjusted: false, parity: 'odd' })
    expect(applyGenderSyllableParity(3, 'male')).toEqual({ count: 2, adjusted: true, parity: 'even' })
    expect(applyGenderSyllableParity(4, 'male')).toEqual({ count: 4, adjusted: false, parity: 'even' })
    expect(applyGenderSyllableParity(3, 'other').adjusted).toBe(false)
  })

  it('computes whole-sign house from lagna', () => {
    expect(naamkaranHouseOf(1, 12)).toBe(2)
    expect(naamkaranHouseOf(4, 12)).toBe(5)
    expect(naamkaranHouseOf(8, 12)).toBe(9)
    expect(naamkaranHouseOf(12, 12)).toBe(1)
  })

  it('has 27×4 Akshar Chakra and distinct Me/Ju Devanagari', () => {
    expect(AKSHAR_CHAKRA).toHaveLength(27)
    expect(AKSHAR_CHAKRA.every((row) => row.length === 4)).toBe(true)
    expect(AKSHAR_CHAKRA[21]).toEqual(['Khi', 'Khu', 'Khe', 'Kho'])
    expect(PLANET_VARGA.Me.lettersDe).toEqual(['ट', 'ठ', 'ड', 'ढ', 'ण'])
    expect(PLANET_VARGA.Ju.lettersDe).toEqual(['त', 'थ', 'द', 'ध', 'न'])
    // Latin akṣar rows share TA/DA/NA romanization; Devanagari columns stay distinct
    expect(PLANET_VARGA.Me.lettersDe).not.toEqual(PLANET_VARGA.Ju.lettersDe)
  })
})

describe('suggestSahasranamaNames', () => {
  it('finds Cha + 3-syllable Lalita stems', () => {
    const names = suggestSahasranamaNames({
      key: 'lalita',
      startSound: 'Cha',
      syllables: 3,
    })
    expect(names.some((n) => n.name === 'Chaitanya' || n.name === 'Chakrana')).toBe(true)
  })
})

describe('analyzeNaamkaran classical', () => {
  it('returns null without shadbala', () => {
    const chart = stubChart({ shadbala: undefined as unknown as ChartOutput['shadbala'] })
    expect(analyzeNaamkaran(chart)).toBeNull()
  })

  it('prescribes Moon pada and gender-adjusted syllables', () => {
    const result = analyzeNaamkaran(stubChart())
    expect(result).not.toBeNull()
    // Moon Ashwini pada 1 → Chu; Leo Moon → sthira 4 → female → 3
    expect(result!.classical?.sound).toBe('Chu')
    expect(result!.classical?.letter.pada).toBe(1)
    expect(result!.classical?.syllableFromRashi).toBe(4)
    expect(result!.classical?.syllableCount).toBe(3)
    expect(result!.classical?.genderAdjusted).toBe(true)
    expect(result!.classical?.alternates).toHaveLength(3)
    expect(result!.selected?.sound).toBe('Chu')
    expect(result!.syllableCount).toBe(3)
  })

  it('uses Karakamsha (AK in D9) for Ishta', () => {
    const result = analyzeNaamkaran(stubChart())
    expect(result).not.toBeNull()
    expect(result!.ishta?.source).toBe('karakamsha')
    expect(result!.ishta?.rashi).toBe(7) // Me in D9 Libra
    expect(result!.ishta?.akId).toBe('Me')
    expect(result!.ishta?.sahasranamaKey === 'lalita' || result!.ishta?.sahasranamaKey === 'lakshmi').toBe(true)
  })

  it('keeps male even syllable count from sthira Moon', () => {
    const chart = stubChart({
      meta: {
        ...stubChart().meta,
        gender: 'male',
      },
    })
    const result = analyzeNaamkaran(chart)
    expect(result!.classical?.syllableFromRashi).toBe(4)
    expect(result!.classical?.syllableCount).toBe(4)
    expect(result!.classical?.genderAdjusted).toBe(false)
  })

  it('does not use Shadbala letter as the selected start', () => {
    const result = analyzeNaamkaran(stubChart())
    expect(result!.selected?.origin).toBe('navtara')
    expect(result!.selected?.nakshatraName).toBe('Ashwini')
    expect(result!.strongPlanetOptions[0]!.id).toBe('Su')
  })

  it('lists Navtara hard taras for ceremony avoid, not as name starts', () => {
    const result = analyzeNaamkaran(stubChart())
    expect(result!.navtara?.hardNakshatras.length).toBe(9)
    expect(result!.navtara?.janmaSound).toBe('Chu')
  })

  it('builds session Shadbala alphabet method with Trikona/Kendra picks', () => {
    const result = analyzeNaamkaran(stubChart())
    expect(result!.session).not.toBeNull()
    expect(result!.session!.relevantPlanets).toHaveLength(2)
    expect(result!.session!.planetOptions).toHaveLength(2)
    expect(result!.session!.vargaLetters.length).toBeGreaterThanOrEqual(1)
    expect(result!.session!.preferred.length).toBeGreaterThan(0)
    expect(result!.session!.selected).not.toBeNull()
    expect(result!.session!.selected!.origin).toBe('shadbala')
    expect(['trikona', 'kendra']).toContain(result!.session!.selected!.priority)
    expect(result!.session!.syllableCount).toBeTruthy()
    expect(result!.session!.ishta?.akId).toBe('Me')
  })

  it('gives Moon-sign rashi letters apart from the pada sound', () => {
    const result = analyzeNaamkaran(stubChart())
    expect(result!.rashiNaam?.rashi).toBe(5)
    expect(result!.rashiNaam?.letters.map((l) => l.sound)).toEqual(['Ma', 'Tta'])
    expect(result!.rashiNaam?.letters.map((l) => l.letterDe)).toEqual(['म', 'ट'])
    expect(result!.rashiNaam?.selectedSound).toBe('Ma')
    expect(result!.rashiNaam?.syllableCount).toBe(3)
    expect(result!.rashiNaam?.genderAdjusted).toBe(true)
    expect(result!.classical?.sound).toBe('Chu')
    expect(result!.rashiNaam?.selectedSound).not.toBe(result!.classical?.sound)
  })

  it('splits janma (Moon pada) and vyavahara (lagna pada)', () => {
    const result = analyzeNaamkaran(stubChart({
      lagnas: { ascRashi: 12 as Rashi, ascDegree: 335 } as ChartOutput['lagnas'],
    }))
    expect(result!.twoName?.janma?.sound).toBe('Chu')
    expect(result!.twoName?.janma?.syllableCount).toBe(3)
    expect(result!.twoName?.vyavahara?.sound).toBe('Du')
    expect(result!.twoName?.vyavahara?.nakshatraName).toBe('Uttara Bhadra')
    expect(result!.twoName?.vyavahara?.pada).toBe(1)
    expect(result!.twoName?.vyavahara?.rashi).toBe(12)
    expect(result!.twoName?.vyavahara?.syllableCount).toBe(3)
    expect(result!.twoName?.vyavahara?.alternates.some((a) => a.sound === 'Cha')).toBe(true)
    expect(result!.twoName?.janma?.sound).not.toBe(result!.twoName?.vyavahara?.sound)
  })
})
