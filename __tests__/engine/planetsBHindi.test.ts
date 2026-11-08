// Hindi tables for the Planets-tab "B" panels: remedies, maturity, energy
// cycles, yogi point and the Insights tab. Pure engine imports only.
import { describe, expect, it } from 'vitest'
import type { GrahaData, InterpretationInsight, ShadbalaResult } from '@/types/astrology'
import {
  computePlanetaryRemedies,
  getPlanetRemedyTeaching,
  getRemedyCorePrinciple,
  PLANET_REMEDY_TEACHINGS,
  REMEDY_CORE_PRINCIPLE,
  REMEDY_GRAHAS,
} from '@/lib/engine/planetaryRemedies'
import { PLANET_REMEDY_TEACHINGS_HI, REMEDY_REASON_HI } from '@/lib/engine/locale/planetaryRemedies.hi'
import {
  getPlanetaryMaturityNotes,
  getPlanetaryMaturityRows,
  PLANETARY_MATURITY,
  PLANETARY_MATURITY_NOTES,
} from '@/lib/engine/planetaryMaturity'
import { PLANETARY_MATURITY_HI } from '@/lib/engine/locale/planetaryMaturity.hi'
import { computePlanetaryEnergyCycles } from '@/lib/engine/planetaryEnergyCycles'
import { ENERGY_STATIC_HI } from '@/lib/engine/locale/planetaryEnergyCycles.hi'
import { calculateYogiPoint, getYogiPointText } from '@/lib/engine/yogiPoint'
import { localizeChartInterpretation } from '@/lib/engine/advancedInterpretationLang'
import {
  DIGNITY_ACTION_HI,
  GRAHA_DOMAIN_HI,
  GRAHA_PRACTICE_HI,
  HOUSE_LABEL_HI,
  MRITYU_REMEDY_HI,
  RASHI_CORE_HI,
} from '@/lib/engine/locale/advancedInterpretation.hi'

const DEV = /[ऀ-ॿ]/
const LATIN_WORD = /[A-Za-z]{3,}/

function strings(v: unknown): string[] {
  if (typeof v === 'string') return [v]
  if (Array.isArray(v)) return v.flatMap(strings)
  if (v && typeof v === 'object') return Object.values(v).flatMap(strings)
  return []
}

function expectHindi(v: unknown, allowLatin = /Gold/) {
  for (const s of strings(v)) {
    if (!s.trim() || /^[\d\s.,:–\-—°·()+±/]+$/.test(s)) continue
    expect(s, s).toMatch(DEV)
    expect(s.replace(allowLatin, ''), s).not.toMatch(LATIN_WORD)
  }
}

const listKeys = ['deities', 'indications', 'behavioral', 'spiritual', 'donation', 'seva', 'notes'] as const

function graha(id: GrahaData['id'], over: Partial<GrahaData> = {}): GrahaData {
  return {
    id, name: id, lonSidereal: 45, rashi: 2, rashiName: 'Taurus', degree: 15, nakshatraIndex: 3,
    nakshatraName: 'Rohini', pada: 2, dignity: 'neutral', isRetro: false, isCombust: false,
    gandanta: { isGandanta: false, type: null, severity: 'none', position: null },
    pushkara: { isPushkara: false, type: null, isPushkaraNavamsha: false, remedy: null },
    mrityuBhaga: { isMrityuBhaga: false, severity: 'none', distanceFromMrityu: 5, mrityuDegree: 10, remedy: null },
    yuddha: { isWarring: false, planets: [], winner: null, loser: null, degreeDifference: 0, orb: 1 },
    ...over,
  } as unknown as GrahaData
}

