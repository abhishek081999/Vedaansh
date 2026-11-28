// __tests__/engine/prashnaQuestions.test.ts
// M1 question guide: checklist, 12-question scheme, lost-item clues, Method essentials.

import { describe, it, expect } from 'vitest'
import { QUESTION_KINDS, buildQuestionChecklist, houseFromPoint, lostItemClues, twelveQuestionPoints, type QuestionChartInput } from '@/lib/engine/prashnaQuestions'
import { methodEssentials } from '@/lib/engine/prashnaMethodEssentials'
import type { Dignity, GrahaData, GrahaId, Rashi } from '@/types/astrology'

const DEV = /[ऀ-ॿ]/
const SPEED: Record<string, number> = { Su: 1, Mo: 13, Ma: 0.5, Me: 1.2, Ju: 0.1, Ve: 1.1, Sa: 0.05, Ra: -0.05, Ke: -0.05 }

function at(id: GrahaId, lon: number, x: { retro?: boolean; dignity?: Dignity } = {}): GrahaData {
  const rashi = (Math.floor(lon / 30) + 1) as Rashi
  const speed = (x.retro ? -1 : 1) * Math.abs(SPEED[id] ?? 0)
  return { id, name: id, rashi, degree: lon % 30, totalDegree: lon, speed, isRetro: !!x.retro || id === 'Ra' || id === 'Ke', isCombust: false, dignity: x.dignity ?? 'neutral' } as GrahaData
}

/** Modelled on the lost watch case: Sagittarius lagna, Aries navāṃśa lagna. */
const watch: QuestionChartInput = {
  ascRashi: 9,
  grahas: [
    at('Su', 205), at('Mo', 239, { dignity: 'debilitated' }), at('Ma', 117, { dignity: 'debilitated' }),
    at('Me', 185, { retro: true }), at('Ju', 260, { dignity: 'own' }), at('Ve', 165, { retro: true, dignity: 'debilitated' }),
    at('Sa', 340, { retro: true }), at('Ra', 82), at('Ke', 262),
  ],
  d9: { ascRashi: 1, signs: { Ju: 12, Mo: 4, Su: 5, Ve: 2, Me: 3, Ra: 7 } },
}

describe('Question checklist', () => {
  it('always reads the lagna first, then the question houses', () => {
    for (const q of QUESTION_KINDS) {
      const c = buildQuestionChecklist(watch, q.id)
      expect(c.houses[0].house).toBe(1)
      expect(c.houses.slice(1).map(h => h.house)).toEqual(q.houses.map(h => h.house))
    }
  })

  it('lost item: karyesha, weak lagna lord and a genuine question', () => {
    const c = buildQuestionChecklist(watch, 'lost')
    expect(c.lagna.lord.id).toBe('Ju')
    expect(c.lagna.weakReasons.join()).toMatch(/Ketu/)
    expect(c.karyesha.id).toBe('Sa') // 2nd from Sagittarius is Capricorn
    expect(c.genuine.ok).toBe(true)
    expect(c.genuine.reasons.join()).toMatch(/Moon in the 12th/)
    expect(c.karakas.map(k => k.id)).toEqual(['Ma', 'Sa', 'Mo'])
  })

  it('marriage notes Rahu in D1 and D9; property flags an exalted 11th lord', () => {
    expect(buildQuestionChecklist(watch, 'marriage').notes.some(n => /Rahu in D1/.test(n.text))).toBe(true)
    const sale = { ...watch, grahas: watch.grahas.map(g => (g.id === 'Ve' ? { ...g, dignity: 'exalted' as Dignity } : g)) }
    // 11th from Sagittarius is Libra: Venus.
    expect(buildQuestionChecklist(sale, 'propertySale').notes.some(n => n.tone === 'good' && /desired price/.test(n.text))).toBe(true)
  })

  it('translates fully into Hindi', () => {
    const c = buildQuestionChecklist(watch, 'lost', 'hi')
    for (const s of [c.label, c.lagna.sign, c.karyesha.name, ...c.houses.map(h => h.role), ...c.genuine.reasons, ...c.notes.map(n => n.text)]) expect(s).toMatch(DEV)
  })
})

describe('12-question scheme', () => {
  it('lists the twelve reference points in order', () => {
    const p = twelveQuestionPoints(watch)
    expect(p.map(x => x.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
    expect(p[0]).toMatchObject({ chart: 'D1', sign: 9 })
    expect(p[1]).toMatchObject({ chart: 'D9', sign: 1 })
    expect(p[2].name).toMatch(/Moon/)
    expect(p[8].name).toMatch(/stronger/)
    expect(p[10].name).toMatch(/weaker/)
  })

  it('counts the matter house from a point', () => {
    expect(houseFromPoint(1, 7)).toMatchObject({ sign: 7, lord: 'Ve' })
    expect(houseFromPoint(9, 10)).toMatchObject({ sign: 6, lord: 'Me' })
  })
})

describe('Lost-item clues', () => {
  it('reads the watch case as the class did', () => {
    const ids = lostItemClues(watch).map(c => c.id)
    expect(ids).toEqual(expect.arrayContaining(['who', 'where', 'lord-d9-12', 'moon-12', 'mars', 'saturn', 'lord-ketu', 'no-law', 'ishrafa-Ma', 'direction']))
    expect(ids).not.toContain('recovery')
    const c = lostItemClues(watch)
    expect(c.find(x => x.id === 'who')!.detail).toMatch(/known person but not family/)
    expect(c.find(x => x.id === 'where')!.detail).toMatch(/far away/)
    expect(c.find(x => x.id === 'direction')!.title).toMatch(/North-East/)
  })

  it('Hindi clues are in Devanagari', () => {
    for (const c of lostItemClues(watch, 'hi')) {
      expect(c.title).toMatch(DEV)
      expect(c.detail).toMatch(DEV)
    }
  })
})

describe('Method essentials', () => {
  it('English and Hindi have the same shape, and Hindi is translated', () => {
    const en = methodEssentials('en'), hi = methodEssentials('hi')
    expect(hi.map(s => s.id)).toEqual(en.map(s => s.id))
    en.forEach((s, i) => {
      expect(hi[i].rows?.length).toBe(s.rows?.length)
      expect(hi[i].points?.length).toBe(s.points?.length)
      expect(hi[i].title).toMatch(DEV)
    })
  })
})
