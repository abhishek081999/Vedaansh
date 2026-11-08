// ─────────────────────────────────────────────────────────────
//  __tests__/engine/divisionalHindi.test.ts
//  Hindi parity for the divisional-chart engines (D3, D4, D9, D12, D27).
//  - every English table entry has a Hindi twin with the same {slots}
//  - Hindi output keeps ids / numbers / enums identical to English
//  - Hindi output is Devanagari; English stays the default
// ─────────────────────────────────────────────────────────────

import { describe, it, expect, beforeAll } from 'vitest'
import type { ChartOutput } from '@/types/astrology'
import * as d3 from '@/lib/engine/locale/drekkana.hi'
import * as d4 from '@/lib/engine/locale/chaturthamsa.hi'
import * as d4c from '@/lib/engine/locale/chaturthamsaClassical.hi'
import * as d9 from '@/lib/engine/locale/navamsha.hi'
import * as d12 from '@/lib/engine/locale/dwadashamsha.hi'
import * as d27 from '@/lib/engine/locale/nakshatramsha.hi'

const DEVANAGARI = /[ऀ-ॿ]/
const HOUSES = Array.from({ length: 12 }, (_, i) => i + 1)
const GRAHAS = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']
const slots = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(',')

function expectHindiTable(name: string, table: Record<string | number, string>, keys: (string | number)[]) {
  for (const k of keys) {
    const v = table[k]
    expect(typeof v, `${name}.${k}`).toBe('string')
    expect(DEVANAGARI.test(v), `${name}.${k} is Devanagari`).toBe(true)
  }
}

/** Every Hindi template is Devanagari (or pure punctuation/slots). */
function expectHindiTemplates(name: string, table: Record<string, string>) {
  for (const [k, v] of Object.entries(table)) {
    expect(DEVANAGARI.test(v) || /^[\s{}\w:·.,()/+-]*$/.test(v), `${name}.${k}`).toBe(true)
  }
}

/** Walk two outputs in parallel: non-string leaves must match exactly. */
function sameShape(en: unknown, hi: unknown, path = ''): void {
  if (typeof en === 'string') {
    expect(typeof hi, path).toBe('string')
    return
  }
  if (Array.isArray(en)) {
    expect(Array.isArray(hi), path).toBe(true)
    expect((hi as unknown[]).length, `${path}.length`).toBe(en.length)
    en.forEach((v, i) => sameShape(v, (hi as unknown[])[i], `${path}[${i}]`))
    return
  }
  if (en && typeof en === 'object') {
    for (const k of Object.keys(en)) sameShape((en as Record<string, unknown>)[k], (hi as Record<string, unknown>)[k], `${path}.${k}`)
    return
  }
  expect(hi, path).toEqual(en)
}

function collectStrings(x: unknown, out: string[] = []): string[] {
  if (typeof x === 'string') out.push(x)
  else if (Array.isArray(x)) x.forEach((v) => collectStrings(v, out))
  else if (x && typeof x === 'object') Object.values(x).forEach((v) => collectStrings(v, out))
  return out
}

