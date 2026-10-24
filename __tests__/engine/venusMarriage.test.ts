import { describe, it, expect } from 'vitest'
import type { ChartOutput, Dignity, DashaNode, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { analyzeVenusMarriage, compareVenusMarriage, type VenusMarriageReading } from '@/lib/engine/venusMarriage'

function g(
  id: GrahaId,
  rashi: Rashi,
  dignity: Dignity = 'neutral',
  extra: Partial<GrahaData> = {},
): GrahaData {
  return { id, rashi, dignity, isCombust: false, isRetro: false, name: id, ...extra } as GrahaData
}

function chart(opts: {
  asc: Rashi
  grahas: GrahaData[]
  dasha?: boolean
  name?: string
}): ChartOutput {
  const maha: DashaNode = {
    lord: 'Ve',
    start: new Date('2020-01-01'),
    end: new Date('2040-01-01'),
    durationMs: 1,
    level: 1,
    isCurrent: false,
    children: [],
  }
  return {
    meta: { name: opts.name ?? 'Test' },
    grahas: opts.grahas,
    lagnas: { ascRashi: opts.asc },
    dashas: opts.dasha ? { vimshottari: [maha] } : {},
  } as unknown as ChartOutput
}

function ids(reading: VenusMarriageReading): string[] {
  return reading.venus.map(n => n.id)
}

function prose(reading: VenusMarriageReading): string {
  return reading.venus.map(n => `${n.title} ${n.detail}`).join(' ')
}

describe('Venus in marriage', () => {
  it('treats a dignified Venus without Jupiter as intensity, not a perfect marriage', () => {
    const reading = analyzeVenusMarriage(chart({
      asc: 1,
      grahas: [g('Ve', 12, 'exalted'), g('Ju', 5, 'friend'), g('Ma', 1), g('Sa', 10), g('Mo', 4)],
    }))!
    expect(reading.flags.bridge).toBe('highway')
    expect(reading.flags.showpiece).toBe(true)
    expect(reading.flags.sukhLike).toBe(false)
    expect(ids(reading)).toContain('venus-showpiece')
    expect(prose(reading)).toMatch(/not a perfect marriage|no depth|showpiece/i)
    expect(prose(reading)).not.toMatch(/marriage will fail|shaadi kharab/i)
  })

  it('lets Jupiter make a strong Venus feel like contentment without calling it sukh', () => {
    const reading = analyzeVenusMarriage(chart({
      asc: 1,
      grahas: [g('Ve', 7, 'own'), g('Ju', 1, 'own'), g('Ma', 5), g('Sa', 10), g('Mo', 4)],
    }))!
    expect(reading.flags.sukhLike).toBe(true)
    expect(ids(reading)).toContain('venus-sukh-like')
    expect(prose(reading)).toMatch(/not given sukh|still not given sukh|has still not given sukh/i)
  })

  it('does not condemn an afflicted Venus when Jupiter can interpret it', () => {
    const reading = analyzeVenusMarriage(chart({
      asc: 1,
      grahas: [g('Ve', 6, 'debilitated'), g('Ju', 12, 'own'), g('Ma', 1), g('Sa', 10)],
    }))!
    expect(reading.flags.bridge).toBe('broken')
    expect(ids(reading)).toContain('venus-jupiter-meaning')
    expect(prose(reading)).toMatch(/does not mean the marriage fails|do not become sukh|understood/i)
  })

  it('refuses a marriage muhurta when Venus is combust', () => {
    const reading = analyzeVenusMarriage(chart({
      asc: 1,
      grahas: [g('Ve', 7, 'own', { isCombust: true }), g('Su', 7), g('Ju', 9), g('Ma', 1)],
    }))!
    expect(reading.flags.combust).toBe(true)
    expect(ids(reading)).toContain('venus-combust-muhurta')
    expect(prose(reading)).toMatch(/not calculated|not fixed/i)
  })

  it('separates a running Venus mahadasha from its pre-marriage results', () => {
    const reading = analyzeVenusMarriage(chart({
      asc: 1,
      dasha: true,
      grahas: [g('Ve', 2, 'own'), g('Ju', 9), g('Ma', 1), g('Sa', 10)],
    }))!
    expect(reading.flags.venusDasha).toBe(true)
    expect(ids(reading)).toContain('venus-dasha-shift')
  })

  it('compares a damaged Venus with a wide one', () => {
    const rough = analyzeVenusMarriage(chart({
      asc: 1,
      name: 'Asha',
      grahas: [g('Ve', 6, 'debilitated'), g('Ma', 1), g('Sa', 10), g('Ju', 3)],
    }))!
    const wide = analyzeVenusMarriage(chart({
      asc: 1,
      name: 'Dev',
      grahas: [g('Ve', 7, 'own'), g('Ju', 1, 'own'), g('Ma', 5), g('Sa', 10)],
    }))!
    expect(rough.flags.bridge).toBe('broken')
    expect(wide.flags.bridge).toBe('highway')
    const pair = compareVenusMarriage(rough, wide, 'Asha', 'Dev')
    expect(pair.map(n => n.id)).toContain('venus-pair-bridge')
  })

  it('returns nothing without an ascendant', () => {
    expect(analyzeVenusMarriage({ grahas: [], lagnas: {} } as unknown as ChartOutput)).toBeNull()
  })
})
