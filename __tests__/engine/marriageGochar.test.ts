import { describe, it, expect } from 'vitest'
import type { ChartOutput, Dignity, DashaNode, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { analyzeMarriageGochar, compareMarriageGochar, type MarriageGocharReading } from '@/lib/engine/marriageGochar'

function g(id: GrahaId, rashi: Rashi, dignity: Dignity = 'neutral'): GrahaData {
  return { id, rashi, dignity, isCombust: false, isRetro: false, name: id } as GrahaData
}

function chart(opts: {
  asc: Rashi
  grahas: GrahaData[]
  name?: string
  dasha?: { md: GrahaId; ad?: GrahaId }
}): ChartOutput {
  const maha: DashaNode = {
    lord: opts.dasha?.md ?? 'Ju',
    start: new Date('2020-01-01'),
    end: new Date('2036-01-01'),
    durationMs: 1,
    level: 1,
    isCurrent: true,
    children: opts.dasha?.ad ? [{
      lord: opts.dasha.ad,
      start: new Date('2024-01-01'),
      end: new Date('2027-06-01'),
      durationMs: 1,
      level: 2,
      isCurrent: true,
      children: [],
    }] : [],
  }
  return {
    meta: { name: opts.name ?? 'Test' },
    grahas: opts.grahas,
    lagnas: { ascRashi: opts.asc },
    dashas: opts.dasha ? { vimshottari: [maha] } : {},
  } as unknown as ChartOutput
}

function ids(reading: MarriageGocharReading): string[] {
  return reading.window.map(n => n.id)
}

function prose(reading: MarriageGocharReading): string {
  return [reading.headline, reading.summary, ...reading.window.map(n => `${n.title} ${n.detail}`)].join(' ')
}

describe('marriage double transit', () => {
  it('lets an open marriage dasha receive a transit without dating it', () => {
    const reading = analyzeMarriageGochar(chart({
      asc: 1,
      dasha: { md: 'Ve', ad: 'Ma' },
      grahas: [g('Ve', 7, 'own'), g('Ma', 1, 'own'), g('Ju', 9, 'own'), g('Su', 5), g('Sa', 11)],
    }))!
    expect(reading.flags.dashaSupports).toBe(true)
    expect(reading.flags.houses).toContain(7)
    expect(ids(reading)).toContain('gochar-open')
    expect(prose(reading)).toMatch(/not taken from the birth chart/)
    expect(prose(reading)).not.toMatch(/100%|guaranteed/)
  })

  it('lets a double transit pass when the period touches none of the marriage houses', () => {
    const reading = analyzeMarriageGochar(chart({
      asc: 1,
      dasha: { md: 'Ju' },
      grahas: [g('Ju', 9, 'own'), g('Ve', 6), g('Ma', 8), g('Su', 10), g('Mo', 12), g('Me', 6), g('Sa', 10)],
    }))!
    expect(reading.flags.dashaSupports).toBe(false)
    expect(reading.flags.houses).toEqual([])
    expect(ids(reading)).toContain('gochar-pass')
    expect(ids(reading)).not.toContain('gochar-children')
  })

  it('names a child as a possible reason when Jupiter and the 5th are in the period', () => {
    const reading = analyzeMarriageGochar(chart({
      asc: 1,
      dasha: { md: 'Ju' },
      grahas: [g('Ju', 5), g('Ve', 7, 'own'), g('Su', 10), g('Ma', 8)],
    }))!
    expect(reading.flags.childrenVehicle).toBe(true)
    expect(ids(reading)).toContain('gochar-children')
    expect(prose(reading)).toMatch(/not a finding that a child is assured/)
    expect(prose(reading)).toMatch(/caution/)
    expect(prose(reading)).not.toMatch(/100%/)
  })

  it('refuses the transit when no period is on the chart', () => {
    const reading = analyzeMarriageGochar(chart({
      asc: 1,
      grahas: [g('Ve', 7, 'own')],
    }))!
    expect(reading.flags.dashaSupports).toBeNull()
    expect(ids(reading)).toContain('gochar-no-period')
  })

  it('pairs one open period with one that would let the transit pass', () => {
    const open = analyzeMarriageGochar(chart({
      asc: 1,
      name: 'Asha',
      dasha: { md: 'Ve' },
      grahas: [g('Ve', 7, 'own'), g('Ju', 9)],
    }))!
    const closed = analyzeMarriageGochar(chart({
      asc: 1,
      name: 'Dev',
      dasha: { md: 'Ju' },
      grahas: [g('Ju', 9, 'own'), g('Ve', 6), g('Ma', 8), g('Su', 10), g('Mo', 12), g('Me', 6), g('Sa', 10)],
    }))!
    const pair = compareMarriageGochar(open, closed, 'Asha', 'Dev')
    expect(pair.map(n => n.id)).toContain('gochar-pair-one')
  })

  it('returns nothing without an ascendant', () => {
    expect(analyzeMarriageGochar({ grahas: [], lagnas: {} } as unknown as ChartOutput)).toBeNull()
  })
})
