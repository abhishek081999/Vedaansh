// ─────────────────────────────────────────────────────────────
//  __tests__/engine/todayPredictions.test.ts
//  House-by-house day predictions: natal promise (SAV / Shadbala),
//  transit occupancy with BAV bindus, Parashari drishti, dasha links
//  and Moon phases. Pure inputs, no ephemeris.
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import type { GrahaData, GrahaId, Rashi } from '@/types/astrology'
import type { DashaDay, GocharRow, MoonDay, TodayTransitGraha } from '@/lib/engine/todayReading'
import {
  buildTodayPredictions,
  type BuildPredictionsInput,
  type PredictionNatalInput,
} from '@/lib/engine/todayPredictions'

function natalGraha(id: GrahaId, rashi: Rashi, extra: Partial<GrahaData> = {}): GrahaData {
  return {
    id, rashi, degree: 10, lonSidereal: (rashi - 1) * 30 + 10,
    nakshatraIndex: 0, dignity: 'neutral', isCombust: false, isRetro: false, ...extra,
  } as unknown as GrahaData
}

function tGraha(id: GrahaId, rashi: Rashi, extra: Partial<TodayTransitGraha> = {}): TodayTransitGraha {
  return {
    id, rashi, degree: 10, lonSidereal: (rashi - 1) * 30 + 10,
    nakshatraIndex: 0, nakshatraName: 'N0', pada: 1, isRetro: false, dignity: 'neutral', speed: 13, ...extra,
  }
}

const flatBav = (over: Partial<Record<GrahaId, Record<number, number>>> = {}) => {
  const out: Record<string, { bindus: number[] }> = {}
  for (const p of ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa'] as const) {
    const bindus = Array(12).fill(4) as number[]
    for (const [sign, v] of Object.entries(over[p] ?? {})) bindus[Number(sign) - 1] = v
    out[p] = { bindus }
  }
  return out
}

/** Aries lagna: house N is sign N. Lords: 1 Ma, 2 Ve, 3 Me, 4 Mo, 5 Su, 6 Me, 7 Ve, 8 Ma, 9 Ju, 10 Sa, 11 Sa, 12 Ju. */
function natal(extra: Partial<PredictionNatalInput> = {}): PredictionNatalInput {
  return {
    lagnas: { ascRashi: 1 },
    grahas: [
      natalGraha('Su', 5), natalGraha('Mo', 2), natalGraha('Ma', 1), natalGraha('Me', 5),
      natalGraha('Ju', 4, { dignity: 'exalted' }), natalGraha('Ve', 2, { dignity: 'own' }),
      natalGraha('Sa', 7, { dignity: 'exalted' }), natalGraha('Ra', 11), natalGraha('Ke', 5),
    ],
    ashtakavarga: { bav: flatBav(), sav: Array(12).fill(28) as number[] },
    ...extra,
  }
}

/** Quiet sky: everything in Taurus except Saturn (Gemini) so no stray drishti lands on Aquarius. */
function sky(over: Partial<Record<GrahaId, TodayTransitGraha>> = {}): TodayTransitGraha[] {
  const ids: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']
  const base = Object.fromEntries(ids.map(id => [id, tGraha(id, id === 'Sa' ? 3 : 2)])) as Record<GrahaId, TodayTransitGraha>
  return Object.values({ ...base, ...over })
}

function moon(over: Partial<MoonDay> = {}): MoonDay {
  return {
    rashi: 2, rashiName: 'Taurus', nakshatraName: 'Rohini', pada: 1,
    chandraPosition: 1, chandraQuality: 'avg', chandraNote: '', lagnaHouse: 2, lagnaTheme: 'wealth',
    overNatal: [], signChange: null, ...over,
  }
}

function gocharRow(planet: GrahaId, status: GocharRow['status'], fromMoon: number): GocharRow {
  return {
    planet: planet as GocharRow['planet'], planetName: planet, rashiName: '', fromMoon, fromLagna: fromMoon,
    status, isRetro: false, note: '', delta: 0,
  }
}

function dashaDay(lord: GrahaId, level: number, tone: DashaDay['tone']): DashaDay {
  return { level, levelLabel: level === 2 ? 'Antardasha' : 'Pratyantar', lord, lordName: lord, tone, note: '' }
}

function run(over: Partial<BuildPredictionsInput> = {}) {
  return buildTodayPredictions({
    natal: natal(),
    transit: sky(),
    reading: { moon: moon(), gochar: [], dasha: [] },
    ...over,
  })!
}