const GRAHAS: GrahaData[] = [
  graha('Su', { rashi: 3, nakshatraIndex: 5 }),
  graha('Mo', { rashi: 4, nakshatraIndex: 7 }),
  graha('Ma', { rashi: 7, dignity: 'debilitated', nakshatraIndex: 13 }),
  graha('Me', { rashi: 6, nakshatraIndex: 12, isCombust: true }),
  graha('Ju', { rashi: 9 }),
  graha('Ve', { rashi: 12, dignity: 'exalted', nakshatraIndex: 26, pada: 3 }),
  graha('Sa', { rashi: 1, dignity: 'debilitated', isRetro: true, nakshatraIndex: 1 }),
  graha('Ra', { rashi: 8, nakshatraIndex: 16 }),
  graha('Ke', { rashi: 2, nakshatraIndex: 3 }),
]

describe('planetary remedies Hindi', () => {
  it('every teaching has Hindi with matching list lengths', () => {
    for (const id of REMEDY_GRAHAS) {
      const en = PLANET_REMEDY_TEACHINGS[id]
      const hi = PLANET_REMEDY_TEACHINGS_HI[id]
      for (const k of listKeys) expect(hi[k].length, `${id}.${k}`).toBe(en[k].length)
      expect(Boolean(hi.duration)).toBe(Boolean(en.duration))
      expect(getPlanetRemedyTeaching(id, 'hi').grahaId).toBe(id)
      expectHindi(hi)
    }
    expect(getRemedyCorePrinciple('hi').steps.length).toBe(REMEDY_CORE_PRINCIPLE.steps.length)
    expectHindi(getRemedyCorePrinciple('hi'))
  })

  it('Hindi assessment keeps ids, scores and needs; English unchanged', () => {
    const en = computePlanetaryRemedies(GRAHAS)
    const hi = computePlanetaryRemedies(GRAHAS, null, 'hi')
    expect(computePlanetaryRemedies(GRAHAS, null, 'en')).toEqual(en)
    expect(hi.priority).toEqual(en.priority)
    expect(hi.planets.map((p) => [p.grahaId, p.score, p.need, p.nakshatraIndex]))
      .toEqual(en.planets.map((p) => [p.grahaId, p.score, p.need, p.nakshatraIndex]))
    for (const p of en.planets) for (const r of p.reasons) expect(REMEDY_REASON_HI[r], r).toBeTruthy()
    expectHindi([hi.insight, hi.planets.map((p) => [p.reasons, p.nakshatraName, p.nakshatraDeity, listKeys.map((k) => p.teaching[k]), p.teaching.name])])
  })
})

describe('planetary maturity Hindi', () => {
  it('rows and notes translate with ages and houses unchanged', () => {
    const en = getPlanetaryMaturityRows()
    const hi = getPlanetaryMaturityRows('hi')
    expect(hi.map((r) => [r.grahaId, r.maturityAge, r.karakaHouses])).toEqual(en.map((r) => [r.grahaId, r.maturityAge, r.karakaHouses]))
    for (const id of Object.keys(PLANETARY_MATURITY) as Array<keyof typeof PLANETARY_MATURITY>) {
      expect(PLANETARY_MATURITY_HI[id].significances.length).toBe(PLANETARY_MATURITY[id].significances.length)
    }
    expectHindi(hi.map((r) => [r.name, r.sanskrit, r.significances]))
    expect(getPlanetaryMaturityNotes()).toBe(PLANETARY_MATURITY_NOTES)
    const notes = getPlanetaryMaturityNotes('hi')
    expect(notes.map((n) => n.id)).toEqual(PLANETARY_MATURITY_NOTES.map((n) => n.id))
    expectHindi(notes.map((n) => [n.title, n.body]))
  })
})

