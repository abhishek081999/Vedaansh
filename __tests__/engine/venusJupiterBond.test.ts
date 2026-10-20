import { describe, it, expect } from 'vitest'
import type { ChartOutput, Dignity, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { analyzeVenusJupiterBond, compareVenusJupiterBond, type VenusJupiterReading } from '@/lib/engine/venusJupiterBond'

function g(
  id: GrahaId,
  rashi: Rashi,
  dignity: Dignity = 'neutral',
  extra: Partial<GrahaData> = {},
): GrahaData {
  return { id, rashi, dignity, isCombust: false, isRetro: false, name: id, nakshatraIndex: 0, ...extra } as GrahaData
}

function chart(opts: {
  asc: Rashi
  grahas: GrahaData[]
  d9Asc?: Rashi
  d9?: GrahaData[]
  name?: string
}): ChartOutput {
  return {
    meta: { name: opts.name ?? 'Test' },
    grahas: opts.grahas,
    lagnas: { ascRashi: opts.asc },
    vargas: opts.d9 ? { D9: opts.d9 } : {},
    vargaLagnas: opts.d9Asc ? { D9: opts.d9Asc } : {},
  } as unknown as ChartOutput
}

function ids(reading: VenusJupiterReading): string[] {
  return [...reading.scenario, ...reading.support].map(n => n.id)
}

function prose(reading: VenusJupiterReading): string {
  return [reading.headline, ...[...reading.scenario, ...reading.support].map(n => `${n.title} ${n.detail}`)].join(' ')
}

describe('Venus and Jupiter in marriage', () => {
  it('reads strong Venus and weak Jupiter as closeness that dries out', () => {
    const reading = analyzeVenusJupiterBond(chart({
      asc: 1,
      grahas: [g('Ve', 7, 'own'), g('Ju', 10, 'debilitated'), g('Ma', 1, 'own'), g('Sa', 11), g('Ra', 3), g('Ke', 9), g('Mo', 5)],
    }))!
    expect(reading.flags.scenario).toBe('venus')
    expect(reading.flags.dominant).toBe('Ve')
    expect(ids(reading)).toContain('vj-venus')
    expect(prose(reading)).toMatch(/no shared aim|substance/i)
    expect(prose(reading)).not.toMatch(/100%/)
  })

  it('reads exalted Jupiter and weak Venus as duty without romance', () => {
    const reading = analyzeVenusJupiterBond(chart({
      asc: 4,
      d9Asc: 4,
      d9: [g('Ju', 4, 'exalted'), g('Ve', 6, 'debilitated')],
      grahas: [g('Ju', 4, 'exalted'), g('Ve', 6, 'debilitated'), g('Ma', 1), g('Sa', 11), g('Ra', 3), g('Ke', 9), g('Mo', 2, 'own')],
    }))!
    expect(reading.flags.scenario).toBe('jupiter')
    expect(ids(reading)).toContain('vj-jupiter')
    expect(ids(reading)).toContain('vj-d9-duty')
    expect(prose(reading)).toMatch(/not a romantic/)
  })

  it('reads both weak, with Rahu, as amplification and a counseling task', () => {
    const reading = analyzeVenusJupiterBond(chart({
      asc: 1,
      d9Asc: 1,
      d9: [g('Ju', 9, 'own'), g('Ve', 6, 'debilitated')],
      grahas: [g('Ve', 6, 'debilitated'), g('Ju', 10, 'debilitated'), g('Ra', 7), g('Ke', 1), g('Ma', 8), g('Sa', 11), g('Mo', 5)],
    }))!
    expect(reading.flags.scenario).toBe('both-weak')
    expect(reading.flags.rahuAmplifies).toBe(true)
    expect(ids(reading)).toContain('vj-rahu')
    expect(ids(reading)).toContain('vj-counsel')
    expect(ids(reading)).toContain('vj-d9-jupiter')
    expect(prose(reading)).toMatch(/Remedies do not/)
    expect(prose(reading)).not.toMatch(/trap|100%/i)
  })

  it('reads both strong as a bond that can deepen', () => {
    const reading = analyzeVenusJupiterBond(chart({
      asc: 1,
      grahas: [g('Ve', 12, 'exalted'), g('Ju', 9, 'own'), g('Ma', 1, 'own'), g('Sa', 11), g('Ra', 10), g('Ke', 4), g('Mo', 5)],
    }))!
    expect(reading.flags.scenario).toBe('both-strong')
    expect(reading.flags.venus).toBe('strong')
    expect(reading.flags.jupiter).toBe('strong')
    expect(ids(reading)).toContain('vj-both-strong')
  })

  it('reads a nakshatra exchange between the lagna lord and the 7th lord', () => {
    const reading = analyzeVenusJupiterBond(chart({
      asc: 1,
      grahas: [
        g('Ma', 1, 'own', { nakshatraIndex: 1 }),
        g('Ve', 7, 'own', { nakshatraIndex: 4 }),
        g('Ju', 9, 'own'),
        g('Sa', 10),
        g('Ra', 3),
        g('Ke', 9),
      ],
    }))!
    expect(ids(reading)).toContain('vj-nakshatra-exchange')
  })

  it('pairs a Venus pattern with a Jupiter pattern as the two halves', () => {
    const close = analyzeVenusJupiterBond(chart({
      asc: 1,
      name: 'Asha',
      grahas: [g('Ve', 7, 'own'), g('Ju', 10, 'debilitated'), g('Ra', 3), g('Ke', 9), g('Ma', 1), g('Sa', 11)],
    }))!
    const duty = analyzeVenusJupiterBond(chart({
      asc: 4,
      name: 'Dev',
      grahas: [g('Ju', 4, 'exalted'), g('Ve', 6, 'debilitated'), g('Ra', 3), g('Ke', 9), g('Ma', 1), g('Sa', 11)],
    }))!
    expect(close.flags.scenario).toBe('venus')
    expect(duty.flags.scenario).toBe('jupiter')
    const pair = compareVenusJupiterBond(close, duty, 'Asha', 'Dev')
    expect(pair.map(n => n.id)).toContain('vj-pair-complement')
  })

  it('returns nothing without an ascendant', () => {
    expect(analyzeVenusJupiterBond({ grahas: [], lagnas: {} } as unknown as ChartOutput)).toBeNull()
  })
})
