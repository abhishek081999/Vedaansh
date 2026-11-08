// Hindi coverage for the dasha period panels (Vimshottari, Yogini, Kalachakra):
// every English entry has Hindi, ids / tones / numbers match English, and the
// Hindi output is Devanagari. English output must not change.
import { describe, expect, it } from 'vitest'
import { calculateChart } from '@/lib/engine/calculator'
import {
  VIMSHOTTARI_ANTAR_HINTS,
  VIMSHOTTARI_INTERPRETATIONS,
  buildVimshottariAntarInterpretation,
  buildVimshottariPratyantarInterpretation,
  formatVimshottariDurationYears,
  getVimshottariInterpretation,
  getVimshottariResultHierarchy,
  VIMSHOTTARI_RESULT_HIERARCHY,
} from '@/lib/engine/dasha/vimshottariInterpretations'
import { analyzeVimshottariPeriod } from '@/lib/engine/dasha/vimshottariAnalysis'
import { analyzeDashaGochar } from '@/lib/engine/dasha/vimshottariGochar'
import { buildUpcomingVimshottariTimeline } from '@/lib/engine/dasha/vimshottariTimeline'
import {
  VIMSHOTTARI_MAHA_SCRIPTURES,
  getVimshottariAntarScriptures,
  getVimshottariMahaScriptures,
  getVimshottariPratyantarScriptures,
} from '@/lib/engine/dasha/vimshottariScriptures'
import { YOGINI_INTERPRETATIONS, getYoginiInterpretation } from '@/lib/engine/dasha/yoginiInterpretations'
import { analyzeKalachakra } from '@/lib/engine/dasha/kalachakraAnalysis'
import { computeDashaLordRemedies, PLANET_REMEDY_TEACHINGS } from '@/lib/engine/planetaryRemedies'
import { localizeDashaLordRemedies } from '@/lib/engine/dasha/dashaRemedyText'
import { VIM_ANTAR_HI, VIM_INTERP_HI, VIM_INTERP_MORE_HI } from '@/lib/engine/locale/vimshottari.hi'
import { MAHA_SCRIPTURES_HI } from '@/lib/engine/locale/vimshottariScriptures.hi'
import { YOGINI_HI } from '@/lib/engine/locale/yogini.hi'
import { REMEDY_TEACHINGS_HI } from '@/lib/engine/locale/dashaRemedies.hi'
import { CL_HI } from '@/lib/engine/locale/vimshottariClassical.hi'
import type { TransitPosition } from '@/lib/engine/transits'
import type { ChartOutput, DashaNode, Rashi } from '@/types/astrology'

const DEVANAGARI = /[ऀ-ॿ]/
/** Latin words of 4+ letters that should not survive in Hindi prose (Jyotish abbreviations like D9/BAV are fine). */
const ENGLISH_WORD = /\b[A-Za-z]{4,}\b/

function isHindi(text: string): boolean {
  return DEVANAGARI.test(text) && !ENGLISH_WORD.test(text)
}

function strings(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') out.push(value)
  else if (Array.isArray(value)) value.forEach(v => strings(v, out))
  else if (value && typeof value === 'object') Object.values(value).forEach(v => strings(v, out))
  return out
}

const LORDS = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']

let chart: ChartOutput | null = null
async function getChart(): Promise<ChartOutput> {
  if (!chart) {
    chart = await calculateChart({
      name: 'Test', birthDate: '1990-05-15', birthTime: '10:30', utcDate: '1990-05-15', utcTime: '05:00:00',
      birthPlace: 'New Delhi', latitude: 28.61, longitude: 77.21, timezone: 'Asia/Kolkata', gender: 'male',
    })
  }
  return chart
}

