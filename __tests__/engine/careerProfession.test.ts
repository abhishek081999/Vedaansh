import { describe, it, expect } from 'vitest'
import type { ChartOutput, Dignity, DashaNode, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { analyzeCareerProfession } from '@/lib/engine/careerProfession'

function g(
  id: GrahaId,
  rashi: Rashi,
  dignity: Dignity = 'neutral',
  extra: Partial<GrahaData> = {},
): GrahaData {
  return {
    id,
    rashi,
    dignity,
    isCombust: false,
    isRetro: false,
    name: id,
    nakshatraIndex: extra.nakshatraIndex ?? 0,
    pada: extra.pada ?? 1,
    ...extra,
  } as GrahaData
}

function chart(opts: {
  asc: Rashi
  grahas: GrahaData[]
  d9?: GrahaData[]
  d9Asc?: Rashi
  d10?: GrahaData[]
  d10Asc?: Rashi
  a10?: Rashi
  amk?: GrahaId
  dashaLord?: GrahaId
}): ChartOutput {
  const maha: DashaNode = {
    lord: opts.dashaLord ?? 'Sa',
    start: new Date('2024-01-01T00:00:00Z'),
    end: new Date('2030-01-01T00:00:00Z'),
    durationMs: 1,
    level: 1,
    isCurrent: false,
    children: [{
      lord: 'Me',
      start: new Date('2026-01-01T00:00:00Z'),
      end: new Date('2027-06-01T00:00:00Z'),
      durationMs: 1,
      level: 2,
      isCurrent: false,
      children: [],
    }],
  }
  return {
    meta: { name: 'Test', gender: 'male' },
    grahas: opts.grahas,
    lagnas: { ascRashi: opts.asc },
    vargas: {
      ...(opts.d9 ? { D9: opts.d9 } : {}),
      ...(opts.d10 ? { D10: opts.d10 } : {}),
    },
    vargaLagnas: {
      ...(opts.d9Asc ? { D9: opts.d9Asc } : {}),
      ...(opts.d10Asc ? { D10: opts.d10Asc } : {}),
    },
    dashas: { vimshottari: [maha] },
    arudhas: opts.a10 ? { A10: opts.a10 } : {},
    karakas: opts.amk ? { AmK: opts.amk } : {},
  } as unknown as ChartOutput
}

const AS_OF = new Date('2026-10-23T12:00:00Z')

/** Aries: Saturn (10th lord) own in Capricorn, quiet companions. */
function serviceChart() {
  return chart({
    asc: 1,
    amk: 'Sa',
    a10: 10,
    d10Asc: 10,
    d10: [g('Sa', 10, 'own')],
    d9Asc: 10,
    d9: [g('Sa', 10, 'own')],
    grahas: [
      g('Su', 5, 'own'),
      g('Mo', 4, 'own'),
      g('Ma', 8, 'own'),
      g('Me', 4, 'friend'),
      g('Ju', 9, 'own'),
      g('Ve', 2, 'own'),
      g('Sa', 10, 'own'),
      g('Ra', 11),
      g('Ke', 5),
    ],
  })
}

describe('analyzeCareerProfession', () => {
  it('returns null without an ascendant', () => {
    expect(analyzeCareerProfession({ grahas: [], lagnas: {} } as unknown as ChartOutput)).toBeNull()
  })

  it('reads a dignified 10th lord in the 10th as service, with five scores', () => {
    const reading = analyzeCareerProfession(serviceChart(), AS_OF)
    expect(reading).not.toBeNull()
    expect(reading!.scores).toHaveLength(5)
    expect(reading!.scores.every(s => s.score >= 0 && s.score <= 10)).toBe(true)
    expect(reading!.track.id).toBe('service')
    expect(reading!.headline).toContain('Capricorn')
    expect(reading!.yogas.map(y => y.id)).toContain('tenth-lord-strong')
    expect(reading!.yogas.map(y => y.id)).toContain('vargottama')
    expect(reading!.a10?.signName).toBe('Capricorn')
    expect(reading!.dashamsha?.tone).toBe('supportive')
    expect(reading!.navamsha?.tone).toBe('supportive')
    expect(reading!.timing.some(w => w.live)).toBe(true)
    expect(reading!.fields.length).toBeGreaterThan(0)
    expect(reading!.brief.plain).toContain('Verdict')
    expect(reading!.significators.map(s => s.id)).toEqual(
      expect.arrayContaining(['tenth', 'tenthLord', 'sun', 'saturn', 'mercury', 'amk']),
    )
  })

  it('names business when the 10th lord is in the 7th and Amala holds the 10th', () => {
    const reading = analyzeCareerProfession(chart({
      asc: 4,
      grahas: [
        g('Su', 5, 'own'),
        g('Mo', 4, 'own'),
        g('Ma', 10, 'exalted'),
        g('Me', 3, 'own'),
        g('Ju', 12, 'own'),
        g('Ve', 1, 'neutral'),
        g('Sa', 11, 'own'),
        g('Ra', 8),
        g('Ke', 2),
      ],
    }), AS_OF)
    expect(reading!.track.id).toBe('business')
    expect(reading!.yogas.map(y => y.id)).toContain('amala')
    expect(reading!.foreign.active).toBe(false)
  })

  it('activates foreign work when the 10th lord is in the 12th', () => {
    const reading = analyzeCareerProfession(chart({
      asc: 1,
      grahas: [
        g('Sa', 12, 'neutral'),
        g('Su', 5, 'own'),
        g('Mo', 4, 'own'),
        g('Ma', 8, 'own'),
        g('Me', 4, 'friend'),
        g('Ju', 9, 'own'),
        g('Ve', 2, 'own'),
        g('Ra', 11),
        g('Ke', 5),
      ],
    }), AS_OF)
    expect(reading!.foreign.active).toBe(true)
    expect(reading!.foreign.factors.some(f => f.includes('12th'))).toBe(true)
  })

  it('marks Dharma-Karmadhipati when the 9th and 10th lords conjoin', () => {
    const reading = analyzeCareerProfession(chart({
      asc: 1,
      grahas: [
        g('Ju', 9, 'own'),
        g('Sa', 9, 'neutral'),
        g('Su', 5, 'own'),
        g('Mo', 4, 'own'),
        g('Ma', 8, 'own'),
        g('Me', 4, 'friend'),
        g('Ve', 2, 'own'),
        g('Ra', 11),
        g('Ke', 5),
      ],
    }), AS_OF)
    expect(reading!.yogas.map(y => y.id)).toContain('dharma-karma')
  })

  it('cancels a debilitated 10th lord when the exaltation lord is in a kendra', () => {
    const reading = analyzeCareerProfession(chart({
      asc: 4,
      grahas: [
        g('Ma', 4, 'debilitated'),
        g('Sa', 10, 'own'),
        g('Mo', 8, 'debilitated'),
        g('Su', 5, 'own'),
        g('Me', 3, 'own'),
        g('Ju', 12, 'own'),
        g('Ve', 2, 'own'),
        g('Ra', 6),
        g('Ke', 12),
      ],
    }), AS_OF)
    expect(reading!.yogas.map(y => y.id)).toContain('neecha-bhanga')
  })

  it('reads Sun and Saturn together in the 10th as digbala with a hybrid track', () => {
    const reading = analyzeCareerProfession(chart({
      asc: 1,
      grahas: [
        g('Su', 10, 'enemy'),
        g('Sa', 10, 'own'),
        g('Mo', 4, 'own'),
        g('Ma', 8, 'own'),
        g('Me', 4, 'friend'),
        g('Ju', 9, 'own'),
        g('Ve', 2, 'own'),
        g('Ra', 11),
        g('Ke', 5),
      ],
    }), AS_OF)
    const ids = reading!.yogas.map(y => y.id)
    expect(ids).toContain('digbala-sun')
    expect(ids).toContain('sun-saturn')
    expect(reading!.track.id).toBe('hybrid')
  })
})
