import { describe, it, expect } from 'vitest'
import type { ChartOutput, Dignity, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { analyzeMarriageVivah, compareMarriageVivah, type MarriageVivahReading } from '@/lib/engine/marriageVivah'

function g(
  id: GrahaId,
  rashi: Rashi,
  dignity: Dignity = 'neutral',
  extra: Partial<GrahaData> = {},
): GrahaData {
  return { id, rashi, dignity, isCombust: false, isRetro: false, name: id, nakshatraIndex: 1, ...extra } as GrahaData
}

function chart(opts: {
  asc: Rashi
  grahas: GrahaData[]
  ascDegree?: number
  d9Asc?: Rashi
  d9?: GrahaData[]
}): ChartOutput {
  return {
    meta: { name: 'Test' },
    grahas: opts.grahas,
    lagnas: { ascRashi: opts.asc, ascDegree: opts.ascDegree },
    vargas: opts.d9 ? { D9: opts.d9 } : {},
    vargaLagnas: opts.d9Asc ? { D9: opts.d9Asc } : {},
  } as unknown as ChartOutput
}

function ids(reading: MarriageVivahReading): string[] {
  return [...reading.harm, ...reading.pattern, ...reading.debt].map(n => n.id)
}

function prose(reading: MarriageVivahReading): string {
  return [reading.headline, reading.summary, ...[...reading.harm, ...reading.pattern, ...reading.debt].map(n => `${n.title} ${n.detail}`)].join(' ')
}

describe('marriage method', () => {
  it('reads the case pattern: weak Mars in the 7th, star exchange, repetition, and a service chain', () => {
    const reading = analyzeMarriageVivah(chart({
      asc: 10,
      ascDegree: 285,
      d9Asc: 10,
      d9: [g('Sa', 4), g('Ve', 7), g('Ra', 7), g('Su', 5)],
      grahas: [
        g('Ma', 4, 'debilitated', { nakshatraIndex: 6 }),
        g('Mo', 5, 'neutral', { nakshatraIndex: 9 }),
        g('Ke', 6, 'neutral', { nakshatraIndex: 12 }),
        g('Me', 3, 'own', { isRetro: true, nakshatraIndex: 5 }),
        g('Su', 3, 'neutral', { nakshatraIndex: 5 }),
        g('Ju', 1, 'friend', { nakshatraIndex: 0 }),
        g('Sa', 8, 'neutral', { nakshatraIndex: 16 }),
        g('Ve', 3, 'neutral', { nakshatraIndex: 4 }),
        g('Ra', 12, 'neutral', { nakshatraIndex: 23 }),
      ],
    }))!
    expect(reading.flags.marsHarm).toBe(true)
    expect(reading.flags.channels).toEqual(['body', 'speech', 'sexual', 'work'])
    expect(reading.flags.mercuryReplay).toBe(true)
    expect(reading.flags.starExchange).toBe(true)
    expect(reading.flags.punarvasu).toBe(true)
    expect(reading.flags.transformationChain).toBe(true)
    expect(reading.flags.bandhan).toBe(true)
    expect(reading.flags.blind).toBe(true)
    expect(reading.flags.guidesOthers).toBe(true)
    expect(reading.flags.crisis).toBe(true)
    expect(ids(reading)).toEqual(expect.arrayContaining([
      'vivah-mars',
      'vivah-work',
      'vivah-mercury',
      'vivah-exchange-Mo-Ke',
      'vivah-punarvasu',
      'vivah-lagna-star',
      'vivah-bandhan',
      'vivah-rin-transform',
      'vivah-d9-service',
      'vivah-blind',
      'vivah-guides',
      'vivah-crisis',
      'vivah-counsel',
    ]))
    const text = prose(reading)
    expect(text).toMatch(/sexual harm/)
    expect(text).toMatch(/Punarvasu/)
    expect(text).toMatch(/988/)
    expect(text).not.toMatch(/\bcut\b|attempt|hands|legs|kidnap/i)
    expect(text).toMatch(/clinician/)
  })

  it('does not call a dignified Mars that merely sees the 7th a harm indicator', () => {
    const reading = analyzeMarriageVivah(chart({
      asc: 1,
      grahas: [
        g('Ma', 1, 'own'),
        g('Ve', 2, 'own'),
        g('Ju', 4, 'exalted'),
        g('Mo', 5),
        g('Su', 5),
        g('Me', 3),
        g('Sa', 11),
      ],
    }))!
    expect(reading.flags.marsHarm).toBe(false)
    expect(reading.flags.crisis).toBe(false)
    expect(reading.flags.punarvasu).toBe(false)
    expect(reading.harm).toHaveLength(0)
    expect(prose(reading)).toMatch(/no extra mark/)
  })

  it('reads a later bond from the 9th and Jupiter when Jupiter actually reaches the marriage', () => {
    const reading = analyzeMarriageVivah(chart({
      asc: 1,
      grahas: [
        g('Ju', 7, 'own'),
        g('Ve', 9, 'friend', { nakshatraIndex: 16 }),
        g('Ma', 11, 'neutral'),
        g('Mo', 2, 'own'),
        g('Su', 3),
        g('Me', 3),
        g('Sa', 10, 'own'),
      ],
    }))!
    expect(reading.flags.laterBond).toBe(true)
    expect(reading.flags.jupiterHolds).toBe(true)
    expect(ids(reading)).toContain('vivah-later')
    expect(ids(reading)).toContain('vivah-jupiter-holds')
    expect(prose(reading)).toMatch(/has to meet the spouse/)
  })

  it('reads the 5th and 9th lords in the 6th as a service debt', () => {
    const reading = analyzeMarriageVivah(chart({
      asc: 1,
      grahas: [
        g('Su', 6),
        g('Ju', 6, 'enemy'),
        g('Ve', 2, 'own'),
        g('Ma', 11),
        g('Mo', 2, 'own'),
        g('Me', 3),
        g('Sa', 10, 'own'),
      ],
    }))!
    expect(reading.flags.serviceChain).toBe(true)
    expect(reading.flags.marsHarm).toBe(false)
    expect(ids(reading)).toContain('vivah-rin-service')
  })

  it('compares harm and crisis across two charts', () => {
    const marked = analyzeMarriageVivah(chart({
      asc: 10,
      grahas: [
        g('Ma', 4, 'debilitated', { nakshatraIndex: 6 }),
        g('Mo', 5, 'neutral', { nakshatraIndex: 9 }),
        g('Ke', 6, 'neutral', { nakshatraIndex: 12 }),
        g('Su', 3),
      ],
    }))!
    const quiet = analyzeMarriageVivah(chart({
      asc: 1,
      grahas: [g('Ma', 1, 'own'), g('Ve', 2, 'own'), g('Ju', 9, 'own'), g('Mo', 4)],
    }))!
    const pair = compareMarriageVivah(marked, quiet, 'Asha', 'Dev')
    expect(pair.map(n => n.id)).toEqual(['vivah-pair-mars', 'vivah-pair-crisis'])
    expect(pair.map(n => n.detail).join(' ')).toMatch(/Asha/)
    expect(pair.map(n => n.detail).join(' ')).not.toMatch(/Dev carries|Dev has/)
  })
})
