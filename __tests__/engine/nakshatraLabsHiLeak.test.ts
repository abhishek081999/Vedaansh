// Hindi nakshatra lab outputs must not leak long English prose when lang=hi.

import { describe, it, expect, beforeAll } from 'vitest'
import type { ChartOutput } from '@/types/astrology'
import { calculateChart } from '@/lib/engine/calculator'
import { analyzeTaramandalChart } from '@/lib/engine/nakshatraTaramandal'
import {
  buildCareerFormula,
  ganaCareerInfo,
  getCareerIndicators,
  getFunctionalGroupForNakshatra,
  getMatchingCombosForChart,
  getNakshatraProfession,
  listAriesPadaComparison,
  listAshwiniPadaDetails,
  listCareerDiagnosis,
  listNakshatraLordChain,
  listPlanetCareerSkills,
  listPlanetNakshatraCareerCombos,
  listProfessionFunctionalGroups,
  padaCareerStyle,
} from '@/lib/engine/nakshatraProfession'
import {
  doshaMedicalInfo,
  getAfflictedMedicalHits,
  getMedicalIndicators,
  getNakshatraMedical,
} from '@/lib/engine/nakshatraMedical'
import type { CareerGana } from '@/lib/engine/nakshatraProfession'
import type { MedicalDosha } from '@/lib/engine/nakshatraMedical'
import type { Rashi } from '@/types/astrology'

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
  if (GRAHA_CODE.test(t)) return true
  return false
}

function findEnglishLeaks(strings: string[]): string[] {
  const leaks: string[] = []
  for (const s of strings) {
    if (isAllowedLatin(s)) continue
    if (LATIN_WORD.test(s)) leaks.push(s.slice(0, 180))
  }
  return [...new Set(leaks)]
}

function expectHindi(label: string, value: unknown) {
  const strings = collectStrings(value)
  expect(strings.some(s => DEVANAGARI.test(s)), `${label} should include Devanagari`).toBe(true)
  const leaks = findEnglishLeaks(strings)
  expect(leaks, `${label} English leaks (${leaks.length}):\n${leaks.join('\n---\n')}`).toEqual([])
}

let chart: ChartOutput

beforeAll(async () => {
  chart = await calculateChart({
    name: 'Aarav',
    birthDate: '1990-05-15',
    birthTime: '10:30',
    utcDate: '1990-05-15',
    utcTime: '05:00:00',
    birthPlace: 'New Delhi',
    latitude: 28.61,
    longitude: 77.21,
    timezone: 'Asia/Kolkata',
    gender: 'male',
  })
})

describe('nakshatra labs Hindi leak', () => {
  it('analyzeTaramandalChart (lang=hi) avoids English sentence leaks', () => {
    const reading = analyzeTaramandalChart(chart, 'hi')
    expect(reading.birthNakshatraName).toMatch(DEVANAGARI)
    expectHindi('taramandal', reading)
    expect(analyzeTaramandalChart(chart).insight).toMatch(/Janma nakshatra/)
  })

  it('profession getters (lang=hi) avoid English sentence leaks', () => {
    const bag: unknown[] = [
      getCareerIndicators(chart, 'hi'),
      buildCareerFormula(chart, 'hi'),
      getMatchingCombosForChart(chart, 'hi'),
      listProfessionFunctionalGroups('hi'),
      listAshwiniPadaDetails('hi'),
      listAriesPadaComparison('hi'),
      listPlanetCareerSkills('hi'),
      listPlanetNakshatraCareerCombos('hi'),
      listCareerDiagnosis('hi'),
      listNakshatraLordChain('hi'),
    ]
    for (let i = 0; i < 27; i++) {
      bag.push(getNakshatraProfession(i, 'hi'))
      const group = getFunctionalGroupForNakshatra(i, 'hi')
      if (group) bag.push(group)
    }
    for (const gana of ['Deva', 'Manushya', 'Rakshasa'] as CareerGana[]) bag.push(ganaCareerInfo(gana, 'hi'))
    for (let r = 1; r <= 12; r++) bag.push(padaCareerStyle(r as Rashi, 'hi'))
    expectHindi('profession', bag)
    expect(getNakshatraProfession(3).hiddenPower).toContain('Wealth')
    expect(getNakshatraProfession(3).gana).toBe('Manushya')
  })

  it('medical getters (lang=hi) avoid English sentence leaks', () => {
    const bag: unknown[] = [
      getMedicalIndicators(chart, 'hi'),
      getAfflictedMedicalHits(chart, 'hi'),
    ]
    for (let i = 0; i < 27; i++) bag.push(getNakshatraMedical(i, 'hi'))
    for (const d of ['Vata', 'Pitta', 'Kapha'] as MedicalDosha[]) bag.push(doshaMedicalInfo(d, 'hi'))
    expectHindi('medical', bag)
    expect(getNakshatraMedical(0).dosha).toBe('Vata')
    expect(getNakshatraMedical(0).deity.toLowerCase()).toContain('ashwini')
    expect(getNakshatraMedical(14, 'hi').dosha).toBe('Kapha')
  })
})
