import { describe, it, expect } from 'vitest'
import type { ChartOutput, Dignity, DashaNode, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { analyzeKarmicDebt, compareKarmicDebt, type KarmicDebtReading } from '@/lib/engine/karmicDebt'

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
  dasha?: { md: GrahaId; ad: GrahaId }
  name?: string
}): ChartOutput {
  const maha: DashaNode | undefined = opts.dasha ? {
    lord: opts.dasha.md,
    start: new Date('2020-01-01'),
    end: new Date('2038-01-01'),
    durationMs: 1,
    level: 1,
    children: [{
      lord: opts.dasha.ad,
      start: new Date('2024-01-01'),
      end: new Date('2027-06-01'),
      durationMs: 1,
      level: 2,
    }],
  } : undefined
  return {
    meta: { name: opts.name ?? 'Test' },
    grahas: opts.grahas,
    lagnas: { ascRashi: opts.asc },
    vargas: opts.d9 ? { D9: opts.d9 } : {},
    vargaLagnas: opts.d9Asc ? { D9: opts.d9Asc } : {},
    dashas: maha ? { vimshottari: [maha] } : {},
  } as unknown as ChartOutput
}

function ids(reading: KarmicDebtReading): string[] {
  return [...reading.debt, ...reading.release].map(n => n.id)
}

function prose(reading: KarmicDebtReading): string {
  return [...reading.debt, ...reading.release].map(n => `${n.title} ${n.detail}`).join(' ')
}

describe('karmic debt in marriage', () => {
  it('reads Venus with Rahu in the 7th as an open account and offers no remedy', () => {
    const reading = analyzeKarmicDebt(chart({
      asc: 1,
      grahas: [g('Ve', 7, 'own'), g('Ra', 7), g('Ke', 1), g('Ma', 5), g('Sa', 10), g('Ju', 9), g('Mo', 4)],
    }))!
    expect(reading.flags.present).toBe(true)
    expect(ids(reading)).toContain('karma-account')
    expect(ids(reading)).toContain('karma-venus-rahu')
    expect(ids(reading)).toContain('karma-rahu-seventh')
    expect(ids(reading)).toContain('karma-open')
    expect(prose(reading)).toMatch(/No remedy/)
    expect(prose(reading)).not.toMatch(/will die|100%/i)
  })

  it('does not call a clean chart a debt', () => {
    const reading = analyzeKarmicDebt(chart({
      asc: 1,
      grahas: [g('Ve', 7, 'own'), g('Ra', 2), g('Ke', 8), g('Ma', 1, 'own'), g('Sa', 8), g('Ju', 9, 'own'), g('Mo', 4, 'own')],
    }))!
    expect(reading.flags.present).toBe(false)
    expect(reading.flags.marks).toBe(0)
    expect(ids(reading)).toContain('karma-clear')
  })

  it('lets Saturn’s three houses plus the 5th and 9th finish the account', () => {
    const reading = analyzeKarmicDebt(chart({
      asc: 1,
      grahas: [
        g('Sa', 10, 'own'),
        g('Ve', 10),
        g('Mo', 10),
        g('Ma', 10),
        g('Ra', 7),
        g('Ke', 1),
        g('Ju', 5, 'friend'),
        g('Me', 9, 'friend'),
      ],
    }))!
    expect(reading.flags.present).toBe(true)
    expect(reading.flags.saturnPays).toBe(true)
    expect(reading.flags.understanding).toBe(true)
    expect(reading.flags.complete).toBe(true)
    expect(ids(reading)).toContain('karma-complete')
  })

  it('repeats the 7th in Navamsha when Ketu is not on it', () => {
    const reading = analyzeKarmicDebt(chart({
      asc: 1,
      d9Asc: 1,
      d9: [g('Ke', 2), g('Ve', 7)],
      grahas: [g('Ve', 2, 'own'), g('Ra', 6), g('Ke', 12), g('Ma', 1), g('Ju', 9)],
    }))!
    expect(ids(reading)).toContain('karma-d9-ketu')
  })

  it('names who is paying when only one chart carries the stack', () => {
    const payer = analyzeKarmicDebt(chart({
      asc: 1,
      name: 'Asha',
      grahas: [g('Ve', 7), g('Ra', 7), g('Ma', 6), g('Sa', 8), g('Ju', 9), g('Mo', 4)],
    }))!
    const clear = analyzeKarmicDebt(chart({
      asc: 1,
      name: 'Dev',
      grahas: [g('Ve', 7, 'own'), g('Ra', 2), g('Ke', 8), g('Ma', 1, 'own'), g('Sa', 11), g('Ju', 9, 'own'), g('Mo', 4, 'own')],
    }))!
    expect(payer.flags.present).toBe(true)
    expect(clear.flags.present).toBe(false)
    const pair = compareKarmicDebt(payer, clear, 'Asha', 'Dev')
    expect(pair.map(n => n.id)).toContain('karma-pair-one')
    expect(pair[0].detail).toMatch(/Asha/)
  })

  it('returns nothing without an ascendant', () => {
    expect(analyzeKarmicDebt({ grahas: [], lagnas: {} } as unknown as ChartOutput)).toBeNull()
  })
})
