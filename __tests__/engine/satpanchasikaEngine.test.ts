// __tests__/engine/satpanchasikaEngine.test.ts
// Ṣaṭpañcāśikā rule engine: śloka data, rules from chart facts, verdict, timing.
// Pure logic only.

import { describe, it, expect } from 'vitest'
import {
  SATPANCHASIKA_CHAPTERS,
  SATPANCHASIKA_SLOKAS,
} from '@/lib/engine/satpanchasikaSlokas'
import { SATPANCHASIKA_RULES } from '@/lib/engine/satpanchasikaRules'
import {
  SATPANCHASIKA_QUESTIONS,
  computeAllTiming,
  runSatpanchasika,
  synthesiseVerdict,
  type SatpanchasikaChartInput,
  type SatpanchasikaQuestion,
} from '@/lib/engine/satpanchasikaEngine'
import type { GrahaData, GrahaId, Rashi } from '@/types/astrology'

type Placement = { rashi: Rashi; degree?: number; retro?: boolean; dignity?: GrahaData['dignity']; speed?: number }

function graha(id: GrahaId, p: Placement): GrahaData {
  const degree = p.degree ?? 15
  const totalDegree = (p.rashi - 1) * 30 + degree
  return {
    id, name: id, rashi: p.rashi, degree, totalDegree, lonSidereal: totalDegree, lonTropical: totalDegree,
    isRetro: p.retro ?? false, isCombust: false, dignity: p.dignity ?? 'neutral', speed: p.speed ?? 1,
  } as GrahaData
}

function chart(
  lagna: Rashi,
  lagnaDegree: number,
  planets: Partial<Record<GrahaId, Placement | Rashi>>,
  ratios?: Partial<Record<GrahaId, number>>,
): SatpanchasikaChartInput {
  // Everything not named sits harmlessly apart; tests name what they rely on.
  const defaults: Record<string, Placement> = {
    Su: { rashi: 1 }, Mo: { rashi: 4 }, Ma: { rashi: 1 }, Me: { rashi: 1 }, Ju: { rashi: 1 }, Ve: { rashi: 1 }, Sa: { rashi: 1 },
  }
  const grahas = (['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa'] as GrahaId[]).map(id => {
    const given = planets[id]
    return graha(id, typeof given === 'number' ? { rashi: given } : given ?? defaults[id])
  })
  const shadbala = ratios
    ? { planets: Object.fromEntries((['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa'] as GrahaId[]).map(id => [id, { ratio: ratios[id] ?? 1 }])) }
    : undefined
  return { lagnas: { ascRashi: lagna, ascDegree: (lagna - 1) * 30 + lagnaDegree }, grahas, shadbala }
}

const firedIds = (c: SatpanchasikaChartInput, q: SatpanchasikaQuestion, o = {}) =>
  runSatpanchasika(c, { question: q, ...o }).fired.map(r => r.ruleId)

/** The source's worked example: Leo 12°, waxing Moon in Gemini, Jupiter in Sagittarius, Saturn in Aquarius. */
const WORKED = chart(5, 12, {
  Mo: { rashi: 3, degree: 10 },
  Ju: { rashi: 9 },
  Sa: { rashi: 11 },
  Su: { rashi: 1, degree: 20 },
  Me: { rashi: 1, degree: 25 },
  Ma: { rashi: 7 },
  Ve: { rashi: 12 },
})

