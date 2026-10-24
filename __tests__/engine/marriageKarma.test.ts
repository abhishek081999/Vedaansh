import { describe, it, expect } from 'vitest'
import type { ChartOutput, Dignity, DashaNode, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { analyzeMarriageKarma, compareMarriageKarma, type MarriageKarmaReading } from '@/lib/engine/marriageKarma'

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
  name?: string
  d9Asc?: Rashi
  d9?: GrahaData[]
  dasha?: GrahaId
}): ChartOutput {
  const maha: DashaNode = {
    lord: opts.dasha ?? 'Ju',
    start: new Date('2020-01-01'),
    end: new Date('2036-01-01'),
    durationMs: 1,
    level: 1,
    isCurrent: false,
    children: [],
  }
  return {
    meta: { name: opts.name ?? 'Test' },
    grahas: opts.grahas,
    lagnas: { ascRashi: opts.asc },
    vargas: opts.d9 ? { D9: opts.d9 } : {},
    vargaLagnas: opts.d9Asc ? { D9: opts.d9Asc } : {},
    dashas: opts.dasha ? { vimshottari: [maha] } : {},
  } as unknown as ChartOutput
}

function ids(reading: MarriageKarmaReading): string[] {
  return [...reading.debt, ...reading.venus, ...reading.period].map(n => n.id)
}

function prose(reading: MarriageKarmaReading): string {
  return [...reading.debt, ...reading.venus, ...reading.period].map(n => `${n.title} ${n.detail}`).join(' ')
}

describe('marriage karma and Venus', () => {
  it('reads Venus with Rahu on the 7th as debt, and does not indicate a death', () => {
    const reading = analyzeMarriageKarma(chart({
      asc: 1,
      grahas: [g('Ve', 7), g('Ra', 7), g('Ma', 1), g('Ju', 9), g('Sa', 10), g('Mo', 4)],
    }))!
    expect(reading.flags.kind).toBe('rina')
    expect(ids(reading)).toContain('karma-rina')
    expect(prose(reading)).toMatch(/does not indicate a death/)
    expect(prose(reading)).not.toMatch(/will die|spouse dies/i)
  })

  it('leaves a chart without the stack as open', () => {
    const reading = analyzeMarriageKarma(chart({
      asc: 1,
      grahas: [g('Ve', 2, 'own'), g('Ma', 1, 'own'), g('Ju', 9, 'own'), g('Sa', 10, 'own'), g('Mo', 4, 'own'), g('Su', 5, 'own')],
    }))!
    expect(reading.flags.kind).toBe('open')
    expect(ids(reading)).toContain('karma-open')
    expect(ids(reading)).toContain('karma-seventh-in-second')
  })

  it('lets Jupiter give an exalted Venus a meaning without promising a perfect spouse', () => {
    const reading = analyzeMarriageKarma(chart({
      asc: 1,
      grahas: [g('Ve', 12, 'exalted'), g('Ju', 4, 'exalted'), g('Ma', 1, 'own'), g('Sa', 10), g('Mo', 5)],
    }))!
    expect(reading.flags.jupiterMeans).toBe(true)
    expect(reading.flags.venusExalted).toBe(true)
    expect(prose(reading)).toMatch(/compromised marriage/)
    expect(prose(reading)).toMatch(/meaning/)
  })

  it('does not condemn a marriage for a weak Venus', () => {
    const reading = analyzeMarriageKarma(chart({
      asc: 1,
      grahas: [g('Ve', 6, 'debilitated'), g('Ju', 1), g('Ma', 10), g('Sa', 11), g('Mo', 4)],
    }))!
    expect(prose(reading)).toMatch(/does not, by itself/)
  })

  it('reads Saturn on the household and the 8th as completion when the 5th and 9th can see', () => {
    const reading = analyzeMarriageKarma(chart({
      asc: 1,
      grahas: [
        g('Sa', 2),
        g('Ve', 2),
        g('Mo', 2),
        g('Ra', 7),
        g('Ma', 8, 'own'),
        g('Su', 5, 'own'),
        g('Ju', 9, 'own'),
        g('Me', 3, 'own'),
      ],
    }))!
    expect(reading.flags.kind).toBe('rina')
    expect(ids(reading)).toContain('karma-completion')
    expect(prose(reading)).toMatch(/realization/)
    expect(prose(reading)).not.toMatch(/will die/i)
  })

  it('treats Ketu in the D9 7th as one mark, not the whole debt', () => {
    const reading = analyzeMarriageKarma(chart({
      asc: 1,
      d9Asc: 1,
      d9: [g('Ke', 7)],
      grahas: [g('Ve', 2, 'own'), g('Ma', 1, 'own'), g('Ju', 9, 'own'), g('Sa', 10), g('Mo', 4)],
    }))!
    expect(reading.flags.kind).toBe('karma')
    expect(ids(reading)).toContain('karma-only')
  })

  it('names the separator in a debt chart when the 6th lord is running', () => {
    const reading = analyzeMarriageKarma(chart({
      asc: 1,
      dasha: 'Me',
      grahas: [g('Ve', 7), g('Ra', 7), g('Me', 3), g('Ma', 1), g('Ju', 9), g('Sa', 10), g('Mo', 4)],
    }))!
    expect(ids(reading)).toContain('karma-separation-clock')
    expect(prose(reading)).toMatch(/conflict/)
    expect(prose(reading)).toMatch(/separate judgment/)
    expect(prose(reading)).not.toMatch(/will divorce/i)
  })

  it('puts the debt in one chart and the lagna lord in the other’s lagna', () => {
    const a = analyzeMarriageKarma(chart({
      asc: 1,
      name: 'Asha',
      grahas: [g('Ma', 5), g('Ve', 7), g('Ra', 7), g('Ju', 9), g('Sa', 10), g('Mo', 4)],
    }))!
    const b = analyzeMarriageKarma(chart({
      asc: 5,
      name: 'Dev',
      grahas: [g('Su', 5, 'own'), g('Ve', 2, 'own'), g('Ma', 1), g('Ju', 9), g('Sa', 11), g('Mo', 4)],
    }))!
    expect(a.flags.kind).toBe('rina')
    expect(b.flags.kind).toBe('open')
    const pair = compareMarriageKarma(a, b, 'Asha', 'Dev')
    expect(pair.map(n => n.id)).toEqual(expect.arrayContaining(['karma-pair-one', 'karma-pair-lagna']))
  })

  it('returns nothing without an ascendant', () => {
    expect(analyzeMarriageKarma({ grahas: [], lagnas: {} } as unknown as ChartOutput)).toBeNull()
  })
})