describe('buildTodayPredictions', () => {
  it('returns null without live transit data', () => {
    expect(buildTodayPredictions({ natal: natal(), transit: [], reading: { moon: moon(), gochar: [], dasha: [] } })).toBeNull()
  })

  it('produces all 12 houses mapped from the lagna', () => {
    const r = run()
    expect(r.houses).toHaveLength(12)
    expect(r.houses[10]).toMatchObject({ house: 11, rashi: 11, lord: 'Sa' })
    expect(r.houses[0]).toMatchObject({ house: 1, rashi: 1, lord: 'Ma' })
  })

  it('rates Jupiter on a high-bindu sign in a favourable gochar as a favourable 11th house', () => {
    const r = run({
      natal: natal({ ashtakavarga: { bav: flatBav({ Ju: { 11: 6 } }), sav: Array(12).fill(28) as number[] } }),
      transit: sky({ Ju: tGraha('Ju', 11) }),
      reading: { moon: moon(), gochar: [gocharRow('Ju', 'favourable', 2)], dasha: [] },
    })
    const h11 = r.houses[10]
    expect(h11.influences[0]).toMatchObject({ kind: 'occupies', planet: 'Ju' })
    expect(h11.influences[0].delta).toBeGreaterThan(3)
    expect(h11.tone).toBe('favourable')
    expect(r.predictions.some(p => p.house === 11 && p.tone === 'favourable')).toBe(true)
  })

  it('scores the same Jupiter transit lower when the sign has weak bindus and gochar is poor', () => {
    const strong = run({
      natal: natal({ ashtakavarga: { bav: flatBav({ Ju: { 11: 6 } }), sav: Array(12).fill(28) as number[] } }),
      transit: sky({ Ju: tGraha('Ju', 11) }),
      reading: { moon: moon(), gochar: [gocharRow('Ju', 'favourable', 2)], dasha: [] },
    })
    const weak = run({
      natal: natal({ ashtakavarga: { bav: flatBav({ Ju: { 11: 2 } }), sav: Array(12).fill(28) as number[] } }),
      transit: sky({ Ju: tGraha('Ju', 11) }),
      reading: { moon: moon(), gochar: [gocharRow('Ju', 'unfavourable', 4)], dasha: [] },
    })
    expect(weak.houses[10].score).toBeLessThan(strong.houses[10].score)
  })

  it('applies Saturn special drishti (3rd, 7th, 10th) but never lets Rahu aspect', () => {
    // Saturn in Gemini (3): aspects Leo (5), Sagittarius (9), Pisces (12).
    const r = run()
    const aspectedBySaturn = r.houses.filter(h => h.influences.some(i => i.kind === 'aspects' && i.planet === 'Sa')).map(h => h.house)
    expect(aspectedBySaturn.sort((a, b) => a - b)).toEqual([5, 9, 12])
    expect(r.houses.some(h => h.influences.some(i => i.kind === 'aspects' && (i.planet === 'Ra' || i.planet === 'Ke')))).toBe(false)
    // Malefic aspect pushes a house negative.
    expect(r.houses[11].influences.find(i => i.planet === 'Sa')!.delta).toBeLessThan(0)
  })

  it('amplifies a bad transit on a weakly supported house and softens it on a strong one', () => {
    const tSky = sky({ Sa: tGraha('Sa', 11) })
    const reading = { moon: moon(), gochar: [gocharRow('Sa', 'unfavourable', 9)], dasha: [] as DashaDay[] }
    const bav = flatBav({ Sa: { 11: 2 } })

    const strongSav = Array(12).fill(28) as number[]; strongSav[10] = 34
    const weakSav = Array(12).fill(28) as number[]; weakSav[10] = 20

    const strong = run({
      natal: natal({ ashtakavarga: { bav, sav: strongSav }, shadbala: { planets: { Sa: { ratio: 1.3 } } } }),
      transit: tSky, reading,
    }).houses[10]
    const weak = run({
      natal: natal({ ashtakavarga: { bav, sav: weakSav }, shadbala: { planets: { Sa: { ratio: 0.7 } } } }),
      transit: tSky, reading,
    }).houses[10]

    expect(strong.promise).toBe('strong')
    expect(weak.promise).toBe('weak')
    expect(weak.net).toBeLessThan(strong.net)
    expect(weak.net).toBeLessThan(0)
    expect(weak.score).toBeLessThan(strong.score)
  })

  it('links the running dasha lords to the houses they rule or sit in', () => {
    // Saturn rules houses 10 and 11 for an Aries lagna.
    const r = run({ reading: { moon: moon(), gochar: [], dasha: [dashaDay('Sa', 2, 'challenging')] } })
    expect(r.houses[9].dashaLinks).toEqual(expect.arrayContaining([{ lord: 'Sa', levelLabel: 'Antardasha', relation: 'rules' }]))
    expect(r.houses[10].dashaLinks.some(d => d.lord === 'Sa' && d.relation === 'rules')).toBe(true)
    // Natal Saturn sits in Libra (house 7).
    expect(r.houses[6].dashaLinks.some(d => d.lord === 'Sa' && d.relation === 'sits in')).toBe(true)
    expect(r.houses[9].influences.some(i => i.kind === 'dasha' && i.delta < 0)).toBe(true)
  })

  it('explains each prediction and rates confidence by how many independent sources agree', () => {
    const r = run({
      natal: natal({ ashtakavarga: { bav: flatBav({ Ju: { 11: 6 } }), sav: Array(12).fill(28) as number[] } }),
      transit: sky({ Ju: tGraha('Ju', 11), Ve: tGraha('Ve', 11) }),
      reading: {
        moon: moon(),
        gochar: [gocharRow('Ju', 'favourable', 2), gocharRow('Ve', 'favourable', 2)],
        dasha: [dashaDay('Sa', 2, 'supportive')],
      },
    })
    const p = r.predictions.find(x => x.house === 11)!
    expect(p.because.length).toBeGreaterThan(1)
    expect(p.confidence).toBe('high')
    expect(p.text).toMatch(/Antardasha lord/)
  })

  it('splits the day into two Moon phases when the Moon changes sign within 24 hours', () => {
    const r = run({
      reading: {
        moon: moon({
          lagnaHouse: 7, chandraQuality: 'good',
          signChange: { atIso: '2026-10-24T14:00:00Z', toRashi: 8, toRashiName: 'Scorpio', toChandraPosition: 8, toChandraQuality: 'bad' },
        }),
        gochar: [], dasha: [],
      },
      now: new Date('2026-10-24T05:00:00Z'),
    })
    expect(r.phases).toHaveLength(2)
    expect(r.phases[0]).toMatchObject({ house: 7, tone: 'favourable', untilIso: '2026-10-24T14:00:00Z' })
    expect(r.phases[1]).toMatchObject({ house: 8, tone: 'challenging', rashiName: 'Scorpio' })
  })

  it('keeps a single all-day phase when the Moon will not change sign for more than 24 hours', () => {
    const r = run({
      reading: {
        moon: moon({
          lagnaHouse: 7, chandraQuality: 'good',
          signChange: { atIso: '2026-10-25T14:00:00Z', toRashi: 8, toRashiName: 'Scorpio', toChandraPosition: 8, toChandraQuality: 'bad' },
        }),
        gochar: [], dasha: [],
      },
      now: new Date('2026-10-24T05:00:00Z'),
    })
    expect(r.phases).toHaveLength(1)
    expect(r.phases[0]).toMatchObject({ label: 'All day', untilIso: null })
  })

  it('flags a yoga when the Moon sits in the sign of a yoga planet', () => {
    const r = run({
      natal: natal({ yogas: [{ name: 'Gajakesari Yoga', category: 'raja', strength: 'strong', planets: ['Ju', 'Mo'], effect: 'x' }] }),
      transit: sky({ Mo: tGraha('Mo', 4) }), // natal Jupiter is in Cancer
    })
    expect(r.yogaNotes[0]).toMatch(/Gajakesari Yoga/)
  })

  it('keeps yoga notes unique when a chart has several yogas with the same name', () => {
    const r = run({
      natal: natal({
        yogas: [
          { name: 'Raja Yoga', category: 'raja', strength: 'strong', planets: ['Ju', 'Mo'], effect: 'x' },
          { name: 'Raja Yoga', category: 'raja', strength: 'moderate', planets: ['Ju', 'Su'], effect: 'y' },
          { name: 'Raja Yoga', category: 'raja', strength: 'moderate', planets: ['Ju', 'Su'], effect: 'z' },
        ],
      }),
      transit: sky({ Ju: tGraha('Ju', 4) }),
    })
    expect(r.yogaNotes.length).toBeGreaterThan(1)
    expect(new Set(r.yogaNotes).size).toBe(r.yogaNotes.length)
  })
})
