import { describe, it, expect } from 'vitest'
import type { ChartOutput, Dignity, DashaNode, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { analyzeMarriageMars, compareMarriageMars, type MarriageMarsReading } from '@/lib/engine/marriageMars'

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
  birthDate?: string
  d9Asc?: Rashi
  d9?: GrahaData[]
  dasha?: boolean
}): ChartOutput {
  const maha: DashaNode = {
    lord: 'Ma',
    start: new Date('2024-01-01'),
    end: new Date('2031-01-01'),
    durationMs: 1,
    level: 1,
    isCurrent: true,
    children: [],
  }
  return {
    meta: { name: 'Test', gender: opts.gender, birthDate: opts.birthDate },
    grahas: opts.grahas,
    lagnas: { ascRashi: opts.asc },
    vargas: opts.d9 ? { D9: opts.d9 } : {},
    vargaLagnas: opts.d9Asc ? { D9: opts.d9Asc } : {},
    dashas: opts.dasha ? { vimshottari: [maha] } : {},
  } as unknown as ChartOutput
}

function ids(reading: MarriageMarsReading): string[] {
  return [...reading.level, ...reading.placements, ...reading.pairs].map(n => n.id)
}

function prose(reading: MarriageMarsReading): string {
  return [reading.headline, ...[...reading.level, ...reading.placements, ...reading.pairs].map(n => `${n.title} ${n.detail}`)].join(' ')
}

describe('Mars in marriage', () => {
  it('names a refined Mars when Jupiter and Saturn both hold a strong Mars', () => {
    const reading = analyzeMarriageMars(chart({
      asc: 1,
      gender: 'female',
      grahas: [
        g('Ma', 1, 'own'),
        g('Ju', 5, 'own'),
        g('Sa', 7, 'exalted'),
        g('Ve', 7, 'own'),
        g('Mo', 2, 'own'),
      ],
    }))!
    expect(reading.flags.level).toBe('transformative')
    expect(reading.flags.element).toBe('fire')
    expect(ids(reading)).toContain('mars-transformative')
    expect(ids(reading)).toContain('mars-hers')
    expect(prose(reading)).not.toMatch(/3 years|criminal|bedridden|99\.9/)
  })

  it('does not call a debilitated Mars immature when it is not raw', () => {
    const reading = analyzeMarriageMars(chart({
      asc: 2,
      grahas: [
        g('Ma', 4, 'debilitated'),
        g('Ve', 7, 'own'),
        g('Mo', 2, 'own'),
        g('Ju', 9, 'own'),
        g('Sa', 11),
      ],
    }))!
    expect(reading.flags.level).toBe('open')
    expect(reading.flags.manglik).toBe(false)
    expect(ids(reading)).not.toContain('mars-immature')
    expect(ids(reading)).toContain('mars-no-fight')
  })

  it('reads Mars with Rahu in the 7th as raw heat, not a balanced marriage', () => {
    const reading = analyzeMarriageMars(chart({
      asc: 4,
      gender: 'male',
      grahas: [
        g('Ma', 10, 'exalted'),
        g('Ra', 10),
        g('Ve', 6, 'debilitated'),
        g('Mo', 6, 'debilitated'),
        g('Ju', 3),
        g('Sa', 3),
      ],
    }))!
    expect(reading.flags.level).toBe('immature')
    expect(reading.flags.inSeventh).toBe(true)
    expect(reading.flags.manglik).toBe(true)
    expect(ids(reading)).toContain('mars-rahu')
    expect(ids(reading)).toContain('mars-his')
    expect(prose(reading)).toMatch(/no middle setting/)
    expect(prose(reading)).not.toMatch(/better married life/)
  })

  it('softens Manglik heat after thirty without erasing it', () => {
    const reading = analyzeMarriageMars(chart({
      asc: 1,
      birthDate: '1990-01-01',
      grahas: [g('Ma', 1), g('Ve', 6), g('Mo', 6, 'debilitated'), g('Ju', 3), g('Sa', 3)],
    }), { now: new Date('2026-06-01') })!
    expect(reading.flags.manglik).toBe(true)
    expect(reading.flags.maturedByAge).toBe(true)
    expect(prose(reading)).toMatch(/more lightly/)
  })

  it('compares a raw Mars with one the other chart can meet', () => {
    const raw = analyzeMarriageMars(chart({
      asc: 4,
      grahas: [g('Ma', 10, 'exalted'), g('Ra', 10), g('Ve', 6), g('Mo', 3), g('Ju', 3), g('Sa', 3)],
    }))!
    const held = analyzeMarriageMars(chart({
      asc: 1,
      grahas: [g('Ma', 1, 'own'), g('Ju', 5, 'own'), g('Sa', 7, 'exalted'), g('Ve', 7, 'own'), g('Mo', 2, 'own')],
    }))!
    const pair = compareMarriageMars(raw, held, 'Asha', 'Dev')
    expect(pair.map(n => n.id)).toEqual(['mars-pair-one'])
    expect(pair[0].detail).toMatch(/Asha/)
    expect(pair[0].detail).toMatch(/somewhere for that pace to land/)
  })
})