describe('divisional Hindi tables', () => {
  it('D3 Drekkana tables are complete', () => {
    expectHindiTable('D3_HOUSE_THEMES_HI', d3.D3_HOUSE_THEMES_HI, HOUSES)
    expectHindiTable('D3_LAGNA_SIGN_FLAVOR_HI', d3.D3_LAGNA_SIGN_FLAVOR_HI, HOUSES)
    expectHindiTable('D3_LAGNA_PLANET_HI', d3.D3_LAGNA_PLANET_HI, GRAHAS)
    expectHindiTable('D3_EFFORT_LABEL_HI', d3.D3_EFFORT_LABEL_HI, ['partner', 'mother', 'family', 'father', 'children', 'friends', 'maternal'])
    expectHindiTemplates('D3_TEXT_HI', d3.D3_TEXT_HI)
  })
  it('D4 Chaturthamsha tables are complete', () => {
    expectHindiTable('D4_HOUSE_THEMES_HI', d4.D4_HOUSE_THEMES_HI, HOUSES)
    expectHindiTable('D4_LAGNA_SIGN_FLAVOR_HI', d4.D4_LAGNA_SIGN_FLAVOR_HI, HOUSES)
    expectHindiTable('D4_LAGNA_PLANET_HI', d4.D4_LAGNA_PLANET_HI, GRAHAS)
    expectHindiTemplates('D4_TEXT_HI', d4.D4_TEXT_HI)
    expectHindiTable('D4C_GRADE_HI', d4c.D4C_GRADE_HI, ['ordinary', 'comfortable', 'prosperous', 'royal'])
    expectHindiTable('D4C_OCCUPANT_HI', d4c.D4C_OCCUPANT_HI, GRAHAS)
    for (const h of HOUSES) {
      expect(DEVANAGARI.test(d4c.D4C_FOURTH_LORD_PHALA_HI[h].headline + d4c.D4C_FOURTH_LORD_PHALA_HI[h].prediction)).toBe(true)
    }
    expectHindiTemplates('D4C_TEXT_HI', d4c.D4C_TEXT_HI)
  })
  it('D9 Navamsha tables are complete', () => {
    expectHindiTable('D9_HOUSE_THEMES_HI', d9.D9_HOUSE_THEMES_HI, HOUSES)
    expectHindiTable('D9_LAGNA_THEMES_HI', d9.D9_LAGNA_THEMES_HI, HOUSES)
    expectHindiTable('D9_RASHI_FLAVOR_HI', d9.D9_RASHI_FLAVOR_HI, HOUSES)
    expectHindiTable('D9_SPOUSE_PHYSIQUE_HI', d9.D9_SPOUSE_PHYSIQUE_HI, HOUSES)
    expectHindiTable('D9_SPOUSE_TEMPERAMENT_HI', d9.D9_SPOUSE_TEMPERAMENT_HI, HOUSES)
    expectHindiTable('D9_VOCATION_HI', d9.D9_VOCATION_HI, HOUSES)
    expectHindiTable('D9_PLANET_THEMES_HI', d9.D9_PLANET_THEMES_HI, GRAHAS)
    const kinds = ['vargottama', 'opposing', 'shadashtaka', 'dwirdwadasa', 'trikona', 'kendra', 'upachaya', 'unclassified']
    expectHindiTable('D9_RELATION_NOTES_HI', d9.D9_RELATION_NOTES_HI, kinds)
    expectHindiTable('D9_RELATION_LABELS_HI', d9.D9_RELATION_LABELS_HI, kinds)
    // spouse traits split the English on ';' and strip ' energy' — Hindi keeps the same seams
    for (const h of HOUSES) expect(d9.D9_RASHI_FLAVOR_HI[h].endsWith(' ऊर्जा')).toBe(true)
    expectHindiTemplates('D9_TEXT_HI', d9.D9_TEXT_HI)
  })
  it('D12 / D27 tables are complete', () => {
    expectHindiTable('D12_HOUSE_THEMES_HI', d12.D12_HOUSE_THEMES_HI, HOUSES)
    expectHindiTable('D12_LAGNA_SIGN_FLAVOR_HI', d12.D12_LAGNA_SIGN_FLAVOR_HI, HOUSES)
    expectHindiTable('D12_LAGNA_PLANET_HI', d12.D12_LAGNA_PLANET_HI, GRAHAS)
    for (const g of GRAHAS) expect(DEVANAGARI.test(d12.D12_THIRST_HI[g].lack + d12.D12_THIRST_HI[g].chase)).toBe(true)
    expectHindiTemplates('D12_TEXT_HI', d12.D12_TEXT_HI)
    expectHindiTable('D27_HOUSE_THEMES_HI', d27.D27_HOUSE_THEMES_HI, HOUSES)
    expectHindiTable('D27_ASK_THEME_HI', d27.D27_ASK_THEME_HI, HOUSES)
    expectHindiTable('D27_LAGNA_SIGN_FLAVOR_HI', d27.D27_LAGNA_SIGN_FLAVOR_HI, HOUSES)
    expectHindiTable('D27_LAGNA_PLANET_HI', d27.D27_LAGNA_PLANET_HI, GRAHAS)
    expectHindiTemplates('D27_TEXT_HI', d27.D27_TEXT_HI)
  })
})

