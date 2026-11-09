// Hindi Jaimini text must not leak long English prose when lang=hi.
// Ids, nakshatra keys, karaka codes, and argala source labels stay English.

import { describe, expect, it } from 'vitest'
import type { DashaNode, GrahaData, GrahaId, LagnaData, Rashi } from '@/types/astrology'
import { calculateJaiminiBala } from '@/lib/engine/jaimini/bala'
import { readArgalaTable } from '@/lib/engine/jaimini/argala'
import { calculateFamilyKarakas } from '@/lib/engine/jaimini/family'
import {
  readAkNakshatra,
  readArudhaInsights,
  readGateway,
  readHouseTriads,
  readSpecialLagnas,
  readTransitTriggers,
  readTrinityActivation,
  type InsightContext,
} from '@/lib/engine/jaimini/insights'
import { readKarakamsha } from '@/lib/engine/jaimini/karakamsha'
import { readJaiminiDasha } from '@/lib/engine/jaimini/dashaReading'
import {
  readKarakaLife,
  readSoulKarakas,
  recommendMandook,
  sagittariusBand,
} from '@/lib/engine/jaimini/judgment'

function collectStrings(x: unknown, out: string[] = []): string[] {
  if (typeof x === 'string') out.push(x)
  else if (Array.isArray(x)) x.forEach(v => collectStrings(v, out))
  else if (x && typeof x === 'object') Object.values(x).forEach(v => collectStrings(v, out))
  return out
}

const DEVANAGARI = /[\u0900-\u097F]/
const LATIN_WORD = /[A-Za-z]{4,}/
const GRAHA_CODE = /^(Su|Mo|Ma|Me|Ju|Ve|Sa|Ra|Ke|AK|AmK|BK|MK|PK|GK|DK)$/

function isAllowedLatin(s: string): boolean {
  const t = s.trim()
  if (t.length < 25) return true
  if (DEVANAGARI.test(t)) return true
  if (!LATIN_WORD.test(t)) return true
  const tokens = t.split(/\s+/).filter(Boolean)
  if (tokens.every(w => GRAHA_CODE.test(w) || /^[AD]L$/.test(w) || /^A\d+$/.test(w) || /^\d/.test(w))) return true
  return false
}

function leaksOf(value: unknown): string[] {
  return [...new Set(collectStrings(value).filter(s => !isAllowedLatin(s)).map(s => s.slice(0, 180)))]
}

function g(id: GrahaId, rashi: number, degree: number, dignity: GrahaData['dignity'] = 'neutral'): GrahaData {
  return { id, rashi: rashi as Rashi, degree, dignity, lonSidereal: (rashi - 1) * 30 + degree } as unknown as GrahaData
}

const GRAHAS = [
  g('Su', 1, 29), g('Mo', 2, 25), g('Ma', 3, 21), g('Me', 4, 17),
  g('Ju', 5, 13), g('Ve', 6, 9), g('Sa', 7, 5), g('Ra', 11, 3), g('Ke', 5, 3),
]
const LAGNAS = { ascRashi: 1 as Rashi, ascDegree: 10, ascDegreeInRashi: 10, ghatiLagna: 100, varnadaLagna: 200, horaLagna: 300 } as unknown as LagnaData
const ROLES = { Su: 'AK', Mo: 'AmK', Ma: 'BK', Me: 'MK', Ju: 'PK', Ve: 'GK', Sa: 'DK' } as Partial<Record<GrahaId, string>>
const nodes = [1, 2, 3, 4].map((i, n) => ({
  lord: ['Ar', 'Ta', 'Ge', 'Cn'][n],
  start: new Date(`${2000 + n * 10}-01-01`),
  end: new Date(`${2010 + n * 10}-01-01`),
  level: 1,
  children: [],
})) as unknown as DashaNode[]

function ctx(method: InsightContext['method']): InsightContext {
  return {
    grahas: GRAHAS,
    lagnas: LAGNAS,
    roleOf: ROLES,
    bala: calculateJaiminiBala({ grahas: GRAHAS, lagnas: LAGNAS }),
    nodes,
    method,
    asOf: new Date('2025-01-01'),
    lang: 'hi',
  }
}

describe('jaimini Hindi leak', () => {
  it('keeps judgment, dasha, family, and karakamsha prose in Hindi', () => {
    const placed = GRAHAS.map(planet => ({ id: planet.id, rashi: planet.rashi, degree: planet.degree }))
    const leaks = leaksOf([
      recommendMandook(placed, 1, 'hi'),
      sagittariusBand(1, 'hi'),
      readSoulKarakas({ grahas: placed, lagna: 1, ak: 'Su', amk: 'Mo', lang: 'hi' }),
      readKarakaLife({ grahas: placed, lagna: 1, ak: 'Su', amk: 'Mo', bk: 'Ma', mk: 'Me', pk: 'Ju', gk: 'Ve', dk: 'Sa', ageYears: 15, lang: 'hi' }),
      readJaiminiDasha({ sign: 9, lagna: 1, grahas: placed, roleOf: ROLES, antarSign: 8, sequenceForward: false, vimshottariLord: 'गुरु', upapada: 9, karakamsha: 5, lang: 'hi' }),
      calculateFamilyKarakas(GRAHAS, 'hi'),
      readKarakamsha({ d1: placed, d9: placed, lagna: 1, arudhaLagna: 2, ak: 'Su', amk: 'Mo', dk: 'Sa', lang: 'hi' }),
    ])
    expect(leaks).toEqual([])
  })

  it('keeps insight and argala prose in Hindi', () => {
    const practical = ctx('practical')
    const leaks = leaksOf([
      readGateway(practical, 3),
      readSpecialLagnas(practical),
      readTrinityActivation(practical),
      readArudhaInsights(practical, { AL: 12, A7: 4 }),
      readHouseTriads(practical),
      readAkNakshatra(practical, 'Su'),
      readTransitTriggers(practical, [{ id: 'Sa', rashi: 3 }], { dashaSign: 3, ak: 'Su', dk: 'Sa' }),
      readArgalaTable(1, GRAHAS.map(planet => ({ id: planet.id, rashi: planet.rashi, degree: planet.degree })), () => 10, 'practical', 'hi'),
    ])
    for (let lon = 0; lon < 360; lon += 13.3) {
      const rashi = (Math.floor(lon / 30) + 1) as Rashi
      leaks.push(...leaksOf(readAkNakshatra({ ...practical, grahas: [g('Su', rashi, lon % 30)] }, 'Su')))
    }
    expect([...new Set(leaks)]).toEqual([])
  })
})
