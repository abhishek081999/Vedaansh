// Ṣaṭpañcāśikā readings and the question list must be Devanagari when
// lang=hi, with verdicts, polarity, weights, timing values and ids unchanged.

import { beforeAll, describe, expect, it } from 'vitest'
import type { ChartOutput } from '@/types/astrology'
import { calculateChart } from '@/lib/engine/calculator'
import {
  SATPANCHASIKA_INTERPRETIVE_NOTES, SATPANCHASIKA_QUESTIONS, SATPANCHASIKA_QUESTION_GROUPS, runSatpanchasika, satpanchasikaGroupLabel,
  satpanchasikaInterpretiveNotes, satpanchasikaQuestions,
  type SatpanchasikaOptions,
} from '@/lib/engine/satpanchasikaEngine'
import { SATPANCHASIKA_CHAPTERS, SATPANCHASIKA_SLOKAS, getSatpanchasikaSloka, satpanchasikaChapterTitle } from '@/lib/engine/satpanchasikaSlokas'

function collect(x: unknown, path: string, out: [string, string][] = []): [string, string][] {
  if (typeof x === 'string') out.push([path, x])
  else if (Array.isArray(x)) x.forEach((v) => collect(v, path, out))
  else if (x && typeof x === 'object') Object.entries(x).forEach(([k, v]) => collect(v, path ? `${path}.${k}` : k, out))
  return out
}

const KEEP = /^(question|verdict|strengthSource|subject\.strongest|planets\.nature|lostItem\.object\.kind|lostItem\.whenLost\.value|timing\.(unit|status|basis)|(fired|notEvaluated)\.(ruleId|slokaId|polarity)|slokaStatus\..*)$|(^|\.)(id|group)$/
/** Any Latin word of two or more letters outside the id paths is a leak. */
const englishLeaks = (value: unknown) =>
  collect(value, '').filter(([path, text]) => !KEEP.test(path) && /[A-Za-zāīūṃṇṣḥś]{2,}/.test(text.replace(/[ĀŚṢ]/g, '')))

const charts: ChartOutput[] = []
beforeAll(async () => {
  for (const [date, time] of [['1985-11-02', '16:40:00'], ['2026-11-09', '06:30:00'], ['1999-03-21', '01:15:00'], ['1971-08-14', '11:05:00']]) {
    charts.push(await calculateChart({
      name: 'S', birthDate: date, birthTime: time.slice(0, 5), utcDate: date, utcTime: time,
      birthPlace: 'Delhi', latitude: 28.61, longitude: 77.21, timezone: 'UTC', gender: 'male',
    } as Parameters<typeof calculateChart>[0]))
  }
}, 60_000)

const OPTIONS: SatpanchasikaOptions[] = SATPANCHASIKA_QUESTIONS.flatMap((q) => [
  { question: q.id },
  ...(q.id === 'contest' ? [{ question: q.id, contestRole: 'challenger' as const }] : []),
  ...(q.id === 'any_house' ? [5, 8, 11].map((house) => ({ question: q.id, house })) : []),
  ...(q.id === 'rain' ? [{ question: q.id, season: 'rainy' as const }] : []),
])

describe('Satpanchasika in Hindi', () => {
  it('has no English in any reading', () => {
    for (const c of charts) for (const o of OPTIONS) expect(englishLeaks(runSatpanchasika(c, o, 'hi'))).toEqual([])
  })

  it('keeps verdict, weights, rules and timing values the same', () => {
    for (const c of charts) for (const o of OPTIONS) {
      const en = runSatpanchasika(c, o)
      const hi = runSatpanchasika(c, o, 'hi')
      expect([hi.verdict, hi.clarity, hi.weights, hi.slokaStatus, hi.notFiredCount]).toEqual([en.verdict, en.clarity, en.weights, en.slokaStatus, en.notFiredCount])
      expect(hi.fired.map((r) => [r.ruleId, r.polarity, r.weight])).toEqual(en.fired.map((r) => [r.ruleId, r.polarity, r.weight]))
      expect(hi.timing.map((t) => [t.id, t.value, t.unit, t.status, t.basis])).toEqual(en.timing.map((t) => [t.id, t.value, t.unit, t.status, t.basis]))
      expect(hi.planets.map((p) => [p.id, p.nature, p.strength])).toEqual(en.planets.map((p) => [p.id, p.nature, p.strength]))
    }
  })

  it('has a Hindi gist for every śloka and chapter', () => {
    expect(englishLeaks(SATPANCHASIKA_SLOKAS.map((x) => getSatpanchasikaSloka(x.id, 'hi')?.meaning))).toEqual([])
    expect(englishLeaks(SATPANCHASIKA_CHAPTERS.map((c) => satpanchasikaChapterTitle(c, 'hi')))).toEqual([])
    expect(getSatpanchasikaSloka('1.2')?.meaning).toMatch(/^Fall from position/)
  })

  it('translates the interpretive notes and their śloka labels', () => {
    expect(englishLeaks(satpanchasikaInterpretiveNotes('hi'))).toEqual([])
    expect(satpanchasikaInterpretiveNotes('hi').map((n) => n.slokas.replace(/[^\d.,]/g, ''))).toEqual(SATPANCHASIKA_INTERPRETIVE_NOTES.map((n) => n.slokas.replace(/[^\d.,]/g, '')))
  })

  it('translates the question list and groups, keeping ids and groups as keys', () => {
    const hi = satpanchasikaQuestions('hi')
    expect(englishLeaks(hi)).toEqual([])
    expect(hi.map((q) => [q.id, q.group, q.judgedHouse])).toEqual(SATPANCHASIKA_QUESTIONS.map((q) => [q.id, q.group, q.judgedHouse]))
    expect(englishLeaks(SATPANCHASIKA_QUESTION_GROUPS.map((g) => satpanchasikaGroupLabel(g, 'hi')))).toEqual([])
    expect(satpanchasikaQuestions()[0].label).toBe('Will the work succeed')
  })
})
