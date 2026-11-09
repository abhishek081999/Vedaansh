// Full Nadi reading and Jaimini yoga / trinity / dasha-board text in Hindi.
// Every sentence the Nadi panel shows must be Devanagari when lang=hi.
// English output keeps its wording; ids, houses and codes stay English.

import { beforeAll, describe, expect, it } from 'vitest'
import type { ChartOutput } from '@/types/astrology'
import { calculateChart } from '@/lib/engine/calculator'
import { readNadiChart } from '@/lib/engine/nadi'
import { readNadiLiveFromChart } from '@/lib/engine/nadi/live'
import { detectJaiminiRajayogas } from '@/lib/engine/jaimini'
import { calculateJaiminiTrinity } from '@/lib/engine/jaimini/trinity'
import { buildDashaBoard, matchLifeEvent } from '@/lib/engine/jaimini/dashaBoard'
import { calcCharaKarakas } from '@/lib/engine/karakas'

function collect(x: unknown, path: string, out: [string, string][] = []): [string, string][] {
  if (typeof x === 'string') out.push([path, x])
  else if (Array.isArray(x)) x.forEach((v, i) => collect(v, `${path}[${i}]`, out))
  else if (x && typeof x === 'object' && !(x instanceof Date)) {
    Object.entries(x).forEach(([k, v]) => collect(v, `${path}.${k}`, out))
  }
  return out
}

const CODE = /^(Su|Mo|Ma|Me|Ju|Ve|Sa|Ra|Ke|AK|AmK|BK|MK|PK|GK|DK|BCP|D\d+)$/
const ID_PATH = /\.(id|kind|chart|tone|type|strength)$/

/** Strings with two or more English words, outside id-like fields. */
function englishLeaks(value: unknown): string[] {
  return collect(value, 'root')
    .filter(([path]) => !ID_PATH.test(path))
    .map(([, text]) => text)
    .filter((text) => (text.match(/[A-Za-z]{3,}/g) ?? []).filter((w) => !CODE.test(w)).length >= 2)
}

const births = [
  { birthDate: '1990-05-15', birthTime: '10:30', utcDate: '1990-05-15', utcTime: '05:00:00', latitude: 28.61, longitude: 77.21, gender: 'male' },
  { birthDate: '1985-11-02', birthTime: '22:10', utcDate: '1985-11-02', utcTime: '16:40:00', latitude: 19.07, longitude: 72.87, gender: 'female' },
  { birthDate: '2001-02-20', birthTime: '04:05', utcDate: '2001-02-19', utcTime: '22:35:00', latitude: 22.57, longitude: 88.36, gender: 'male' },
] as const

let charts: ChartOutput[] = []
let sky: ChartOutput

beforeAll(async () => {
  charts = await Promise.all(births.map((b) => calculateChart({
    name: 'Test', birthPlace: 'India', timezone: 'Asia/Kolkata', ...b,
  } as Parameters<typeof calculateChart>[0])))
  sky = await calculateChart({
    name: 'Sky', birthDate: '2026-11-09', birthTime: '12:00', utcDate: '2026-11-09', utcTime: '06:30:00',
    birthPlace: 'Delhi', latitude: 28.61, longitude: 77.21, timezone: 'Asia/Kolkata', gender: 'male',
  } as Parameters<typeof calculateChart>[0])
}, 60_000)