describe('planetary energy cycles Hindi', () => {
  const asOf = new Date(2026, 10, 7)
  for (const birth of ['1990-05-15', '1998-01-01', '2012-03-03', '1984-11-30']) {
    it(`matches English structure for ${birth}`, () => {
      const en = computePlanetaryEnergyCycles(GRAHAS, birth, asOf)
      const hi = computePlanetaryEnergyCycles(GRAHAS, birth, asOf, 'hi')
      expect(computePlanetaryEnergyCycles(GRAHAS, birth, asOf, 'en')).toEqual(en)
      expect(hi.age).toBe(en.age)
      hi.cycles.forEach((c, i) => {
        const e = en.cycles[i]
        expect([c.grahaId, c.kind, c.status]).toEqual([e.grahaId, e.kind, e.status])
        expect(c.phases.length).toBe(e.phases.length)
        expect(c.manifestations.length).toBe(e.manifestations.length)
        expect(c.natalNotes.length).toBe(e.natalNotes.length)
        expect(c.windows.map((w) => [w.kind, w.active])).toEqual(e.windows.map((w) => [w.kind, w.active]))
        // numeric age windows feed the timeline; they must stay identical
        c.windows.forEach((w, j) => { if (/^\d/.test(e.windows[j].ages)) expect(w.ages).toBe(e.windows[j].ages) })
        expectHindi([c.grahaName, c.title, c.theme, c.cyclePeriod, c.statusLabel, c.summary, c.phases, c.manifestations, c.natalNotes, c.windows.map((w) => w.label), c.insight])
      })
    })
  }
  it('static table covers every kind', () => {
    const en = computePlanetaryEnergyCycles(GRAHAS, '1990-05-15', asOf)
    for (const c of en.cycles) expect(ENERGY_STATIC_HI[c.kind], c.kind).toBeTruthy()
  })
})

describe('yogi point Hindi', () => {
  it('rebuilds interpretation and remedy; English is the stored text', () => {
    const r = calculateYogiPoint(30.5, 200.25)
    expect(getYogiPointText(r)).toEqual({ interpretation: r.interpretation, remedy: r.remedy })
    const hi = getYogiPointText(r, 'hi')
    expectHindi(hi)
    expect(hi.interpretation.yogi).toContain(r.yogiDegreeInSign.toFixed(2))
  })
})

describe('insights (chart interpretation) Hindi', () => {
  const tables = { HOUSE_LABEL_HI, GRAHA_DOMAIN_HI, GRAHA_PRACTICE_HI, DIGNITY_ACTION_HI, MRITYU_REMEDY_HI, RASHI_CORE_HI }
  it('tables are complete Devanagari', () => {
    expect(Object.keys(HOUSE_LABEL_HI)).toHaveLength(12)
    expect(Object.keys(RASHI_CORE_HI)).toHaveLength(12)
    expectHindi(tables)
  })

  it('localizes each insight kind, keeping ids and numbers', () => {
    const ins = (id: string, over: Partial<InterpretationInsight>): InterpretationInsight => ({
      id, title: 'x', message: 'x', tone: 'mixed', category: 'summary', priority: 50, relatedGrahas: ['Sa'], actions: ['a'], ...over,
    })
    const shadbala = { planets: { Ju: { totalShash: 412.5 }, Sa: { totalShash: 250.25 } }, strongest: 'Ju', weakest: 'Sa' } as unknown as ShadbalaResult
    const insights = [
      ins('strength-jupiter-leads-your-chart', { category: 'strength', relatedGrahas: ['Ju'], house: 9 }),
      ins('vulnerability-saturn-needs-support', { category: 'vulnerability', house: 1 }),
      ins('summary-lagna-in-aries', { relatedGrahas: ['Ma'], house: 1 }),
      ins('summary-saturn-in-house-1', { house: 1 }),
      ins('summary-saturn-in-aries', { actions: undefined }),
      ins('summary-yogi-graha-ju', { relatedGrahas: ['Ju', 'Me'], house: 9 }),
    ]
    const interp = { headline: 'h', strengths: [], cautions: [], special: [], topInsights: insights }
    const ctx = { grahas: GRAHAS.map((g) => ({ ...g, name: ({ Ju: 'Jupiter', Sa: 'Saturn' } as Record<string, string>)[g.id] ?? g.name })), shadbala, ascRashi: 1 }
    expect(localizeChartInterpretation(interp, ctx)).toBe(interp)
    const hi = localizeChartInterpretation(interp, ctx, 'hi')
    hi.topInsights.forEach((h, i) => {
      expect([h.id, h.house, h.priority, h.tone]).toEqual([insights[i].id, insights[i].house, insights[i].priority, insights[i].tone])
      expect(Boolean(h.actions)).toBe(Boolean(insights[i].actions))
    })
    expectHindi([hi.headline, hi.topInsights.map((h) => [h.title, h.message, h.actions ?? []])])
    expect(hi.topInsights[0].message).toContain('412.50')
  })
})