describe('Śloka data', () => {
  it('holds exactly 56 ślokas', () => {
    expect(SATPANCHASIKA_SLOKAS).toHaveLength(56)
  })

  it('has chapter counts 7+17+5+5+5+5+12', () => {
    const counts = SATPANCHASIKA_CHAPTERS.map(ch => SATPANCHASIKA_SLOKAS.filter(s => s.chapter === ch.number).length)
    expect(counts).toEqual([7, 17, 5, 5, 5, 5, 12])
    expect(SATPANCHASIKA_CHAPTERS.map(ch => ch.slokaCount)).toEqual(counts)
  })

  it('numbers every chapter in order, each with its verse marker and a meaning', () => {
    for (const ch of SATPANCHASIKA_CHAPTERS) {
      const list = SATPANCHASIKA_SLOKAS.filter(s => s.chapter === ch.number)
      list.forEach((s, i) => {
        expect(s.id).toBe(`${ch.number}.${i + 1}`)
        expect(s.sanskrit).toMatch(/॥[१२३४५६७८९०]+॥$/)
        expect(s.meaning.length).toBeGreaterThan(10)
      })
    }
  })

  it('flags 2.1 alone as check-against-print', () => {
    expect(SATPANCHASIKA_SLOKAS.filter(s => s.checkAgainstPrint).map(s => s.id)).toEqual(['2.1'])
  })

  it('accounts for all 56 ślokas under every question type', () => {
    for (const { id } of SATPANCHASIKA_QUESTIONS) {
      const status = runSatpanchasika(WORKED, { question: id }).slokaStatus
      expect(Object.keys(status)).toHaveLength(56)
    }
  })

  it('every rule points at a real śloka, and every śloka but the invocation is handled', () => {
    const ids = new Set(SATPANCHASIKA_SLOKAS.map(s => s.id))
    for (const r of SATPANCHASIKA_RULES) expect(ids.has(r.sloka)).toBe(true)
    const handled = new Set([
      ...SATPANCHASIKA_RULES.map(r => r.sloka),
      '1.1', '1.6', '1.7', '2.14', '2.15', '2.16', '2.17', '5.5', '6.2', '6.4', '6.5', '7.6', '7.7', '7.8',
    ])
    expect([...ids].filter(id => !handled.has(id))).toEqual([])
  })
})

describe('Worked example: lost ring', () => {
  const r = runSatpanchasika(WORKED, { question: 'lost_item' })

  it('reads recoverable', () => {
    expect(r.verdict).toBe('favourable')
    expect(r.headline).toMatch(/Recovery is indicated/)
  })

  it('fires 1.5 and 6.3 from the strong waxing Moon in the 11th', () => {
    const ids = r.fired.map(x => x.ruleId)
    expect(ids).toContain('1.5-eleventh')
    expect(ids).toContain('6.3-eleventh')
  })

  it('every fired rule carries its śloka, facts and weight', () => {
    for (const hit of r.fired) {
      expect(hit.slokaId).toMatch(/^\d\.\d+$/)
      expect(hit.facts.length).toBeGreaterThan(0)
      expect(hit.weight).toBeGreaterThan(0)
    }
  })

  it('gives dhātu from the 4th navāṃśa of an odd sign (1.7)', () => {
    expect(r.lostItem?.object.kind).toMatch(/^Dhātu/)
    expect(r.steps[0].summary).toContain('navāṃśa 4 (Cancer)')
  })

  it('says own people, still there (6.1)', () => {
    expect(r.fired.map(x => x.ruleId)).toContain('6.1')
    expect(r.lostItem?.whoHolds.value).toMatch(/close to the owner/)
  })

  it('places it in the middle of the house (6.2)', () => {
    expect(r.lostItem?.where.place).toMatch(/middle/)
  })

  it('takes direction West from Saturn in the 7th, over Leo\'s East (6.4)', () => {
    expect(r.lostItem?.direction.value).toBe('West')
  })

  it('gives one step of distance, not yojanas (6.4)', () => {
    expect(r.lostItem?.distance.steps).toBe(1)
    expect(r.lostItem?.distance.working).toMatch(/not as yojanas/)
  })

  it('gives daytime from Leo (6.5)', () => {
    expect(r.lostItem?.whenLost.value).toBe('Daytime')
  })

  it('gives age from lagna lord Sun, with no class or caste (6.5)', () => {
    expect(r.lostItem?.personAge.value).toBe('around 70')
    expect(JSON.stringify(r.lostItem)).not.toMatch(/caste|brahmin|kshatriya|sudra/i)
  })

  it('reports the 6.5 parts it cannot judge', () => {
    expect(r.notEvaluated.map(n => n.ruleId)).toEqual(expect.arrayContaining(['6.5-appearance', '6.5-class', '6.5-place']))
  })
})

describe('Book example for 5.5', () => {
  it('Taurus lagna, first occupied Virgo, direct = 60 days', () => {
    const c = chart(2, 10, { Su: 6, Mo: 7, Ma: 7, Me: 6, Ju: 8, Ve: 7, Sa: 8 })
    expect(computeAllTiming(c).first_occupied.value).toBe(60)
  })

  it('same chart, retrograde planet = 5 days', () => {
    const c = chart(2, 10, { Su: 7, Mo: 7, Ma: 7, Me: 8, Ju: 8, Ve: 8, Sa: { rashi: 6, retro: true } })
    expect(computeAllTiming(c).first_occupied.value).toBe(5)
  })
})

