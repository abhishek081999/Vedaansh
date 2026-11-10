// Hindi Sthana / Kaal / Dig-Drig-Cheshta readings must not leak Latin words
// of 4+ letters. Ids, bands, tones, roles and graha codes stay English.
// Omitted lang and lang='en' stay on the English sentences.

import { describe, expect, it } from 'vitest'
import type { DashaNode, GrahaData, GrahaId, Rashi, ShadbalaPlanet, ShadbalaResult } from '@/types/astrology'
import { analyzeSthanaBala } from '@/lib/engine/sthanaBalaAnalysis'
import { analyzeKalaBala } from '@/lib/engine/kalaBalaAnalysis'
import { analyzeDigDrigChesta } from '@/lib/engine/digDrigChestaAnalysis'
import { D9 } from '@/lib/engine/vargas'

const LATIN_WORD = /[A-Za-z]{4,}/
const SKIP_KEYS = new Set([
  'id', 'topic', 'tone', 'role', 'softBand', 'profile', 'careerPath', 'polarity',
  'direction', 'dominant', 'seventhModality', 'lord', 'scoredId', 'fromRole', 'toRole',
  'varga', 'strongestId', 'weakestId', 'mostPositiveId', 'mostNegativeId',
])

function collectDisplay(value: unknown, key: string | null, out: string[]): void {
  if (typeof value === 'string') {
    if (key && SKIP_KEYS.has(key)) return
    out.push(value)
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

const ORDER = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa'] as const

function planet(
  id: GrahaId,
  parts: { sthana?: number; kala?: number; dig?: number; chesta?: number; drik?: number; naisargika?: number },
): ShadbalaPlanet {
  const sthana = parts.sthana ?? 140
  const kala = parts.kala ?? 120
  const dig = parts.dig ?? 30
  const chesta = parts.chesta ?? 40
  const drik = parts.drik ?? 0
  const naisargika = parts.naisargika ?? 30
  return {
    id,
    sthanaBala: sthana / 60,
    digBala: dig / 60,
    kalaBala: kala / 60,
    chestaBala: chesta / 60,
    naisargikaBala: naisargika / 60,
    drikBala: drik / 60,
    total: 5,
    totalShash: 300,
    required: 5,
    ratio: 1,
    isStrong: true,
    componentShash: { sthana, dig, kala, chesta, naisargika, drik },
    details: {
      sthana: { uccha: 40, saptavargaja: 40, ojhayugma: 20, kendradi: 20, drekkana: 10 },
      kala: { natha: 10, paksha: 10, tribhaga: 10, vaara: 10, hora: 10, maasa: 10, varsha: 10, ayana: 10, yuddha: 0, isDayBirth: true },
      drik: { benefic: Math.max(0, drik), malefic: Math.max(0, -drik), net: drik },
    },
  }
}

function shadbala(map: Partial<Record<(typeof ORDER)[number], Parameters<typeof planet>[1]>>): ShadbalaResult {
  const planets: Record<string, ShadbalaPlanet> = {}
  for (const id of ORDER) planets[id] = planet(id, map[id] ?? {})
  return { planets, strongest: 'Ju', weakest: 'Sa', averageRatio: 1, generatedProfile: 'balanced' }
}

function maha(lord: string, start: string, end: string, isCurrent: boolean): DashaNode {
  return { lord, start: new Date(start), end: new Date(end), durationMs: 1, level: 1, isCurrent, children: [] }
}

const LIBRA_D9: number[] = []
for (let lon = 0; lon < 360 && LIBRA_D9.length < 4; lon += 0.25) {
  if (D9(lon) === 7) LIBRA_D9.push(lon)
}

function graha(id: GrahaId, rashi: Rashi, totalDegree: number): GrahaData {
  return {
    id,
    name: id,
    lonTropical: totalDegree,
    lonSidereal: totalDegree,
    latitude: 0,
    speed: 1,
    isRetro: false,
    isCombust: false,
    rashi,
    rashiName: String(rashi),
    degree: totalDegree % 30,
    totalDegree,
    nakshatraIndex: 0,
    nakshatraName: '0',
    pada: 1,
    dignity: 'neutral',
  } as GrahaData
}

describe('Shadbala analysis Hindi', () => {
  const asOf = new Date('2024-06-15T12:00:00Z')
  const dashaJu = [
    maha('Me', '2010-01-01', '2027-01-01', true),
    maha('Ju', '2027-01-01', '2043-01-01', false),
  ]
  const dashaVe = [maha('Ve', '2020-01-01', '2040-01-01', true)]
  const dashaRa = [
    maha('Ra', '2020-01-01', '2038-01-01', true),
    maha('Ju', '2038-01-01', '2054-01-01', false),
  ]
  const kalaTriple = [
    maha('Ju', '2000-01-01', '2016-01-01', false),
    maha('Sa', '2016-01-01', '2035-01-01', true),
    maha('Me', '2035-01-01', '2052-01-01', false),
  ]
  const moonDashas = [maha('Mo', '2020-01-01', '2030-01-01', true)]

  const cases = [
    () => analyzeSthanaBala(shadbala({ Ju: { sthana: 220 }, Me: { sthana: 130 }, Sa: { sthana: 80 } }), { dashaNodes: dashaJu, asOf, lang: 'hi' }),
    () => analyzeSthanaBala(shadbala({
      Su: { sthana: 140 }, Mo: { sthana: 138 }, Ma: { sthana: 150 }, Me: { sthana: 145 }, Ju: { sthana: 160 }, Ve: { sthana: 142 }, Sa: { sthana: 112 },
    }), { lang: 'hi' }),
    () => analyzeSthanaBala(shadbala({ Su: { sthana: 85 }, Mo: { sthana: 90 }, Ma: { sthana: 95 }, Sa: { sthana: 80 } }), { lang: 'hi' }),
    () => analyzeSthanaBala(shadbala({ Ve: { sthana: 255 } }), { dashaNodes: dashaVe, asOf, lang: 'hi' }),
    () => analyzeSthanaBala(shadbala({ Su: { sthana: 200 } }), { dashaNodes: dashaRa, grahas: [graha('Ra', 5, 130)], asOf, lang: 'hi' }),
    () => analyzeSthanaBala(shadbala({}), { dashaNodes: dashaRa, asOf, lang: 'hi' }),
    () => analyzeKalaBala(shadbala({ Su: { kala: 140 }, Mo: { kala: 140 }, Ma: { kala: 140 }, Me: { kala: 160 }, Ju: { kala: 140 }, Ve: { kala: 140 }, Sa: { kala: 135 } }), { ascRashi: 1, grahas: ORDER.map((id, i) => graha(id, 1, 10 + i)), lang: 'hi' }),
    () => analyzeKalaBala(shadbala({ Su: { kala: 70 }, Mo: { kala: 80 }, Sa: { kala: 60 }, Ju: { kala: 200 }, Me: { kala: 90 } }), { dashaNodes: kalaTriple, asOf, grahas: ORDER.map((id) => graha(id, id === 'Me' ? 2 : 1, 15)), ascRashi: 1, lang: 'hi' }),
    () => analyzeKalaBala(shadbala({ Mo: { kala: 278 } }), { dashaNodes: moonDashas, asOf, lang: 'hi' }),
    () => analyzeKalaBala(shadbala({}), { lang: 'hi' }),
    () => analyzeKalaBala(shadbala({ Me: { kala: 90 } }), { grahas: [graha('Me', 3, 40)], ascRashi: 1, lang: 'hi' }),
    () => analyzeDigDrigChesta(shadbala({
      Ve: { dig: 55, chesta: 12, drik: 8 },
      Mo: { dig: 10, chesta: 20 },
      Ju: { dig: 52, chesta: 60, drik: 12 },
      Sa: { dig: 18, chesta: 55, drik: -15 },
      Su: { dig: 48, chesta: 30 },
    }), {
      lang: 'hi',
      ascRashi: 1,
      asOf,
      dashaNodes: dashaVe,
      grahas: ORDER.map((id, i) => graha(id, i < 4 ? 1 : 3, LIBRA_D9[i] ?? 10 + i)),
    }),
    () => analyzeDigDrigChesta(shadbala({ Ve: { chesta: 30, dig: 25 }, Ju: { chesta: 30 }, Sa: { chesta: 30 } }), {
      lang: 'hi',
      dashaNodes: dashaRa,
      asOf,
    }),
  ]

  it('has no long Latin prose when lang is Hindi', () => {
    const leaks = cases.flatMap((run) => leaksOf(run()))
    expect(leaks).toEqual([])
  })

  it('keeps English sentences and ids when lang is omitted', () => {
    const en = analyzeSthanaBala(shadbala({ Ju: { sthana: 220 } }), { dashaNodes: dashaJu, asOf })
    const explicit = analyzeSthanaBala(shadbala({ Ju: { sthana: 220 } }), { dashaNodes: dashaJu, asOf, lang: 'en' })
    expect(explicit?.summary).toBe(en?.summary)
    expect(en?.summary).toMatch(/Virupas/)
    expect(en?.predictions.find((p) => p.topic === 'career')?.basedOn).toBe('Jupiter')
    expect(en?.predictions.find((p) => p.topic === 'career')?.title).toMatch(/next MD/i)
    const hi = analyzeSthanaBala(shadbala({ Ju: { sthana: 220 } }), { dashaNodes: dashaJu, asOf, lang: 'hi' })
    expect(hi?.predictions.map((p) => p.id)).toEqual(en?.predictions.map((p) => p.id))
    expect(hi?.profile).toBe(en?.profile)
    expect(hi?.rows.map((r) => r.softBand)).toEqual(en?.rows.map((r) => r.softBand))
  })
})
