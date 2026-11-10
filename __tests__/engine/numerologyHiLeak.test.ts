// Hindi numerology prose must not leak long English when lang=hi.
// Number ids, graha codes, harmony enums and yoga quality stay English.

import { describe, expect, it } from 'vitest'
import type { DashaNode } from '@/types/astrology'
import { buildNumerologyCore } from '@/lib/engine/numerology/calc'
import { getCompoundMeaning, getNumberProfile } from '@/lib/engine/numerology/data'
import { getLifeAreaPredictions } from '@/lib/engine/numerology/predictions'
import { buildNumerologyPremium } from '@/lib/engine/numerology/report'
import {
  buildInclusionTable,
  getCheiroLabels,
  getDailyAnkaMuhurta,
  getHealthAlerts,
  getLagnaNumber,
  getMarriageTimingYears,
  getNakshatraLetterBridge,
  getNumberFriendshipMode,
  getVastuKuaHints,
  getYantraPacks,
  getYearGocharaHint,
  scoreBrandOrSignature,
  scoreDevanagariName,
  suggestPlateEndings,
} from '@/lib/engine/numerology/advanced'
import { buildDashaNumberBridge, matchBusinessPartners, suggestBabyNames } from '@/lib/engine/numerology/tools'

function collectStrings(x: unknown, out: string[] = []): string[] {
  if (typeof x === 'string') out.push(x)
  else if (Array.isArray(x)) x.forEach(v => collectStrings(v, out))
  else if (x && typeof x === 'object') Object.values(x).forEach(v => collectStrings(v, out))
  return out
}

const DEVANAGARI = /[\u0900-\u097F]/
const LATIN_WORD = /[A-Za-z]{4,}/

function isAllowedLatin(s: string): boolean {
  const t = s.trim()
  if (t.length < 25) return true
  if (DEVANAGARI.test(t)) return true
  if (!LATIN_WORD.test(t)) return true
  return false
}

function findEnglishLeaks(strings: string[]): string[] {
  return [...new Set(strings.filter(s => !isAllowedLatin(s)).map(s => s.slice(0, 180)))]
}

describe('numerology Hindi leak', () => {
  it('keeps the English profile, compound and life-area strings when lang is omitted', () => {
    expect(getNumberProfile(1).planet).toBe('Sun')
    expect(getNumberProfile(1).nature).toContain('Independent')
    expect(getLifeAreaPredictions(1, 6)[0]?.summary).toBe('Born to lead and initiate.')
    expect(getCompoundMeaning(10)?.title).toBe('Wheel of Fortune')
  })

  it('localizes a full core + premium reading without long English prose', () => {
    const core = buildNumerologyCore({
      birthDate: '1992-03-19',
      name: 'Rahul Sharma',
      gender: 'male',
      lang: 'hi',
      today: { year: 2026, month: 6, day: 1 },
    })
    expect(core).not.toBeNull()
    const profile = getNumberProfile(core!.moolank.value, 'hi')
    expect(profile.number).toBe(core!.moolank.value)
    expect(profile.graha).toBe(getNumberProfile(core!.moolank.value).graha)
    expect(profile.planet).not.toBe(getNumberProfile(core!.moolank.value).planet)
    const premium = buildNumerologyPremium(core!, 'hi')
    const baby = suggestBabyNames({ babyDob: '2024-08-15', candidateName: 'Aryan', lang: 'hi' })
    const partners = matchBusinessPartners(
      { label: '', birthDate: '1992-03-19' },
      { label: '', birthDate: '1990-11-29' },
      'hi',
    )
    const leaks = findEnglishLeaks(collectStrings({ core, premium, baby, partners }))
    expect(leaks).toEqual([])
    expect(premium.predictions.lifeAreas[0]?.id).toBe(getLifeAreaPredictions(1, 6)[0]?.id)
    expect(premium.predictions.yogas.every(y => ['raj', 'dhana', 'mixed', 'dosha'].includes(y.quality))).toBe(true)
  })

  it('localizes the dasha bridge and still matches the English amplification', () => {
    const now = Date.parse('2026-06-15T12:00:00Z')
    const tree: DashaNode[] = [
      {
        lord: 'Ju',
        start: new Date('2020-01-01'),
        end: new Date('2036-01-01'),
        durationMs: 1,
        level: 1,
        isCurrent: true,
        children: [
          {
            lord: 'Ve',
            start: new Date('2025-01-01'),
            end: new Date('2027-01-01'),
            durationMs: 1,
            level: 2,
            isCurrent: true,
            children: [],
          },
        ],
      },
      {
        lord: 'Sa',
        start: new Date('2036-01-01'),
        end: new Date('2055-01-01'),
        durationMs: 1,
        level: 1,
        isCurrent: false,
        children: [],
      },
    ]
    const en = buildDashaNumberBridge({
      vimshottari: tree, moolank: 3, bhagyank: 6, personalYear: 3, now,
    })!
    expect(en.amplification).toMatch(/Personal year 3 matches Mahadasha/)
    const hi = buildDashaNumberBridge({
      vimshottari: tree, moolank: 3, bhagyank: 6, personalYear: 3, now, lang: 'hi',
    })!
    expect(hi.current[0]?.lord).toBe('Ju')
    expect(hi.current[0]?.number).toBe(3)
    expect(findEnglishLeaks(collectStrings(hi))).toEqual([])
  })

  it('localizes advanced Anka tools without long English prose', () => {
    const friendship = getNumberFriendshipMode(2, 'indian')
    const advanced = {
      cheiro: getCheiroLabels(2, 5, 'hi'),
      lagna: getLagnaNumber(5, 'hi'),
      inclusion: buildInclusionTable({ 1: 0, 2: 1, 3: 2, 4: 3, 5: 0, 6: 1, 7: 0, 8: 2, 9: 1 }, 'hi'),
      health: getHealthAlerts({
        moolank: 2,
        missing: [3, 8],
        personalYear: 8,
        enemiesOfMoolank: friendship.enemies,
        lang: 'hi',
      }),
      marriage: getMarriageTimingYears({
        yourDob: { year: 1992, month: 3, day: 19 },
        partnerDob: { year: 1994, month: 7, day: 11 },
        fromYear: 2026,
        count: 4,
        lang: 'hi',
      }),
      brand: scoreBrandOrSignature('Vedaansh Studio', 1, 3, 'hi'),
      plates: suggestPlateEndings(1, 3, 4, 'hi'),
      nak: getNakshatraLetterBridge(0, 1, 'hi'),
      daily: getDailyAnkaMuhurta({
        birth: { year: 1992, month: 3, day: 19 },
        moolank: 2,
        bhagyank: 5,
        today: { year: 2026, month: 6, day: 1 },
        lang: 'hi',
      }),
      yantras: getYantraPacks([1, 8], 'hi'),
      vastu: getVastuKuaHints({
        moolank: 2,
        kua: { value: 2, directions: { success: 'उत्तर', health: 'पूर्व', love: 'पश्चिम', growth: 'दक्षिण' } },
        lang: 'hi',
      }),
      gochara: getYearGocharaHint(3, 'hi'),
      devanagari: scoreDevanagariName('वेदांश', 1, 3, 'hi'),
    }
    expect(advanced.cheiro.note).toMatch(/चेरो/)
    expect(advanced.lagna.rashiName).toBe('सिंह')
    expect(advanced.yantras[0]?.yantraName).toBe('सूर्य यंत्र')
    expect(advanced.nak.nakshatraName).toBe('अश्विनी')
    expect(findEnglishLeaks(collectStrings(advanced))).toEqual([])
  })
})