describe('divisional engines in Hindi', () => {
  const charts: ChartOutput[] = []
  beforeAll(async () => {
    const { calculateChart } = await import('@/lib/engine/calculator')
    const births = [
      ['1990-05-15', '05:00:00', 28.61, 77.21],
      ['1972-11-23', '18:10:00', 22.57, 88.36],
      ['2004-12-31', '14:20:00', 12.97, 77.59],
    ] as const
    for (const [d, t, lat, lng] of births) {
      charts.push(await calculateChart({
        name: 'T', birthDate: d, birthTime: t, utcDate: d, utcTime: t,
        birthPlace: 'X', latitude: lat, longitude: lng, timezone: 'UTC', gender: 'male',
      }, 'platinum'))
    }
  }, 60_000)

  it('keeps ids, numbers and enums; English is the default', async () => {
    const { analyzeDrekkana } = await import('@/lib/engine/drekkanaAnalysis')
    const { analyzeChaturthamsa } = await import('@/lib/engine/chaturthamsaAnalysis')
    const { buildChaturthamsaClassical } = await import('@/lib/engine/chaturthamsaClassical')
    const { analyzeNavamsha } = await import('@/lib/engine/navamshaAnalysis')
    const { analyzeDwadashamsha } = await import('@/lib/engine/dwadashamshaAnalysis')
    const { analyzeNakshatramsha } = await import('@/lib/engine/nakshatramshaAnalysis')
    for (const chart of charts) {
      const runs: [string, (lang?: 'en' | 'hi') => unknown][] = [
        ['D3', (l) => analyzeDrekkana(chart, l)],
        ['D4', (l) => analyzeChaturthamsa(chart, l)],
        ['D9', (l) => analyzeNavamsha(chart, l)],
        ['D12', (l) => analyzeDwadashamsha(chart, l)],
        ['D27', (l) => analyzeNakshatramsha(chart, l)],
      ]
      for (const [name, run] of runs) {
        const en = run()
        expect(en, name).not.toBeNull()
        expect(JSON.stringify(run('en')), `${name} default is English`).toBe(JSON.stringify(en))
        const hi = run('hi')
        sameShape(en, hi, name)
        // Most display strings are Devanagari (ids and enums stay Latin).
        const prose = collectStrings(hi).filter((s) => s.length > 25)
        const latinOnly = prose.filter((s) => !DEVANAGARI.test(s))
        expect(latinOnly, `${name} Latin-only prose`).toEqual([])
      }
      // D4 classical: same scores/grades/ids; Hindi classical notes are one summary per list
      const a4en = analyzeChaturthamsa(chart)!
      const a4hi = analyzeChaturthamsa(chart, 'hi')!
      const cen = buildChaturthamsaClassical(a4en, chart)!
      const chi = buildChaturthamsaClassical(a4hi, chart, 'hi')!
      expect(chi.sukhaphala.score).toBe(cen.sukhaphala.score)
      expect(chi.sukhaphala.grade).toBe(cen.sukhaphala.grade)
      expect(chi.yogas.map((y) => [y.id, y.formed, y.tone])).toEqual(cen.yogas.map((y) => [y.id, y.formed, y.tone]))
      expect(chi.phala.map((p) => [p.id, p.d4House, p.priority])).toEqual(cen.phala.map((p) => [p.id, p.d4House, p.priority]))
      const prose = collectStrings({ ...chi, sources: [] }).filter((s) => s.length > 25)
      expect(prose.filter((s) => !DEVANAGARI.test(s))).toEqual([])
    }
  })

  it('English templates carry the same slots as Hindi', async () => {
    // Templates are built with fill(); a slot missing in Hindi would print literally.
    const mods = [d3.D3_TEXT_HI, d4.D4_TEXT_HI, d4c.D4C_TEXT_HI, d9.D9_TEXT_HI, d12.D12_TEXT_HI, d27.D27_TEXT_HI]
    for (const t of mods) for (const v of Object.values(t)) expect(v.includes('{') ? slots(v).length > 0 : true).toBe(true)
  })
})