describe('Nadi full reading in Hindi', () => {
  it('has no English sentences anywhere in the reading', () => {
    for (const chart of charts) {
      expect(englishLeaks(readNadiChart(chart, 'hi'))).toEqual([])
    }
  })

  it('keeps ids, houses and years the same in both languages', () => {
    for (const chart of charts) {
      const en = readNadiChart(chart)
      const hi = readNadiChart(chart, 'hi')
      expect(hi.houses.map((h) => [h.house, h.sign, h.lord])).toEqual(en.houses.map((h) => [h.house, h.sign, h.lord]))
      expect(hi.links.map((l) => l.id)).toEqual(en.links.map((l) => l.id))
      expect(hi.future.years.map((y) => [y.year, y.house, y.techniques])).toEqual(en.future.years.map((y) => [y.year, y.house, y.techniques]))
      expect(hi.career.priority).toBe(en.career.priority)
      expect(hi.marriageYogas.map((y) => y.id)).toEqual(en.marriageYogas.map((y) => y.id))
      expect(hi.degreeNotes.length).toBe(en.degreeNotes.length)
    }
  })

  it('keeps English text English', () => {
    const en = readNadiChart(charts[0]!)
    expect(en.placementNote).toMatch(/^A planet is read from the house/)
    expect(en.houses[0]!.prediction).toMatch(/^The 1st is /)
    expect(en.future.note).toMatch(/^The coming years stack/)
  })

  it('translates the live transit reading', () => {
    const bodies = sky.grahas
      .filter((g) => !['Ur', 'Ne', 'Pl'].includes(g.id))
      .map((g) => ({ id: g.id as 'Su', rashi: g.rashi, degree: g.degree, isRetro: g.isRetro }))
    for (const chart of charts) {
      const hi = readNadiLiveFromChart(chart, bodies, 'hi')
      const en = readNadiLiveFromChart(chart, bodies)
      expect(englishLeaks(hi)).toEqual([])
      expect(hi.hits.map((h) => h.id)).toEqual(en.hits.map((h) => h.id))
    }
  })
})

describe('Jaimini yogas, trinity and dasha board in Hindi', () => {
  it('translates rajayoga names and descriptions', () => {
    for (const chart of charts) {
      const karakas = calcCharaKarakas(chart.grahas.map((g) => ({ id: g.id, lonSidereal: g.lonSidereal, degree: g.degree })), 7)
      const args = [chart.grahas, chart.lagnas.ascRashi, karakas, chart.arudhas?.AL] as const
      const en = detectJaiminiRajayogas(...args, { d9: chart.vargas.D9, d9Lagna: chart.vargaLagnas?.D9 })
      const hi = detectJaiminiRajayogas(...args, { d9: chart.vargas.D9, d9Lagna: chart.vargaLagnas?.D9, lang: 'hi' })
      expect(englishLeaks(hi)).toEqual([])
      expect(hi.map((y) => [y.id, y.strength])).toEqual(en.map((y) => [y.id, y.strength]))
    }
  })

  it('translates trinity reasons and keeps the planets', () => {
    for (const chart of charts) {
      const en = calculateJaiminiTrinity(chart)
      const hi = calculateJaiminiTrinity(chart, 'hi')
      expect(englishLeaks(hi)).toEqual([])
      expect([hi.brahma.id, hi.maheshwara.id, hi.rudra.id]).toEqual([en.brahma.id, en.maheshwara.id, en.rudra.id])
    }
  })

  it('translates dasha board details and event reasons', () => {
    const chart = charts[1]!
    const karakas = calcCharaKarakas(chart.grahas.map((g) => ({ id: g.id, lonSidereal: g.lonSidereal, degree: g.degree })), 7)
    const systems = [{ id: 'vimshottari', name: 'विंशोत्तरी', kind: 'graha' as const, nodes: chart.dashas?.vimshottari ?? [] }]
    const base = { grahas: chart.grahas, lagna: chart.lagnas.ascRashi, roleOf: karakas.roleOf, method: 'classical' as const }
    const hi = buildDashaBoard(systems, { ...base, lang: 'hi' }, new Date('2026-11-09T12:00:00Z'))
    expect(englishLeaks(hi.rows.map((r) => r.periods))).toEqual([])
    const event = { id: 'e1', type: 'marriage' as const, date: '2012-03-01' }
    const match = matchLifeEvent(event, systems, { ...base, lang: 'hi' }, { karakas: karakas as never })
    expect(englishLeaks(match?.systems.map((s) => s.reasons))).toEqual([])
    const en = buildDashaBoard(systems, base, new Date('2026-11-09T12:00:00Z'))
    expect(en.rows[0]?.periods[0]?.detail).toMatch(/house/)
  })
})
