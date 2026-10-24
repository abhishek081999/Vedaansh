import { describe, it, expect } from 'vitest'
import type { ChartOutput, Dignity, DashaNode, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { analyzeMarriageClass, compareMarriageClass, type MarriageClassReading } from '@/lib/engine/marriageClass'

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
  d7?: Rashi
  gender?: 'male' | 'female'
  name?: string
  dasha?: boolean
  ul?: Rashi
  ascDegree?: number
}): ChartOutput {
  const maha: DashaNode = {
    lord: 'Ra',
    start: new Date('2020-01-01'),
    end: new Date('2038-01-01'),
    durationMs: 1,
    level: 1,
    isCurrent: false,
    children: [{
      lord: 'Sa',
      start: new Date('2024-01-01'),
      end: new Date('2027-06-01'),
      durationMs: 1,
      level: 2,
      isCurrent: false,
      children: [],
    }],
  }
  return {
    meta: { gender: opts.gender ?? 'female', name: opts.name ?? 'Test' },
    grahas: opts.grahas,
    lagnas: { ascRashi: opts.asc, ...(opts.ascDegree != null ? { ascDegree: opts.ascDegree } : {}) },
    vargas: opts.d9 ? { D9: opts.d9 } : {},
    vargaLagnas: {
      ...(opts.d9Asc ? { D9: opts.d9Asc } : {}),
      ...(opts.d7 ? { D7: opts.d7 } : {}),
    },
    dashas: opts.dasha ? { vimshottari: [maha] } : {},
    arudhas: opts.ul ? { A12: opts.ul } : {},
  } as unknown as ChartOutput
}

function ids(reading: MarriageClassReading): string[] {
  return [
    ...reading.frame, ...reading.kind, ...reading.pillars, ...reading.pattern,
    ...reading.bond, ...reading.nakshatra, ...reading.navamsha, ...reading.strain,
  ].map(n => n.id)
}

function prose(reading: MarriageClassReading): string {
  return ids(reading).map(id => {
    const all = [
      ...reading.frame, ...reading.kind, ...reading.pillars, ...reading.pattern,
      ...reading.bond, ...reading.nakshatra, ...reading.navamsha, ...reading.strain,
    ]
    const n = all.find(x => x.id === id)!
    return `${n.title} ${n.detail}`
  }).join(' ')
}

