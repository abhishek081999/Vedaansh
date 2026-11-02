// ─────────────────────────────────────────────────────────────
//  __tests__/engine/navamshaPredictions.test.ts
//  D9 sign knowledge base + advanced navamsha prediction rules
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { buildNavamshaPredictions } from '@/lib/engine/navamshaPredictions'
import { NAVAMSHA_DASHA_NOTE } from '@/lib/engine/navamshaSignKnowledge'
import {
  ATMAKARAKA_IN_NAVAMSHA,
  NAVAMSHA_SIGNS,
  SOURCE_SIGN_GENERIC,
} from '@/lib/engine/navamshaSignKnowledge'
import type { NavamshaAnalysis } from '@/lib/engine/navamshaAnalysis'
import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'
import type { Dignity, GrahaId, Rashi } from '@/types/astrology'

const ALL: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']

interface Spec { id: GrahaId; d1: Rashi; d9: Rashi; d1Dig?: Dignity; d9Dig?: Dignity; deg?: number }

function stubAnalysis(d1Asc: Rashi, d9Asc: Rashi, specs: Spec[], ak: GrahaId, dashaLords: GrahaId[] = []): NavamshaAnalysis {
  const house = (asc: Rashi, r: Rashi) => ((r - asc + 12) % 12) + 1
  const planets = specs.map((s) => ({
    id: s.id,
    name: GRAHA_NAMES[s.id],
    d1Rashi: s.d1,
    d1RashiName: RASHI_NAMES[s.d1],
    d1Degree: s.deg ?? 10,
    d1House: house(d1Asc, s.d1),
    d9Rashi: s.d9,
    d9RashiName: RASHI_NAMES[s.d9],
    d9House: house(d9Asc, s.d9),
    d1Dignity: s.d1Dig ?? 'neutral',
    d9Dignity: s.d9Dig ?? 'neutral',
    isVargottama: s.d1 === s.d9,
  }))
  const houses = Array.from({ length: 12 }, (_, i) => {
    const rashi = (((d9Asc - 1 + i) % 12) + 1) as Rashi
    return {
      house: i + 1,
      rashi,
      rashiName: RASHI_NAMES[rashi],
      occupants: planets.filter((p) => p.d9Rashi === rashi).map((p) => ({ id: p.id })),
    }
  })
  return {
    d9Lagna: d9Asc,
    d9LagnaName: RASHI_NAMES[d9Asc],
    atmakaraka: ak,
    planets,
    houses,
    dashaOverlay: dashaLords.length
      ? { lords: dashaLords.map((lord, i) => ({ lord, levelLabel: i === 0 ? 'Maha' : 'Antar' })) }
      : null,
  } as unknown as NavamshaAnalysis
}

describe('navamsha sign knowledge base', () => {
  it('covers all 12 signs with every planet reading', () => {
    for (let s = 1; s <= 12; s++) {
      const p = NAVAMSHA_SIGNS[s as Rashi]
      expect(p.sign).toBe(s)
      expect(p.essence.length).toBeGreaterThan(40)
      expect(p.remedy.length).toBeGreaterThan(10)
      for (const g of ALL) expect(p.planets[g], `${s}/${g}`).toBeTruthy()
      expect(ATMAKARAKA_IN_NAVAMSHA[s as Rashi]).toBeTruthy()
      expect(SOURCE_SIGN_GENERIC[s as Rashi]).toBeTruthy()
    }
  })
})