describe('Timing methods stay separate', () => {
  it('2.14 and 2.15: multiplies by the navāṃśa type', () => {
    // Saturn strongest, 3rd from Aries; 15° Gemini is the 5th navāṃśa from Libra = Aquarius, fixed: ×2.
    const c = chart(1, 5, { Sa: { rashi: 3, degree: 15 }, Su: 2, Mo: 4, Ma: 5, Me: 2, Ju: 6, Ve: 2 }, { Sa: 1.5 })
    const t = computeAllTiming(c).strongest_planet
    expect(t.unit).toBe('months')
    expect(t.value).toBe(6)
  })

  it('2.16: a luminary 7th lord cannot turn retrograde', () => {
    // Aquarius lagna: 7th is Leo, Sun's.
    expect(computeAllTiming(chart(11, 5, {})).seventh_lord_retro.status).toBe('void')
    // Aries lagna: 7th is Libra, Venus's.
    expect(computeAllTiming(chart(1, 5, {})).seventh_lord_retro.status).toBe('event')
  })

  it('2.17: counts signs to the Moon, and is void if a planet lies between', () => {
    const clear = chart(1, 5, { Mo: 4, Su: 8, Ma: 8, Me: 8, Ju: 8, Ve: 8, Sa: 8 })
    expect(computeAllTiming(clear).lagna_to_moon.value).toBe(4)
    const blocked = chart(1, 5, { Mo: 4, Su: 2, Ma: 8, Me: 8, Ju: 8, Ve: 8, Sa: 8 })
    const t = computeAllTiming(blocked).lagna_to_moon
    expect(t.status).toBe('void')
    expect(t.value).toBeNull()
  })

  it('1.2: nearest direct planet, in degrees, ignoring retrograde ones', () => {
    // Aries lagna: 4th is Cancer (starts at 90°). Mars is retro at Gemini 29; Sun direct at Gemini 20.
    const c = chart(1, 5, { Ma: { rashi: 3, degree: 29, retro: true }, Su: { rashi: 3, degree: 20 }, Mo: 8, Me: 8, Ju: 8, Ve: 8, Sa: 8 })
    const t = computeAllTiming(c).planet_to_fourth
    expect(t.value).toBe(10)
    expect(t.working).toMatch(/Sun/)
  })

  it('each question gets only its own methods', () => {
    const methods = (q: SatpanchasikaQuestion) => runSatpanchasika(WORKED, { question: q }).timing.map(t => t.id)
    expect(methods('opponent')).toEqual(['lagna_to_moon'])
    expect(methods('traveller_return')).toEqual(['strongest_planet', 'seventh_lord_retro', 'first_occupied', 'planet_to_fourth'])
    expect(runSatpanchasika(WORKED, { question: 'whom' }).timing).toEqual([])
    expect(runSatpanchasika(WORKED, { question: 'whom' }).timingNote).toMatch(/no event to time/)
  })

  it('never adds methods together', () => {
    const r = runSatpanchasika(WORKED, { question: 'traveller_return' })
    expect(new Set(r.timing.map(t => t.id)).size).toBe(r.timing.length)
    expect(r).not.toHaveProperty('combinedTiming')
  })
})

