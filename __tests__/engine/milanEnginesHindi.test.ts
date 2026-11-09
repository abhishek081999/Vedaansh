import { describe, it, expect } from 'vitest'
import type { ChartOutput, GrahaData, Rashi } from '@/types/astrology'
import { analyzeManglikPair, analyzeMarriageTiming, buildMilanRemedies, catalogVaidhavyaCues } from '@/lib/engine/milanSuite'
import { calculatePorutham } from '@/lib/engine/porutham'
import { analyzeMilanDeep } from '@/lib/engine/milanDeepAnalysis'
import { analyzeMatchMaking } from '@/lib/engine/matchMaking'
import { matchVaidhavyaVidhur, analyzeDashaPair } from '@/lib/engine/milanExtras'

const DEVANAGARI = /[\u0900-\u097F]/

function stubGraha(partial: Partial<GrahaData> & { id: GrahaData['id']; rashi: Rashi }): GrahaData {
  return {
    name: partial.id, lonTropical: 0, lonSidereal: 0, latitude: 0, speed: 1,
    isRetro: false, isCombust: false, rashiName: String(partial.rashi),
    degree: 5, totalDegree: (partial.rashi - 1) * 30 + 5,
    nakshatraIndex: 4, nakshatraName: 'Rohini', pada: 1, dignity: 'neutral',
    avastha: { baladi: 'Yuva', jagradadi: 'Jagrat' }, charaKaraka: null,
    gandanta: { isGandanta: false, type: null, severity: 'none', position: null, distanceFromJunction: null, rashi: partial.rashi, nakshatraIndex: 4, degreeInNakshatra: 0 },
    yuddha: { isWarring: false, planets: [], winner: null, loser: null, degreeDifference: 0, orb: 1 },
    pushkara: { isPushkara: false, type: null, rashi: partial.rashi, degreeInSign: 5, navamsha: 1, isPushkaraNavamsha: false, remedy: null },
    mrityuBhaga: { isMrityuBhaga: false, severity: 'none', rashi: partial.rashi, degreeInSign: 5, mrityuDegree: 0, distanceFromMrityu: 15, interpretation: null, remedy: null },
    ...partial,
  }
}

function chart(name: string, asc: Rashi): ChartOutput {
  return {
    meta: { name, gender: 'male', birthDate: '1990-01-01', birthTime: '12:00', birthPlace: 'X', latitude: 0, longitude: 0, timezone: 'UTC', settings: { ayanamsha: 'lahiri' }, calculatedAt: new Date(), ayanamshaValue: 24, julianDay: 1 },
    grahas: [
      stubGraha({ id: 'Su', rashi: 1 }), stubGraha({ id: 'Mo', rashi: 4 }),
      stubGraha({ id: 'Ma', rashi: 2 }), stubGraha({ id: 'Me', rashi: 2 }),
      stubGraha({ id: 'Ju', rashi: 9 }), stubGraha({ id: 'Ve', rashi: 2 }),
      stubGraha({ id: 'Sa', rashi: 10 }), stubGraha({ id: 'Ra', rashi: 11 }), stubGraha({ id: 'Ke', rashi: 5 }),
    ],
    lagnas: { ascRashi: asc },
    dashas: { vimshottari: [] },
  } as unknown as ChartOutput
}

describe('Milan engines Hindi', () => {
  it('keeps porutham English byte-stable by default', () => {
    const en = calculatePorutham(1, 1, 5, 5)
    const explicit = calculatePorutham(1, 1, 5, 5, 'en')
    expect(JSON.stringify(explicit)).toBe(JSON.stringify(en))
  })

  it('returns Devanagari for porutham when lang is hi', () => {
    const hi = calculatePorutham(1, 1, 5, 5, 'hi')
    expect(DEVANAGARI.test(hi.summary)).toBe(true)
    expect(hi.items.every(i => DEVANAGARI.test(i.detail))).toBe(true)
  })

  it('returns Devanagari for manglik pair in Hindi', () => {
    const a = chart('A', 1)
    const b = chart('B', 5)
    const hi = analyzeManglikPair(a, b, 'hi')
    expect(DEVANAGARI.test(hi.label)).toBe(true)
    expect(DEVANAGARI.test(hi.detail)).toBe(true)
  })

  it('localizes milan remedies in Hindi', () => {
    const hi = buildMilanRemedies({ nadiDosha: true }, 'hi')
    expect(hi[0].title).toMatch(DEVANAGARI)
    expect(hi[0].detail).toMatch(DEVANAGARI)
  })

  it('keeps analyzeMilanDeep English stable with explicit en', () => {
    const a = chart('A', 1)
    const b = chart('B', 7)
    const def = analyzeMilanDeep(a, b)
    const en = analyzeMilanDeep(a, b, 'en')
    expect(JSON.stringify(def)).toBe(JSON.stringify(en))
  })

  it('returns Devanagari pillars for match making in Hindi', () => {
    const a = chart('A', 1)
    const b = chart('B', 7)
    const hi = analyzeMatchMaking(a, b, 'hi')
    expect(hi).not.toBeNull()
    expect(DEVANAGARI.test(hi!.headline)).toBe(true)
    expect(hi!.steps.every(s => DEVANAGARI.test(s.title))).toBe(true)
    expect(DEVANAGARI.test(hi!.summary)).toBe(true)
    expect(hi!.steps.every(s => DEVANAGARI.test(s.detail))).toBe(true)
    expect(DEVANAGARI.test(hi!.lagna.reason)).toBe(true)
    expect(hi!.vargas.some(v => v.hits.length > 0 && DEVANAGARI.test(v.hits[0].title))).toBe(true)
  })

  it('returns Devanagari milan deep overall and affliction notes in Hindi', () => {
    const a = chart('A', 1)
    const b = chart('B', 7)
    const hi = analyzeMilanDeep(a, b, 'hi')
    expect(DEVANAGARI.test(hi.overall.summary)).toBe(true)
    expect(hi.stage2.houseAfflictions.every(h => DEVANAGARI.test(h.note))).toBe(true)
    expect(hi.stage2.seventhRotation.every(r => r.notes.every(n => DEVANAGARI.test(n)))).toBe(true)
    expect(hi.longevityYogas.personA.factors.every(f => DEVANAGARI.test(f))).toBe(true)
  })

  it('vaidhavya summary in Hindi', () => {
    const a = chart('A', 1)
    const b = chart('B', 7)
    const hi = matchVaidhavyaVidhur(a, b, 'hi')
    expect(DEVANAGARI.test(hi.summary)).toBe(true)
  })

  it('dasha pair summary in Hindi', () => {
    const a = chart('A', 1)
    const b = chart('B', 7)
    const hi = analyzeDashaPair(a, b, new Date(), 'hi')
    expect(hi.findings.some(f => DEVANAGARI.test(f.title) || DEVANAGARI.test(f.detail))).toBe(true)
  })

  it('vaidhavya catalog items in Hindi', () => {
    const items = catalogVaidhavyaCues(chart('X', 1), 'hi')
    expect(items.length).toBeGreaterThan(0)
    expect(items.every(i => DEVANAGARI.test(i.name) && DEVANAGARI.test(i.detail))).toBe(true)
  })
})
