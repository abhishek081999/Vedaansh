import { describe, it, expect } from 'vitest'
import type { ChartOutput, Dignity, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { analyzeJayaBhava, compareJayaBhava, type JayaBhavaReading } from '@/lib/engine/jayaBhava'

function g(
  id: GrahaId,
  rashi: Rashi,
  dignity: Dignity = 'neutral',
  extra: Partial<GrahaData> = {},
): GrahaData {
  return { id, rashi, dignity, isCombust: false, name: id, ...extra } as GrahaData
}

function chart(opts: {
  asc: Rashi
  grahas: GrahaData[]
  gender?: 'male' | 'female' | 'other'
  name?: string
}): ChartOutput {
  return {
    meta: { gender: opts.gender ?? 'other', name: opts.name ?? 'Test' },
    grahas: opts.grahas,
    lagnas: { ascRashi: opts.asc },
  } as ChartOutput
}

function ids(reading: JayaBhavaReading): string[] {
  return [
    ...reading.lord,
    ...reading.occupants,
    ...reading.dynamics,
    ...reading.multiplicity,
    ...reading.timing,
    ...reading.strain,
  ].map(n => n.id)
}

function prose(reading: JayaBhavaReading): string {
  return [
    reading.headline,
    reading.summary,
    ...ids(reading).length ? '' : '',
    ...[...reading.lord, ...reading.occupants, ...reading.dynamics, ...reading.multiplicity, ...reading.timing, ...reading.strain]
      .map(n => `${n.title} ${n.detail}`),
  ].join(' ')
}

describe('BPHS chapter 19, seventh house', () => {
  it('treats an exalted 7th lord in the 12th as full happiness that still develops', () => {
    const reading = analyzeJayaBhava(chart({
      asc: 1,
      gender: 'male',
      grahas: [
        g('Ve', 12, 'exalted'),
        g('Ma', 1, 'own'),
        g('Sa', 11),
        g('Ju', 9, 'own'),
        g('Mo', 4),
      ],
    }))
    expect(reading).not.toBeNull()
    expect(ids(reading!)).toContain('bphs-19-1')
    expect(ids(reading!)).toContain('bphs-19-2-override')
    expect(ids(reading!)).toContain('bphs-19-6')
    expect(ids(reading!)).not.toContain('bphs-19-2')
    expect(reading!.headline).toMatch(/full happiness/i)
    expect(reading!.flags.dignifiedLord).toBe(true)
    expect(reading!.flags.dusthanaUndignified).toBe(false)
  })

  it('reads a debilitated 7th lord in the 6th as service without ease', () => {
    const reading = analyzeJayaBhava(chart({
      asc: 1,
      grahas: [
        g('Ve', 6, 'debilitated'),
        g('Ma', 8, 'own'),
        g('Sa', 2),
        g('Mo', 4),
      ],
    }))!
    expect(ids(reading)).toContain('bphs-19-2')
    expect(ids(reading)).toContain('bphs-19-17')
    expect(ids(reading)).not.toContain('bphs-19-1')
    expect(reading.flags.dusthanaUndignified).toBe(true)
    expect(prose(reading)).toMatch(/service/i)
    expect(prose(reading)).toMatch(/physically ill/i)
  })

  it('keeps the Mars–Saturn spouse line off a natural 7th lord unless the affliction is real', () => {
    const reading = analyzeJayaBhava(chart({
      asc: 4,
      grahas: [
        g('Sa', 5),
        g('Ma', 4),
        g('Ve', 12),
        g('Mo', 2),
      ],
    }))!
    expect(ids(reading)).toContain('bphs-19-11-guard')
    expect(ids(reading)).not.toContain('bphs-19-11')
    expect(prose(reading)).not.toMatch(/harlot|adulteress|will die|snake bite/i)
  })

  it('reads Venus in the 7th as desire at full volume, without a script of acts', () => {
    const reading = analyzeJayaBhava(chart({
      asc: 7,
      gender: 'female',
      grahas: [
        g('Ve', 1),
        g('Ma', 10, 'exalted'),
        g('Sa', 3),
        g('Ju', 9, 'own'),
      ],
    }))!
    expect(ids(reading)).toContain('bphs-19-3')
    expect(ids(reading)).toContain('bphs-19-7-Ve')
    expect(prose(reading)).not.toMatch(/harlot|breasts|oral|prostitute/i)
  })

  it('marks the Mars–Rahu–Saturn siege without predicting a death', () => {
    const reading = analyzeJayaBhava(chart({
      asc: 1,
      grahas: [
        g('Ma', 6),
        g('Ra', 7),
        g('Sa', 8),
        g('Ve', 2, 'own'),
        g('Ke', 1),
      ],
    }))!
    expect(ids(reading)).toContain('bphs-19-42')
    expect(reading.flags.siege).toBe(true)
    expect(reading.headline).toMatch(/pressure/i)
    expect(prose(reading)).not.toMatch(/wife dies|cannot live long/i)
  })

  it('times Sun in the 7th with the 7th lord beside Venus', () => {
    const reading = analyzeJayaBhava(chart({
      asc: 2,
      grahas: [
        g('Su', 8),
        g('Ma', 8),
        g('Ve', 8),
        g('Sa', 6),
        g('Mo', 4),
      ],
    }))!
    expect(ids(reading)).toContain('bphs-19-23')
    expect(reading.flags.earliestYear).toBe(7)
    expect(prose(reading)).toMatch(/not a modern birthday|early-marriage-era|relative/i)
  })

  it('requires all three gold-standard conditions', () => {
    const reading = analyzeJayaBhava(chart({
      asc: 9,
      grahas: [
        g('Ju', 3, 'own'),
        g('Me', 6, 'own'),
        g('Ve', 3),
        g('Sa', 11),
        g('Ma', 1, 'own'),
      ],
    }))!
    expect(ids(reading)).toContain('bphs-19-14')
    expect(reading.flags.goldStandard).toBe(true)
    expect(reading.headline).toMatch(/gold-standard/i)
  })

  it('reads Moon in the 7th, the lord in the 12th, and a weak significator as need without a mechanism', () => {
    const reading = analyzeJayaBhava(chart({
      asc: 3,
      grahas: [
        g('Mo', 9),
        g('Ju', 2),
        g('Ve', 6, 'debilitated'),
        g('Ma', 1),
        g('Sa', 11),
      ],
    }))!
    expect(ids(reading)).toContain('bphs-19-18')
    expect(prose(reading)).toMatch(/not the defect|blaming/i)
  })

  it('lets a waxing Moon mitigate the denial of marital happiness', () => {
    const reading = analyzeJayaBhava(chart({
      asc: 3,
      grahas: [
        g('Mo', 9, 'neutral', { isWaxingMoon: true }),
        g('Ju', 2),
        g('Ve', 6, 'debilitated'),
        g('Ma', 1),
        g('Sa', 11),
      ],
    }))!
    expect(ids(reading)).toContain('bphs-19-18')
    expect(prose(reading)).toMatch(/waxing/i)
    expect(prose(reading)).toMatch(/mitigat/i)
  })

  it('compares a steady 7th lord with a developmental one', () => {
    const steady = analyzeJayaBhava(chart({
      asc: 1,
      name: 'Asha',
      grahas: [g('Ve', 2, 'own'), g('Ma', 8, 'own'), g('Sa', 11), g('Mo', 4)],
    }))!
    const heavy = analyzeJayaBhava(chart({
      asc: 1,
      name: 'Dev',
      grahas: [g('Ve', 6, 'debilitated'), g('Ma', 8, 'own'), g('Sa', 2), g('Mo', 4)],
    }))!
    const pair = compareJayaBhava(steady, heavy, 'Asha', 'Dev')
    expect(pair.map(n => n.id)).toContain('jaya-pair-uneven')
    expect(pair.find(n => n.id === 'jaya-pair-uneven')!.detail).toMatch(/Asha/)
    expect(pair.find(n => n.id === 'jaya-pair-uneven')!.detail).toMatch(/Dev/)
  })

  it('returns nothing without an ascendant', () => {
    expect(analyzeJayaBhava({ grahas: [], lagnas: {} } as unknown as ChartOutput)).toBeNull()
  })
})