// ── Venus / Saturn / Rahu / Ketu analyses ─────────────────────
// Each analysis is run in English and Hindi on several synthetic charts. The
// Hindi result must keep every id, enum, number and boolean, keep list
// lengths (except the classical catalogues, which carry the first note only),
// and contain Devanagari in every display string.
import type { ChartOutput, GrahaId, Rashi } from '@/types/astrology'
import { analyzeVenus } from '@/lib/engine/venusAnalysis'
import { analyzeSaturn } from '@/lib/engine/saturnAnalysis'
import { analyzeRahu } from '@/lib/engine/rahuAnalysis'
import { analyzeKetu } from '@/lib/engine/ketuAnalysis'

/** English words; all-caps acronyms (IAS, DNA) are allowed inside Hindi. */
const LOWER_WORD = /[A-Za-z]?[a-z]{2,}/
const ID_KEYS = new Set(['id', 'grahaId', 'kind', 'tone', 'difficulty', 'dignity', 'source', 'ref', 'companion'])
const FREE_LENGTH = new Set(['classical', 'natalHouseClassical', 'natalSignClassical', 'vakriAst', 'aspectOverviewClassical'])

/** Every display string under `v` is Devanagari; id-like keys are skipped. */
function hindiDeep(v: unknown, path: string): void {
  if (typeof v === 'string') {
    if (!v.trim() || /^[\d\s.,:–\-—°·()+±/~<>→↔]+$/.test(v)) return
    expect(v, `${path}: ${v}`).toMatch(DEV)
    expect(v.replace(/H\d+/g, ''), `${path}: ${v}`).not.toMatch(LOWER_WORD)
  } else if (Array.isArray(v)) v.forEach((x, i) => hindiDeep(x, `${path}[${i}]`))
  else if (v && typeof v === 'object') {
    for (const [k, x] of Object.entries(v)) if (!ID_KEYS.has(k)) hindiDeep(x, `${path}.${k}`)
  }
}

function compareHi(en: unknown, hi: unknown, path: string, strict = true): void {
  if (typeof en === 'string') {
    expect(typeof hi, path).toBe('string')
    const key = path.split('.').pop() ?? ''
    if (ID_KEYS.has(key.replace(/\[\d+\]$/, ''))) {
      expect(hi, path).toBe(en)
      return
    }
    const h = hi as string
    if (!h.trim() || /^[\d\s.,:–\-—°·()+±/~<>→↔]+$/.test(h) || h === '—') return
    expect(h, `${path}: ${h}`).toMatch(DEV)
    expect(h.replace(/H\d+/g, ''), `${path}: ${h}`).not.toMatch(LOWER_WORD)
    return
  }
  if (Array.isArray(en)) {
    expect(Array.isArray(hi), path).toBe(true)
    const h = hi as unknown[]
    if (strict) expect(h.length, `${path} length`).toBe(en.length)
    h.forEach((v, i) => compareHi(en[i], v, `${path}[${i}]`, strict))
    return
  }
  if (en && typeof en === 'object') {
    for (const [k, v] of Object.entries(en as Record<string, unknown>)) {
      const strictChild = strict && !FREE_LENGTH.has(k) && k !== 'allHouses' && k !== 'allSigns' && k !== 'natalMixed' && k !== 'aspectTeachings'
      if (!strictChild) {
        hindiDeep((hi as Record<string, unknown>)[k], `${path}.${k}`)
        continue
      }
      compareHi(v, (hi as Record<string, unknown>)[k], `${path}.${k}`, strictChild)
    }
    return
  }
  expect(hi, path).toEqual(en)
}

