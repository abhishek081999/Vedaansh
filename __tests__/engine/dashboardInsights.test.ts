// ─────────────────────────────────────────────────────────────
//  __tests__/engine/dashboardInsights.test.ts
//  Dosha snapshot and remedy focus used by the dashboard cards
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { getDoshaSnapshot, getRemedySnapshot, PLANET_REMEDIES } from '@/lib/engine/dashboardInsights'
import type { ChartOutput, GrahaData, GrahaId, Rashi } from '@/types/astrology'

function graha(id: GrahaId, rashi: Rashi, extra: Partial<GrahaData> = {}): GrahaData {
  return {
    id,
    name: id,
    rashi,
    nakshatraIndex: 3,
    nakshatraName: 'Rohini',
    isCombust: false,
    gandanta: { isGandanta: false, severity: 'none' },
    mrityuBhaga: { isMrityuBhaga: false },
    yuddha: { isWarring: false, winner: null },
    ...extra,
  } as unknown as GrahaData
}

function chartWith(grahas: GrahaData[], extra: Record<string, unknown> = {}): ChartOutput {
  return {
    grahas,
    lagnas: { ascRashi: 1 },
    dashas: { vimshottari: [] },
    yogas: [],
    ...extra,
  } as unknown as ChartOutput
}

describe('getDoshaSnapshot', () => {
  it('returns null without grahas', () => {
    expect(getDoshaSnapshot(chartWith([]))).toBeNull()
  })

  it('flags Mars in the 7th as Manglik and stays quiet elsewhere', () => {
    // Mars in Libra (7th from Aries lagna); Jupiter in Taurus is the 8th from Mars, so it does not cancel
    const snap = getDoshaSnapshot(chartWith([graha('Ma', 7), graha('Ju', 2), graha('Mo', 2)]))!
    const manglik = snap.flags.find(f => f.id === 'manglik')!
    expect(manglik.tone).not.toBe('clear')
    expect(snap.flags.find(f => f.id === 'gandanta')!.tone).toBe('clear')
    expect(snap.flags.some(f => f.id === 'kaalsarp')).toBe(false)
  })

  it('reports gandanta and combustion planets by name', () => {
    const snap = getDoshaSnapshot(chartWith([
      graha('Mo', 4, { gandanta: { isGandanta: true, severity: 'exact' } as GrahaData['gandanta'] }),
      graha('Me', 5, { isCombust: true }),
    ]))!
    expect(snap.flags.find(f => f.id === 'gandanta')!.detail).toContain('Moon')
    expect(snap.flags.find(f => f.id === 'combust')!.detail).toContain('Mercury')
  })
})

describe('getRemedySnapshot', () => {
  const now = new Date('2026-06-01T00:00:00Z').getTime()
  const dashas = {
    vimshottari: [{
      lord: 'Sa', start: new Date('2020-01-01'), end: new Date('2039-01-01'), level: 1,
      children: [{ lord: 'Ju', start: new Date('2025-01-01'), end: new Date('2027-01-01'), level: 2 }],
    }],
  }

  it('uses the Moon nakshatra and the running dasha lords', () => {
    const snap = getRemedySnapshot(chartWith([graha('Mo', 2)], { dashas }), now)
    expect(snap.moonNakshatra?.name).toBe('Rohini')
    expect(snap.focus.map(f => f.graha)).toEqual(['Sa', 'Ju'])
    expect(snap.focus[0].remedy).toBe(PLANET_REMEDIES.Sa)
  })

  it('does not repeat a planet that is both dasha lord and weakest', () => {
    const snap = getRemedySnapshot(chartWith([graha('Mo', 2)], { dashas, shadbala: { weakest: 'Sa' } }), now)
    expect(snap.focus.filter(f => f.graha === 'Sa')).toHaveLength(1)
  })

  it('adds the weakest planet when it differs', () => {
    const snap = getRemedySnapshot(chartWith([graha('Mo', 2)], { dashas, shadbala: { weakest: 'Me' } }), now)
    expect(snap.focus.map(f => f.role)).toContain('Weakest by Shadbala')
  })
})
