// Hindi Ashtakavarga display text must not leak Latin words of 4+ letters.
// Ids, bands, roles, planets, quality and strength enums stay English.
// Omitted lang and lang='en' stay byte-for-byte identical.

import { describe, expect, it } from 'vitest'
import {
  analyzeAshtakavargaInsights,
  bhavaBhaavam,
  buildHouseComparisonReadings,
  negativeHouseNotes,
  rateBindus,
} from '@/lib/engine/ashtakavargaInsights'
import { analyzeBhinnashtakavargaGuide } from '@/lib/engine/bhinnashtakavargaGuide'
import { analyzeSodhyaPindas } from '@/lib/engine/ashtakavargaSodhyaGuide'
import { kakshyaNote, type KakshyaTransitRow } from '@/lib/engine/ashtakavargaKakshya'
import type { AshtakavargaResult, GrahaId, Rashi } from '@/types/astrology'

const LATIN_WORD = /[A-Za-z]{4,}/
const SKIP_KEYS = new Set([
  'id', 'band', 'severity', 'role', 'quality', 'planet', 'strength',
  'kakshyaLord', 'tag', 'dominant', 'directionPeak', 'lifeStagePeak',
  'ashramPeak', 'tenthLord',
])

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
  return [...new Set(strings.filter((s) => LATIN_WORD.test(s)).map((s) => s.slice(0, 180)))]
}

const SAMPLE = [33, 28, 26, 32, 27, 31, 34, 21, 21, 25, 33, 26]
const STRESSED = [8, 12, 0, 41, 15, 0, 48, 46, 9, 36, 42, 18]

function row(seed: number): number[] {
  return Array.from({ length: 12 }, (_, i) => (i * 3 + seed) % 8)
}

function avFixture(): AshtakavargaResult {
  const planets = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa'] as const
  const bav: AshtakavargaResult['bav'] = {}
  planets.forEach((p, i) => {
    const bindus = row(i + 1)
    if (p === 'Su') bindus[0] = 2
    if (p === 'Ju') bindus[1] = 7
    if (p === 'Ma') bindus[2] = 0
    if (p === 'Ve') bindus[6] = 2
    bav[p] = { planet: p, bindus, total: bindus.reduce((a, b) => a + b, 0) }
  })
  const sav = SAMPLE.slice()
  const sodhyaPindas: NonNullable<AshtakavargaResult['sodhyaPindas']> = {}
  const pindas = [228, 98, 149, 132, 208, 133, 70]
  planets.forEach((p, i) => {
    sodhyaPindas[p] = {
      planet: p,
      rasiPinda: pindas[i] - 40,
      grahaPinda: 40,
      sodhyaPinda: pindas[i],
    }
  })
  return { bav, sav, savTotal: sav.reduce((a, b) => a + b, 0), sodhyaPindas }
}

const GRAHAS = [
  { id: 'Su', rashi: 1, dignity: 'exalted', nakshatraIndex: 0, pada: 2 },
  { id: 'Mo', rashi: 4, dignity: 'own', nakshatraIndex: 3, pada: 1 },
  { id: 'Ma', rashi: 3, dignity: 'neutral' },
  { id: 'Me', rashi: 6, dignity: 'neutral' },
  { id: 'Ju', rashi: 2, dignity: 'debilitated' },
  { id: 'Ve', rashi: 7, dignity: 'exalted' },
  { id: 'Sa', rashi: 8, dignity: 'neutral' },
]

