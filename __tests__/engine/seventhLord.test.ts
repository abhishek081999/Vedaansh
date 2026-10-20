import { describe, it, expect } from 'vitest'
import type { ChartOutput, Dignity, DashaNode, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { analyzeSeventhLord, compareSeventhLord, type SeventhLordReading } from '@/lib/engine/seventhLord'

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
  gender?: 'male' | 'female'
  name?: string
  ascDegree?: number
  dasha?: { md: GrahaId; ad?: GrahaId }
  d9Asc?: Rashi
  d9?: GrahaData[]
}): ChartOutput {
  const maha: DashaNode = {
    lord: opts.dasha?.md ?? 'Ju',
    start: new Date('2020-01-01'),
    end: new Date('2036-01-01'),
    durationMs: 1,
    level: 1,
    isCurrent: false,
    children: opts.dasha?.ad ? [{
      lord: opts.dasha.ad,
      start: new Date('2024-01-01'),
      end: new Date('2027-06-01'),
      durationMs: 1,
      level: 2,
      isCurrent: false,
      children: [],
    }] : [],
  }
  return {
    meta: { gender: opts.gender ?? 'female', name: opts.name ?? 'Test' },
    grahas: opts.grahas,
    lagnas: { ascRashi: opts.asc, ascDegree: opts.ascDegree },
    vargas: opts.d9 ? { D9: opts.d9 } : {},
    vargaLagnas: opts.d9Asc ? { D9: opts.d9Asc } : {},
    dashas: opts.dasha ? { vimshottari: [maha] } : {},
  } as unknown as ChartOutput
}

function ids(reading: SeventhLordReading): string[] {
  return [...reading.placement, ...reading.combinations, ...reading.timing].map(n => n.id)
}

function prose(reading: SeventhLordReading): string {
  return [reading.headline, ...ids(reading).map(id => {
    const n = [...reading.placement, ...reading.combinations, ...reading.timing].find(x => x.id === id)!
    return `${n.title} ${n.detail}`
  })].join(' ')
}

