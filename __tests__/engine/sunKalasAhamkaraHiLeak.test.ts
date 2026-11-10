// Hindi Sun Kalas / Ahamkara display text must not leak Latin words of 4+ letters.
// Ids and dignity enums stay English. Omitted lang and lang='en' stay identical.

import { describe, expect, it } from 'vitest'
import type { ChartOutput, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import {
  AHAMKARA_STAGES,
  SUN_KALAS,
  ahamkaraStages,
  analyzeSunKalasAhamkara,
  kalaFromSunRashi,
  sunKalas,
} from '@/lib/engine/sunKalasAhamkara'

const LATIN_WORD = /[A-Za-z]{4,}/
const SKIP_KEYS = new Set(['id', 'dignity'])

function collectDisplay(value: unknown, key: string | null, out: string[]): void {
  if (typeof value === 'string') {
    if (!key || !SKIP_KEYS.has(key)) out.push(value)
    return
  }
  if (Array.isArray(value)) {
    for (const item of value) collectDisplay(item, key, out)
    return
  }
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) collectDisplay(v, k, out)
  }
}

function leaksOf(value: unknown): string[] {
  const strings: string[] = []
  collectDisplay(value, null, strings)
  return [...new Set(strings.filter(s => LATIN_WORD.test(s)).map(s => s.slice(0, 180)))]
}

function g(
  id: GrahaId,
  rashi: Rashi,
  nakshatraIndex: number,
  lonSidereal: number,
  extra: Partial<GrahaData> = {},
): GrahaData {
  return { id, rashi, nakshatraIndex, lonSidereal, degree: lonSidereal % 30, pada: 1, dignity: 'neutral', ...extra } as GrahaData
}

function chart(grahas: GrahaData[], ascRashi: Rashi): ChartOutput {
  return { grahas, lagnas: { ascRashi } } as unknown as ChartOutput
}

/** Leo Sun, own sign, lagna, every graha conjunct — strong worship and most score reasons. */
const OWN_CLUSTER = chart([
  g('Su', 5, 9, 130, { dignity: 'own' }),
  g('Mo', 5, 10, 132),
  g('Ma', 5, 9, 128),
  g('Me', 5, 9, 131),
  g('Ju', 5, 10, 134),
  g('Ve', 5, 9, 129),
  g('Sa', 5, 10, 136),
  g('Ra', 5, 10, 135),
  g('Ke', 5, 9, 127),
], 5)

/** Debilitated Libra Sun in the 10th with Ketu — strained worship, debility reasons. */
const DEBIL_TENTH = chart([
  g('Su', 7, 14, 190, { dignity: 'debilitated' }),
  g('Ke', 7, 15, 194),
  g('Ra', 1, 0, 8),
  g('Mo', 4, 7, 100),
  g('Ma', 1, 1, 15),
  g('Me', 6, 12, 160),
  g('Ju', 9, 18, 250),
  g('Ve', 2, 3, 45),
  g('Sa', 10, 21, 290),
], 10)

/** Neutral Gemini Sun, no grahan — plain worship note. */
const NEUTRAL = chart([
  g('Su', 3, 4, 70, { dignity: 'neutral' }),
  g('Mo', 9, 18, 250),
  g('Ma', 1, 1, 15),
  g('Me', 6, 12, 160),
  g('Ju', 11, 22, 320),
  g('Ve', 2, 3, 45),
  g('Sa', 10, 21, 290),
  g('Ra', 8, 17, 220),
  g('Ke', 2, 4, 40),
], 1)

/** Moolatrikona dignity word in the strong-Sun reason. */
const MOOLA = chart([
  g('Su', 5, 11, 140, { dignity: 'moolatrikona' }),
  g('Ra', 11, 23, 315),
  g('Ke', 5, 11, 145),
], 9)

const CASES = [OWN_CLUSTER, DEBIL_TENTH, NEUTRAL, MOOLA]

describe('sun kalas ahamkara Hindi leak', () => {
  it('keeps English when lang is omitted', () => {
    expect(sunKalas()).toBe(SUN_KALAS)
    expect(ahamkaraStages()).toBe(AHAMKARA_STAGES)
    expect(kalaFromSunRashi(5).name).toBe('Jvalini')
    expect(kalaFromSunRashi(12).name).toBe('Kshama')
    for (const c of CASES) {
      expect(analyzeSunKalasAhamkara(c)).toEqual(analyzeSunKalasAhamkara(c, 'en'))
    }
  })

  it('translates kalas, ahamkara stages, past-life flags and reading prose', () => {
    const hiKalas = sunKalas('hi')
    expect(hiKalas.map(k => [k.number, k.rashi])).toEqual(SUN_KALAS.map(k => [k.number, k.rashi]))
    expect(leaksOf(hiKalas)).toEqual([])

    const hiStages = ahamkaraStages('hi')
    expect(hiStages.map(s => [s.id, s.nakshatraIndexes, s.houses])).toEqual(
      AHAMKARA_STAGES.map(s => [s.id, s.nakshatraIndexes, s.houses]),
    )
    expect(leaksOf(hiStages)).toEqual([])
    expect(kalaFromSunRashi(5, 'hi').name).toBe('ज्वालिनी')
    expect(kalaFromSunRashi(5, 'hi').meaning).not.toBe(kalaFromSunRashi(5).meaning)

    for (const c of CASES) {
      const en = analyzeSunKalasAhamkara(c)!
      const hi = analyzeSunKalasAhamkara(c, 'hi')!
      expect(hi.activeKala.number).toBe(en.activeKala.number)
      expect(hi.activeKala.rashi).toBe(en.activeKala.rashi)
      expect(hi.primaryAhamkara.id).toBe(en.primaryAhamkara.id)
      expect(hi.secondaryAhamkara.map(s => s.id)).toEqual(en.secondaryAhamkara.map(s => s.id))
      expect(hi.ahamkaraScores.map(s => [s.id, s.score])).toEqual(en.ahamkaraScores.map(s => [s.id, s.score]))
      expect(hi.pastLifeFlags.map(f => [f.id, f.active])).toEqual(en.pastLifeFlags.map(f => [f.id, f.active]))
      expect(hi.grahanYoga.active).toBe(en.grahanYoga.active)
      expect(hi.grahanYoga.with).toBe(en.grahanYoga.with)
      expect(hi.sun.rashi).toBe(en.sun.rashi)
      expect(hi.sun.house).toBe(en.sun.house)
      expect(hi.sun.dignity).toBe(en.sun.dignity)
      expect(leaksOf(hi)).toEqual([])
      expect(hi.activeKala.meaning).not.toBe(en.activeKala.meaning)
      expect(hi.primaryAhamkara.meaning).not.toBe(en.primaryAhamkara.meaning)
      expect(hi.pastLifeFlags[0].detail).not.toBe(en.pastLifeFlags[0].detail)
    }
  })
})