describe('Vimshottari interpretation tables', () => {
  it('has Hindi for every lord, every field and every antar hint', () => {
    for (const lord of Object.keys(VIMSHOTTARI_INTERPRETATIONS)) {
      expect(VIM_INTERP_HI[lord], lord).toBeDefined()
      expect(VIM_INTERP_MORE_HI[lord], lord).toBeDefined()
      const en = VIMSHOTTARI_INTERPRETATIONS[lord]
      const hi = getVimshottariInterpretation(lord, 'hi')!
      expect({ lord: hi.lord, years: hi.years, nature: hi.nature }).toEqual({ lord: en.lord, years: en.years, nature: en.nature })
      for (const s of strings({ ...hi, lord: '', nature: '' }).filter(Boolean)) expect(isHindi(s), s).toBe(true)
    }
    expect(Object.keys(VIM_ANTAR_HI).sort()).toEqual(Object.keys(VIMSHOTTARI_ANTAR_HINTS).sort())
  })

  it('keeps English unchanged', () => {
    expect(getVimshottariInterpretation('Su')).toBe(VIMSHOTTARI_INTERPRETATIONS.Su)
    expect(getVimshottariResultHierarchy()).toBe(VIMSHOTTARI_RESULT_HIERARCHY)
    expect(formatVimshottariDurationYears(0.5)).toBe('6 Months')
    expect(formatVimshottariDurationYears(0.5, 'hi')).toBe('6 माह')
    expect(isHindi(getVimshottariResultHierarchy('hi'))).toBe(true)
  })

  it('builds Hindi antar and pratyantar readings for every pair with English ids', () => {
    for (const md of LORDS) {
      for (const ad of LORDS) {
        const en = buildVimshottariAntarInterpretation(md, ad, 1.2)!
        const hi = buildVimshottariAntarInterpretation(md, ad, 1.2, 'hi')!
        expect({ lord: hi.lord, years: hi.years, nature: hi.nature }).toEqual({ lord: en.lord, years: en.years, nature: en.nature })
        for (const s of strings({ ...hi, lord: '', nature: '' }).filter(Boolean)) expect(isHindi(s), `${md}-${ad}: ${s}`).toBe(true)
        const pd = buildVimshottariPratyantarInterpretation(md, ad, 'Ma', 0.1, 'hi')!
        for (const s of strings({ ...pd, lord: '', nature: '' }).filter(Boolean)) expect(isHindi(s), s).toBe(true)
      }
    }
  })
})

describe('scriptures, yogini, remedies, classical rules tables', () => {
  it('has Hindi for every mahadasha passage, in the same order', () => {
    for (const lord of LORDS) {
      expect(MAHA_SCRIPTURES_HI[lord]?.length, lord).toBe(VIMSHOTTARI_MAHA_SCRIPTURES[lord].length)
      const hi = getVimshottariMahaScriptures(lord, 'hi')
      expect(hi.map(p => p.source)).toEqual(VIMSHOTTARI_MAHA_SCRIPTURES[lord].map(p => p.source))
      for (const p of hi) expect(isHindi(p.text), p.text).toBe(true)
      for (const p of [...getVimshottariAntarScriptures(lord, 'Ve', 'hi'), ...getVimshottariPratyantarScriptures(lord, 'Ve', 'Sa', 'hi')]) {
        expect(isHindi(p.text), p.text).toBe(true)
      }
    }
  })

  it('has Hindi for every yogini', () => {
    for (const lord of Object.keys(YOGINI_INTERPRETATIONS)) {
      expect(YOGINI_HI[lord], lord).toBeDefined()
      const en = YOGINI_INTERPRETATIONS[lord]
      const hi = getYoginiInterpretation(lord, 'hi')!
      expect({ lord: hi.lord, years: hi.years, nature: hi.nature }).toEqual({ lord: en.lord, years: en.years, nature: en.nature })
      for (const key of Object.keys(en) as (keyof typeof en)[]) {
        expect(hi[key] === null, `${lord}.${key}`).toBe(en[key] === null)
      }
      for (const s of strings({ ...hi, lord: '', nature: '' }).filter(Boolean)) expect(isHindi(s), s).toBe(true)
    }
  })

  it('has Hindi remedy teachings with the same list lengths', () => {
    for (const [id, en] of Object.entries(PLANET_REMEDY_TEACHINGS)) {
      const hi = REMEDY_TEACHINGS_HI[id]
      expect(hi, id).toBeDefined()
      for (const key of ['deities', 'indications', 'behavioral', 'spiritual', 'donation', 'seva', 'notes'] as const) {
        expect(hi[key].length, `${id}.${key}`).toBe(en[key].length)
      }
      expect(Boolean(hi.duration)).toBe(Boolean(en.duration))
    }
  })

  it('classical rule templates are Devanagari', () => {
    for (const [key, v] of Object.entries(CL_HI)) {
      for (const s of [v.label, v.detail].filter(x => x && x.replace(/\{\w+\}/g, '').trim())) expect(DEVANAGARI.test(s), key).toBe(true)
    }
  })
})

