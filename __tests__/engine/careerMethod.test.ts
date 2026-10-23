import { describe, it, expect } from 'vitest'
import type { ChartOutput, Dignity, DashaNode, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { analyzeCareerMethod } from '@/lib/engine/careerMethod'

function g(id: GrahaId, rashi: Rashi, dignity: Dignity = 'neutral', extra: Partial<GrahaData> = {}): GrahaData {
  return {
    id, rashi, dignity, isCombust: false, isRetro: false, name: id,
    nakshatraIndex: extra.nakshatraIndex ?? 0, pada: extra.pada ?? 1, ...extra,
  } as GrahaData
}

function chart(opts: {
  asc: Rashi
  grahas: GrahaData[]
  d10?: GrahaData[]
  d10Asc?: Rashi
  d9?: GrahaData[]
  d9Asc?: Rashi
  dashaLord?: GrahaId
  antarLord?: GrahaId
  sav?: number[]
  birthDate?: string
}): ChartOutput {
  const maha: DashaNode = {
    lord: opts.dashaLord ?? 'Me',
    start: new Date('2024-01-01T00:00:00Z'),
    end: new Date('2030-01-01T00:00:00Z'),
    durationMs: 1,
    level: 1,
    isCurrent: false,
    children: opts.antarLord ? [{
      lord: opts.antarLord,
      start: new Date('2024-01-01T00:00:00Z'),
      end: new Date('2030-01-01T00:00:00Z'),
      durationMs: 1,
      level: 2,
      isCurrent: false,
      children: [],
    }] : [],
  }
  return {
    grahas: opts.grahas,
    lagnas: { ascRashi: opts.asc },
    vargas: { ...(opts.d10 ? { D10: opts.d10 } : {}), ...(opts.d9 ? { D9: opts.d9 } : {}) },
    vargaLagnas: { ...(opts.d10Asc ? { D10: opts.d10Asc } : {}), ...(opts.d9Asc ? { D9: opts.d9Asc } : {}) },
    dashas: { vimshottari: [maha] },
    ...(opts.sav ? { ashtakavarga: { sav: opts.sav, savTotal: opts.sav.reduce((sum, n) => sum + n, 0), bav: {} } } : {}),
    ...(opts.birthDate ? { meta: { birthDate: opts.birthDate } } : {}),
  } as unknown as ChartOutput
}

const AS_OF = new Date('2026-10-23T12:00:00Z')

describe('analyzeCareerMethod', () => {
  it('returns null without an ascendant', () => {
    expect(analyzeCareerMethod({ grahas: [], lagnas: {} } as unknown as ChartOutput)).toBeNull()
  })

  it('reads a 10th lord in the 6th and Saturn in the 10th as a job', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Sa', 10, 'own'),
        g('Me', 6, 'neutral'),
        g('Su', 5, 'own'),
        g('Mo', 4, 'own'),
        g('Ma', 8, 'own'),
        g('Ju', 9, 'own'),
        g('Ve', 2, 'own'),
        g('Ra', 11),
        g('Ke', 5),
      ],
    }), AS_OF)
    expect(reading!.questions.find(q => q.id === 'type')!.answer).toMatch(/Job/)
    expect(reading!.structure.map(h => h.house)).toEqual([1, 6, 7, 10, 11])
    expect(reading!.support).toHaveLength(7)
    expect(reading!.steps).toHaveLength(7)
    expect(reading!.factors.map(f => f.id)).toEqual(['mindset', 'decision', 'timing'])
  })

  it('names a partnership when the 10th lord is in the 7th with Venus and Mercury', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 4,
      grahas: [
        g('Ma', 10, 'exalted'),
        g('Me', 10, 'neutral'),
        g('Ve', 10, 'neutral'),
        g('Su', 5, 'own'),
        g('Mo', 4, 'own'),
        g('Ju', 12, 'own'),
        g('Sa', 11, 'own'),
        g('Ra', 8),
        g('Ke', 2),
      ],
    }), AS_OF)
    const type = reading!.questions.find(q => q.id === 'type')!
    expect(type.answer).toMatch(/Partnership|Business|Mixed/)
    expect(reading!.combinations.map(c => c.id)).toContain('ve-me')
  })

  it('flags Ketu in the 10th as a break in the path', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 4,
      grahas: [
        g('Ke', 1),
        g('Ra', 7),
        g('Ma', 2, 'neutral'),
        g('Su', 5, 'own'),
        g('Mo', 4, 'own'),
        g('Me', 3, 'own'),
        g('Ju', 12, 'own'),
        g('Ve', 2, 'own'),
        g('Sa', 11, 'own'),
      ],
    }), AS_OF)
    expect(reading!.questions.find(q => q.id === 'direction')!.detail).toMatch(/Ketu in the 10th/)
  })

  it('opens medicine when Mars is in the 6th and the 10th lord is in the 12th', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Ma', 6, 'friend'),
        g('Sa', 12, 'neutral'),
        g('Su', 5, 'own'),
        g('Mo', 4, 'own'),
        g('Me', 3, 'own'),
        g('Ju', 9, 'own'),
        g('Ve', 2, 'own'),
        g('Ra', 11),
        g('Ke', 5),
      ],
    }), AS_OF)
    expect(reading!.medical.active).toBe(true)
    expect(reading!.questions.find(q => q.id === 'environment')!.answer).toMatch(/distance|Foreign|curtain|elsewhere/i)
  })

  it('forms Mercury and Rahu as a technical combination', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Me', 3, 'own'),
        g('Ra', 3),
        g('Ke', 9),
        g('Sa', 10, 'own'),
        g('Su', 5, 'own'),
        g('Mo', 4, 'own'),
        g('Ma', 8, 'own'),
        g('Ju', 9, 'own'),
        g('Ve', 2, 'own'),
      ],
    }), AS_OF)
    expect(reading!.combinations.map(c => c.id)).toContain('me-ra')
    expect(reading!.modern.some(m => m.title === 'Technology')).toBe(true)
  })

  it('says the career is harder to sustain when D1 is strong and D10 is weak', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      d10Asc: 1,
      d10: [g('Sa', 4, 'debilitated')],
      grahas: [
        g('Sa', 10, 'own'),
        g('Su', 5, 'own'),
        g('Mo', 4, 'own'),
        g('Ma', 8, 'own'),
        g('Me', 3, 'own'),
        g('Ju', 9, 'own'),
        g('Ve', 2, 'own'),
        g('Ra', 11),
        g('Ke', 5),
      ],
    }), AS_OF)
    expect(reading!.d10.verdict).toMatch(/harder to sustain/)
  })

  it('names a large income when the 11th lord is exalted in the 11th', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 4,
      grahas: [
        g('Ve', 2, 'exalted'),
        g('Ma', 10, 'exalted'),
        g('Ju', 4, 'exalted'),
        g('Su', 5, 'own'),
        g('Mo', 2, 'own'),
        g('Me', 6, 'own'),
        g('Sa', 7, 'own'),
        g('Ra', 8),
        g('Ke', 2),
      ],
    }), AS_OF)
    expect(reading!.questions.find(q => q.id === 'income')!.answer).toMatch(/large|substantial/)
  })

  it('notes a weak Mars in the lagna as thinner ambition', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 4,
      grahas: [
        g('Ma', 4, 'debilitated'),
        g('Su', 5, 'own'),
        g('Mo', 8, 'debilitated'),
        g('Me', 3, 'own'),
        g('Ju', 12, 'own'),
        g('Ve', 2, 'own'),
        g('Sa', 10, 'own'),
        g('Ra', 6),
        g('Ke', 12),
      ],
    }), AS_OF)
    expect(reading!.questions.find(q => q.id === 'direction')!.detail).toMatch(/Mars is weak in the lagna/)
  })

  it('reads a permanent government seat when Sun, Mars, the 10th lord, and Saturn agree', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Su', 10, 'debilitated'),
        g('Sa', 10, 'own'),
        g('Ma', 6, 'neutral'),
        g('Me', 3, 'own'),
        g('Mo', 4, 'own'),
        g('Ju', 9, 'own'),
        g('Ve', 2, 'own'),
        g('Ra', 11),
        g('Ke', 5),
      ],
    }), AS_OF)
    const service = reading!.practice.notes.find(n => n.id === 'service')!
    expect(service.answer).toMatch(/Permanent government/)
    expect(service.reading).toMatch(/renewed/)
  })

  it('reads government work on contract when the 6th, 5th, and 2nd meet and Saturn does not lock it', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 4,
      grahas: [
        g('Su', 9, 'neutral'),
        g('Ma', 9, 'neutral'),
        g('Sa', 5, 'enemy'),
        g('Me', 3, 'own'),
        g('Mo', 4, 'own'),
        g('Ju', 12, 'own'),
        g('Ve', 7, 'own'),
        g('Ra', 11),
        g('Ke', 5),
      ],
    }), AS_OF)
    const service = reading!.practice.notes.find(n => n.id === 'service')!
    expect(service.answer).toMatch(/on contract/)
    expect(service.reading).toMatch(/Saturn in Leo/)
  })

  it('names repeated leaving when the 10th lord is in the 8th and the 6th lord sits with Rahu', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Sa', 8, 'neutral'),
        g('Me', 6, 'neutral'),
        g('Ra', 6),
        g('Su', 5, 'own'),
        g('Mo', 4, 'own'),
        g('Ma', 6, 'neutral'),
        g('Ju', 9, 'own'),
        g('Ve', 2, 'own'),
        g('Ke', 12),
      ],
    }), AS_OF)
    const changes = reading!.practice.notes.find(n => n.id === 'changes')!
    expect(changes.answer).toMatch(/More than one job/)
    expect(changes.reading).toMatch(/10th lord in the 8th/)
    expect(changes.reading).toMatch(/Rahu/)
    expect(changes.reading).toMatch(/competitive exam/)
  })

  it('ties stability to the father when the 9th lord is in the 10th', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Ju', 10, 'neutral'),
        g('Sa', 11, 'own'),
        g('Su', 2, 'neutral'),
        g('Mo', 4, 'own'),
        g('Ma', 8, 'own'),
        g('Me', 3, 'own'),
        g('Ve', 7, 'own'),
        g('Ra', 6),
        g('Ke', 12),
      ],
    }), AS_OF)
    expect(reading!.practice.notes.find(n => n.id === 'father')!.answer).toBe('Stability waits on the father.')
  })

  it('lets the career mature with the child when the 5th lord is in the 10th', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Su', 10, 'debilitated'),
        g('Sa', 11, 'own'),
        g('Ma', 8, 'own'),
        g('Me', 3, 'own'),
        g('Mo', 4, 'own'),
        g('Ju', 9, 'own'),
        g('Ve', 2, 'own'),
        g('Ra', 6),
        g('Ke', 12),
      ],
    }), AS_OF)
    expect(reading!.practice.notes.find(n => n.id === 'child')!.answer).toBe('The career matures with the child.')
    expect(reading!.practice.layers.map(l => l.title)).toEqual([
      'Direction', 'Survival', 'Consistency', 'Social contribution', 'Legacy',
    ])
    expect(reading!.practice.formula).toHaveLength(10)
  })

  it('reads effort, dissatisfaction, and a Ketu place when the 4th is under Mars and Rahu', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Mo', 3, 'neutral'),
        g('Ma', 4, 'neutral'),
        g('Ra', 4),
        g('Ke', 10),
        g('Su', 5, 'own'),
        g('Me', 6, 'own'),
        g('Ju', 9, 'own'),
        g('Ve', 2, 'own'),
        g('Sa', 11, 'own'),
      ],
    }), AS_OF)
    const property = reading!.practice.notes.find(n => n.id === 'property')!
    expect(property.answer).toMatch(/effort/)
    expect(property.reading).toMatch(/3rd/)
    expect(property.reading).toMatch(/dissatisfaction/)
    expect(property.reading).toMatch(/temple|elevated|upper/)
  })

  it('resets the first business when the 7th lord is in the 8th', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Ve', 8, 'neutral'),
        g('Sa', 10, 'own'),
        g('Su', 5, 'own'),
        g('Mo', 4, 'own'),
        g('Ma', 1, 'own'),
        g('Me', 3, 'own'),
        g('Ju', 9, 'own'),
        g('Ra', 11),
        g('Ke', 5),
      ],
    }), AS_OF)
    expect(reading!.practice.notes.find(n => n.id === 'venture')!.answer).toMatch(/first business/)
  })

  it('names a high-risk comeback when both career lords sit in the 8th with Mercury and Mars', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Ma', 8, 'own'),
        g('Sa', 8, 'neutral'),
        g('Me', 8, 'neutral'),
        g('Su', 5, 'own'),
        g('Mo', 4, 'own'),
        g('Ju', 9, 'own'),
        g('Ve', 2, 'own'),
        g('Ra', 11),
        g('Ke', 5),
      ],
    }), AS_OF)
    const collapse = reading!.practice.notes.find(n => n.id === 'collapse')!
    expect(collapse.answer).toMatch(/High risk/)
    expect(reading!.practice.lessons).toMatch(/birth chart/)
  })

  it('reads execution style from the sign, and the chain through the nakshatra lord', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 6,
      grahas: [
        g('Me', 8, 'neutral', { nakshatraIndex: 16 }),
        g('Su', 5, 'own'),
        g('Mo', 4, 'own'),
        g('Ma', 1, 'own'),
        g('Ju', 9, 'own'),
        g('Ve', 2, 'own'),
        g('Sa', 10, 'own'),
        g('Ra', 11),
        g('Ke', 5),
      ],
    }), AS_OF)
    const manner = reading!.system.style.find(n => n.id === 'manner')!
    const element = reading!.system.style.find(n => n.id === 'element')!
    const chain = reading!.system.notes.find(n => n.id === 'chain')!
    expect(element.answer).toMatch(/Air/)
    expect(manner.reading).toMatch(/secrecy|secret/)
    expect(chain.reading).toMatch(/Mars/)
    expect(chain.reading).toMatch(/Saturn/)
    expect(reading!.system.closing).toMatch(/manner/)
  })

  it('flags a clash when the lagna lord and the 10th lord are natural enemies together', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Ma', 10, 'exalted'),
        g('Sa', 10, 'own'),
        g('Mo', 4, 'own'),
        g('Su', 5, 'own'),
        g('Me', 3, 'own'),
        g('Ju', 9, 'own'),
        g('Ve', 2, 'own'),
        g('Ra', 11),
        g('Ke', 5),
      ],
    }), AS_OF)
    expect(reading!.system.notes.find(n => n.id === 'alignment')!.answer).toMatch(/clash/)
  })

  it('separates pay from satisfaction when the Moon is weak', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Mo', 8, 'debilitated'),
        g('Sa', 10, 'own'),
        g('Su', 5, 'own'),
        g('Ma', 1, 'own'),
        g('Me', 3, 'own'),
        g('Ju', 9, 'own'),
        g('Ve', 2, 'own'),
        g('Ra', 11),
        g('Ke', 5),
      ],
    }), AS_OF)
    expect(reading!.system.notes.find(n => n.id === 'satisfaction')!.answer).toMatch(/Satisfaction does not/)
  })

  it('names a strong yoga karaka for Capricorn', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 10,
      grahas: [
        g('Ve', 7, 'own'),
        g('Sa', 10, 'own'),
        g('Su', 5, 'own'),
        g('Mo', 4, 'own'),
        g('Ma', 1, 'own'),
        g('Me', 6, 'exalted'),
        g('Ju', 9, 'own'),
        g('Ra', 11),
        g('Ke', 5),
      ],
    }), AS_OF)
    expect(reading!.system.notes.find(n => n.id === 'yoga')!.answer).toMatch(/strong enough/)
  })

  it('opens a loss when the 6th, 8th, and 12th are all awake on the career', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Ma', 6, 'neutral'),
        g('Sa', 8, 'neutral'),
        g('Ju', 12, 'neutral'),
        g('Su', 5, 'own'),
        g('Mo', 4, 'own'),
        g('Me', 3, 'own'),
        g('Ve', 2, 'own'),
        g('Ra', 11),
        g('Ke', 5),
      ],
    }), AS_OF)
    expect(reading!.system.notes.find(n => n.id === 'loss')!.answer).toMatch(/6th, 8th, and 12th/)
  })

  it('adds a second stream from the dasha lord', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      dashaLord: 'Ju',
      grahas: [
        g('Ju', 9, 'own'),
        g('Sa', 10, 'own'),
        g('Su', 5, 'own'),
        g('Mo', 4, 'own'),
        g('Ma', 1, 'own'),
        g('Me', 3, 'own'),
        g('Ve', 2, 'own'),
        g('Ra', 11),
        g('Ke', 5),
      ],
    }), AS_OF)
    expect(reading!.system.notes.find(n => n.id === 'second')!.answer).toMatch(/Jupiter adds a second stream/)
  })

  it('lets the 5th finish a degree and keeps a weak 9th from a long specialization', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Su', 5, 'own'),
        g('Ju', 10, 'debilitated'),
        g('Sa', 11, 'own'),
        g('Mo', 4, 'own'),
        g('Ma', 1, 'own'),
        g('Me', 3, 'own'),
        g('Ve', 2, 'own'),
        g('Ra', 6),
        g('Ke', 12),
      ],
    }), AS_OF)
    expect(reading!.study.notes.find(n => n.id === 'root')!.answer).toMatch(/degree/)
    expect(reading!.study.notes.find(n => n.id === 'root')!.answer).toMatch(/specialization is not held/)
    expect(reading!.study.closing).toMatch(/5th is the root/)
  })

  it('opens study away from home when the 9th lord is in the 12th', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Ju', 12, 'own'),
        g('Sa', 10, 'own'),
        g('Su', 5, 'own'),
        g('Mo', 4, 'own'),
        g('Ma', 1, 'own'),
        g('Me', 3, 'own'),
        g('Ve', 2, 'own'),
        g('Ra', 11),
        g('Ke', 5),
      ],
    }), AS_OF)
    expect(reading!.study.notes.find(n => n.id === 'foreign')!.answer).toMatch(/away from the birthplace/)
  })

  it('puts the struggle on finishing when Mercury is retrograde on the 5th', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Me', 5, 'neutral', { isRetro: true }),
        g('Su', 2, 'neutral'),
        g('Sa', 10, 'own'),
        g('Mo', 4, 'own'),
        g('Ma', 1, 'own'),
        g('Ju', 9, 'own'),
        g('Ve', 7, 'own'),
        g('Ra', 11),
        g('Ke', 5),
      ],
    }), AS_OF)
    expect(reading!.study.notes.find(n => n.id === 'finish')!.answer).toMatch(/finishing/)
  })

  it('breaks a straight paternal line when the 10th lord is in the 8th, and keeps both of Saturn’s houses live', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      dashaLord: 'Sa',
      grahas: [
        g('Sa', 8, 'neutral'),
        g('Su', 5, 'own'),
        g('Mo', 4, 'own'),
        g('Ma', 1, 'own'),
        g('Me', 3, 'own'),
        g('Ju', 9, 'own'),
        g('Ve', 2, 'own'),
        g('Ra', 11),
        g('Ke', 6),
      ],
    }), AS_OF)
    expect(reading!.pattern.notes.find(n => n.id === 'lineage')!.answer).toMatch(/breaks/)
    expect(reading!.pattern.notes.find(n => n.id === 'themes')!.reading).toMatch(/parallel|together|not a sequence/)
    expect(reading!.pattern.notes.find(n => n.id === 'visible')!.answer).toMatch(/internal/)
    expect(reading!.pattern.notes.find(n => n.id === 'phase')!.answer).toMatch(/break|entry|peak|growth/)
    expect(reading!.pattern.closing).toMatch(/pattern of the karma/)
  })

  it('names the 5th and 9th from the 10th lord as the energy channel', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      dashaLord: 'Sa',
      grahas: [
        g('Sa', 10, 'own'),
        g('Su', 5, 'own'),
        g('Mo', 4, 'own'),
        g('Ma', 1, 'own'),
        g('Me', 3, 'own'),
        g('Ju', 9, 'own'),
        g('Ve', 2, 'own'),
        g('Ra', 11),
        g('Ke', 5),
      ],
    }), AS_OF)
    const channel = reading!.pattern.notes.find(n => n.id === 'channel')!
    expect(channel.answer).toMatch(/Taurus/)
    expect(channel.answer).toMatch(/Virgo/)
    expect(reading!.pattern.notes.find(n => n.id === 'phase')!.answer).toMatch(/peak/)
  })

  it('names dharma when the lagna lord and the 10th lord are both in the 9th', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 6,
      grahas: [
        g('Me', 2, 'own'),
        g('Su', 5, 'own'),
        g('Mo', 4, 'own'),
        g('Ma', 1, 'own'),
        g('Ju', 9, 'own'),
        g('Ve', 7, 'own'),
        g('Sa', 10, 'own'),
        g('Ra', 11),
        g('Ke', 3),
      ],
    }), AS_OF)
    expect(reading!.kshetra.notes.find(n => n.id === 'field')!.answer).toMatch(/dharma/)
    expect(reading!.kshetra.closing).toMatch(/field of karma/)
  })

  it('names protective service when the lagna lord and the 10th lord exchange and Jupiter is in the 6th', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Ma', 10, 'exalted'),
        g('Sa', 1, 'debilitated'),
        g('Ju', 6, 'neutral'),
        g('Su', 5, 'own'),
        g('Mo', 4, 'own'),
        g('Me', 3, 'own'),
        g('Ve', 2, 'own'),
        g('Ra', 11),
        g('Ke', 5),
      ],
    }), AS_OF)
    const field = reading!.kshetra.notes.find(n => n.id === 'field')!
    expect(field.answer).toMatch(/protective service/)
    expect(field.reading).toMatch(/exchanged/)
  })

  it('ties marriage to the career when the 7th lord is in the 10th', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Ve', 10, 'neutral'),
        g('Sa', 11, 'own'),
        g('Su', 5, 'own'),
        g('Mo', 4, 'own'),
        g('Ma', 8, 'own'),
        g('Me', 3, 'own'),
        g('Ju', 9, 'own'),
        g('Ra', 6),
        g('Ke', 12),
      ],
    }), AS_OF)
    expect(reading!.kshetra.notes.find(n => n.id === 'contracts')!.answer).toMatch(/Marriage/)
  })

  it('reads a teacher’s line when Saturn and Jupiter are bound and Ketu is in the lagna', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Ju', 9, 'own'),
        g('Sa', 9, 'neutral'),
        g('Ke', 1),
        g('Ma', 1, 'own'),
        g('Su', 5, 'own'),
        g('Mo', 4, 'own'),
        g('Me', 3, 'own'),
        g('Ve', 2, 'own'),
        g('Ra', 7),
      ],
    }), AS_OF)
    expect(reading!.kshetra.notes.find(n => n.id === 'renounce')!.answer).toMatch(/teacher/)
  })

  it('lets the Sun on the Dashamsha lagna give the seat authority only after the birth chart', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      d10Asc: 5,
      d10: [g('Su', 5, 'own'), g('Me', 3, 'own')],
      grahas: [
        g('Sa', 10, 'own'),
        g('Su', 5, 'own'),
        g('Mo', 4, 'own'),
        g('Ma', 1, 'own'),
        g('Me', 3, 'own'),
        g('Ju', 9, 'own'),
        g('Ve', 2, 'own'),
        g('Ra', 11),
        g('Ke', 5),
      ],
    }), AS_OF)
    const voice = reading!.kshetra.notes.find(n => n.id === 'd10voice')!
    expect(voice.answer).toMatch(/Sun/)
    expect(voice.reading).toMatch(/personal authority/)
    expect(voice.reading).toMatch(/after the birth-chart field/)
  })

  it('reads an earth Mercury on the 10th as analysis, and names the nakshatra of that lord', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 6,
      grahas: [
        g('Me', 10, 'neutral', { nakshatraIndex: 20 }),
        g('Ve', 2, 'own'),
        g('Su', 5, 'own'),
        g('Mo', 4, 'own'),
        g('Ma', 1, 'own'),
        g('Ju', 9, 'own'),
        g('Sa', 11, 'own'),
        g('Ra', 3),
        g('Ke', 9),
      ],
    }), AS_OF)
    const sequence = reading!.profile.notes.find(n => n.id === 'sequence')!
    expect(sequence.answer).toMatch(/Mercury/)
    expect(sequence.answer).toMatch(/earth/)
    expect(reading!.profile.notes.find(n => n.id === 'mercury')!.answer).toMatch(/analytical/)
    expect(reading!.profile.closing).toMatch(/field, then the sector, then this profile/)
  })

  it('pulls Mercury toward a craft when the 10th lord sits in the 6th', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 6,
      grahas: [
        g('Me', 11, 'neutral', { nakshatraIndex: 9 }),
        g('Ve', 7, 'own'),
        g('Su', 5, 'own'),
        g('Mo', 4, 'own'),
        g('Ma', 1, 'own'),
        g('Ju', 9, 'own'),
        g('Sa', 10, 'own'),
        g('Ra', 3),
        g('Ke', 9),
      ],
    }), AS_OF)
    expect(reading!.profile.notes.find(n => n.id === 'mercury')!.answer).toMatch(/not pure analysis/)
    expect(reading!.profile.notes.find(n => n.id === 'sequence')!.reading).toMatch(/research/)
  })

  it('allows a protocol uniform only when Saturn touches the 6th and the 10th', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Sa', 6, 'neutral'),
        g('Su', 5, 'own'),
        g('Mo', 4, 'own'),
        g('Ma', 8, 'own'),
        g('Me', 3, 'own'),
        g('Ju', 9, 'own'),
        g('Ve', 2, 'own'),
        g('Ra', 11),
        g('Ke', 5),
      ],
    }), AS_OF)
    expect(reading!.profile.notes.find(n => n.id === 'uniform')!.answer).toMatch(/protocol uniform/)
  })

  it('finds the craft in the 2nd when Venus and Mercury are not joined', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Ve', 2, 'own'),
        g('Me', 3, 'own'),
        g('Sa', 10, 'own'),
        g('Su', 5, 'own'),
        g('Mo', 4, 'own'),
        g('Ma', 8, 'own'),
        g('Ju', 9, 'own'),
        g('Ra', 11),
        g('Ke', 5),
      ],
    }), AS_OF)
    expect(reading!.profile.notes.find(n => n.id === 'craft')!.answer).toMatch(/2nd/)
  })

  it('keeps side channels behind the field when Rahu is in the 3rd and the Moon is in the 5th', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Ra', 3),
        g('Mo', 5, 'own'),
        g('Sa', 10, 'own'),
        g('Su', 2, 'neutral'),
        g('Ma', 8, 'own'),
        g('Me', 6, 'own'),
        g('Ju', 9, 'own'),
        g('Ve', 7, 'own'),
        g('Ke', 9),
      ],
    }), AS_OF)
    expect(reading!.profile.notes.find(n => n.id === 'streams')!.answer).toMatch(/Name the field first/)
  })

  it('asks for a move when the 4th lord is a maraka and the dasha sits in the 8th', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 12,
      dashaLord: 'Me',
      grahas: [
        g('Me', 7, 'neutral'),
        g('Ve', 2, 'own'),
        g('Su', 5, 'own'),
        g('Mo', 4, 'own'),
        g('Ma', 1, 'own'),
        g('Ju', 9, 'own'),
        g('Sa', 10, 'own'),
        g('Ra', 11),
        g('Ke', 5),
      ],
    }), AS_OF)
    expect(reading!.profile.notes.find(n => n.id === 'loss')!.answer).toMatch(/staying at home/)
  })

  it('reads renunciation when retrograde Jupiter is with Ketu and Saturn is in the 10th', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 11,
      grahas: [
        g('Sa', 8, 'neutral'),
        g('Ma', 3, 'neutral'),
        g('Ju', 9, 'own', { isRetro: true }),
        g('Ke', 9),
        g('Su', 5, 'own'),
        g('Mo', 4, 'own'),
        g('Me', 6, 'own'),
        g('Ve', 7, 'own'),
        g('Ra', 3),
      ],
    }), AS_OF)
    const sector = reading!.sector.notes.find(n => n.id === 'sector')!
    expect(sector.answer).toMatch(/renunciation/)
    expect(sector.reading).toMatch(/Spirituality is a karma/)
    expect(reading!.sector.closing).toMatch(/sector before the title/)
  })

  it('lets Mars start the work and withholds a long result when Saturn is weak', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Ma', 10, 'exalted'),
        g('Sa', 1, 'debilitated'),
        g('Ju', 5, 'own'),
        g('Ke', 11),
        g('Su', 2, 'neutral'),
        g('Mo', 4, 'own'),
        g('Me', 3, 'own'),
        g('Ve', 7, 'own'),
        g('Ra', 6),
      ],
    }), AS_OF)
    expect(reading!.sector.notes.find(n => n.id === 'finish')!.answer).toMatch(/not strong enough to promise that it lasts/)
  })

  it('keeps the father’s profession apart from the father’s backing', () => {
    const both = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Sa', 9, 'neutral'),
        g('Ju', 1, 'neutral'),
        g('Ma', 8, 'own'),
        g('Su', 5, 'own'),
        g('Mo', 4, 'own'),
        g('Me', 3, 'own'),
        g('Ve', 2, 'own'),
        g('Ra', 11),
        g('Ke', 5),
      ],
    }), AS_OF)
    expect(both!.sector.notes.find(n => n.id === 'fathers')!.answer).toMatch(/different yogas/)

    const backing = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Ju', 1, 'neutral'),
        g('Sa', 10, 'own'),
        g('Ma', 8, 'own'),
        g('Su', 5, 'own'),
        g('Mo', 4, 'own'),
        g('Me', 3, 'own'),
        g('Ve', 2, 'own'),
        g('Ra', 11),
        g('Ke', 5),
      ],
    }), AS_OF)
    expect(backing!.sector.notes.find(n => n.id === 'fathers')!.answer).toMatch(/not the same profession/)
  })

  it('ties the 3rd to the 10th without calling it music', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Me', 10, 'neutral'),
        g('Sa', 11, 'own'),
        g('Ma', 8, 'own'),
        g('Su', 5, 'own'),
        g('Mo', 4, 'own'),
        g('Ju', 9, 'own'),
        g('Ve', 2, 'own'),
        g('Ra', 6),
        g('Ke', 12),
      ],
    }), AS_OF)
    const rooms = reading!.sector.notes.find(n => n.id === 'rooms')!
    expect(rooms.answer).toMatch(/3/)
    expect(rooms.reading).toMatch(/not automatically music/)
  })

  it('confirms dharma in Navamsa when the 5th lord sits in the 9th there', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      d9Asc: 3,
      d9: [g('Su', 11, 'neutral')],
      grahas: [
        g('Su', 5, 'own'),
        g('Sa', 10, 'own'),
        g('Ma', 8, 'own'),
        g('Mo', 4, 'own'),
        g('Me', 3, 'own'),
        g('Ju', 9, 'own'),
        g('Ve', 2, 'own'),
        g('Ra', 11),
        g('Ke', 5),
      ],
    }), AS_OF)
    expect(reading!.sector.notes.find(n => n.id === 'navamsa')!.answer).toMatch(/5th lord in the 9th/)
  })

  it('confirms an eastern growth when the lagna, its sign, and the Sun agree, and sends comfort elsewhere', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      dashaLord: 'Su',
      grahas: [
        g('Su', 1, 'own'),
        g('Mo', 4, 'own', { nakshatraIndex: 15 }),
        g('Ma', 5, 'neutral'),
        g('Me', 6, 'own'),
        g('Ju', 9, 'own'),
        g('Ve', 7, 'own'),
        g('Sa', 8, 'neutral'),
        g('Ra', 5),
        g('Ke', 11),
      ],
    }), AS_OF)
    const growth = reading!.disha.notes.find(n => n.id === 'growth')!
    expect(growth.answer).toMatch(/confirmed toward the east/)
    expect(growth.reading).toMatch(/Go toward the growth/)
    expect(growth.reading).toMatch(/Vishakha/)
    expect(growth.reading).toMatch(/This period can carry/)
    expect(reading!.disha.notes.find(n => n.id === 'half')!.answer).toMatch(/relationship/)
    expect(reading!.disha.notes.find(n => n.id === 'cycle')!.answer).toMatch(/first earning is the 2nd/)
    expect(reading!.disha.closing).toMatch(/No city is named/)
  })

  it('leans to karma when the Sun’s half holds the planets', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Su', 10, 'neutral'),
        g('Mo', 10, 'neutral'),
        g('Ma', 10, 'exalted'),
        g('Me', 10, 'neutral'),
        g('Ju', 10, 'neutral'),
        g('Ve', 11, 'neutral'),
        g('Sa', 4, 'neutral'),
        g('Ra', 10),
        g('Ke', 4),
      ],
    }), AS_OF)
    expect(reading!.disha.notes.find(n => n.id === 'half')!.answer).toMatch(/leans to karma/)
  })

  it('reads a side income only when Mercury, Rahu, and Saturn agree', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Me', 6, 'own'),
        g('Ra', 6),
        g('Sa', 11, 'own'),
        g('Su', 5, 'own'),
        g('Mo', 4, 'own'),
        g('Ma', 8, 'own'),
        g('Ju', 9, 'own'),
        g('Ve', 2, 'own'),
        g('Ke', 12),
      ],
    }), AS_OF)
    expect(reading!.disha.notes.find(n => n.id === 'side')!.answer).toMatch(/side income/)
  })

  it('blocks handing over the front when Saturn aspects the Sun there', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Su', 1, 'own'),
        g('Sa', 7, 'exalted'),
        g('Mo', 4, 'own'),
        g('Ma', 8, 'own'),
        g('Me', 3, 'own'),
        g('Ju', 9, 'own'),
        g('Ve', 2, 'own'),
        g('Ra', 6),
        g('Ke', 12),
      ],
    }), AS_OF)
    expect(reading!.disha.notes.find(n => n.id === 'front')!.answer).toMatch(/hard to hand over/)
  })

  it('lets a strong Mars move before a weak Mercury has judged it', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Ma', 10, 'exalted'),
        g('Me', 12, 'debilitated'),
        g('Su', 5, 'own'),
        g('Mo', 4, 'own'),
        g('Ju', 9, 'own'),
        g('Ve', 2, 'own'),
        g('Sa', 11, 'own'),
        g('Ra', 6),
        g('Ke', 12),
      ],
    }), AS_OF)
    expect(reading!.pipeline.notes.find(n => n.id === 'chain')!.answer).toMatch(/fast and the judgment is thin/)
    expect(reading!.pipeline.closing).toMatch(/No single planet finishes/)
  })

  it('names a result without satisfaction when the Moon is weak and the Sun is strong', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Mo', 8, 'debilitated'),
        g('Su', 5, 'own'),
        g('Ma', 1, 'own'),
        g('Me', 3, 'own'),
        g('Ju', 9, 'own'),
        g('Ve', 7, 'own'),
        g('Sa', 10, 'own'),
        g('Ra', 6),
        g('Ke', 12),
      ],
    }), AS_OF)
    expect(reading!.pipeline.notes.find(n => n.id === 'chain')!.answer).toMatch(/without satisfaction/)
  })

  it('puts authority ahead of the system when the Sun is stronger on the work', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Su', 1, 'exalted'),
        g('Sa', 1, 'debilitated'),
        g('Mo', 4, 'own'),
        g('Ma', 8, 'own'),
        g('Me', 3, 'own'),
        g('Ju', 9, 'own'),
        g('Ve', 2, 'own'),
        g('Ra', 6),
        g('Ke', 12),
      ],
    }), AS_OF)
    expect(reading!.pipeline.notes.find(n => n.id === 'seat')!.answer).toMatch(/Authority sits ahead of the system/)
  })

  it('reads an initiating chart when the planets sit from the 12th through the 5th', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Su', 1, 'own'),
        g('Mo', 1, 'neutral'),
        g('Ma', 1, 'own'),
        g('Me', 1, 'neutral'),
        g('Ju', 1, 'neutral'),
        g('Ve', 1, 'neutral'),
        g('Sa', 1, 'debilitated', { nakshatraIndex: 20 }),
        g('Ra', 1),
        g('Ke', 7),
      ],
    }), AS_OF)
    const style = reading!.pipeline.notes.find(n => n.id === 'style')!
    expect(style.answer).toMatch(/initiates/)
    expect(style.answer).toMatch(/10th lord initiates/)
    expect(style.reading).toMatch(/not the Disha split/)
    expect(reading!.pipeline.notes.find(n => n.id === 'hemisphere')!.answer).toMatch(/private/)
    const control = reading!.pipeline.notes.find(n => n.id === 'control')!
    expect(control.answer).toMatch(/Mars/)
    expect(control.reading).toMatch(/Sun/)
  })

  it('lets a sub-period in the other half pull against the mahadasha', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      dashaLord: 'Su',
      antarLord: 'Sa',
      grahas: [
        g('Su', 1, 'own'),
        g('Sa', 10, 'own'),
        g('Mo', 4, 'own'),
        g('Ma', 8, 'own'),
        g('Me', 3, 'own'),
        g('Ju', 9, 'own'),
        g('Ve', 2, 'own'),
        g('Ra', 6),
        g('Ke', 12),
      ],
    }), AS_OF)
    expect(reading!.pipeline.notes.find(n => n.id === 'period')!.reading).toMatch(/pulls against/)
  })

  it('keeps the direction clear and the satisfaction absent when the Moon and the 10th lord are on opposite halves', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Mo', 4, 'own', { nakshatraIndex: 18 }),
        g('Sa', 10, 'own'),
        g('Su', 9, 'neutral'),
        g('Ma', 8, 'own'),
        g('Me', 7, 'own'),
        g('Ju', 6, 'neutral'),
        g('Ve', 2, 'own'),
        g('Ra', 11),
        g('Ke', 5),
      ],
    }), AS_OF)
    expect(reading!.counsel.notes.find(n => n.id === 'sides')!.answer).toMatch(/direction is clear and the satisfaction is not/)
    expect(reading!.counsel.notes.find(n => n.id === 'mind')!.reading).toMatch(/junction/)
    expect(reading!.counsel.closing).toMatch(/psychology first/)
  })

  it('allows satisfaction when the Moon and the 10th lord share the Sun’s half, and overthinking when a node joins the Moon', () => {
    const steady = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Mo', 10, 'neutral'),
        g('Sa', 10, 'own'),
        g('Su', 5, 'own'),
        g('Ma', 8, 'own'),
        g('Me', 3, 'own'),
        g('Ju', 9, 'own'),
        g('Ve', 2, 'own'),
        g('Ra', 6),
        g('Ke', 12),
      ],
    }), AS_OF)
    expect(steady!.counsel.notes.find(n => n.id === 'sides')!.answer).toMatch(/sit together/)

    const node = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Mo', 10, 'neutral'),
        g('Ke', 10),
        g('Sa', 10, 'own'),
        g('Su', 5, 'own'),
        g('Ma', 8, 'own'),
        g('Me', 3, 'own'),
        g('Ju', 9, 'own'),
        g('Ve', 2, 'own'),
        g('Ra', 4),
      ],
    }), AS_OF)
    expect(node!.counsel.notes.find(n => n.id === 'sides')!.answer).toMatch(/overthinking/)
    expect(node!.counsel.notes.find(n => n.id === 'mind')!.answer).toMatch(/not isolation/)
  })

  it('withholds a clear direction when the 10th lord is on the Moon’s half', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Sa', 4, 'neutral'),
        g('Mo', 10, 'neutral'),
        g('Su', 5, 'own'),
        g('Ma', 8, 'own'),
        g('Me', 3, 'own'),
        g('Ju', 9, 'own'),
        g('Ve', 2, 'own'),
        g('Ra', 6),
        g('Ke', 12),
      ],
    }), AS_OF)
    expect(reading!.counsel.notes.find(n => n.id === 'sides')!.answer).toMatch(/not clear/)
  })

  it('makes a charge hard to finish when the Moon and Mercury are both weak', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Mo', 8, 'debilitated'),
        g('Me', 12, 'debilitated'),
        g('Su', 5, 'own'),
        g('Ma', 1, 'own'),
        g('Ju', 9, 'own'),
        g('Ve', 2, 'own'),
        g('Sa', 10, 'own'),
        g('Ra', 6),
        g('Ke', 11),
      ],
    }), AS_OF)
    expect(reading!.counsel.notes.find(n => n.id === 'charge')!.answer).toMatch(/hard to finish/)
  })

  it('reads a change of city when the 4th lord is in the 10th', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Mo', 10, 'neutral'),
        g('Sa', 11, 'own'),
        g('Su', 5, 'own'),
        g('Ma', 8, 'own'),
        g('Me', 3, 'own'),
        g('Ju', 9, 'own'),
        g('Ve', 2, 'own'),
        g('Ra', 6),
        g('Ke', 12),
      ],
    }), AS_OF)
    expect(reading!.counsel.notes.find(n => n.id === 'service')!.reading).toMatch(/change of city/)
  })

  it('names an unhemmed Moon when neither neighbouring sign holds a planet', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Mo', 4, 'own'),
        g('Su', 6, 'neutral'),
        g('Ma', 7, 'neutral'),
        g('Me', 8, 'neutral'),
        g('Ju', 9, 'own'),
        g('Ve', 10, 'neutral'),
        g('Sa', 11, 'own'),
        g('Ra', 12),
        g('Ke', 6),
      ],
    }), AS_OF)
    expect(reading!.counsel.notes.find(n => n.id === 'mind')!.answer).toMatch(/no planet on either side/)
  })

  it('reads a foreign door as learning when the Sun and Mars both touch the home', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Su', 10, 'neutral'),
        g('Ma', 1, 'own'),
        g('Ju', 12, 'own'),
        g('Mo', 2, 'own'),
        g('Me', 3, 'own'),
        g('Ve', 7, 'own'),
        g('Sa', 6, 'neutral'),
        g('Ra', 8),
        g('Ke', 2),
      ],
    }), AS_OF)
    const stay = reading!.demand.notes.find(n => n.id === 'stay')!
    expect(stay.answer).toMatch(/not a settlement/)
    expect(stay.reading).toMatch(/not a settlement by themselves/)
  })

  it('does not ask about a stay abroad when the foreign houses are quiet', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Ju', 1, 'neutral'),
        g('Sa', 5, 'neutral'),
        g('Ra', 6),
        g('Su', 5, 'own'),
        g('Mo', 2, 'own'),
        g('Ma', 8, 'own'),
        g('Me', 3, 'own'),
        g('Ve', 7, 'own'),
        g('Ke', 12),
      ],
    }), AS_OF)
    expect(reading!.demand.notes.find(n => n.id === 'stay')!.answer).toMatch(/not the career question/)
  })

  it('lets a strong Saturn lengthen a stay without calling it a settlement', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Ra', 12),
        g('Mo', 8, 'neutral'),
        g('Su', 5, 'own'),
        g('Ma', 8, 'own'),
        g('Sa', 7, 'exalted'),
        g('Me', 3, 'own'),
        g('Ju', 6, 'neutral'),
        g('Ve', 2, 'own'),
        g('Ke', 6),
      ],
    }), AS_OF)
    expect(reading!.demand.notes.find(n => n.id === 'stay')!.answer).toMatch(/lengthen a stay/)
  })

  it('spends a primary business when the lagna lord is in the 12th', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Ma', 12, 'neutral'),
        g('Sa', 12, 'neutral'),
        g('Su', 5, 'own'),
        g('Mo', 2, 'own'),
        g('Me', 3, 'own'),
        g('Ju', 9, 'own'),
        g('Ve', 7, 'own'),
        g('Ra', 6),
        g('Ke', 11),
      ],
    }), AS_OF)
    expect(reading!.demand.notes.find(n => n.id === 'venture')!.answer).toMatch(/spends the effort/)
  })

  it('reads property income when the 2nd and the 4th both meet the 10th', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Ve', 10, 'neutral'),
        g('Mo', 10, 'neutral'),
        g('Sa', 11, 'own'),
        g('Su', 5, 'own'),
        g('Ma', 8, 'own'),
        g('Me', 3, 'own'),
        g('Ju', 9, 'own'),
        g('Ra', 6),
        g('Ke', 12),
      ],
    }), AS_OF)
    expect(reading!.demand.notes.find(n => n.id === 'property')!.answer).toMatch(/Property can be an income/)
  })

  it('keeps a public role local when the local houses outweigh the wider ones', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Su', 4, 'neutral'),
        g('Ra', 4),
        g('Ve', 2, 'own'),
        g('Me', 6, 'own'),
        g('Ma', 8, 'own'),
        g('Sa', 10, 'own'),
        g('Ju', 6, 'neutral'),
        g('Mo', 3, 'neutral'),
        g('Ke', 10),
      ],
    }), AS_OF)
    expect(reading!.demand.notes.find(n => n.id === 'reach')!.answer).toMatch(/stays local/)
    expect(reading!.demand.notes.find(n => n.id === 'reach')!.reading).toMatch(/not an election/)
  })

  it('lets a retrograde Jupiter on the 10th turn the direction back', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Ju', 10, 'neutral', { isRetro: true }),
        g('Ma', 7, 'own'),
        g('Su', 5, 'own'),
        g('Mo', 2, 'own'),
        g('Me', 3, 'own'),
        g('Ve', 7, 'own'),
        g('Sa', 11, 'own'),
        g('Ra', 6),
        g('Ke', 12),
      ],
    }), AS_OF)
    expect(reading!.demand.notes.find(n => n.id === 'turn')!.answer).toMatch(/turns the direction back/)
  })

  it('lets Mars in the private half plan more than it executes', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Ma', 6, 'own'),
        g('Ju', 9, 'own'),
        g('Su', 5, 'own'),
        g('Mo', 2, 'own'),
        g('Me', 3, 'own'),
        g('Ve', 7, 'own'),
        g('Sa', 11, 'own'),
        g('Ra', 8),
        g('Ke', 2),
      ],
    }), AS_OF)
    expect(reading!.demand.notes.find(n => n.id === 'turn')!.answer).toMatch(/plans the move/)
    expect(reading!.demand.notes.find(n => n.id === 'turn')!.reading).toMatch(/not a job title/)
  })

  it('reads the 10th sign as the manner and the 10th lord as the skill', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Sa', 10, 'own'),
        g('Su', 5, 'own'),
        g('Mo', 4, 'own'),
        g('Ma', 1, 'own'),
        g('Me', 3, 'own'),
        g('Ju', 9, 'own'),
        g('Ve', 2, 'own'),
        g('Ra', 6),
        g('Ke', 12),
      ],
    }), AS_OF)
    const three = reading!.pillars.notes.find(n => n.id === 'three')!
    expect(three.answer).toMatch(/Capricorn is the manner/)
    expect(three.answer).toMatch(/Saturn is the skill/)
    expect(three.reading).toMatch(/is a job title/)
    expect(reading!.pillars.closing).toMatch(/before the wish/)
  })

  it('supports a higher seat only when the 5th, the 10th, and the 11th meet', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Su', 10, 'own'),
        g('Sa', 10, 'own'),
        g('Mo', 4, 'own'),
        g('Ma', 1, 'own'),
        g('Me', 6, 'own'),
        g('Ju', 9, 'own'),
        g('Ve', 2, 'own'),
        g('Ra', 8),
        g('Ke', 2),
      ],
    }), AS_OF)
    expect(reading!.pillars.notes.find(n => n.id === 'links')!.answer).toMatch(/higher seat/)
    expect(reading!.pillars.notes.find(n => n.id === 'links')!.answer).toMatch(/not guaranteed/)
  })

  it('lets Rahu bend a Sun seat and keeps a quiet Rahu from bending it', () => {
    const bent = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Su', 10, 'own'),
        g('Ra', 10),
        g('Sa', 11, 'own'),
        g('Mo', 4, 'own'),
        g('Ma', 1, 'own'),
        g('Me', 3, 'own'),
        g('Ju', 9, 'own'),
        g('Ve', 2, 'own'),
        g('Ke', 4),
      ],
    }), AS_OF)
    expect(bent!.pillars.notes.find(n => n.id === 'bend')!.answer).toMatch(/bend the Sun/)

    const quiet = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Su', 5, 'own'),
        g('Ra', 8),
        g('Sa', 6, 'neutral'),
        g('Mo', 4, 'own'),
        g('Ma', 1, 'own'),
        g('Me', 3, 'own'),
        g('Ju', 9, 'own'),
        g('Ve', 2, 'own'),
        g('Ke', 2),
      ],
    }), AS_OF)
    expect(quiet!.pillars.notes.find(n => n.id === 'bend')!.answer).toMatch(/not bending/)
  })

  it('makes the lagna lord in the 11th less visible, and refuses a second business from Mercury alone', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Ma', 11, 'own'),
        g('Me', 11, 'own'),
        g('Sa', 1, 'neutral'),
        g('Su', 5, 'own'),
        g('Mo', 4, 'own'),
        g('Ju', 9, 'own'),
        g('Ve', 2, 'own'),
        g('Ra', 6),
        g('Ke', 12),
      ],
    }), AS_OF)
    expect(reading!.pillars.notes.find(n => n.id === 'links')!.reading).toMatch(/less visible/)
    expect(reading!.pillars.notes.find(n => n.id === 'sync')!.reading).toMatch(/not a second business/)
    expect(reading!.pillars.notes.find(n => n.id === 'sync')!.answer).toMatch(/not in sync/)
  })

  it('reads a rite only when Mercury, the career houses, and Venus on the 9th agree', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Me', 5, 'own'),
        g('Ve', 9, 'own'),
        g('Sa', 10, 'own'),
        g('Su', 1, 'own'),
        g('Mo', 4, 'own'),
        g('Ma', 8, 'own'),
        g('Ju', 3, 'neutral'),
        g('Ra', 6),
        g('Ke', 12),
      ],
    }), AS_OF)
    expect(reading!.pillars.notes.find(n => n.id === 'points')!.reading).toMatch(/Speech and a rite/)
    expect(reading!.pillars.notes.find(n => n.id === 'points')!.reading).toMatch(/not a temple post/)
    expect(reading!.pillars.notes.find(n => n.id === 'points')!.answer).toMatch(/not on this chart/)
  })

  it('uses Ashtakavarga points of the 6th, the 10th, and the 11th when they are present', () => {
    const sav = Array(12).fill(22)
    sav[5] = 32
    sav[9] = 20
    sav[10] = 36
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      sav,
      grahas: [
        g('Sa', 10, 'own'),
        g('Su', 5, 'own'),
        g('Mo', 4, 'own'),
        g('Ma', 1, 'own'),
        g('Me', 3, 'own'),
        g('Ju', 9, 'own'),
        g('Ve', 2, 'own'),
        g('Ra', 6),
        g('Ke', 12),
      ],
    }), AS_OF)
    const points = reading!.pillars.notes.find(n => n.id === 'points')!
    expect(points.answer).toMatch(/heavy workload/)
    expect(points.reading).toMatch(/gain can exceed/)
  })

  it('splits a hidden skill from the visible work when Ketu is on the 5th and the 5th misses the 10th', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Ke', 5),
        g('Su', 5, 'own'),
        g('Sa', 10, 'own'),
        g('Mo', 4, 'own'),
        g('Ma', 8, 'own'),
        g('Me', 6, 'neutral'),
        g('Ju', 3, 'neutral'),
        g('Ve', 2, 'own'),
        g('Ra', 11),
      ],
    }), AS_OF)
    expect(reading!.calling.notes.find(n => n.id === 'pair')!.answer).toMatch(/do not agree/)
  })

  it('names power only when the 5th, 9th, 10th, and 11th meet and the Sun sits with Saturn', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Su', 10, 'own'),
        g('Sa', 10, 'own'),
        g('Ju', 10, 'neutral'),
        g('Mo', 4, 'own'),
        g('Ma', 1, 'own'),
        g('Me', 6, 'own'),
        g('Ve', 2, 'own'),
        g('Ra', 8),
        g('Ke', 2),
      ],
    }), AS_OF)
    expect(reading!.calling.notes.find(n => n.id === 'kind')!.answer).toMatch(/calling is power/)
    expect(reading!.calling.notes.find(n => n.id === 'kind')!.reading).toMatch(/not power by itself|keep agreeing/)
  })

  it('reads an early direction when Rahu is on the 10th and power is not formed', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Ra', 10),
        g('Sa', 6, 'neutral'),
        g('Su', 5, 'neutral'),
        g('Mo', 4, 'own'),
        g('Ma', 8, 'own'),
        g('Me', 3, 'own'),
        g('Ju', 3, 'neutral'),
        g('Ve', 2, 'own'),
        g('Ke', 4),
      ],
    }), AS_OF)
    expect(reading!.calling.notes.find(n => n.id === 'kind')!.answer).toMatch(/known early/)
  })

  it('reads survival when the 6th lord is strong in the 6th and the other callings are quiet', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Me', 6, 'own'),
        g('Su', 8, 'debilitated'),
        g('Sa', 3, 'neutral'),
        g('Mo', 4, 'own'),
        g('Ma', 8, 'neutral'),
        g('Ju', 3, 'neutral'),
        g('Ve', 2, 'own'),
        g('Ra', 11),
        g('Ke', 5),
      ],
    }), AS_OF)
    expect(reading!.calling.notes.find(n => n.id === 'kind')!.answer).toMatch(/survival/)
  })

  it('takes a decision once when the Sun and Mars exchange signs', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Su', 1, 'exalted'),
        g('Ma', 5, 'neutral'),
        g('Sa', 10, 'own'),
        g('Mo', 4, 'own'),
        g('Me', 6, 'own'),
        g('Ju', 9, 'own'),
        g('Ve', 2, 'own'),
        g('Ra', 8),
        g('Ke', 2),
      ],
    }), AS_OF)
    expect(reading!.calling.notes.find(n => n.id === 'decide')!.answer).toMatch(/taken once/)
    expect(reading!.calling.notes.find(n => n.id === 'subject')!.answer).toMatch(/from the 2nd/)
    expect(reading!.calling.notes.find(n => n.id === 'subject')!.reading).toMatch(/Do not take the subject from the 5th/)
  })

  it('names a hidden gain when the 8th lord is strong in the 11th', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Ma', 11, 'own'),
        g('Sa', 3, 'neutral'),
        g('Su', 8, 'debilitated'),
        g('Mo', 4, 'own'),
        g('Me', 6, 'neutral'),
        g('Ju', 3, 'neutral'),
        g('Ve', 2, 'own'),
        g('Ra', 7),
        g('Ke', 1),
      ],
    }), AS_OF)
    expect(reading!.calling.notes.find(n => n.id === 'eighth')!.answer).toMatch(/hidden gain/)
    expect(reading!.calling.notes.find(n => n.id === 'eighth')!.reading).toMatch(/not a fortune/)
  })

  it('keeps the stream dasha when the period at age sixteen is still running', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      birthDate: '2010-01-01',
      grahas: [
        g('Sa', 10, 'own'),
        g('Su', 5, 'own'),
        g('Mo', 4, 'own'),
        g('Ma', 8, 'own'),
        g('Me', 3, 'own'),
        g('Ju', 9, 'own'),
        g('Ve', 2, 'own'),
        g('Ra', 6),
        g('Ke', 12),
      ],
    }), AS_OF)
    expect(reading!.calling.notes.find(n => n.id === 'subject')!.reading).toMatch(/still running/)
    expect(reading!.calling.notes.find(n => n.id === 'subject')!.reading).toMatch(/Siddhamsha is not on this chart/)
  })

  it('lets Siddhamsha support the subject when the 2nd lord is strong there', () => {
    const base = chart({
      asc: 1,
      grahas: [
        g('Ve', 2, 'own'),
        g('Sa', 10, 'own'),
        g('Su', 5, 'own'),
        g('Mo', 4, 'own'),
        g('Ma', 8, 'own'),
        g('Me', 3, 'own'),
        g('Ju', 9, 'own'),
        g('Ra', 6),
        g('Ke', 12),
      ],
    })
    base.vargas = { ...base.vargas, D24: [g('Ve', 2, 'own')] }
    base.vargaLagnas = { ...base.vargaLagnas, D24: 2 }
    const reading = analyzeCareerMethod(base, AS_OF)
    expect(reading!.calling.notes.find(n => n.id === 'subject')!.reading).toMatch(/Siddhamsha supports the subject/)
    expect(reading!.calling.closing).toMatch(/not a wish/)
  })

  it('reads accounts from Mercury with Jupiter, and refuses a technical stream from that pair', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Me', 3, 'own'),
        g('Ju', 3, 'neutral'),
        g('Sa', 10, 'own'),
        g('Su', 5, 'own'),
        g('Mo', 4, 'own'),
        g('Ma', 8, 'own'),
        g('Ve', 2, 'own'),
        g('Ra', 6),
        g('Ke', 12),
      ],
    }), AS_OF)
    const pair = reading!.streams.notes.find(n => n.id === 'pair')!
    expect(pair.answer).toMatch(/accounts, law, or finance/)
    expect(pair.reading).toMatch(/not a technical stream/)
  })

  it('reads a technical stream from Mercury with Mars', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Me', 1, 'neutral'),
        g('Ma', 1, 'own'),
        g('Sa', 10, 'neutral'),
        g('Su', 5, 'own'),
        g('Mo', 4, 'own'),
        g('Ju', 9, 'own'),
        g('Ve', 2, 'own'),
        g('Ra', 6),
        g('Ke', 12),
      ],
    }), AS_OF)
    expect(reading!.streams.notes.find(n => n.id === 'pair')!.answer).toMatch(/technical stream/)
  })

  it('lets Mercury and Saturn be a built design, and lets a strong Mars make it a building', () => {
    const design = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Me', 10, 'neutral'),
        g('Sa', 10, 'own'),
        g('Ma', 8, 'own'),
        g('Su', 5, 'own'),
        g('Mo', 4, 'own'),
        g('Ju', 9, 'own'),
        g('Ve', 2, 'own'),
        g('Ra', 6),
        g('Ke', 12),
      ],
    }), AS_OF)
    expect(design!.streams.notes.find(n => n.id === 'pair')!.answer).toMatch(/built design/)

    const build = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Me', 10, 'neutral'),
        g('Sa', 10, 'own'),
        g('Ma', 10, 'own'),
        g('Su', 5, 'own'),
        g('Mo', 4, 'own'),
        g('Ju', 9, 'own'),
        g('Ve', 2, 'own'),
        g('Ra', 6),
        g('Ke', 12),
      ],
    }), AS_OF)
    expect(build!.streams.notes.find(n => n.id === 'pair')!.answer).toMatch(/can build/)
  })

  it('stops construction when Saturn is weak inside the land trio', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Me', 1, 'neutral'),
        g('Sa', 1, 'debilitated'),
        g('Ma', 1, 'own'),
        g('Su', 5, 'own'),
        g('Mo', 4, 'own'),
        g('Ju', 9, 'own'),
        g('Ve', 2, 'own'),
        g('Ra', 6),
        g('Ke', 12),
      ],
    }), AS_OF)
    expect(reading!.streams.notes.find(n => n.id === 'pair')!.answer).toMatch(/Construction is not read/)
  })

  it('lets a strong Saturn away from the 6th, 8th, and 12th hold a service', () => {
    const held = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Sa', 5, 'own'),
        g('Me', 6, 'own'),
        g('Ma', 8, 'own'),
        g('Ju', 12, 'own'),
        g('Su', 5, 'own'),
        g('Mo', 4, 'own'),
        g('Ve', 2, 'own'),
        g('Ra', 3),
        g('Ke', 9),
      ],
    }), AS_OF)
    expect(held!.streams.notes.find(n => n.id === 'saturn')!.answer).toMatch(/hold a service/)

    const hard = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Sa', 6, 'own'),
        g('Me', 3, 'own'),
        g('Ma', 8, 'own'),
        g('Ju', 9, 'own'),
        g('Su', 5, 'own'),
        g('Mo', 4, 'own'),
        g('Ve', 2, 'own'),
        g('Ra', 11),
        g('Ke', 5),
      ],
    }), AS_OF)
    expect(hard!.streams.notes.find(n => n.id === 'saturn')!.answer).toMatch(/hard room/)
  })

  it('reads a commission when Jupiter is strong in the 2nd', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Ju', 2, 'own'),
        g('Sa', 10, 'neutral'),
        g('Me', 6, 'neutral'),
        g('Su', 5, 'own'),
        g('Mo', 4, 'own'),
        g('Ma', 8, 'own'),
        g('Ve', 7, 'own'),
        g('Ra', 11),
        g('Ke', 5),
      ],
    }), AS_OF)
    expect(reading!.streams.notes.find(n => n.id === 'commission')!.answer).toMatch(/commission/)
    expect(reading!.streams.notes.find(n => n.id === 'commission')!.reading).toMatch(/not a number/)
  })

  it('tells the person to take the job first when the 6th is louder and its period is running', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      dashaLord: 'Me',
      grahas: [
        g('Sa', 6, 'neutral'),
        g('Me', 6, 'own'),
        g('Su', 5, 'own'),
        g('Mo', 4, 'own'),
        g('Ma', 8, 'own'),
        g('Ju', 9, 'own'),
        g('Ve', 2, 'own'),
        g('Ra', 3),
        g('Ke', 9),
      ],
    }), AS_OF)
    expect(reading!.streams.notes.find(n => n.id === 'order')!.answer).toMatch(/job first/)
    expect(reading!.streams.notes.find(n => n.id === 'order')!.reading).toMatch(/not an instruction to borrow/)
  })

  it('reads a public rite only when Sun, Moon, Mars, and Rahu are one chain', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Su', 5, 'own'),
        g('Mo', 5, 'neutral'),
        g('Ma', 5, 'neutral'),
        g('Ra', 5),
        g('Me', 3, 'own'),
        g('Ju', 9, 'own'),
        g('Ve', 2, 'own'),
        g('Sa', 10, 'own'),
        g('Ke', 11),
      ],
    }), AS_OF)
    expect(reading!.streams.notes.find(n => n.id === 'pair')!.answer).toMatch(/public rite/)
    expect(reading!.streams.closing).toMatch(/not a planet taken from a list/)
  })

  it('reads a Deva nakshatra as building, and names the pada’s manner', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Sa', 10, 'own', { nakshatraIndex: 0, pada: 1 }),
        g('Mo', 4, 'own', { nakshatraIndex: 0, pada: 1 }),
        g('Ra', 6, 'neutral', { nakshatraIndex: 0, pada: 1 }),
        g('Su', 5, 'own'),
        g('Ma', 8, 'own'),
        g('Me', 3, 'own'),
        g('Ju', 9, 'own'),
        g('Ve', 2, 'own'),
        g('Ke', 12),
      ],
    }), AS_OF)
    const blueprint = reading!.gana.notes.find(n => n.id === 'blueprint')!
    expect(blueprint.answer).toMatch(/Ashwini is Deva gana/)
    expect(blueprint.reading).toMatch(/starts fast/)
    expect(blueprint.reading).toMatch(/action/)
    expect(blueprint.reading).toMatch(/not a job title/)
    expect(reading!.gana.notes.find(n => n.id === 'three')!.answer).toMatch(/share one group/)
  })

  it('reads Manushya as scattered aims and Rakshasa as holding too tightly', () => {
    const human = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Sa', 10, 'own', { nakshatraIndex: 1, pada: 2 }),
        g('Su', 5, 'own'),
        g('Mo', 4, 'own'),
        g('Ma', 8, 'own'),
        g('Me', 3, 'own'),
        g('Ju', 9, 'own'),
        g('Ve', 2, 'own'),
        g('Ra', 6),
        g('Ke', 12),
      ],
    }), AS_OF)
    expect(human!.gana.notes.find(n => n.id === 'blueprint')!.answer).toMatch(/Bharani is Manushya gana/)
    expect(human!.gana.notes.find(n => n.id === 'blueprint')!.reading).toMatch(/too many aims/)

    const power = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Sa', 10, 'own', { nakshatraIndex: 2, pada: 1 }),
        g('Su', 5, 'own'),
        g('Mo', 4, 'own'),
        g('Ma', 8, 'own'),
        g('Me', 3, 'own'),
        g('Ju', 9, 'own'),
        g('Ve', 2, 'own'),
        g('Ra', 6),
        g('Ke', 12),
      ],
    }), AS_OF)
    expect(power!.gana.notes.find(n => n.id === 'blueprint')!.answer).toMatch(/Krittika is Rakshasa gana/)
    expect(power!.gana.notes.find(n => n.id === 'blueprint')!.reading).toMatch(/too tightly/)
  })

  it('does not invent a gana when the teaching left the nakshatra unnamed', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Sa', 10, 'own', { nakshatraIndex: 20, pada: 1 }),
        g('Su', 5, 'own'),
        g('Mo', 4, 'own'),
        g('Ma', 8, 'own'),
        g('Me', 3, 'own'),
        g('Ju', 9, 'own'),
        g('Ve', 2, 'own'),
        g('Ra', 6),
        g('Ke', 12),
      ],
    }), AS_OF)
    const blueprint = reading!.gana.notes.find(n => n.id === 'blueprint')!
    expect(blueprint.answer).toMatch(/Uttara Ashadha has no gana/)
    expect(blueprint.reading).toMatch(/Staying is the advantage/)
    expect(reading!.gana.notes.find(n => n.id === 'three')!.reading).toMatch(/mahadasa|mahadasha/)
  })

  it('separates the Moon’s group from the 10th lord, and keeps a weak lord inside the manner', () => {
    const reading = analyzeCareerMethod(chart({
      asc: 1,
      grahas: [
        g('Sa', 10, 'debilitated', { nakshatraIndex: 0, pada: 4 }),
        g('Mo', 4, 'own', { nakshatraIndex: 1, pada: 1 }),
        g('Ra', 6, 'neutral', { nakshatraIndex: 2, pada: 1 }),
        g('Su', 5, 'own'),
        g('Ma', 8, 'own'),
        g('Me', 3, 'own'),
        g('Ju', 9, 'own'),
        g('Ve', 2, 'own'),
        g('Ke', 12),
      ],
    }), AS_OF)
    expect(reading!.gana.notes.find(n => n.id === 'three')!.answer).toMatch(/not the same/)
    expect(reading!.gana.notes.find(n => n.id === 'blueprint')!.reading).toMatch(/with difficulty/)
    expect(reading!.gana.notes.find(n => n.id === 'blueprint')!.reading).toMatch(/care/)
    expect(reading!.gana.closing).toMatch(/not the same career/)
  })
})
