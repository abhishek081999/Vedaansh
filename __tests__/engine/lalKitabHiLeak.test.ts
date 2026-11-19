// The Lal Kitab reading in Hindi must not leak English sentences.
// Ids, codes, houses and enums stay English.

import { beforeAll, describe, expect, it } from 'vitest'
import type { ChartOutput } from '@/types/astrology'
import { calculateChart } from '@/lib/engine/calculator'
import { LK_GRAHAS, LK_HOUSES, lkGrahaKaraka, lkHouseMeaning, readLalKitab } from '@/lib/engine/lalKitab'

function collect(x: unknown, path: string, out: [string, string][] = []): [string, string][] {
  if (typeof x === 'string') out.push([path, x])
  else if (Array.isArray(x)) x.forEach((v, i) => collect(v, `${path}[${i}]`, out))
  else if (x && typeof x === 'object' && !(x instanceof Date)) {
    Object.entries(x).forEach(([k, v]) => collect(v, `${path}.${k}`, out))
  }
  return out
}

const CODE = /^(Su|Mo|Ma|Me|Ju|Ve|Sa|Ra|Ke)$/
const ID_PATH = /\.(id|planet|from|to|a|b|kind|relation|effect|basis|op|area|tone|side|role|waker|houses|planet|victim|reason|kind|cost|houses\[\d+\]|strengthens\[\d+\]|releases\[\d+\]|notNeeded\[\d+\]|doshas\[\d+\]|planets\[\d+\]|areas\[\d+\]|reasons\[\d+\]|dignities\[\d+\]|occupants\[\d+\]|karakas\[\d+\]|others\[\d+\]|lang)$/

function englishLeaks(value: unknown): string[] {
  return collect(value, 'root')
    .filter(([path]) => !ID_PATH.test(path))
    .map(([, text]) => text)
    .filter((text) => (text.match(/[A-Za-z]{3,}/g) ?? []).filter((w) => !CODE.test(w)).length >= 1)
}

const births = [
  { birthDate: '1990-05-15', birthTime: '10:30', utcDate: '1990-05-15', utcTime: '05:00:00', latitude: 28.61, longitude: 77.21, gender: 'male' },
  { birthDate: '1985-11-02', birthTime: '22:10', utcDate: '1985-11-02', utcTime: '16:40:00', latitude: 19.07, longitude: 72.87, gender: 'female' },
  { birthDate: '2001-02-20', birthTime: '04:05', utcDate: '2001-02-19', utcTime: '22:35:00', latitude: 22.57, longitude: 88.36, gender: 'male' },
] as const

let charts: ChartOutput[] = []

beforeAll(async () => {
  charts = await Promise.all(births.map((b) => calculateChart({
    name: 'Test', birthPlace: 'India', timezone: 'Asia/Kolkata', ...b,
  } as Parameters<typeof calculateChart>[0])))
}, 60_000)

describe('Lal Kitab reading in Hindi', () => {
  it('has no English in findings, reasons, houses or planets', () => {
    for (const chart of charts) {
      const r = readLalKitab(chart, { lang: 'hi' })
      expect(r.findings.length).toBeGreaterThan(0)
      expect(englishLeaks({
        findings: r.findings.map(({ trail: _trail, ...f }) => f),
        houses: r.houses,
        planets: r.planets,
        conjunctions: r.conjunctions,
        masnui: r.masnui.map(({ label, text }) => ({ label, text })),
        phal: r.phal,
        areas: r.areas,
        remedies: r.remedies,
      })).toEqual([])
    }
  })

  it('translates every karaka and house meaning', () => {
    expect(englishLeaks(LK_GRAHAS.map((id) => lkGrahaKaraka(id, 'hi')))).toEqual([])
    expect(englishLeaks(LK_HOUSES.map((h) => lkHouseMeaning(h, 'hi')))).toEqual([])
  })

  it('keeps the English reading in English', () => {
    const r = readLalKitab(charts[0], { lang: 'en' })
    expect(r.findings.every((f) => /[A-Za-z]/.test(f.text))).toBe(true)
  })
})
