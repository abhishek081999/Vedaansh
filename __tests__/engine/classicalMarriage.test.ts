import { describe, it, expect } from 'vitest'
import type { ChartOutput, Dignity, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { analyzeClassicalMarriage, compareClassicalMarriage } from '@/lib/engine/classicalMarriage'

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
  gender?: 'male' | 'female'
  name?: string
  dk?: GrahaId
}): ChartOutput {
  return {
    meta: { name: opts.name ?? 'Test', gender: opts.gender },
    grahas: opts.grahas,
    lagnas: { ascRashi: opts.asc },
    vargas: opts.d9 ? { D9: opts.d9 } : {},
    vargaLagnas: opts.d9Asc ? { D9: opts.d9Asc } : {},
    karakas: opts.dk ? { DK: opts.dk } : undefined,
  } as unknown as ChartOutput
}

function allProse(reading: NonNullable<ReturnType<typeof analyzeClassicalMarriage>>): string {
  return [
    reading.headline,
    reading.summary,
    ...[...reading.spouse, ...reading.timing, ...reading.happiness, ...reading.remarriage]
      .map(n => `${n.title} ${n.detail}`),
  ].join(' ')
}

const BOOKISH = /BPHS|Phaladeepika|Chapter\s*\d+|Parashara|Brihat/i

describe('classical marriage predictions', () => {
  it('builds spouse portrait with appearance, family, direction, and DK', () => {
    const reading = analyzeClassicalMarriage(chart({
      asc: 1,
      dk: 'Ve',
      grahas: [
        g('Ve', 5, 'own'),
        g('Ju', 9, 'own'),
        g('Ma', 1, 'own'),
        g('Sa', 11),
        g('Ra', 3),
        g('Ke', 9),
        g('Mo', 4, 'own'),
        g('Su', 2),
        g('Me', 3),
      ],
    }))!
    expect(reading.spouse.map(n => n.id)).toEqual(expect.arrayContaining([
      'partner-appear',
      'partner-family',
      'partner-direction',
      'partner-dk',
    ]))
    expect(allProse(reading)).toMatch(/Darakaraka|Venus/i)
    expect(allProse(reading)).not.toMatch(BOOKISH)
  })

  it('assembles timing from age band and house gates', () => {
    const reading = analyzeClassicalMarriage(chart({
      asc: 1,
      grahas: [
        g('Ve', 7, 'own'),
        g('Ju', 9, 'own'),
        g('Ma', 1, 'own'),
        g('Sa', 11),
        g('Ra', 3),
        g('Ke', 9),
        g('Mo', 5),
        g('Su', 2),
        g('Me', 6),
      ],
    }))!
    expect(reading.timing.some(n => n.id === 'classical-timing-band')).toBe(true)
    expect(reading.timing.some(n => n.id === 'classical-timing-houses')).toBe(true)
    expect(allProse(reading)).not.toMatch(BOOKISH)
  })

  it('includes happiness softeners when Mars heat can cancel', () => {
    const reading = analyzeClassicalMarriage(chart({
      asc: 1,
      grahas: [
        g('Ma', 7, 'own'),
        g('Ju', 1, 'own'),
        g('Ve', 2, 'friend'),
        g('Mo', 4, 'own'),
        g('Sa', 11, 'friend'),
        g('Ra', 3),
        g('Ke', 9),
        g('Su', 5),
        g('Me', 6),
      ],
    }))!
    expect(reading.happiness.some(n => n.id === 'split-kuja-cancel' || n.id === 'split-kuja-active')).toBe(true)
    expect(allProse(reading)).not.toMatch(BOOKISH)
  })

  it('flags remarriage / multiplicity stacks without book labels', () => {
    const reading = analyzeClassicalMarriage(chart({
      asc: 1,
      gender: 'female',
      grahas: [
        g('Sa', 7),
        g('Mo', 7),
        g('Ma', 7),
        g('Ve', 6, 'debilitated'),
        g('Ju', 10, 'debilitated'),
        g('Ra', 3),
        g('Ke', 9),
        g('Su', 2),
        g('Me', 4),
      ],
    }))!
    expect(reading.remarriage.some(n =>
      n.id === 'class-remarriage-three' || n.id === 'classical-remarriage-flag' || n.id.includes('remarriage'),
    )).toBe(true)
    expect(allProse(reading)).not.toMatch(BOOKISH)
  })

  it('compares two charts for shared second-bond marks', () => {
    const a = analyzeClassicalMarriage(chart({
      asc: 1,
      name: 'Asha',
      gender: 'female',
      grahas: [
        g('Sa', 7), g('Mo', 7), g('Ma', 7),
        g('Ve', 6, 'debilitated'), g('Ju', 10, 'debilitated'),
        g('Ra', 3), g('Ke', 9), g('Su', 2), g('Me', 4),
      ],
    }))!
    const b = analyzeClassicalMarriage(chart({
      asc: 4,
      name: 'Dev',
      grahas: [
        g('Ju', 4, 'exalted'), g('Ve', 7, 'own'),
        g('Ma', 1), g('Sa', 11), g('Ra', 3), g('Ke', 9), g('Mo', 2, 'own'),
        g('Su', 5), g('Me', 6),
      ],
    }))!
    const pair = compareClassicalMarriage(a, b, 'Asha', 'Dev')
    expect(pair.some(n => n.id.startsWith('classical-pair'))).toBe(true)
    expect(pair.map(n => `${n.title} ${n.detail}`).join(' ')).not.toMatch(BOOKISH)
  })

  it('returns null without ascendant', () => {
    expect(analyzeClassicalMarriage({ grahas: [], lagnas: {} } as unknown as ChartOutput)).toBeNull()
  })
})
