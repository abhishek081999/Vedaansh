import { describe, it, expect } from 'vitest'
import type { ChartOutput, Dignity, DashaNode, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { analyzeCareerChange } from '@/lib/engine/careerChange'

function g(id: GrahaId, rashi: Rashi, dignity: Dignity = 'neutral', extra: Partial<GrahaData> = {}): GrahaData {
  return { id, rashi, dignity, isCombust: false, isRetro: false, name: id, nakshatraIndex: 0, pada: 1, ...extra } as GrahaData
}

function antar(lord: GrahaId, start: string, end: string): DashaNode {
  return { lord, start: new Date(start), end: new Date(end), durationMs: 1, level: 2, isCurrent: false, children: [] }
}

function chart(asc: Rashi, grahas: GrahaData[], mahaLord: GrahaId = 'Sa', antars?: DashaNode[]): ChartOutput {
  const children = antars ?? [
    antar('Sa', '2024-01-01', '2026-06-01'),
    antar('Me', '2026-06-01', '2028-06-01'),
    antar('Ke', '2028-06-01', '2029-06-01'),
    antar('Ve', '2029-06-01', '2032-06-01'),
  ]
  const maha: DashaNode = {
    lord: mahaLord, start: new Date('2024-01-01'), end: new Date('2032-06-01'), durationMs: 1, level: 1, isCurrent: true, children,
  }
  return { lagnas: { ascRashi: asc }, grahas, dashas: { vimshottari: [maha] } } as unknown as ChartOutput
}

const BASE = [
  g('Su', 1), g('Mo', 4), g('Ma', 10), g('Me', 2), g('Ju', 9), g('Ve', 3), g('Sa', 7), g('Ra', 10), g('Ke', 4),
]

describe('analyzeCareerChange', () => {
  it('returns null without an ascendant', () => {
    expect(analyzeCareerChange({ grahas: [] } as unknown as ChartOutput)).toBeNull()
  })

  it('reads a movable 10th with a node in it as frequent change', () => {
    // Aries lagna → 10th is Capricorn (movable), Rahu and Mars in the 10th.
    const r = analyzeCareerChange(chart(1, BASE), new Date('2027-01-01'))!
    expect(r.stability.level).toBe('frequent')
    expect(r.stability.score).toBeGreaterThanOrEqual(7)
  })

  it('reads a fixed 10th with Saturn holding it as long tenure', () => {
    // Leo lagna → 10th is Taurus (fixed), Saturn holds it.
    const grahas = [g('Su', 5), g('Mo', 6), g('Ma', 9), g('Me', 5), g('Ju', 1), g('Ve', 2, 'own'), g('Sa', 2, 'friend'), g('Ra', 7), g('Ke', 1)]
    const r = analyzeCareerChange(chart(5, grahas), new Date('2027-01-01'))!
    expect(r.stability.level).toBe('steady')
  })

  it('builds dated windows, marks the running one live, and covers every topic card', () => {
    const r = analyzeCareerChange(chart(1, BASE), new Date('2027-01-01'))!
    expect(r.windows).toHaveLength(3) // Sa antar already ended
    const live = r.windows.filter(w => w.live)
    expect(live).toHaveLength(1)
    expect(live[0].antarLord).toBe('Me')
    expect(r.windows[0].start).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    const ids = r.groups.flatMap(gr => gr.cards.map(c => c.id))
    expect(ids).toEqual(expect.arrayContaining([
      'stability', 'field', 'business', 'government', 'job-loss', 'workplace',
      'promotion', 'transfer', 'side-income', 'reskill', 'satisfaction', 'late-career',
    ]))
    expect(r.now.id).toBe('now')
    expect(r.rules.length).toBeGreaterThanOrEqual(4)
  })

  it('classifies a 9th/12th-ruling Jupiter antar for Aries lagna as a change window', () => {
    // Aries: Jupiter rules the 9th and 12th (the 12th and 3rd from the 10th) and sits in the 9th.
    const r = analyzeCareerChange(
      chart(1, BASE, 'Sa', [antar('Ju', '2026-01-01', '2029-01-01')]),
      new Date('2027-01-01'),
    )!
    expect(r.windows[0].kind).toBe('switch')
    expect(r.now.answer).toMatch(/window for change/)
    const promoSat = analyzeCareerChange(
      chart(1, BASE, 'Sa', [antar('Sa', '2026-01-01', '2029-01-01')]),
      new Date('2027-01-01'),
    )!
    // Saturn rules the 10th and 11th for Aries → growth window.
    expect(promoSat.windows[0].kind).toBe('rise')
  })

  it('adds a transit card only when positions are passed', () => {
    const c = chart(1, BASE)
    expect(analyzeCareerChange(c, new Date('2027-01-01'))!.sky).toBeNull()
    const sky = analyzeCareerChange(c, new Date('2027-01-01'), 'en', [
      { id: 'Sa', rashi: 4 }, { id: 'Ju', rashi: 10 }, { id: 'Ra', rashi: 10 }, { id: 'Ke', rashi: 4 },
    ])!.sky!
    expect(sky.id).toBe('sky')
    expect(sky.factors.some(f => /sade sati/.test(f))).toBe(true)
  })

  it('returns Hindi text with no long English sentences', () => {
    const r = analyzeCareerChange(chart(1, BASE), new Date('2027-01-01'), 'hi', [{ id: 'Sa', rashi: 4 }, { id: 'Ju', rashi: 11 }])!
    const strings: string[] = []
    const walk = (x: unknown) => {
      if (typeof x === 'string') strings.push(x)
      else if (Array.isArray(x)) x.forEach(walk)
      else if (x && typeof x === 'object') Object.values(x).forEach(walk)
    }
    walk(r)
    const leaks = strings.filter(s =>
      s.length >= 25 && !/[ऀ-ॿ]/.test(s) && !/^change-|^\d{4}-/.test(s) && /[A-Za-z]{4,}/.test(s))
    expect(leaks).toEqual([])
    const ids = r.groups.flatMap(gr => gr.cards.map(c => c.id))
    expect(ids).toContain('job-loss')
    expect(r.windows[0].kindLabel).toMatch(/[ऀ-ॿ]/)
  })
})

describe('analyzeCareerChange cross-checks', () => {
  const asOf = new Date('2027-01-01')
  // Aries lagna; Jupiter antar (rules 9 and 12) → switch window.
  function withChecks(): ChartOutput {
    const c = chart(1, BASE, 'Sa', [antar('Ju', '2026-01-01', '2029-01-01')]) as unknown as Record<string, unknown>
    c.vargaLagnas = { D10: 1 }
    c.vargas = { D10: [g('Ju', 10)] } // D10 house 10 → agrees
    c.kp = { significators: { planetSignificators: { Ju: [3, 9, 10] }, houseSignificators: {} }, cusps: [], rulingPlanets: {} }
    return c as unknown as ChartOutput
  }
  const SPANS = [
    { id: 'Ju' as const, rashi: 11 as Rashi, start: '2026-01-01', end: '2029-01-01' }, // 11th from Aries lagna
    { id: 'Sa' as const, rashi: 6 as Rashi, start: '2026-01-01', end: '2029-01-01' }, // 3rd from Moon in Cancer
  ]

  it('confirms a switch window by D10, KP and gochar', () => {
    const r = analyzeCareerChange(withChecks(), asOf, 'en', [], SPANS)!
    const w = r.windows[0]
    expect(w.kind).toBe('switch')
    expect(w.checks.d10?.verdict).toBe('agrees')
    expect(w.checks.kp?.verdict).toBe('agrees')
    expect(w.checks.gochar?.verdict).toBe('agrees')
    expect(w.checks.agree).toBe(3)
    expect(w.tone).toBe('supportive')
    expect(r.bestSwitch?.id).toBe(w.id)
    expect(r.summary).toMatch(/Best confirmed change window/)
  })

  it('downgrades a switch window when the checks disagree', () => {
    const c = withChecks() as unknown as Record<string, unknown>
    c.vargas = { D10: [g('Ju', 8)] } // D10 house 8
    c.kp = { significators: { planetSignificators: { Ju: [5, 8, 12] }, houseSignificators: {} }, cusps: [], rulingPlanets: {} }
    const r = analyzeCareerChange(c as unknown as ChartOutput, asOf, 'en', [], [])!
    expect(r.windows[0].checks.available).toBe(2)
    expect(r.windows[0].tone).toBe('caution')
    expect(r.bestSwitch).toBeNull()
  })

  it('leaves checks empty when D10, KP and gochar are missing', () => {
    const r = analyzeCareerChange(chart(1, BASE), asOf)!
    expect(r.windows.every(w => w.checks.available === 0)).toBe(true)
  })

  it('builds muhurta day links inside the confirmed window', () => {
    const r = analyzeCareerChange(withChecks(), asOf, 'en', [], SPANS)!
    const ids = r.dayLinks.map(d => d.id)
    expect(ids).toEqual(['interview', 'join', 'business'])
    const join = r.dayLinks.find(d => d.id === 'join')!
    expect(join.purpose).toBe('BUSINESS')
    expect(join.from).toBe('2027-01-01')
    expect(join.to).toBe('2027-01-31')
    expect(r.dayLinks.find(d => d.id === 'interview')!.purpose).toBe('EDUCATION')
  })
})
