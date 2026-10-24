import { describe, it, expect } from 'vitest'
import type { ChartOutput, Dignity, DashaNode, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import {
  analyzeMarriageGochar,
  classifyTransitMonth,
  compareMarriageGochar,
  mergeTransitMonths,
  type MarriageGocharReading,
} from '@/lib/engine/marriageGochar'

function g(id: GrahaId, rashi: Rashi, dignity: Dignity = 'neutral'): GrahaData {
  return { id, rashi, dignity, isCombust: false, isRetro: false, name: id } as GrahaData
}

function chart(opts: {
  asc: Rashi
  grahas: GrahaData[]
  name?: string
  birthDate?: string
  gender?: 'male' | 'female'
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
    meta: { name: opts.name ?? 'Test', birthDate: opts.birthDate, gender: opts.gender },
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
  it('lets an open marriage dasha receive a transit without dating it from the birth chart alone', () => {
    const reading = analyzeMarriageGochar(chart({
      asc: 1,
      dasha: { md: 'Ve', ad: 'Ma' },
      grahas: [g('Ve', 7, 'own'), g('Ma', 1, 'own'), g('Ju', 9, 'own'), g('Su', 5), g('Sa', 11)],
    }), { skipScan: true })!
    expect(reading.flags.dashaSupports).toBe(true)
    expect(reading.flags.houses).toContain(7)
    expect(ids(reading)).toContain('gochar-open')
    expect(prose(reading)).toMatch(/opportunity ranges|search ranges/)
    expect(prose(reading)).toMatch(/not a guaranteed wedding day/)
    expect(prose(reading)).not.toMatch(/100%|BPHS|Chapter/)
  })

  it('lets a double transit pass when the period touches none of the marriage houses', () => {
    const reading = analyzeMarriageGochar(chart({
      asc: 1,
      dasha: { md: 'Ju' },
      grahas: [g('Ju', 9, 'own'), g('Ve', 6), g('Ma', 8), g('Su', 10), g('Mo', 12), g('Me', 6), g('Sa', 10)],
    }), { skipScan: true })!
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
    }), { skipScan: true })!
    expect(reading.flags.childrenVehicle).toBe(true)
    expect(ids(reading)).toContain('gochar-children')
    expect(prose(reading)).toMatch(/not a finding that a child is assured/)
    expect(prose(reading)).not.toMatch(/100%/)
  })

  it('refuses the transit when no period is on the chart', () => {
    const reading = analyzeMarriageGochar(chart({
      asc: 1,
      grahas: [g('Ve', 7, 'own')],
    }), { skipScan: true })!
    expect(reading.flags.dashaSupports).toBeNull()
    expect(ids(reading)).toContain('gochar-no-period')
  })

  it('emits ISO dated windows when injected and dasha is open', () => {
    const reading = analyzeMarriageGochar(chart({
      asc: 1,
      birthDate: '1995-06-15',
      dasha: { md: 'Ve', ad: 'Ma' },
      grahas: [g('Ve', 7, 'own'), g('Ma', 1, 'own'), g('Ju', 9), g('Su', 5), g('Sa', 11)],
    }), {
      skipScan: true,
      injectWindows: [
        { start: '2025-03-01', end: '2025-06-28', kind: 'double-7', inDasha: false, inAgeBand: null },
        { start: '2026-01-01', end: '2026-03-28', kind: 'jupiter-lagna', inDasha: false, inAgeBand: null },
      ],
    })!
    expect(reading.windows.length).toBe(2)
    expect(reading.windows[0].start).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(reading.muhurtaFrom).toBeTruthy()
    expect(ids(reading).some(id => id.startsWith('gochar-win-'))).toBe(true)
    expect(prose(reading)).not.toMatch(/BPHS|Chapter|Parashara/)
  })

  it('classifies and merges contiguous months', () => {
    expect(classifyTransitMonth(1, 1)).toBe('double-1')
    expect(classifyTransitMonth(7, 7)).toBe('double-7')
    // Jupiter in 1 glances the 7th; Saturn in 5 glances the 7th by its 3rd.
    expect(classifyTransitMonth(1, 5)).toBe('double-7')
    // Jupiter in 5 glances the lagna by its 9th; Saturn in 7 glances the lagna.
    expect(classifyTransitMonth(5, 7)).toBe('double-1')
    // Saturn in 3 reaches neither the lagna nor the 7th. Jupiter occupies the lagna.
    expect(classifyTransitMonth(1, 3)).toBe('jupiter-lagna')
    expect(classifyTransitMonth(4, 6)).toBeNull()
    const merged = mergeTransitMonths([
      { ym: '2025-03', kind: 'double-7' },
      { ym: '2025-04', kind: 'double-7' },
      { ym: '2025-06', kind: 'jupiter-lagna' },
    ])
    expect(merged).toEqual([
      { start: '2025-03-01', end: '2025-04-28', kind: 'double-7' },
      { start: '2025-06-01', end: '2025-06-28', kind: 'jupiter-lagna' },
    ])
  })

  it('pairs one open period with one that would let the transit pass', () => {
    const open = analyzeMarriageGochar(chart({
      asc: 1,
      name: 'Asha',
      dasha: { md: 'Ve' },
      grahas: [g('Ve', 7, 'own'), g('Ju', 9)],
    }), { skipScan: true })!
    const closed = analyzeMarriageGochar(chart({
      asc: 1,
      name: 'Dev',
      dasha: { md: 'Ju' },
      grahas: [g('Ju', 9, 'own'), g('Ve', 6), g('Ma', 8), g('Su', 10), g('Mo', 12), g('Me', 6), g('Sa', 10)],
    }), { skipScan: true })!
    const pair = compareMarriageGochar(open, closed, 'Asha', 'Dev')
    expect(pair.map(n => n.id)).toContain('gochar-pair-one')
  })

  it('lets a transit pass outside marriageable years, and asks for care when a child-period is early', () => {
    const reading = analyzeMarriageGochar(chart({
      asc: 1,
      birthDate: '2012-01-01',
      gender: 'male',
      dasha: { md: 'Ju' },
      grahas: [
        g('Ju', 5),
        g('Ve', 2, 'own'),
        g('Mo', 1),
        g('Ma', 6),
        g('Sa', 10, 'own'),
        g('Su', 9),
        g('Me', 3, 'own'),
      ],
    }), {
      now: new Date('2026-10-24T00:00:00Z'),
      skipScan: true,
      injectWindows: [
        { start: '2026-04-01', end: '2026-08-28', kind: 'double-7' },
      ],
    })!
    expect(reading.flags.childrenVehicle).toBe(true)
    expect(reading.windows[0].inAgeBand).toBe(false)
    expect(ids(reading)).toContain('gochar-care')
    expect(prose(reading)).toMatch(/passes\. It does not trigger a wedding/)
    expect(prose(reading)).toMatch(/before the/)
    expect(prose(reading)).not.toMatch(/100%/)
  })

  it('returns nothing without an ascendant', () => {
    expect(analyzeMarriageGochar({ grahas: [], lagnas: {} } as unknown as ChartOutput)).toBeNull()
  })
})
