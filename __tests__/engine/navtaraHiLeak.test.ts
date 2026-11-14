// Hindi Navtara prediction must not leak long English prose when lang=hi.
// Ids, tara names and tone enums stay English.

import { describe, expect, it } from 'vitest'
import type { ChartOutput, DashaNode, GrahaData, GrahaId } from '@/types/astrology'
import { TARA_NAMES, type TaraName } from '@/lib/engine/nakshatraAdvanced'
import {
  buildGocharaNavtaraReport,
  checkMuhurtaNavtara,
  getNavtaraPrediction,
  getRelationshipNavtara,
  getTaraFromBirth,
  localizeTaraProfile,
  TARA_DECISION_PROFILES,
} from '@/lib/engine/navtaraPrediction'

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
  if (tokens.every(w => GRAHA_CODE.test(w) || /^H\d+$/.test(w))) return true
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

function graha(id: GrahaId, nak: number): GrahaData {
  return {
    id,
    name: id,
    nakshatraIndex: nak,
    nakshatraName: `Nak${nak}`,
    pada: 1,
  } as unknown as GrahaData
}

function dasha(lord: GrahaId, start: string, end: string, children: DashaNode[] = []): DashaNode {
  return { lord, level: 1, start: new Date(start), end: new Date(end), children } as unknown as DashaNode
}

function chart(vim: DashaNode[], nak = 17): Pick<ChartOutput, 'grahas' | 'dashas' | 'panchang'> {
  return {
    grahas: [graha('Mo', nak), graha('Ve', 19), graha('Ju', 24), graha('Sa', 21)],
    panchang: { nakshatra: { index: nak } },
    dashas: { vimshottari: vim },
  } as unknown as Pick<ChartOutput, 'grahas' | 'dashas' | 'panchang'>
}

const NOW = new Date('2026-06-01T00:00:00Z')