describe('marriage class', () => {
  it('reads Venus with Rahu and a node on the Moon as a karmic account', () => {
    const reading = analyzeMarriageClass(chart({
      asc: 1,
      grahas: [
        g('Ve', 2, 'own'),
        g('Ra', 2),
        g('Ke', 8),
        g('Mo', 8),
        g('Ma', 5),
        g('Sa', 6),
        g('Ju', 9, 'own'),
        g('Su', 5),
      ],
    }))!
    expect(reading.flags.bond).toBe('karmic')
    expect(ids(reading)).toContain('class-bond-karmic')
    expect(ids(reading)).toContain('class-d9-missing')
    expect(ids(reading)).toContain('class-age-moved')
    expect(prose(reading)).toMatch(/No year for meeting or ending|Neither stretch names the year/i)
    expect(prose(reading)).not.toMatch(/100%|murder|eyes closed|at 25|at age/i)
  })

  it('reads Jupiter with Venus and a trine to the Moon as a soul bond', () => {
    const reading = analyzeMarriageClass(chart({
      asc: 9,
      grahas: [
        g('Ve', 7, 'own'),
        g('Ju', 7, 'friend'),
        g('Mo', 11),
        g('Me', 5),
        g('Ma', 1, 'own'),
        g('Sa', 3),
        g('Ra', 6),
        g('Ke', 12),
        g('Su', 5),
      ],
    }))!
    expect(reading.flags.bond).toBe('soul')
    expect(ids(reading)).toContain('class-bond-soul')
    expect(reading.headline).toMatch(/soul/i)
  })

  it('keeps the two nakshatra pairs specific', () => {
    const sustain = analyzeMarriageClass(chart({
      asc: 1,
      grahas: [g('Ve', 2, 'own', { nakshatraIndex: 3 }), g('Mo', 2, 'neutral', { nakshatraIndex: 4 }), g('Ma', 5), g('Sa', 6)],
    }))!
    const disconnect = analyzeMarriageClass(chart({
      asc: 1,
      grahas: [g('Ve', 3, 'neutral', { nakshatraIndex: 5 }), g('Mo', 4, 'own', { nakshatraIndex: 7 }), g('Ma', 5), g('Sa', 6)],
    }))!
    expect(ids(sustain)).toContain('class-nak-pair-sustain')
    expect(ids(disconnect)).toContain('class-nak-pair-break')
    expect(prose(disconnect)).toMatch(/Do not extend it/i)
  })

  it('lets the 8th of D9 override an exalted Venus', () => {
    const reading = analyzeMarriageClass(chart({
      asc: 1,
      grahas: [g('Ve', 2, 'own'), g('Ma', 5), g('Sa', 6), g('Mo', 4)],
      d9Asc: 1,
      d9: [g('Ve', 8, 'exalted'), g('Ma', 1), g('Sa', 10)],
    }))!
    expect(ids(reading)).toContain('class-d9-venus-8')
    expect(prose(reading)).toMatch(/exalted, and the 8th still wins/i)
  })

  it('names three deep bonds only with the ethical limit', () => {
    const reading = analyzeMarriageClass(chart({
      asc: 1,
      grahas: [g('Ve', 2), g('Sa', 2), g('Ma', 5), g('Mo', 4), g('Ju', 9)],
      d9Asc: 4,
      d9: [g('Ve', 4), g('Ma', 4), g('Sa', 10)],
    }))!
    expect(ids(reading)).toContain('class-three-deep')
    expect(prose(reading)).toMatch(/already know the history/i)
  })

  it('reads a kendra 7th lord, a strong D9, and a fixed Moon as linear', () => {
    const reading = analyzeMarriageClass(chart({
      asc: 1,
      grahas: [
        g('Ve', 7, 'own'),
        g('Ma', 5),
        g('Sa', 2),
        g('Ra', 4),
        g('Ke', 10),
        g('Su', 5),
        g('Mo', 11),
        g('Ju', 9, 'own'),
      ],
      d9Asc: 1,
      d9: [g('Ve', 2, 'own'), g('Ma', 1, 'own')],
    }))!
    expect(reading.flags.pattern).toBe('linear')
    expect(ids(reading)).toContain('class-pattern-linear')
  })

  it('requires the Rahu–Saturn period before calling the bond unable to restart', () => {
    const base = {
      asc: 1 as Rashi,
      grahas: [
        g('Ve', 6, 'debilitated'),
        g('Sa', 6),
        g('Ma', 5),
        g('Mo', 4, 'own', { isWaxingMoon: true }),
        g('Ju', 1),
        g('Ra', 3),
        g('Ke', 9),
        g('Su', 5),
      ],
      d9Asc: 1 as Rashi,
      d9: [g('Ve', 10), g('Sa', 10), g('Ma', 1)],
    }
    const waiting = analyzeMarriageClass(chart(base))!
    const running = analyzeMarriageClass(chart({ ...base, dasha: true }))!
    expect(ids(waiting)).toContain('class-strain-watch')
    expect(ids(waiting)).not.toContain('class-irreversible')
    expect(ids(running)).toContain('class-irreversible')
  })

  it('compares a karmic chart with a soul chart as a difference of pace', () => {
    const karmic = analyzeMarriageClass(chart({
      asc: 1,
      name: 'Asha',
      grahas: [g('Ve', 2, 'own'), g('Ra', 2), g('Ke', 8), g('Mo', 8), g('Ma', 5), g('Sa', 6)],
    }))!
    const soul = analyzeMarriageClass(chart({
      asc: 9,
      name: 'Dev',
      grahas: [g('Ve', 7, 'own'), g('Ju', 7), g('Mo', 11), g('Me', 5), g('Ma', 1), g('Sa', 3), g('Ra', 6), g('Ke', 12)],
    }))!
    const pair = compareMarriageClass(karmic, soul, 'Asha', 'Dev')
    expect(pair.map(n => n.id)).toContain('class-pair-pace')
  })

  it('returns nothing without an ascendant', () => {
    expect(analyzeMarriageClass({ grahas: [], lagnas: {} } as unknown as ChartOutput)).toBeNull()
  })

  it('reads one break from an afflicted 7th lord when D9 does not repeat it', () => {
    const reading = analyzeMarriageClass(chart({
      asc: 1,
      grahas: [
        g('Ve', 12, 'exalted'),
        g('Ma', 1),
        g('Sa', 2),
        g('Ra', 4),
        g('Ke', 10),
        g('Mo', 5),
        g('Ju', 9),
        g('Su', 5),
      ],
    }))!
    expect(ids(reading)).toContain('class-one-break')
    expect(ids(reading)).not.toContain('class-sequence')
    expect(ids(reading)).not.toContain('class-kind-open')
    expect(ids(reading)).not.toContain('class-pattern-divorce')
    expect(prose(reading)).not.toMatch(/100%|guaranteed/i)
  })

  it('names Ruchaka and the harmony formula when an exalted Mars 7th lord is supported', () => {
    const reading = analyzeMarriageClass(chart({
      asc: 7,
      grahas: [
        g('Ma', 10, 'exalted'),
        g('Ve', 1, 'own'),
        g('Ju', 9, 'own'),
        g('Mo', 2),
        g('Sa', 11),
        g('Ra', 6),
        g('Ke', 12),
        g('Su', 8),
      ],
    }))!
    expect(ids(reading)).toContain('class-ruchaka')
    expect(ids(reading)).toContain('class-virtuous')
    expect(prose(reading)).toMatch(/Ruchaka/)
    expect(prose(reading)).not.toMatch(/Shasha/)
  })

  it('does not treat a dual 7th rashi as the navamsha condition for two bonds', () => {
    const reading = analyzeMarriageClass(chart({
      asc: 3,
      ascDegree: 60,
      grahas: [
        g('Ju', 10, 'debilitated'),
        g('Sa', 10),
        g('Ve', 2, 'own'),
        g('Ma', 1),
        g('Mo', 4),
      ],
    }))!
    expect(ids(reading)).not.toContain('class-two-bonds')
  })

  it('reads two bonds when the 7th cusp navamsha is a dual sign', () => {
    const reading = analyzeMarriageClass(chart({
      asc: 1,
      ascDegree: 7,
      grahas: [
        g('Ve', 6, 'debilitated'),
        g('Sa', 6),
        g('Ma', 1),
        g('Mo', 4),
        g('Ju', 9),
      ],
    }))!
    expect(ids(reading)).toContain('class-two-bonds')
    expect(ids(reading)).toContain('class-layers')
    expect(prose(reading)).toMatch(/navamsha/i)
    expect(prose(reading)).toMatch(/Saturn on the 7th lord/)
    expect(prose(reading)).not.toMatch(/100%|guaranteed|murder|eyes closed|kilometer/i)
  })

  it('keeps retrograde Venus visible when D9 dignity is strong', () => {
    const reading = analyzeMarriageClass(chart({
      asc: 1,
      grahas: [g('Ve', 7, 'own', { isRetro: true }), g('Ma', 5), g('Mo', 11), g('Ju', 9)],
      d9Asc: 2,
      d9: [g('Ve', 2, 'own', { isRetro: true }), g('Ma', 6)],
    }))!
    expect(prose(reading)).toMatch(/strong in the Navamsha/)
    expect(prose(reading)).toMatch(/unfinished love/)
  })

  it('reads Anuradha as duty with devotion, not as two contradictory yogas', () => {
    const reading = analyzeMarriageClass(chart({
      asc: 1,
      grahas: [g('Ve', 8, 'neutral', { nakshatraIndex: 16 }), g('Mo', 4), g('Ma', 5)],
    }))!
    expect(prose(reading)).toMatch(/duty comes before romance/i)
    expect(prose(reading)).not.toMatch(/Commitment outruns romance/)
  })

  it('names a soul contract when Venus occupies the D9 lagna', () => {
    const reading = analyzeMarriageClass(chart({
      asc: 1,
      grahas: [g('Ve', 7, 'own'), g('Ma', 5), g('Mo', 11), g('Ju', 3)],
      d9Asc: 5,
      d9: [g('Ve', 5, 'friend'), g('Su', 5, 'own')],
    }))!
    expect(ids(reading)).toContain('class-soul-contract')
    expect(prose(reading)).toMatch(/occupies the D9 lagna/)
  })

  it('reads a weak birth-chart Venus and Jupiter as holding when the Navamsha is strong', () => {
    const reading = analyzeMarriageClass(chart({
      asc: 1,
      grahas: [
        g('Ve', 6, 'debilitated'),
        g('Ju', 7, 'debilitated'),
        g('Mo', 4, 'enemy'),
        g('Ma', 1, 'own'),
        g('Sa', 11, 'enemy'),
        g('Su', 5, 'friend'),
        g('Me', 3, 'neutral'),
      ],
      d9Asc: 2,
      d9: [
        g('Ve', 12, 'exalted'),
        g('Ju', 4, 'exalted'),
        g('Mo', 2, 'own'),
        g('Ma', 8, 'own'),
        g('Sa', 11, 'own'),
        g('Su', 1, 'exalted'),
        g('Me', 6, 'own'),
      ],
    }))!
    const pillars = reading.pillars.find(n => n.id === 'class-pillars')!
    expect(pillars.detail).toMatch(/Venus is exalted, at its strongest/)
    expect(pillars.detail).toMatch(/Jupiter is exalted, at its strongest/)
    expect(pillars.detail).toMatch(/deeper chart holds it/)
    expect(pillars.detail).toMatch(/Attraction \(Venus\) reaches the marriage and holds/)
    expect(pillars.detail).toMatch(/Protection \(Jupiter\) reaches the marriage and holds/)
    expect(prose(reading)).not.toMatch(/Mars is in its own sign/)
    expect(prose(reading)).toMatch(/Saturn is in its own sign/)
    expect(ids(reading)).toContain('class-strength')
  })

  it('does not keep a strong birth-chart Venus when the Navamsha is weak', () => {
    const reading = analyzeMarriageClass(chart({
      asc: 1,
      grahas: [
        g('Ve', 7, 'exalted'),
        g('Ju', 7, 'own'),
        g('Mo', 11, 'own'),
        g('Ma', 5),
      ],
      d9Asc: 2,
      d9: [
        g('Ve', 6, 'debilitated'),
        g('Ju', 10, 'debilitated'),
        g('Mo', 8, 'enemy'),
      ],
    }))!
    const pillars = reading.pillars.find(n => n.id === 'class-pillars')!
    expect(pillars.detail).toMatch(/Attraction \(Venus\) reaches the marriage and does not hold/)
    expect(pillars.detail).toMatch(/that strength does not hold underneath/)
    expect(pillars.detail).toMatch(/Jupiter is fallen, at its weakest/)
  })

  it('states the field of many bonds for the chart’s own gender', () => {
    const reading = analyzeMarriageClass(chart({
      asc: 6,
      gender: 'male',
      grahas: [
        g('Ve', 3, 'friend'),
        g('Me', 6, 'own'),
        g('Ju', 4, 'exalted'),
        g('Mo', 2),
        g('Ma', 1, 'own'),
        g('Sa', 11),
        g('Ra', 8),
        g('Ke', 2),
      ],
    }))!
    expect(reading.flags.pattern).toBe('many')
    expect(prose(reading)).toMatch(/In this chart the field is women/)
    expect(prose(reading)).not.toMatch(/woman’s chart/)
  })

  it('reads a strained marriage lord with a strong Navamsha Venus as the first account', () => {
    const reading = analyzeMarriageClass(chart({
      asc: 4,
      grahas: [
        g('Sa', 1, 'debilitated'),
        g('Ve', 2, 'own'),
        g('Mo', 4, 'own'),
        g('Ma', 5),
        g('Ju', 9),
      ],
      d9Asc: 2,
      d9: [
        g('Ve', 2, 'own'),
        g('Ma', 4, 'debilitated'),
      ],
    }))!
    expect(reading.flags.pattern).not.toBe('divorce')
    expect(reading.flags.pattern).not.toBe('second')
    expect(ids(reading)).toContain('class-karmic-first')
    expect(ids(reading)).not.toContain('class-one-break')
    expect(prose(reading)).not.toMatch(/100%|guaranteed|death/i)
  })

  it('decodes the Moon when Cancer is the 7th', () => {
    const reading = analyzeMarriageClass(chart({
      asc: 10,
      grahas: [
        g('Mo', 4, 'own', { nakshatraIndex: 7, isWaxingMoon: true }),
        g('Sa', 10, 'own'),
        g('Ve', 7, 'own'),
      ],
    }))!
    expect(ids(reading)).toContain('class-moon-is-lord')
    const note = reading.navamsha.find(n => n.id === 'class-moon-is-lord')!
    expect(note.detail).toMatch(/Cancer/)
    expect(note.detail).toMatch(/Pushya/)
    expect(note.detail).toMatch(/waxing/)
    expect(note.detail).toMatch(/Saturn/)
  })
})
