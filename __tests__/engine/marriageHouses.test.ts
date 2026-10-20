import { describe, it, expect } from 'vitest'
import type { ChartOutput, Dignity, DashaNode, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { analyzeMarriageHouses, compareMarriageHouses, type MarriageHousesReading } from '@/lib/engine/marriageHouses'

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
  d9Asc?: Rashi
  d9?: GrahaData[]
  gender?: 'male' | 'female'
  name?: string
  dasha?: { md: GrahaId; ad?: GrahaId }
}): ChartOutput {
  const maha: DashaNode = {
    lord: opts.dasha?.md ?? 'Ju',
    start: new Date('2020-01-01'),
    end: new Date('2036-01-01'),
    durationMs: 1,
    level: 1,
    children: opts.dasha?.ad ? [{
      lord: opts.dasha.ad,
      start: new Date('2024-01-01'),
      end: new Date('2027-06-01'),
      durationMs: 1,
      level: 2,
      children: [{
        lord: 'Mo',
        start: new Date('2026-01-01'),
        end: new Date('2026-12-01'),
        durationMs: 1,
        level: 3,
      }],
    }] : [],
  }
  return {
    meta: { gender: opts.gender ?? 'female', name: opts.name ?? 'Test' },
    grahas: opts.grahas,
    lagnas: { ascRashi: opts.asc },
    vargas: opts.d9 ? { D9: opts.d9 } : {},
    vargaLagnas: opts.d9Asc ? { D9: opts.d9Asc } : {},
    dashas: opts.dasha ? { vimshottari: [maha] } : {},
  } as unknown as ChartOutput
}

function ids(reading: MarriageHousesReading): string[] {
  return [...reading.houses, ...reading.groups, ...reading.activation].map(n => n.id)
}

function prose(reading: MarriageHousesReading): string {
  return [reading.headline, reading.summary, ...[...reading.houses, ...reading.groups, ...reading.activation].map(n => `${n.title} ${n.detail}`)].join(' ')
}

describe('eight marriage houses', () => {
  it('treats a disturbed 4th as a divorce condition while the 7th still holds', () => {
    const reading = analyzeMarriageHouses(chart({
      asc: 4,
      grahas: [
        g('Ve', 6, 'debilitated'),
        g('Sa', 7, 'exalted'),
        g('Mo', 2, 'own'),
        g('Ma', 1, 'own'),
        g('Ju', 9, 'own'),
        g('Su', 5, 'own'),
      ],
    }))!
    expect(reading.flags.fourthStrained).toBe(true)
    expect(reading.flags.seventhHolding).toBe(true)
    expect(ids(reading)).toContain('houses-fourth-divorce')
    expect(ids(reading)).toContain('houses-seventh')
    expect(prose(reading)).toMatch(/7th is holding/)
    expect(prose(reading)).not.toMatch(/will die|100%|physically ill/i)
  })

  it('reads a holding 1-5-9 as a value-based marriage', () => {
    const reading = analyzeMarriageHouses(chart({
      asc: 1,
      grahas: [
        g('Ma', 1, 'own'),
        g('Su', 5, 'own'),
        g('Ju', 9, 'own'),
        g('Ve', 2, 'own'),
        g('Mo', 4, 'own'),
        g('Sa', 10, 'own'),
      ],
    }))!
    expect(reading.flags.trineBalanced).toBe(true)
    expect(ids(reading)).toContain('houses-trine')
    expect(reading.headline).toMatch(/value-based/i)
  })

  it('requires both triangular and binding houses before calling the period a wedding', () => {
    const reading = analyzeMarriageHouses(chart({
      asc: 1,
      gender: 'male',
      dasha: { md: 'Ju', ad: 'Sa' },
      grahas: [
        g('Ju', 5, 'neutral'),
        g('Sa', 8, 'neutral'),
        g('Ma', 4, 'debilitated'),
        g('Su', 7, 'debilitated'),
        g('Mo', 2, 'own'),
        g('Ve', 2, 'own'),
      ],
    }))!
    expect(reading.flags.triangularActive).toBe(true)
    expect(reading.flags.bindingActive).toBe(true)
    expect(reading.flags.fourthStrained).toBe(false)
    expect(reading.flags.trineBalanced).toBe(false)
    expect(ids(reading)).toContain('houses-both-energies')
    expect(ids(reading)).toContain('houses-saturn-eighth')
    expect(prose(reading)).toMatch(/Jupiter/)
    expect(prose(reading)).not.toMatch(/definitely|100%/i)
  })

  it('lets a quiet Navamsha 7th lord cancel a willing period', () => {
    const reading = analyzeMarriageHouses(chart({
      asc: 1,
      gender: 'male',
      d9Asc: 1,
      d9: [g('Ve', 6, 'debilitated')],
      grahas: [g('Ve', 7, 'own'), g('Ma', 1, 'own')],
    }))!
    expect(reading.flags.d9Silent).toBe(true)
    expect(ids(reading)).toContain('houses-d9-silent')
    expect(prose(reading)).toMatch(/no wedding|not answering/i)
  })

  it('counts houses one chart holds for the other', () => {
    const a = analyzeMarriageHouses(chart({
      asc: 1,
      name: 'Asha',
      grahas: [
        g('Mo', 8, 'debilitated'),
        g('Ve', 6, 'debilitated'),
        g('Ma', 4, 'debilitated'),
        g('Su', 5, 'own'),
        g('Ju', 9, 'own'),
      ],
    }))!
    const b = analyzeMarriageHouses(chart({
      asc: 2,
      name: 'Dev',
      grahas: [
        g('Me', 6, 'exalted'),
        g('Su', 5, 'own'),
        g('Ju', 9, 'own'),
        g('Ve', 2, 'own'),
        g('Mo', 4, 'own'),
        g('Ma', 1, 'own'),
      ],
    }))!
    expect(a.flags.health[4]).toBe('strained')
    expect(b.flags.health[2]).toBe('holding')
    expect(b.flags.health[4]).toBe('holding')
    expect(b.flags.health[8]).toBe('holding')
    const pair = compareMarriageHouses(a, b, 'Asha', 'Dev')
    expect(pair.map(n => n.id)).toContain('houses-pair-cover')
    expect(pair.map(n => n.detail).join(' ')).toMatch(/Dev holds/)
  })

  it('returns nothing without an ascendant', () => {
    expect(analyzeMarriageHouses({ grahas: [], lagnas: {} } as unknown as ChartOutput)).toBeNull()
  })
})
