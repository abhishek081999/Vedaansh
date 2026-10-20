import { describe, it, expect } from 'vitest'
import type { ChartOutput, Dignity, DashaNode, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { analyzeDivorceEnergy, compareDivorceEnergy, type DivorceEnergyReading } from '@/lib/engine/divorceEnergy'

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
  name?: string
  dasha?: { md: GrahaId; ad?: GrahaId }
}): ChartOutput {
  const maha: DashaNode | undefined = opts.dasha ? {
    lord: opts.dasha.md,
    start: new Date('2020-01-01'),
    end: new Date('2036-01-01'),
    durationMs: 1,
    level: 1,
    isCurrent: true,
    children: opts.dasha.ad ? [{
      lord: opts.dasha.ad,
      start: new Date('2024-01-01'),
      end: new Date('2027-06-01'),
      durationMs: 1,
      level: 2,
      isCurrent: true,
      children: [],
    }] : [],
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

function ids(reading: DivorceEnergyReading): string[] {
  return [...reading.energies, ...reading.triggers].map(n => n.id)
}

function prose(reading: DivorceEnergyReading): string {
  return [reading.headline, ...[...reading.energies, ...reading.triggers].map(n => `${n.title} ${n.detail}`)].join(' ')
}

describe('divorce and separation energies', () => {
  it('reads all three threads down as divorce without a guarantee', () => {
    const reading = analyzeDivorceEnergy(chart({
      asc: 1,
      grahas: [g('Mo', 8, 'debilitated'), g('Ve', 6, 'debilitated'), g('Sa', 1, 'debilitated'), g('Ju', 9, 'own'), g('Ma', 5), g('Ra', 3), g('Ke', 9)],
    }))!
    expect(reading.flags.level).toBe('divorce')
    expect(ids(reading)).toContain('split-divorce')
    expect(ids(reading)).not.toContain('split-triggers')
    expect(prose(reading)).toMatch(/does not restore/)
    expect(prose(reading)).not.toMatch(/100%|certain|inevitable|guaranteed/)
  })

  it('keeps a duty thread when Saturn still holds', () => {
    const reading = analyzeDivorceEnergy(chart({
      asc: 1,
      grahas: [g('Mo', 8, 'debilitated'), g('Ve', 6, 'debilitated'), g('Sa', 7, 'exalted'), g('Ma', 5), g('Ra', 3), g('Ke', 9), g('Su', 10), g('Me', 9)],
    }))!
    expect(reading.flags.level).toBe('separation')
    expect(reading.flags.thread).toBe('Sa')
    expect(ids(reading)).toContain('split-separation')
    expect(ids(reading)).not.toContain('split-divorce')
    expect(ids(reading)).not.toContain('split-triggers')
    expect(prose(reading)).toMatch(/Duty is the thread/)
  })

  it('refuses to call Mars and Rahu on the 7th a divorce', () => {
    const reading = analyzeDivorceEnergy(chart({
      asc: 1,
      grahas: [g('Mo', 4, 'own'), g('Ve', 2, 'own'), g('Sa', 11, 'own'), g('Ma', 7), g('Ra', 7), g('Ke', 1), g('Ju', 9, 'own')],
    }))!
    expect(reading.flags.level).toBe('held')
    expect(ids(reading)).toContain('split-mars-rahu')
    expect(ids(reading)).not.toContain('split-divorce')
    expect(prose(reading)).toMatch(/not a divorce yoga/)
  })

  it('reads Venus with Rahu as an outside option, not a completed affair', () => {
    const reading = analyzeDivorceEnergy(chart({
      asc: 1,
      grahas: [g('Ve', 7, 'own'), g('Ra', 7), g('Mo', 4, 'own'), g('Sa', 11, 'own'), g('Ke', 1), g('Ma', 5), g('Ju', 9)],
    }))!
    expect(ids(reading)).toContain('split-venus-rahu')
    expect(reading.flags.level).not.toBe('divorce')
    expect(prose(reading)).toMatch(/not a finding that an affair has already happened/)
  })

  it('lets a held birth chart still show strain in Navamsha', () => {
    const reading = analyzeDivorceEnergy(chart({
      asc: 1,
      d9Asc: 1,
      d9: [g('Mo', 8, 'debilitated'), g('Ve', 6, 'debilitated'), g('Sa', 11, 'own')],
      grahas: [g('Mo', 4, 'own'), g('Ve', 2, 'own'), g('Sa', 11, 'own'), g('Ma', 6), g('Ju', 9, 'own'), g('Ra', 3), g('Ke', 9)],
    }))!
    expect(reading.flags.level).toBe('held')
    expect(ids(reading)).toContain('split-d9')
  })

  it('names the chart that carries the break when the two charts differ', () => {
    const broken = analyzeDivorceEnergy(chart({
      asc: 1,
      name: 'Asha',
      grahas: [g('Mo', 8, 'debilitated'), g('Ve', 6, 'debilitated'), g('Sa', 1, 'debilitated'), g('Ju', 9)],
    }))!
    const held = analyzeDivorceEnergy(chart({
      asc: 1,
      name: 'Dev',
      grahas: [g('Mo', 4, 'own'), g('Ve', 2, 'own'), g('Sa', 11, 'own'), g('Ju', 9, 'own'), g('Ma', 6)],
    }))!
    const pair = compareDivorceEnergy(broken, held, 'Asha', 'Dev')
    expect(pair.map(n => n.id)).toContain('split-pair-one')
  })

  it('returns nothing without an ascendant', () => {
    expect(analyzeDivorceEnergy({ grahas: [], lagnas: {} } as unknown as ChartOutput)).toBeNull()
  })
})