describe('navtara Hindi leak', () => {
  it('keeps tara ids and English prose on the default path', () => {
    const en = getNavtaraPrediction(
      chart([
        dasha('Ve', '2017-01-01', '2037-01-01', [
          dasha('Su', '2025-01-01', '2027-01-01'),
        ]),
      ]),
      NOW,
    )
    expect(en.current.maha?.tara).toBe('Janma')
    expect(en.current.synthesis).toContain('Mahadasha')
    expect(en.current.synthesis).toContain('Navtara shows experience nature')
    expect(en.current.decisionAdvice).toContain('Act in keeping with your nature')
    expect(getTaraFromBirth(17, 19).name).toBe('Vipat')
    expect(getTaraFromBirth(17, 19).isHard).toBe(true)
    expect(getTaraFromBirth(17, 19).shortLabel).toBe(TARA_DECISION_PROFILES.Vipat.shortLabel)
  })

  it('does not leak long English prose when lang=hi', () => {
    const blobs: unknown[] = []

    for (const tara of TARA_NAMES) {
      blobs.push(localizeTaraProfile(TARA_DECISION_PROFILES[tara], 'hi'))
    }
    blobs.push(getTaraFromBirth(0, 2, 'hi'))
    blobs.push(getTaraFromBirth(0, 4, 'hi'))
    blobs.push(getTaraFromBirth(0, 6, 'hi'))
    blobs.push(getTaraFromBirth(0, 8, 'hi'))

    const bothHard = chart([
      dasha('Ve', '2000-01-01', '2010-01-01'),
      dasha('Mo', '2020-01-01', '2030-01-01', [
        dasha('Ra', '2025-01-01', '2027-01-01'),
      ]),
    ])
    const hardSoft = chart([
      dasha('Ve', '2000-01-01', '2010-01-01'),
      dasha('Mo', '2020-01-01', '2030-01-01', [
        dasha('Ke', '2025-01-01', '2027-01-01'),
      ]),
    ])
    const softHard = chart([
      dasha('Ve', '2017-01-01', '2037-01-01', [
        dasha('Ra', '2025-01-01', '2027-01-01'),
      ]),
    ])
    const bothSoft = chart([
      dasha('Ve', '2017-01-01', '2037-01-01', [
        dasha('Su', '2025-01-01', '2027-01-01'),
      ]),
    ])
    const mahaOnly = chart([dasha('Ve', '2017-01-01', '2037-01-01')])
    const noDasha = chart([])

    for (const c of [bothHard, hardSoft, softHard, bothSoft, mahaOnly, noDasha]) {
      const hi = getNavtaraPrediction(c, NOW, 'hi')
      const en = getNavtaraPrediction(c, NOW)
      blobs.push(hi)
      expect(hi.current.maha?.tara).toBe(en.current.maha?.tara)
      expect(hi.current.antar?.tara).toBe(en.current.antar?.tara)
      expect(hi.current.experienceTone).toBe(en.current.experienceTone)
      expect(hi.reducedResultLords).toEqual(en.reducedResultLords)
      expect(hi.natalPlanets.map(p => p.tara)).toEqual(en.natalPlanets.map(p => p.tara))
      expect(hi.natalPlanets.map(p => p.resultCapacity)).toEqual(en.natalPlanets.map(p => p.resultCapacity))
    }

    const hiPred = getNavtaraPrediction(bothSoft, NOW, 'hi')
    expect(hiPred.current.synthesis).not.toContain('Mahadasha')
    expect(hiPred.current.synthesis).toContain('महादशा')
    expect(hiPred.current.maha?.profile.name).toBe('Janma')
    expect(hiPred.current.maha?.profile.isHard).toBe(false)
    expect(DEVANAGARI.test(hiPred.current.maha?.profile.experience ?? '')).toBe(true)

    blobs.push(buildGocharaNavtaraReport(17, [], [], '2026-06-01', 'hi'))
    blobs.push(buildGocharaNavtaraReport(
      17,
      [{ id: 'Mo', nakshatraIndex: 19, nakshatraName: 'Purva Ashadha' }],
      [],
      '2026-06-01',
      'hi',
    ))
    blobs.push(buildGocharaNavtaraReport(
      17,
      [{ id: 'Ju', nakshatraIndex: 24, nakshatraName: 'Purva Bhadra' }],
      ['Ju'],
      '2026-06-01',
      'hi',
    ))
    blobs.push(buildGocharaNavtaraReport(
      17,
      [
        { id: 'Mo', nakshatraIndex: 19, nakshatraName: 'Purva Ashadha' },
        { id: 'Ma', nakshatraIndex: 19, nakshatraName: 'Purva Ashadha' },
        { id: 'Ju', nakshatraIndex: 24, nakshatraName: 'Purva Bhadra' },
      ],
      ['Ma', 'Ju'],
      '2026-06-01',
      'hi',
    ))

    const enGo = buildGocharaNavtaraReport(
      17,
      [{ id: 'Mo', nakshatraIndex: 19, nakshatraName: 'Purva Ashadha' }],
      ['Ju'],
      '2026-06-01',
    )
    expect(enGo.summary).toContain('Transit Moon')
    expect(enGo.moonTara?.tara).toBe('Vipat')
    expect(enGo.moonTara?.eventLikelihood).toBe('energy-only')

    for (const day of [17, 18, 19]) {
      blobs.push(checkMuhurtaNavtara(17, day, 'वाहन', 'hi'))
      blobs.push(checkMuhurtaNavtara(17, day, undefined, 'hi'))
    }
    const enMuh = checkMuhurtaNavtara(17, 19, 'vehicle delivery')
    expect(enMuh.verdict).toBe('avoid')
    expect(enMuh.advice).toContain('postpone booking')
    expect(enMuh.profile.shortLabel).toBe('Crisis & struggle')

    blobs.push(getRelationshipNavtara(17, 17, 'You', 'Other', 'hi'))
    blobs.push(getRelationshipNavtara(17, 18, 'You', 'Other', 'hi'))
    blobs.push(getRelationshipNavtara(17, 21, 'You', 'Other', 'hi'))
    const enRel = getRelationshipNavtara(17, 21, 'A', 'B')
    expect(enRel.aToB.tara).toBe('Pratyari')
    expect(enRel.advice).toContain('hard tara window')
    expect(enRel.aToB.profile.name).toBe('Pratyari' satisfies TaraName)

    const leaks = findEnglishLeaks(collectStrings(blobs))
    expect(leaks).toEqual([])
  })
})