describe('Verdict weighs strength over count', () => {
  it('one heavy rule beats several light ones', () => {
    const v = synthesiseVerdict([
      { polarity: 'favourable', weight: 0.5 },
      { polarity: 'favourable', weight: 0.5 },
      { polarity: 'favourable', weight: 0.5 },
      { polarity: 'unfavourable', weight: 6 },
    ])
    expect(v.verdict).toBe('unfavourable')
  })

  it('balanced signals give success only with difficulty (1.4)', () => {
    expect(synthesiseVerdict([{ polarity: 'favourable', weight: 2 }, { polarity: 'unfavourable', weight: 2 }]).verdict).toBe('with_difficulty')
    expect(synthesiseVerdict([{ polarity: 'mixed', weight: 2 }]).verdict).toBe('with_difficulty')
  })

  it('ṣaḍbala changes a planet rule\'s weight', () => {
    const c = (ratio: number) => chart(5, 12, { Ju: 3, Mo: 2, Su: 1, Me: 1, Ma: 7, Ve: 12, Sa: 11 }, { Ju: ratio })
    const weight = (ratio: number) => runSatpanchasika(c(ratio), { question: 'lost_item' }).fired.find(r => r.ruleId === '6.3-eleventh')!.strengthFactor
    expect(weight(1.5)).toBeGreaterThan(weight(1))
  })

  it('a strong benefic must be strong: a weak one in the 11th does not fire 1.5', () => {
    const c = chart(5, 12, { Ju: 3, Mo: { rashi: 1 }, Su: 1, Me: 2, Ma: 7, Ve: 12, Sa: 11 }, { Ju: 0.6 })
    expect(firedIds(c, 'lost_item')).not.toContain('1.5-eleventh')
  })

  it('repeated rules weigh more (1.5 and 6.3; 1.2 and 7.9)', () => {
    for (const id of ['1.5-moon', '1.5-eleventh', '6.3-moon', '6.3-eleventh', '1.2-return', '7.9-query', '7.9-left']) {
      expect(SATPANCHASIKA_RULES.find(r => r.id === id)?.repeated).toBe(true)
    }
    const hit = runSatpanchasika(WORKED, { question: 'lost_item' }).fired.find(r => r.ruleId === '6.3-eleventh')!
    expect(hit.weight).toBeGreaterThan(hit.baseWeight * hit.strengthFactor)
  })
})

describe('Fixed lagna means no change, not good (2.1)', () => {
  it('reads no change for a return question, with nothing else strong', () => {
    const c = chart(2, 10, { Su: 12, Mo: 12, Ma: 12, Me: 12, Ju: 10, Ve: 12, Sa: 12 })
    const r = runSatpanchasika(c, { question: 'traveller_return' })
    expect(r.fired.find(x => x.ruleId === '2.1')?.polarity).toBe('no_change')
    expect(r.verdict).toBe('no_change')
  })

  it('cuts both ways: it helps a position question', () => {
    const c = chart(2, 10, {})
    expect(runSatpanchasika(c, { question: 'position' }).fired.find(x => x.ruleId === '2.1')?.polarity).toBe('favourable')
  })

  it('blocks cure too: patient question is no_change, never favourable by itself', () => {
    const c = chart(2, 10, {})
    expect(runSatpanchasika(c, { question: 'patient' }).fired.find(x => x.ruleId === '2.1')?.polarity).toBe('no_change')
  })
})

describe('Sign and planet interpretation', () => {
  it('a dual lagna splits at 15°', () => {
    expect(firedIds(chart(3, 10, {}), 'traveller_return')).toContain('2.1')
    expect(firedIds(chart(3, 20, {}), 'traveller_return')).toContain('2.2-movable')
  })

  it('Pisces rising is both, so 1.4 is mixed even with a clean lagna', () => {
    const r = runSatpanchasika(chart(12, 10, { Ju: 12, Su: 2, Mo: 4, Ma: 2, Me: 2, Ve: 2, Sa: 2 }), { question: 'work' })
    expect(r.fired.find(x => x.ruleId === '1.4')?.polarity).toBe('mixed')
  })

  it('a waning Moon is malefic, a waxing Moon benefic', () => {
    const waxing = chart(5, 12, { Su: { rashi: 1, degree: 0 }, Mo: { rashi: 3 }, Ju: 12, Ve: 12, Me: 12, Ma: 12, Sa: 12 })
    const waning = chart(5, 12, { Su: { rashi: 8, degree: 0 }, Mo: { rashi: 3 }, Ju: 12, Ve: 12, Me: 12, Ma: 12, Sa: 12 })
    expect(firedIds(waxing, 'lost_item')).toContain('1.5-eleventh')
    expect(firedIds(waning, 'lost_item')).not.toContain('1.5-eleventh')
  })

  it('Mercury joined with a malefic turns malefic', () => {
    const alone = chart(1, 5, { Me: 7, Sa: 2, Su: 2, Ma: 2, Ju: 2, Ve: 2, Mo: 2 })
    const joined = chart(1, 5, { Me: 7, Sa: 7, Su: 2, Ma: 2, Ju: 2, Ve: 2, Mo: 2 })
    expect(firedIds(alone, 'position')).toContain('4.3-position')
    expect(firedIds(joined, 'position')).not.toContain('4.3-position')
  })

  it('aspects use Vedic drishti, so Saturn reaches the 3rd and Jupiter the 9th', () => {
    // Saturn in Taurus aspects Cancer (3rd); Jupiter in Taurus aspects Capricorn (9th).
    const c = chart(4, 5, { Sa: 2, Ju: 2, Su: 8, Mo: 8, Ma: 8, Me: 8, Ve: 8 })
    const facts = runSatpanchasika(c, { question: 'work' }).fired.find(x => x.ruleId === '2.2-aspect')?.facts.join(' ')
    expect(facts).toContain('Saturn')
  })
})