describe('7th lord placements', () => {
  it('reads a lagna–7th exchange as familiar, and not a guaranteed wedding', () => {
    const reading = analyzeSeventhLord(chart({
      asc: 1,
      grahas: [g('Ma', 7), g('Ve', 1, 'own'), g('Ju', 9), g('Sa', 10), g('Mo', 5)],
    }))!
    expect(reading.flags.exchange).toBe(true)
    expect(ids(reading)).toContain('seventh-exchange')
    expect(ids(reading)).not.toContain('seventh-h-1')
    expect(prose(reading)).toMatch(/does not by itself/)
  })

  it('keeps a severely afflicted 7th lord in the 2nd off the sex-work sentence', () => {
    const reading = analyzeSeventhLord(chart({
      asc: 1,
      grahas: [
        g('Ve', 2, 'own'),
        g('Sa', 2),
        g('Ma', 2),
        g('Ju', 9),
        g('Mo', 5),
        g('Su', 3),
      ],
    }))!
    expect(ids(reading)).toContain('seventh-h-2')
    expect(prose(reading)).toMatch(/Do not use that image/)
    expect(prose(reading)).not.toMatch(/prostitution|sex work/i)
  })

  it('reads Jupiter in the 7th as protection with guilt', () => {
    const reading = analyzeSeventhLord(chart({
      asc: 7,
      grahas: [g('Ju', 1, 'friend'), g('Ve', 7, 'own'), g('Ma', 8), g('Sa', 11), g('Mo', 4)],
    }))!
    expect(reading.flags.jupiterSeventh).toBe(true)
    expect(ids(reading)).toContain('seventh-jupiter')
    expect(prose(reading)).toMatch(/guilt/)
  })

  it('does not announce an identity from Capricorn lagna with Saturn and fallen Mars', () => {
    const reading = analyzeSeventhLord(chart({
      asc: 10,
      grahas: [g('Sa', 10, 'own'), g('Ma', 4, 'debilitated'), g('Mo', 4), g('Ve', 2)],
    }))!
    expect(ids(reading)).toContain('seventh-capricorn-mars')
    expect(ids(reading)).not.toContain('seventh-mars-saturn')
    expect(prose(reading)).toMatch(/Do not announce an identity/)
    expect(prose(reading)).not.toMatch(/homosexual|transgender/i)
  })

  it('flags Sun and Rahu on the 7th in a woman’s chart as remarriage, not a cause of death', () => {
    const reading = analyzeSeventhLord(chart({
      asc: 4,
      gender: 'female',
      grahas: [g('Su', 10), g('Ra', 10), g('Mo', 1), g('Ve', 2), g('Ma', 5), g('Sa', 11)],
    }))!
    expect(ids(reading)).toContain('seventh-remarriage-sun-rahu')
    expect(prose(reading)).not.toMatch(/will die|husband died/i)
  })

  it('confirms remarriage from Saturn’s trimshamsha in a woman’s chart', () => {
    const reading = analyzeSeventhLord(chart({
      asc: 1,
      ascDegree: 6,
      gender: 'female',
      grahas: [g('Ve', 7, 'own'), g('Ma', 1, 'own')],
    }))!
    expect(ids(reading)).toContain('seventh-remarriage-d30')
  })

  it('keeps Saturn in the 9th troublesome when it is exalted', () => {
    const reading = analyzeSeventhLord(chart({
      asc: 11,
      grahas: [g('Sa', 7, 'exalted'), g('Ve', 2), g('Ma', 1), g('Mo', 4), g('Ju', 9)],
    }))!
    expect(reading.flags.saturnNinth).toBe(true)
    expect(ids(reading)).toContain('seventh-saturn-ninth')
    expect(prose(reading)).toMatch(/exalted/)
  })

  it('places the 7th lord in the 8th and the lagna lord in the 12th in the late band', () => {
    const reading = analyzeSeventhLord(chart({
      asc: 1,
      gender: 'male',
      grahas: [
        g('Ve', 8, 'neutral'),
        g('Ma', 12, 'neutral'),
        g('Sa', 7, 'exalted'),
        g('Mo', 3),
        g('Su', 6),
        g('Ju', 9),
      ],
    }))!
    expect(reading.flags.band).toBe('late')
    expect(reading.flags.lordHouse).toBe(8)
    expect(ids(reading)).toContain('seventh-band-late')
    expect(ids(reading)).toContain('seventh-h-8')
  })

  it('reads Venus in Gemini as a career that climbs and a marriage that suffers', () => {
    const reading = analyzeSeventhLord(chart({
      asc: 1,
      grahas: [g('Ve', 3, 'friend'), g('Ma', 1), g('Ju', 9), g('Sa', 10), g('Mo', 4)],
    }))!
    expect(ids(reading)).toContain('seventh-venus-gemini')
    expect(ids(reading)).not.toContain('seventh-venus-air')
  })

  it('compares a late band with a timely one', () => {
    const late = analyzeSeventhLord(chart({
      asc: 1,
      name: 'Asha',
      gender: 'male',
      grahas: [g('Ve', 8), g('Ma', 12), g('Sa', 7, 'exalted'), g('Mo', 3), g('Su', 6)],
    }))!
    const timely = analyzeSeventhLord(chart({
      asc: 1,
      name: 'Dev',
      gender: 'female',
      grahas: [
        g('Ve', 7, 'own'),
        g('Ma', 6),
        g('Ju', 9, 'own'),
        g('Mo', 5, 'own', { isWaxingMoon: true }),
        g('Su', 1, 'own'),
        g('Sa', 9),
      ],
    }))!
    expect(late.flags.band).toBe('late')
    expect(timely.flags.band).toBe('timely')
    const pair = compareSeventhLord(late, timely, 'Asha', 'Dev')
    expect(pair.map(n => n.id)).toContain('seventh-pair-band')
  })

  it('returns nothing without an ascendant', () => {
    expect(analyzeSeventhLord({ grahas: [], lagnas: {} } as unknown as ChartOutput)).toBeNull()
  })
})
