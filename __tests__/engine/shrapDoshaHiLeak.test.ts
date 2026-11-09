// Hindi Shrap / Dosha text must not leak long English prose when lang=hi.
// Dosha ids and severity enums stay English and match the default path.

import { describe, expect, it } from 'vitest'
import type { ChartOutput, Dignity, DashaNode, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { analyzeShrapDosha } from '@/lib/engine/shrapDosha'
import { analyzeMatruDosha, analyzePitruDosha } from '@/lib/engine/shrap/pitruMatru'
import {
  analyzeBrahminDosha,
  analyzeGuruDosha,
  analyzeSarpaDosha,
  analyzeStriKanyaDosha,
} from '@/lib/engine/shrap/sarpaGuruStri'
import { analyzeAddictionSignatures, analyzeChildrenFocus } from '@/lib/engine/shrap/childrenAddiction'
import { analyzeJupiterRemedyTiming, analyzeLendingRisk } from '@/lib/engine/shrap/financeJupiter'

function collectStrings(x: unknown, out: string[] = []): string[] {
  if (typeof x === 'string') out.push(x)
  else if (Array.isArray(x)) x.forEach(v => collectStrings(v, out))
  else if (x && typeof x === 'object') Object.values(x).forEach(v => collectStrings(v, out))
  return out
}

const DEVANAGARI = /[\u0900-\u097F]/
const LATIN_WORD = /[A-Za-z]{4,}/
const GRAHA_CODE = /^(Su|Mo|Ma|Me|Ju|Ve|Sa|Ra|Ke)$/

function isAllowedLatin(s: string): boolean {
  const t = s.trim()
  if (t.length < 25) return true
  if (DEVANAGARI.test(t)) return true
  if (!LATIN_WORD.test(t)) return true
  const tokens = t.split(/\s+/).filter(Boolean)
  if (tokens.every(w => GRAHA_CODE.test(w) || /^H\d+$/.test(w) || /^D\d+$/.test(w))) return true
  return false
}

function findEnglishLeaks(strings: string[]): string[] {
  const leaks: string[] = []
  for (const s of strings) {
    if (isAllowedLatin(s)) continue
    leaks.push(s.slice(0, 180))
  }
  return [...new Set(leaks)]
}

function graha(id: GrahaId, rashi: Rashi, extra: Partial<GrahaData> = {}): GrahaData {
  return {
    id,
    name: id,
    rashi,
    nakshatraIndex: 3,
    nakshatraName: 'Rohini',
    isCombust: false,
    isRetro: false,
    speed: 1,
    dignity: 'neutral' as Dignity,
    ...extra,
  } as unknown as GrahaData
}

function dasha(lord: GrahaId, start: string, end: string): DashaNode {
  return { lord, level: 1, start: new Date(start), end: new Date(end), children: [] } as unknown as DashaNode
}

function chartWith(grahas: GrahaData[], extra: Record<string, unknown> = {}, ascRashi: Rashi = 1): ChartOutput {
  return {
    grahas,
    lagnas: { ascRashi },
    dashas: { vimshottari: [] },
    yogas: [],
    vargas: {},
    vargaLagnas: {},
    ...extra,
  } as unknown as ChartOutput
}

const NOW = new Date('2026-06-01T00:00:00Z').getTime()

describe('shrap dosha Hindi leak', () => {
  it('keeps English prose and kal-sarp wording on the default path', () => {
    const en = analyzeShrapDosha(chartWith([
      graha('Su', 7, { dignity: 'debilitated' }),
      graha('Ra', 7),
      graha('Ke', 1),
      graha('Mo', 2),
      graha('Ju', 9),
      graha('Ve', 3),
      graha('Ma', 4),
      graha('Me', 5),
      graha('Sa', 10),
    ]))!
    expect(en.headline).toMatch(/dosha/)
    expect(en.doshas.find(d => d.id === 'sarpa')!.indicators.some(i => i.text.toLowerCase().includes('kal sarp'))).toBe(true)
    expect(en.teachingNote).toContain('BPHS')
  })

  it('does not leak long English prose when lang=hi', () => {
    const blobs: unknown[] = []

    const pitru = chartWith([
      graha('Su', 7, { dignity: 'debilitated' }),
      graha('Ra', 7),
      graha('Ke', 1),
      graha('Mo', 8, { dignity: 'debilitated', isCombust: true }),
      graha('Ju', 7, { dignity: 'debilitated' }),
      graha('Ve', 7, { dignity: 'debilitated' }),
      graha('Ma', 9),
      graha('Me', 5, { isCombust: true }),
      graha('Sa', 9),
    ], {
      vargas: { D9: [graha('Su', 9), graha('Ra', 9), graha('Ju', 9), graha('Ve', 9)] },
      vargaLagnas: { D9: 1 as Rashi },
    })

    const sarpa = chartWith(
      [
        graha('Ra', 5),
        graha('Ke', 11),
        graha('Su', 1),
        graha('Mo', 4, { dignity: 'debilitated' }),
        graha('Ju', 9, { dignity: 'enemy' }),
        graha('Ve', 3),
        graha('Ma', 4),
        graha('Me', 6),
        graha('Sa', 4),
      ],
      {
        vargas: {
          D7: [
            graha('Ra', 5),
            graha('Ke', 11),
            graha('Su', 1),
            graha('Mo', 2),
            graha('Ju', 3),
            graha('Ve', 4),
            graha('Ma', 6),
            graha('Me', 7),
            graha('Sa', 8),
          ],
        },
        vargaLagnas: { D7: 1 as Rashi },
      },
    )

    const packed = chartWith(
      [
        graha('Ra', 10),
        graha('Ve', 10, { dignity: 'debilitated' }),
        graha('Sa', 10),
        graha('Me', 10),
        graha('Ma', 10),
        graha('Mo', 10, { dignity: 'debilitated', isCombust: true }),
        graha('Ju', 10, { dignity: 'debilitated' }),
        graha('Su', 1),
        graha('Ke', 4),
      ],
      {
        dashas: {
          vimshottari: [dasha('Ma', '2020-01-01', '2030-01-01')],
        },
      },
    )

    const lend = chartWith([
      graha('Ju', 6, { dignity: 'debilitated', isRetro: true, isCombust: true }),
      graha('Ma', 6),
      graha('Ra', 6),
      graha('Ke', 12),
      graha('Su', 6),
      graha('Mo', 2),
      graha('Me', 3),
      graha('Ve', 4),
      graha('Sa', 8),
    ])

    const jupiterLong = chartWith([
      graha('Ju', 1, { dignity: 'friend', isRetro: true }),
      graha('Su', 5),
      graha('Mo', 2),
      graha('Ma', 3),
      graha('Me', 4),
      graha('Ve', 7),
      graha('Sa', 8),
      graha('Ra', 9),
      graha('Ke', 3),
    ])

    const jupiterStd = chartWith([
      graha('Ju', 4, { dignity: 'exalted' }),
      graha('Su', 1),
      graha('Mo', 2),
      graha('Ma', 3),
      graha('Me', 5),
      graha('Ve', 7),
      graha('Sa', 8),
      graha('Ra', 9),
      graha('Ke', 3),
    ])

    const quiet = chartWith([
      graha('Mo', 2),
      graha('Me', 3),
      graha('Ve', 5),
      graha('Ju', 9, { dignity: 'exalted' }),
    ])

    const focus = chartWith(
      [
        graha('Me', 12, { isCombust: true }),
        graha('Sa', 5),
        graha('Ma', 1),
        graha('Su', 2),
        graha('Mo', 3),
        graha('Ju', 9),
        graha('Ve', 7),
        graha('Ra', 8),
        graha('Ke', 2),
      ],
      { dashas: { vimshottari: [dasha('Ma', '2020-01-01', '2030-01-01')] } },
    )

    const charts = [pitru, sarpa, packed, lend, jupiterLong, jupiterStd, quiet, focus]
    for (const c of charts) {
      const hi = analyzeShrapDosha(c, NOW, 'hi')!
      const en = analyzeShrapDosha(c, NOW)!
      blobs.push(hi)
      expect(hi.doshas.map(d => d.id)).toEqual(en.doshas.map(d => d.id))
      expect(hi.doshas.map(d => d.severity)).toEqual(en.doshas.map(d => d.severity))
      expect(hi.doshas.map(d => d.present)).toEqual(en.doshas.map(d => d.present))
      expect(hi.presentCount).toBe(en.presentCount)
      if (hi.jupiterRemedy && en.jupiterRemedy) {
        expect(hi.jupiterRemedy.recommendedDays).toBe(en.jupiterRemedy.recommendedDays)
        expect(hi.jupiterRemedy.conditionTable.map(row => row.active)).toEqual(
          en.jupiterRemedy.conditionTable.map(row => row.active),
        )
      }
      if (hi.addiction && en.addiction) {
        expect(hi.addiction.severity).toBe(en.addiction.severity)
        expect(hi.addiction.combinations.map(x => x.id)).toEqual(en.addiction.combinations.map(x => x.id))
      }
    }

    const bare = { grahas: [], lagnas: { ascRashi: 1 } } as unknown as ChartOutput
    blobs.push(analyzePitruDosha(bare, 'hi'))
    blobs.push(analyzeMatruDosha(bare, 'hi'))
    blobs.push(analyzeSarpaDosha({ grahas: [graha('Su', 1)] } as unknown as ChartOutput, 'hi'))
    blobs.push(analyzeGuruDosha(bare, 'hi'))
    blobs.push(analyzeBrahminDosha(bare, 'hi'))
    blobs.push(analyzeStriKanyaDosha(bare, 'hi'))
    blobs.push(analyzeChildrenFocus(focus, NOW, 'hi'))
    blobs.push(analyzeChildrenFocus(quiet, NOW, 'hi'))
    blobs.push(analyzeAddictionSignatures(packed, NOW, 'hi'))
    blobs.push(analyzeAddictionSignatures(quiet, NOW, 'hi'))
    blobs.push(analyzeLendingRisk(lend, 'hi'))
    blobs.push(analyzeLendingRisk(quiet, 'hi'))
    blobs.push(analyzeJupiterRemedyTiming(lend, 'hi'))
    blobs.push(analyzeJupiterRemedyTiming(jupiterLong, 'hi'))
    blobs.push(analyzeJupiterRemedyTiming(jupiterStd, 'hi'))

    const hiPitru = analyzeShrapDosha(pitru, NOW, 'hi')!
    expect(hiPitru.doshas.find(d => d.id === 'pitru')!.label).toBe('पितृ दोष')
    expect(hiPitru.teachingNote).not.toContain('BPHS')
    expect(DEVANAGARI.test(hiPitru.headline)).toBe(true)

    const leaks = findEnglishLeaks(collectStrings(blobs))
    expect(leaks).toEqual([])
  })
})