describe('Opponent rules (chapter 2)', () => {
  it('2.6: movable lagna, Moon fixed = will not come', () => {
    const r = runSatpanchasika(chart(1, 5, { Mo: 2 }), { question: 'opponent' })
    expect(r.fired.find(x => x.ruleId === '2.6-no')?.polarity).toBe('favourable')
  })

  it('2.6: fixed lagna, Moon movable = will come', () => {
    const r = runSatpanchasika(chart(2, 5, { Mo: 1 }), { question: 'opponent' })
    expect(r.fired.find(x => x.ruleId === '2.6-yes')?.polarity).toBe('unfavourable')
  })

  it('2.7 and 2.8 use the sign types', () => {
    expect(firedIds(chart(2, 5, { Mo: 3 }), 'opponent')).toContain('2.7')
    expect(firedIds(chart(3, 20, { Mo: 1 }), 'opponent')).toContain('2.8-half')
    expect(firedIds(chart(1, 5, { Mo: 3 }), 'opponent')).toContain('2.8-comes')
  })

  it('2.9: a retrograde planet reverses the move', () => {
    const direct = chart(1, 5, { Sa: 1 })
    const retro = chart(1, 5, { Su: 2, Me: 2, Ve: 2, Sa: { rashi: 1, retro: true } })
    expect(runSatpanchasika(direct, { question: 'opponent' }).fired.find(x => x.ruleId === '2.9')?.polarity).toBe('unfavourable')
    expect(runSatpanchasika(retro, { question: 'opponent' }).fired.find(x => x.ruleId === '2.9')?.polarity).toBe('favourable')
  })

  it('2.11 needs the whole list', () => {
    expect(firedIds(chart(1, 5, { Su: 4, Mo: 4 }), 'opponent')).toContain('2.11-no')
    expect(firedIds(chart(1, 5, { Su: 4, Mo: 5 }), 'opponent')).not.toContain('2.11-no')
  })
})

describe('Contests (chapter 3)', () => {
  const c = chart(1, 5, { Ju: 7, Ve: 7, Me: 7, Mo: 7, Su: 2, Ma: 2, Sa: 2 })

  it('favours the defender and flips for a challenger', () => {
    const def = runSatpanchasika(c, { question: 'contest', contestRole: 'defender' })
    const cha = runSatpanchasika(c, { question: 'contest', contestRole: 'challenger' })
    expect(def.fired.find(x => x.ruleId === '3.1-benefics')?.polarity).toBe('favourable')
    expect(cha.fired.find(x => x.ruleId === '3.1-benefics')?.polarity).toBe('unfavourable')
  })

  it('carries a not-legal-advice note', () => {
    expect(runSatpanchasika(c, { question: 'contest' }).notices.join(' ')).toMatch(/not legal/)
  })
})

describe('Rules needing what a chart lacks', () => {
  it('7.3 is not evaluated without the season, and evaluated once confirmed', () => {
    const c = chart(1, 5, { Mo: 2, Ve: 8, Su: 3, Sa: 9, Ju: 6, Me: 3, Ma: 3 })
    const without = runSatpanchasika(c, { question: 'rain' })
    expect(without.notEvaluated.find(n => n.slokaId === '7.3')?.reason).toMatch(/season/)
    expect(without.slokaStatus['7.3']).toBe('not_evaluated')
    expect(firedIds(c, 'rain')).not.toContain('7.3')
    expect(firedIds(c, 'rain', { season: 'rainy' })).toContain('7.3')
  })

  it('7.10 is always reported not evaluated, and never fires', () => {
    for (const { id } of SATPANCHASIKA_QUESTIONS) {
      const r = runSatpanchasika(WORKED, { question: id })
      expect(r.notEvaluated.some(n => n.slokaId === '7.10')).toBe(true)
      expect(r.fired.some(x => x.slokaId === '7.10')).toBe(false)
    }
  })
})