function chartFrom(asc: Rashi, lons: Partial<Record<GrahaId, number>>, flags: Partial<Record<GrahaId, Partial<GrahaData>>> = {}): ChartOutput {
  const grahas = (Object.entries(lons) as Array<[GrahaId, number]>).map(([id, lon]) => {
    const rashi = (Math.floor(lon / 30) + 1) as Rashi
    const nak = Math.floor(lon / (360 / 27))
    return graha(id, {
      name: id, lonSidereal: lon, rashi, degree: lon % 30, nakshatraIndex: nak,
      pada: (Math.floor((lon % (360 / 27)) / (360 / 108)) + 1), isRetro: id === 'Ra' || id === 'Ke', ...flags[id],
    })
  })
  return { grahas, lagnas: { ascRashi: asc } } as unknown as ChartOutput
}

const CHARTS: ChartOutput[] = [
  // Venus with Ketu & Mars, Saturn with Moon (Visha) and Rahu
  chartFrom(1, { Su: 10, Mo: 284, Ma: 118, Me: 20, Ju: 60, Ve: 115, Sa: 280, Ra: 290, Ke: 110 }, { Ve: { dignity: 'debilitated' }, Sa: { isRetro: true } }),
  // Rahu in 6th with Mars (fire sign), Jupiter in kendra; Venus exalted in 12th
  chartFrom(8, { Su: 345, Mo: 50, Ma: 28, Me: 330, Ju: 220, Ve: 357, Sa: 5, Ra: 25, Ke: 205 }, { Ve: { dignity: 'exalted' }, Sa: { dignity: 'debilitated' } }),
  // Ketu in Pisces with Moon & Saturn (pressure), Rahu alone in 10th
  chartFrom(3, { Su: 120, Mo: 340, Ma: 60, Me: 135, Ju: 250, Ve: 145, Sa: 335, Ra: 160, Ke: 345 }, { Ve: { isRetro: true, isCombust: true } }),
  // Saturn exalted in 10th with Sun (combust) and Ketu, Venus with Jupiter in 5th
  chartFrom(4, { Su: 190, Mo: 100, Ma: 300, Me: 200, Ju: 225, Ve: 230, Sa: 195, Ra: 5, Ke: 185 }, { Sa: { dignity: 'exalted', isCombust: true } }),
]

describe('Venus / Saturn / Rahu / Ketu Hindi', () => {
  const runs = [
    ['venus', analyzeVenus],
    ['saturn', analyzeSaturn],
    ['rahu', analyzeRahu],
    ['ketu', analyzeKetu],
  ] as const
  for (const [name, fn] of runs) {
    CHARTS.forEach((chart, i) => {
      it(`${name} chart ${i}: same structure, Devanagari text, English unchanged`, () => {
        const en = fn(chart)
        expect(en).not.toBeNull()
        expect(fn(chart, 'en')).toEqual(en)
        const hi = fn(chart, 'hi')
        compareHi(en, hi, name)
      })
    })
  }

  it('flags the yogas these charts are built to trigger', () => {
    const on = (ys: Array<{ id: string; active: boolean }>) => ys.filter((y) => y.active).map((y) => y.id)
    expect(on(analyzeVenus(CHARTS[0])!.yogas)).toEqual(expect.arrayContaining(['ve_ketu', 've_ma']))
    expect(on(analyzeSaturn(CHARTS[0])!.yogas)).toEqual(expect.arrayContaining(['visha', 'shapit']))
    expect(on(analyzeRahu(CHARTS[1])!.yogas)).toEqual(expect.arrayContaining(['ashta_lakshmi', 'angarak']))
    expect(on(analyzeKetu(CHARTS[2])!.yogas)).toEqual(expect.arrayContaining(['ke_mo', 'ke_sa', 'ke_ju_expressway']))
  })
})