describe('buildNavamshaPredictions', () => {
  // D1 Aries lagna, D9 Aries lagna
  const specs: Spec[] = [
    { id: 'Su', d1: 7, d9: 1, d1Dig: 'debilitated', d9Dig: 'exalted' }, // neecha → ucha
    { id: 'Mo', d1: 2, d9: 2 }, // vargottama Taurus
    { id: 'Ma', d1: 6, d9: 1 }, // from 6th house + Virgo into Aries
    { id: 'Me', d1: 3, d9: 10 },
    { id: 'Ju', d1: 9, d9: 4 },
    { id: 'Ve', d1: 12, d9: 10 },
    { id: 'Sa', d1: 10, d9: 7 }, // Saturn in D9 7th
    { id: 'Ra', d1: 5, d9: 1 }, // Mars–Rahu in Aries navamsha
    { id: 'Ke', d1: 11, d9: 9 }, // 9th from AK (Sun in Aries)
  ]
  const report = buildNavamshaPredictions(stubAnalysis(1, 1, specs, 'Su', ['Ma', 'Ve']), 1)

  it('reads every planet with sign, source and house text', () => {
    expect(report.planets).toHaveLength(9)
    const su = report.planets.find((p) => p.id === 'Su')!
    expect(su.navamshaTitle).toBe('The Battlefield')
    expect(su.signReading).toContain('Exalted Sun')
    expect(su.isAtmakaraka).toBe(true)
    expect(su.lordOf).toEqual([5])
    const mo = report.planets.find((p) => p.id === 'Mo')!
    expect(mo.isVargottama).toBe(true)
    expect(mo.sourceReading).toContain('Vargottama')
  })

  it('flags dasha-active planets', () => {
    expect(report.activeNow.map((p) => p.id).sort()).toEqual(['Ma', 'Ve'])
  })

  it('reads the atmakaraka navamsha with exalted/debilitated qualities', () => {
    expect(report.atmakaraka?.d9Rashi).toBe(1)
    expect(report.atmakaraka?.present?.planet).toBe('Su')
    expect(report.atmakaraka?.missing?.planet).toBe('Sa')
  })

  it('triggers lecture rules', () => {
    const ids = report.rules.map((r) => r.id)
    expect(ids).toContain('combo-Ma-Ra')
    expect(report.rules.find((r) => r.id === 'combo-Ma-Ra')!.title).toContain('Aries')
    expect(ids).toContain('health-aries-Ma')
    expect(ids).toContain('health-virgo-Ma')
    expect(ids).toContain('dig-rise-Su')
    expect(ids).toContain('lagna-Sa-1-7')
    expect(ids).toContain('karaka-ke-9-ak')
    expect(ids).toContain('karaka-ak-ra')
  })

  it('builds 12 sign cards and age markers', () => {
    expect(report.signCards).toHaveLength(12)
    expect(report.signCards[0]!.occupants.sort()).toEqual(['Ma', 'Ra', 'Su'])
    expect(report.ageMarkers.some((m) => m.age === 33 && m.planets.includes('Ve'))).toBe(true)
    expect(report.ageMarkers.map((m) => m.age)).toEqual([...report.ageMarkers.map((m) => m.age)].sort((a, b) => a - b))
  })
})

describe('buildNavamshaPredictions — extended lecture rules', () => {
  // D1 Aries lagna, D9 Cancer lagna
  const specs: Spec[] = [
    { id: 'Su', d1: 1, d9: 5, d1Dig: 'exalted' },
    { id: 'Mo', d1: 4, d9: 4, deg: 0.5 }, // Moon in D1 4th at 0°
    { id: 'Ma', d1: 3, d9: 6 }, // lagna lord with Rahu in Virgo
    { id: 'Me', d1: 6, d9: 7 }, // 3rd/6th lord in Libra with Saturn
    { id: 'Ju', d1: 9, d9: 12 }, // AK in Pisces with Ketu
    { id: 'Ve', d1: 2, d9: 2, d9Dig: 'own' },
    { id: 'Sa', d1: 10, d9: 7 },
    { id: 'Ra', d1: 5, d9: 6 },
    { id: 'Ke', d1: 11, d9: 12 },
  ]
  const report = buildNavamshaPredictions(stubAnalysis(1, 4, specs, 'Ju'), 1, {
    induLagnaLon: 30, // Krittika → Sun, exalted in D1
    strongestGraha: 'Su',
  })
  const ids = report.rules.map((r) => r.id)

  it('adds Mercury fame, Libra and Virgo rules', () => {
    expect(ids).toContain('fame-Me-Sa')
    expect(ids).toContain('combo-Me-Sa')
    expect(report.rules.find((r) => r.id === 'combo-Me-Sa')!.title).toContain('Libra')
    expect(ids).toContain('lord-3-7')
    expect(ids).toEqual(expect.arrayContaining(['virgo-pierce-Ma', 'virgo-pierce-Ra', 'virgo-stitch-Ra', 'lagna-lord-nodes']))
  })

  it('adds house-suppression and node rules', () => {
    expect(ids).toContain('eighth-from-8')
    expect(report.rules.find((r) => r.id === 'node-ke-12th')!.title).toContain('house 8')
    expect(ids).toContain('node-ra-2nd')
  })

  it('adds Taurus/Cancer/Libra guidance', () => {
    expect(ids).toEqual(expect.arrayContaining(['zero-deg-Mo', 'moon-4th-donate', 'venus-clean', 'naming-strongest', 'indu-wealth']))
  })

  it('reads the atmakaraka departure indication', () => {
    const dep = report.rules.find((r) => r.id === 'departure-ak')
    expect(dep?.text).toContain('Ketu')
    expect(dep?.tone).toBe('supportive')
  })

  it('gives each planet a dasha reading from its navamsha', () => {
    for (const p of report.planets) expect(p.dashaReading).toBe(NAVAMSHA_DASHA_NOTE[p.d9Rashi])
  })
})