describe('Sensitive wording', () => {
  const dangerChart = chart(1, 5, { Sa: 8, Ma: 8, Su: 1, Mo: 1, Me: 1, Ju: 1, Ve: 1 })

  it('7.11 fires as danger without stating death', () => {
    const r = runSatpanchasika(dangerChart, { question: 'traveller_safe' })
    const hit = r.fired.find(x => x.ruleId === '7.11-danger')
    expect(hit?.statement).toMatch(/Traditional warning/)
    expect(hit?.statement).toMatch(/not a prediction/)
  })

  it('no generated text across any question states a death, caste or judgement of women', () => {
    const charts = [WORKED, dangerChart, chart(4, 25, { Mo: 8, Ma: 4, Sa: 7 }), chart(9, 3, { Ma: 3, Sa: 6 })]
    for (const c of charts) {
      for (const { id } of SATPANCHASIKA_QUESTIONS) {
        const r = runSatpanchasika(c, { question: id })
        const text = JSON.stringify({ h: r.headline, f: r.fired.map(x => [x.statement, x.facts]), l: r.lostItem, s: r.subject, st: r.steps })
        expect(text).not.toMatch(/\b(will die|dies|is dead|courtesan|prostitute|low-status|another's wife|brahmin|kshatriya|vaisya|sudra|caste)\b/i)
      }
    }
  })

  it('medical and child questions carry a not-advice note', () => {
    expect(runSatpanchasika(WORKED, { question: 'patient' }).notices.join(' ')).toMatch(/not medical advice/)
    expect(runSatpanchasika(WORKED, { question: 'child_pregnancy' }).notices.join(' ')).toMatch(/not medical advice/)
  })

  it('child question reports indications and no verdict', () => {
    const r = runSatpanchasika(WORKED, { question: 'child_pregnancy' })
    expect(r.verdict).toBe('indication_only')
    expect(r.fired.every(x => x.polarity === 'descriptive')).toBe(true)
  })

  it('labels every reading a study framework', () => {
    for (const { id } of SATPANCHASIKA_QUESTIONS) {
      expect(runSatpanchasika(WORKED, { question: id }).notices[0]).toMatch(/study framework/)
    }
  })
})

describe('Pipeline', () => {
  it('gives all eight steps in order', () => {
    expect(runSatpanchasika(WORKED, { question: 'work' }).steps.map(s => s.step)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
  })

  it('ignores Rahu, Ketu and outer planets', () => {
    const base = chart(2, 10, { Su: 6, Mo: 7, Ma: 7, Me: 6, Ju: 8, Ve: 7, Sa: 8 })
    const withNodes = { ...base, grahas: [...base.grahas, graha('Ra', { rashi: 3 }), graha('Ke', { rashi: 9 }), graha('Ur', { rashi: 3 })] }
    expect(computeAllTiming(withNodes).first_occupied.value).toBe(60)
  })

  it('throws clearly if a planet is missing', () => {
    const base = chart(1, 5, {})
    expect(() => runSatpanchasika({ ...base, grahas: base.grahas.slice(1) }, { question: 'work' })).toThrow(/seven grahas/)
  })

  it('falls back to dignity without ṣaḍbala, and says so', () => {
    expect(runSatpanchasika(chart(1, 5, {}), { question: 'work' }).strengthSource).toBe('dignity')
    expect(runSatpanchasika(chart(1, 5, {}, {}), { question: 'work' }).strengthSource).toBe('shadbala')
  })
})

describe('Narrower questions from the ślokas', () => {
  it('offers 32 question types, each with a group', () => {
    expect(SATPANCHASIKA_QUESTIONS).toHaveLength(32)
    expect(new Set(SATPANCHASIKA_QUESTIONS.map(q => q.id)).size).toBe(32)
    expect(SATPANCHASIKA_QUESTIONS.every(q => q.group)).toBe(true)
  })

  it('every question gives a non-empty headline on any chart', () => {
    for (const c of [WORKED, chart(4, 25, { Mo: 8, Ma: 4, Sa: 7 }), chart(9, 3, { Ma: 3, Sa: 6 })]) {
      for (const { id } of SATPANCHASIKA_QUESTIONS) {
        expect(runSatpanchasika(c, { question: id }).headline.length).toBeGreaterThan(0)
      }
    }
  })

  it('answers where and who from the worked example', () => {
    expect(runSatpanchasika(WORKED, { question: 'lost_where' }).headline).toBe('The middle of the house, towards the West')
    expect(runSatpanchasika(WORKED, { question: 'lost_who' }).headline).toBe('Someone close to the owner')
  })

  it('whom and object class come from the chart', () => {
    expect(runSatpanchasika(WORKED, { question: 'object_class' }).headline).toMatch(/^Dhātu/)
    expect(runSatpanchasika(WORKED, { question: 'whom' }).headline).toMatch(/^It concerns /)
  })

  it('timing questions use only their own methods', () => {
    expect(runSatpanchasika(WORKED, { question: 'opponent_when' }).timing.map(t => t.id)).toEqual(['lagna_to_moon'])
    expect(runSatpanchasika(WORKED, { question: 'traveller_when' }).timing).toHaveLength(4)
  })

  it('narrow questions fire only their own ślokas', () => {
    const ids = (q: SatpanchasikaQuestion) => runSatpanchasika(WORKED, { question: q }).fired.map(r => r.slokaId)
    expect(ids('friendship').every(s => s === '3.4')).toBe(true)
    expect(ids('honour').every(s => s === '4.3')).toBe(true)
    expect(ids('traveller_health').every(s => s === '7.11')).toBe(true)
  })

  it('reports a missing combination as absent, not as a no', () => {
    const r = runSatpanchasika(chart(1, 5, { Mo: 8 }), { question: 'father_abroad' })
    expect(r.headline).toBe('The 7.12 combination is not present')
    expect(r.verdict).toBe('indication_only')
  })

  it('any_house judges the chosen house with 1.3', () => {
    const c = chart(1, 5, { Ju: 7, Su: 2, Mo: 2, Ma: 2, Me: 2, Ve: 2, Sa: 2 })
    const r = runSatpanchasika(c, { question: 'any_house', house: 7 })
    expect(r.fired.find(x => x.ruleId === '1.3-good')?.statement).toMatch(/7th/)
  })

  it('a danger reading on a traveller carries the contact note', () => {
    const c = chart(1, 5, { Sa: 8, Ma: 8, Su: 1, Mo: 1, Me: 1, Ju: 1, Ve: 1 })
    const r = runSatpanchasika(c, { question: 'traveller_health' })
    expect(r.headline).toMatch(/check on the person/)
    expect(r.notices.join(' ')).toMatch(/contact them/)
  })
})

describe('Every event question has a when', () => {
  const NO_EVENT: SatpanchasikaQuestion[] = ['whom', 'object_class', 'person_age', 'child_pregnancy', 'father_abroad', 'traveller_health']

  it('gives timing to all but the non-event questions', () => {
    for (const { id } of SATPANCHASIKA_QUESTIONS) {
      const r = runSatpanchasika(WORKED, { question: id })
      if (NO_EVENT.includes(id)) expect(r.timing).toEqual([])
      else expect(r.timing.length).toBeGreaterThan(0)
    }
  })

  it('labels borrowed methods as adapted and textual ones as from the text', () => {
    const adapted = runSatpanchasika(WORKED, { question: 'marriage' })
    expect(adapted.timing.map(t => [t.id, t.basis])).toEqual([['strongest_planet', 'adapted']])
    expect(adapted.timingCaveat).toMatch(/adapted by analogy/)
    const textual = runSatpanchasika(WORKED, { question: 'opponent' })
    expect(textual.timing.every(t => t.basis === 'text')).toBe(true)
  })

  it('warns when the reading does not favour the event', () => {
    const c = chart(2, 10, { Su: 12, Mo: 12, Ma: 12, Me: 12, Ju: 10, Ve: 12, Sa: 12 })
    expect(runSatpanchasika(c, { question: 'traveller_return' }).timingCaveat).toMatch(/if it happens at all/)
  })

  it('patient timing says it is not a medical timeline', () => {
    expect(runSatpanchasika(WORKED, { question: 'patient' }).timingCaveat).toMatch(/Not a medical timeline/)
  })

  it('reports the quick pace the text itself gives (worked example)', () => {
    expect(runSatpanchasika(WORKED, { question: 'lost_item' }).paceNotes.join(' ')).toMatch(/6\.3 says recovery comes quickly/)
  })
})
