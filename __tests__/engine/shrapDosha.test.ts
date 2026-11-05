// ─────────────────────────────────────────────────────────────
//  __tests__/engine/shrapDosha.test.ts
//  Shrap / Dosha detectors and Kal Sarp absence
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { analyzeShrapDosha } from '@/lib/engine/shrapDosha'
import { getDoshaSnapshot } from '@/lib/engine/dashboardInsights'
import type { ChartOutput, Dignity, GrahaData, GrahaId, Rashi } from '@/types/astrology'

function graha(id: GrahaId, rashi: Rashi, extra: Partial<GrahaData> = {}): GrahaData {
  return {
    id,
    name: id,
    rashi,
    nakshatraIndex: 3,
    nakshatraName: 'Rohini',
    isCombust: false,
    isRetro: false,
    speed: 1,
    dignity: 'neutral' as Dignity,
    gandanta: { isGandanta: false, severity: 'none' },
    mrityuBhaga: { isMrityuBhaga: false },
    yuddha: { isWarring: false, winner: null },
    ...extra,
  } as unknown as GrahaData
}

function chartWith(
  grahas: GrahaData[],
  extra: Record<string, unknown> = {},
  ascRashi: Rashi = 1,
): ChartOutput {
  return {
    grahas,
    lagnas: { ascRashi },
    dashas: { vimshottari: [] },
    yogas: [],
    vargas: {},
    vargaLagnas: {},
    ...extra,
  } as unknown as ChartOutput
}

describe('analyzeShrapDosha', () => {
  it('returns null without grahas', () => {
    expect(analyzeShrapDosha(chartWith([]))).toBeNull()
  })

  it('flags Pitru when Sun is debilitated with Rahu', () => {
    // Aries lagna: Sun+Rahu in Libra (7) debilitated Sun
    const result = analyzeShrapDosha(chartWith([
      graha('Su', 7, { dignity: 'debilitated' }),
      graha('Ra', 7),
      graha('Ke', 1),
      graha('Mo', 2),
      graha('Ju', 9),
      graha('Ve', 3),
      graha('Ma', 4),
      graha('Me', 5),
      graha('Sa', 10),
    ]))!
    const pitru = result.doshas.find(d => d.id === 'pitru')!
    expect(pitru.present).toBe(true)
    expect(pitru.severity).not.toBe('clear')
    expect(result.doshas.some(d => d.id === 'kaalsarp')).toBe(false)
  })

  it('flags True Sarpa when Rahu is in 5th with D7 confirmation', () => {
    // Aries lagna: Rahu in Leo = 5th
    const d7Asc = 1 as Rashi
    const result = analyzeShrapDosha(chartWith(
      [
        graha('Ra', 5),
        graha('Ke', 11),
        graha('Su', 1),
        graha('Mo', 2),
        graha('Ju', 9),
        graha('Ve', 3),
        graha('Ma', 4),
        graha('Me', 6),
        graha('Sa', 10),
      ],
      {
        vargas: {
          D7: [
            graha('Ra', 5),
            graha('Ke', 11),
            graha('Su', 1),
            graha('Mo', 2),
            graha('Ju', 3),
            graha('Ve', 4),
            graha('Ma', 6),
            graha('Me', 7),
            graha('Sa', 8),
          ],
        },
        vargaLagnas: { D7: d7Asc },
      },
    ))!
    const sarpa = result.doshas.find(d => d.id === 'sarpa')!
    expect(sarpa.present).toBe(true)
    expect(sarpa.severity).toBe('strong')
    expect(sarpa.indicators.some(i => i.id === 'd7-confirm')).toBe(true)
    expect(sarpa.indicators.some(i => i.text.toLowerCase().includes('kal sarp'))).toBe(true)
  })

  it('never emits a kaalsarp dosha id', () => {
    const result = analyzeShrapDosha(chartWith([
      graha('Ra', 1),
      graha('Ke', 7),
      graha('Su', 2),
      graha('Mo', 3),
      graha('Ma', 4),
      graha('Me', 5),
      graha('Ju', 6),
      graha('Ve', 8),
      graha('Sa', 9),
    ]))!
    expect(result.doshas.map(d => d.id)).not.toContain('kaalsarp')
    expect(result.summaryRows.map(r => r.id)).not.toContain('kaalsarp')
  })

  it('flags Guru-Chandal style Guru Dosha when Jupiter sits with Rahu', () => {
    const result = analyzeShrapDosha(chartWith([
      graha('Ju', 4),
      graha('Ra', 4),
      graha('Ke', 10),
      graha('Su', 1),
      graha('Mo', 2),
      graha('Ma', 3),
      graha('Me', 5),
      graha('Ve', 6),
      graha('Sa', 8),
    ]))!
    expect(result.doshas.find(d => d.id === 'guru')!.present).toBe(true)
  })

  it('flags lending risk when Jupiter is in the 6th', () => {
    // Aries lagna: Virgo = 6th
    const result = analyzeShrapDosha(chartWith([
      graha('Ju', 6),
      graha('Su', 1),
      graha('Mo', 2),
      graha('Ma', 3),
      graha('Me', 4),
      graha('Ve', 5),
      graha('Sa', 8),
      graha('Ra', 9),
      graha('Ke', 3),
    ]))!
    expect(result.lending?.avoidLending).toBe(true)
    expect(result.lending?.severity).not.toBe('clear')
  })

  it('recommends 108-day remedies when Jupiter is debilitated', () => {
    // Capricorn = debil for Jupiter
    const result = analyzeShrapDosha(chartWith([
      graha('Ju', 10, { dignity: 'debilitated' }),
      graha('Su', 1),
      graha('Mo', 2),
      graha('Ma', 3),
      graha('Me', 4),
      graha('Ve', 5),
      graha('Sa', 8),
      graha('Ra', 9),
      graha('Ke', 3),
    ]))!
    expect(result.jupiterRemedy?.recommendedDays).toBe(108)
  })

  it('keeps standard 40-day window for well-placed Jupiter', () => {
    // Cancer exalt for Jupiter, house 4 from Aries — not dusthana
    const result = analyzeShrapDosha(chartWith([
      graha('Ju', 4, { dignity: 'exalted' }),
      graha('Su', 1),
      graha('Mo', 2),
      graha('Ma', 3),
      graha('Me', 5),
      graha('Ve', 6),
      graha('Sa', 8),
      graha('Ra', 9),
      graha('Ke', 3),
    ]))!
    expect(result.jupiterRemedy?.recommendedDays).toBe(40)
  })
})

describe('getDoshaSnapshot shrap flags', () => {
  it('includes pitru/matru/sarpa flags and still omits kaalsarp', () => {
    const snap = getDoshaSnapshot(chartWith([
      graha('Ma', 7),
      graha('Ju', 2),
      graha('Mo', 2),
      graha('Su', 7, { dignity: 'debilitated' }),
      graha('Ra', 7),
      graha('Ke', 1),
      graha('Ve', 3),
      graha('Me', 5),
      graha('Sa', 10),
    ]))!
    expect(snap.flags.some(f => f.id === 'pitru')).toBe(true)
    expect(snap.flags.some(f => f.id === 'sarpa')).toBe(true)
    expect(snap.flags.some(f => f.id === 'kaalsarp')).toBe(false)
  })
})