describe('ashtakavarga Hindi leak', () => {
  it('keeps English insights when lang is omitted', () => {
    const input = {
      savByRashi: SAMPLE,
      ascRashi: 1 as Rashi,
      grahas: [{ id: 'Sa' as GrahaId, rashi: 6 as Rashi }, { id: 'Ju' as GrahaId, rashi: 4 as Rashi }, { id: 'Ve' as GrahaId, rashi: 8 as Rashi }, { id: 'Mo' as GrahaId, rashi: 1 as Rashi }],
      janmaNakshatraIndex: 0,
    }
    expect(analyzeAshtakavargaInsights(input)).toEqual(analyzeAshtakavargaInsights({ ...input, lang: 'en' }))
    expect(rateBindus(30).label).toBe(rateBindus(30, 'en').label)
    expect(rateBindus(30).band).toBe('clean')
    expect(bhavaBhaavam(SAMPLE, 10).topicShort).toBe('Career')
    expect(negativeHouseNotes(8, 12)[0]).toMatch(/d1|death|loss|obstacle|health|disease/i)
  })

  it('translates insight, bhava, sodhya, BAV and kakshya prose without Latin words', () => {
    const strings: unknown[] = []
    for (const sav of [SAMPLE, STRESSED]) {
      const en = analyzeAshtakavargaInsights({
        savByRashi: sav,
        ascRashi: 1,
        grahas: GRAHAS,
        janmaNakshatraIndex: 11,
      })
      const hi = analyzeAshtakavargaInsights({
        savByRashi: sav,
        ascRashi: 1,
        grahas: GRAHAS,
        janmaNakshatraIndex: 11,
        lang: 'hi',
      })
      expect(en).toEqual(analyzeAshtakavargaInsights({
        savByRashi: sav,
        ascRashi: 1,
        grahas: GRAHAS,
        janmaNakshatraIndex: 11,
        lang: 'en',
      }))
      expect(hi.khandas.dominant).toBe(en.khandas.dominant)
      expect(hi.houseRatings.map((h) => h.band)).toEqual(en.houseRatings.map((h) => h.band))
      expect(hi.promotion?.tenthLord).toBe(en.promotion?.tenthLord)
      strings.push(hi)
      for (const house of [1, 4, 6, 7, 8, 10, 12]) {
        const view = bhavaBhaavam(sav, house, 'hi')
        expect(view.body.role).toBe('body')
        expect(bhavaBhaavam(sav, house)).toEqual(bhavaBhaavam(sav, house, 'en'))
        strings.push(view)
      }
    }
    strings.push(buildHouseComparisonReadings(STRESSED, 28, 'hi'))
    expect(buildHouseComparisonReadings(SAMPLE, 28)).toEqual(buildHouseComparisonReadings(SAMPLE, 28, 'en'))
    for (const house of [6, 8, 12]) {
      for (const bindus of [0, 15, 28, 42]) {
        const hi = negativeHouseNotes(house, bindus, 'hi')
        expect(negativeHouseNotes(house, bindus)).toEqual(negativeHouseNotes(house, bindus, 'en'))
        strings.push(hi)
      }
    }
    for (const n of [0, 12, 23, 28, 30, 32, 36, 42]) {
      const hi = rateBindus(n, 'hi')
      expect(hi.band).toBe(rateBindus(n).band)
      expect(rateBindus(n)).toEqual(rateBindus(n, 'en'))
      strings.push(hi.label)
    }

    const av = avFixture()
    const bavEn = analyzeBhinnashtakavargaGuide({
      ashtakavarga: av,
      ascRashi: 1,
      grahas: GRAHAS,
      transitGrahas: GRAHAS.map((g) => ({ id: g.id, rashi: ((g.rashi + 3) % 12) + 1 })),
      dashaLord: 'Ju',
      janmaNakshatraIndex: 9,
      janmaPada: 2,
    })
    const bavHi = analyzeBhinnashtakavargaGuide({
      ashtakavarga: av,
      ascRashi: 1,
      grahas: GRAHAS,
      transitGrahas: GRAHAS.map((g) => ({ id: g.id, rashi: ((g.rashi + 3) % 12) + 1 })),
      dashaLord: 'Ju',
      janmaNakshatraIndex: 9,
      janmaPada: 2,
      lang: 'hi',
    })
    expect(bavEn).toEqual(analyzeBhinnashtakavargaGuide({
      ashtakavarga: av,
      ascRashi: 1,
      grahas: GRAHAS,
      transitGrahas: GRAHAS.map((g) => ({ id: g.id, rashi: ((g.rashi + 3) % 12) + 1 })),
      dashaLord: 'Ju',
      janmaNakshatraIndex: 9,
      janmaPada: 2,
      lang: 'en',
    }))
    expect(bavHi.planets.map((p) => p.planet)).toEqual(bavEn.planets.map((p) => p.planet))
    expect(bavHi.planets.map((p) => p.strength)).toEqual(bavEn.planets.map((p) => p.strength))
    strings.push(bavHi)

    const sodhyaEn = analyzeSodhyaPindas(av)
    const sodhyaHi = analyzeSodhyaPindas(av, 'hi')
    expect(sodhyaEn).toEqual(analyzeSodhyaPindas(av, 'en'))
    expect(sodhyaHi?.readings.map((r) => r.planet)).toEqual(sodhyaEn?.readings.map((r) => r.planet))
    expect(sodhyaHi?.readings.map((r) => r.band)).toEqual(sodhyaEn?.readings.map((r) => r.band))
    strings.push(sodhyaHi)

    const kakshya = (lord: KakshyaTransitRow['kakshyaLord'], hasBindu: boolean): KakshyaTransitRow => ({
      planet: 'Su',
      date: '2026-01-01',
      rashi: 1,
      degreeInSign: 12.4,
      kakshyaLord: lord,
      hasBindu,
      quality: hasBindu ? 'favorable' : 'unfavorable',
      bavInSign: 4,
      savInSign: 28,
      score: 60,
    })
    for (const lord of ['Sa', 'As'] as const) {
      for (const has of [true, false]) {
        const rowHi = kakshya(lord, has)
        expect(kakshyaNote(rowHi)).toBe(kakshyaNote(rowHi, 'en'))
        strings.push(kakshyaNote(rowHi, 'hi'))
      }
    }

    const leaks = leaksOf(strings)
    expect(leaks, `English leaks (${leaks.length}):\n${leaks.join('\n---\n')}`).toEqual([])
  })
})
