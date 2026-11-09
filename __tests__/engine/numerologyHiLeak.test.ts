// Hindi numerology prose must not leak long English when lang=hi.
// Number ids, graha codes, harmony enums and yoga quality stay English.

import { describe, expect, it } from 'vitest'
import type { DashaNode } from '@/types/astrology'
import { buildNumerologyCore } from '@/lib/engine/numerology/calc'
import { getCompoundMeaning, getNumberProfile } from '@/lib/engine/numerology/data'
import { getLifeAreaPredictions } from '@/lib/engine/numerology/predictions'
import { buildNumerologyPremium } from '@/lib/engine/numerology/report'
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
})