describe('chart-conditioned Hindi output', () => {
  it('analysis keeps ids, tones and numbers and translates every text field', async () => {
    const c = await getChart()
    const input = {
      nodes: c.dashas.vimshottari as DashaNode[],
      ascRashi: c.lagnas.ascRashi as Rashi,
      grahas: c.grahas,
      shadbala: c.shadbala ?? null,
      ashtakavarga: c.ashtakavarga ?? null,
    }
    const en = analyzeVimshottariPeriod(input)!
    const hi = analyzeVimshottariPeriod({ ...input, lang: 'hi' })!
    expect(hi.flags.map(f => [f.id, f.tone])).toEqual(en.flags.map(f => [f.id, f.tone]))
    expect([hi.favorableShare, hi.neutralShare, hi.challengingShare]).toEqual([en.favorableShare, en.neutralShare, en.challengingShare])
    expect(hi.lifeAreas.areas.map(a => [a.id, a.strength, a.houses])).toEqual(en.lifeAreas.areas.map(a => [a.id, a.strength, a.houses]))
    expect(hi.dispositorChains.mahadasha.links.map(l => [l.lord, l.role])).toEqual(en.dispositorChains.mahadasha.links.map(l => [l.lord, l.role]))
    const texts = [
      ...hi.flags.flatMap(f => [f.label, f.detail]),
      ...hi.lifeAreas.areas.flatMap(a => [a.label, a.note]),
      hi.lifeAreas.headline, hi.summary, hi.yogakarakaNote, hi.lagnaSpecialNote, hi.marakaNote,
      hi.dispositorChains.mahadasha.summary, hi.d9Note ?? '', hi.charaKarakaNote ?? '',
    ].filter(Boolean)
    for (const s of texts) expect(DEVANAGARI.test(s), s).toBe(true)
    // English untouched by the Hindi branch
    expect(analyzeVimshottariPeriod(input)).toEqual(en)
  })

  it('timeline and gochar overlay keep lords, dates and tones', async () => {
    const c = await getChart()
    const nodes = c.dashas.vimshottari as DashaNode[]
    const now = Date.UTC(2026, 10, 7)
    const en = buildUpcomingVimshottariTimeline(nodes, now)
    const hi = buildUpcomingVimshottariTimeline(nodes, now, 5, 'hi')
    expect(hi.upcomingAntars.map(i => [i.lord, i.startIso, i.tone])).toEqual(en.upcomingAntars.map(i => [i.lord, i.startIso, i.tone]))
    for (const s of [hi.headline, ...hi.upcomingAntars.flatMap(i => [i.label, i.toneLabel])]) expect(DEVANAGARI.test(s), s).toBe(true)

    const transits: TransitPosition[] = [
      { planetId: 'Sa', sign: c.lagnas.ascRashi, house: 1 } as TransitPosition,
      { planetId: 'Ju', sign: c.grahas.find(g => g.id === 'Mo')!.rashi, house: 4 } as TransitPosition,
    ]
    const g = { ascRashi: c.lagnas.ascRashi as Rashi, natalGrahas: c.grahas, mahaLord: 'Sa', antarLord: 'Me', transitPositions: transits, asOf: '2026-11-07' }
    const gEn = analyzeDashaGochar(g)
    const gHi = analyzeDashaGochar({ ...g, lang: 'hi' })
    expect(gHi.hits.map(h => [h.id, h.tone, h.house])).toEqual(gEn.hits.map(h => [h.id, h.tone, h.house]))
    for (const s of [gHi.summary, ...gHi.hits.flatMap(h => [h.label, h.detail])]) expect(DEVANAGARI.test(s), s).toBe(true)
  })

  it('kalachakra and remedies keep keys and tones', async () => {
    const c = await getChart()
    const moon = c.grahas.find(g => g.id === 'Mo')!
    const base = { moonLonSidereal: moon.lonSidereal, nodes: (c.dashas.kalachakra ?? []) as DashaNode[], grahas: c.grahas, ascRashi: c.lagnas.ascRashi as Rashi }
    const en = analyzeKalachakra(base)
    const hi = analyzeKalachakra({ ...base, lang: 'hi' })
    expect(hi.mahadashas.map(p => [p.key, p.tone, p.houseFromLagna])).toEqual(en.mahadashas.map(p => [p.key, p.tone, p.houseFromLagna]))
    for (const s of [hi.summary, hi.deha.text, hi.jeeva.text, ...hi.mahadashas.flatMap(p => [p.prediction, ...p.areas.map(a => a.text)])]) {
      expect(DEVANAGARI.test(s), s).toBe(true)
    }

    const remedies = computeDashaLordRemedies(['Sa', 'Me'], c.grahas, c.shadbala ?? null)
    const hiR = localizeDashaLordRemedies(remedies, 'hi')
    expect(hiR.map(r => [r.assessment.grahaId, r.assessment.need, r.levels])).toEqual(remedies.map(r => [r.assessment.grahaId, r.assessment.need, r.levels]))
    for (const r of hiR) for (const s of [...r.assessment.reasons, r.assessment.nakshatraDeity, ...r.assessment.teaching.behavioral]) {
      expect(DEVANAGARI.test(s), s).toBe(true)
    }
    expect(localizeDashaLordRemedies(remedies)).toBe(remedies)
  })
})
