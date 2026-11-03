// __tests__/engine/numerologyDepth.test.ts
// Compound > 52, core/premium split, Katapayadi, transliteration,
// name depth, spelling comparison and Pythagorean arrows.
import { describe, it, expect } from 'vitest'
import { buildNumerologyCore, getNameNumber, parseBirthDate } from '@/lib/engine/numerology/calc'
import { buildNumerologyReport } from '@/lib/engine/numerology/report'
import { compoundReadAs, getCompoundMeaning } from '@/lib/engine/numerology/data'
import { devanagariToLatin, getKatapayadi, hasDevanagari } from '@/lib/engine/numerology/devanagari'
import { compareNameSpellings, getNameDepth } from '@/lib/engine/numerology/nameDepth'
import { getPythagoreanArrows } from '@/lib/engine/numerology/arrows'
import { reduceToCore } from '@/lib/engine/numerology/core'

describe('compound meanings above 52', () => {
  it('steps down by 9, keeping the root', () => {
    expect(compoundReadAs(52)).toBe(52)
    expect(compoundReadAs(53)).toBe(44)
    expect(compoundReadAs(72)).toBe(45)
    expect(compoundReadAs(100)).toBe(46)
    for (let n = 53; n <= 150; n++) {
      expect(reduceToCore(compoundReadAs(n))).toBe(reduceToCore(n))
      expect(getCompoundMeaning(n)).not.toBeNull()
    }
    expect(getCompoundMeaning(72)).toEqual(getCompoundMeaning(27))
  })

  it('gives long full names a compound meaning', () => {
    const n = getNameNumber('Narendra Damodardas Modi')!
    expect(n.compound).toBe(72)
    expect(n.compoundMeaning).not.toBeNull()
  })
})

describe('core / premium split', () => {
  const input = { birthDate: '1990-11-29', name: 'Arjun Sharma', gender: 'male' as const, today: new Date(2026, 9, 12) }

  it('core report carries no Gold layer', () => {
    const core = buildNumerologyCore(input)!
    expect(core).not.toHaveProperty('predictions')
    expect(core).not.toHaveProperty('remedies')
    expect(core.today).toEqual({ year: 2026, month: 10, day: 12 })
  })

  it('free timeline matches the Gold prediction bundle', () => {
    const core = buildNumerologyCore(input)!
    const full = buildNumerologyReport(input)!
    expect(core.timeline.pinnacles).toEqual(full.predictions.pinnacles)
    expect(core.timeline.lifePhases).toEqual(full.predictions.lifePhases)
    expect(core.timeline.powerDays).toEqual(full.predictions.powerDays)
    expect(core.timeline.ageNow).toBe(full.predictions.ageNow)
  })

  it('accepts a parsed today (server path)', () => {
    const a = buildNumerologyCore({ ...input, today: parseBirthDate('2026-10-12')! })!
    const b = buildNumerologyCore(input)!
    expect(a.cycles).toEqual(b.cycles)
  })
})

describe('Katapayadi', () => {
  it('reads राम as 52 (right-to-left)', () => {
    const k = getKatapayadi('राम')!
    expect(k.aksharas.map(a => a.digit)).toEqual([2, 5])
    expect(k.number).toBe('52')
    expect(k.digitSum).toBe(7)
    expect(k.root).toBe(7)
  })

  it('counts only the last consonant of a conjunct', () => {
    // ल = 3, क्ष्मी → म = 5
    expect(getKatapayadi('लक्ष्मी')!.aksharas.map(a => a.digit)).toEqual([3, 5])
  })

  it('scores bare vowels as 0 and skips dead consonants', () => {
    // आ = 0, र्य → य = 1, न = 0
    expect(getKatapayadi('आर्यन')!.aksharas.map(a => a.digit)).toEqual([0, 1, 0])
    // final halant consonant is ignored
    expect(getKatapayadi('वाक्')!.aksharas.map(a => a.digit)).toEqual([4])
  })

  it('returns null without Devanagari consonants or vowels', () => {
    expect(getKatapayadi('   ')).toBeNull()
    expect(hasDevanagari('Ram')).toBe(false)
  })
})

describe('Devanagari transliteration', () => {
  it.each([
    ['राम', 'RAM'],
    ['दीपक', 'DEEPAK'],
    ['लक्ष्मी', 'LAKSHMI'],
    ['आर्यन', 'ARYAN'],
    ['कृष्ण', 'KRISHNA'],
    ['आदित्य', 'ADITYA'],
    ['पूजा', 'POOJA'],
    ['शंभु', 'SHAMBHU'],
    ['फ़रहान', 'FARHAN'],
    ['कमला', 'KAMLA'],
    ['कमल', 'KAMAL'],
    ['अजय', 'AJAY'],
    ['पंकज', 'PANKAJ'],
    ['नरेन्द्र', 'NARENDRA'],
    ['कविता', 'KAVITA'],
    ['मनमोहन', 'MANMOHAN'],
    ['न', 'NA'],
    ['राम Kumar', 'RAM KUMAR'],
  ])('%s → %s', (dev, latin) => {
    expect(devanagariToLatin(dev)).toBe(latin)
  })
})

describe('name depth', () => {
  it('finds karmic lessons and balance', () => {
    const d = getNameDepth('Abhishek')!
    // A1 B2 H8 I9 S1 H8 E5 K2
    expect(d.letterCount).toBe(8)
    expect(d.karmicLessons.map(k => k.number)).toEqual([3, 4, 6, 7])
    expect(d.hiddenPassion).toBeNull() // three-way tie at 2
    expect(d.balance).toMatchObject({ value: 1, initials: 'A' })
  })

  it('detects a clear hidden passion', () => {
    const d = getNameDepth('Anna Banana')!
    expect(d.hiddenPassion?.numbers).toEqual([1])
    expect(d.balance).toMatchObject({ value: 3, initials: 'AB' })
  })

  it('returns null for an empty name', () => {
    expect(getNameDepth('  123 ')).toBeNull()
  })
})

describe('spelling comparison', () => {
  it('dedupes, ranks by score and marks a single best', () => {
    const rows = compareNameSpellings(['Abhishek', 'abhishek', 'Abhisheik', 'Abhishekh', ''], 2, 5)
    expect(rows).toHaveLength(3)
    for (let i = 1; i < rows.length; i++) expect(rows[i - 1]!.score).toBeGreaterThanOrEqual(rows[i]!.score)
    expect(rows.filter(r => r.best).length).toBeLessThanOrEqual(1)
    for (const r of rows) {
      expect(r.score).toBeGreaterThanOrEqual(0)
      expect(r.score).toBeLessThanOrEqual(100)
      expect(r.root).toBe(reduceToCore(r.compound))
    }
  })
})

describe('Pythagorean arrows', () => {
  it('reads strength and weakness lines from DOB digits', () => {
    // 29-11-1990 → 2, 9, 1, 1, 1, 9, 9, 0
    const a = getPythagoreanArrows(parseBirthDate('1990-11-29')!)
    expect(a.counts[1]).toBe(3)
    expect(a.counts[9]).toBe(3)
    expect(a.strengths).toEqual([])
    expect(a.weaknesses.map(w => w.name)).toEqual(['Arrow of Frustration', 'Arrow of Scepticism'])
  })

  it('finds an arrow of strength', () => {
    // 15-09-1995 → 1, 5, 9, 1, 9, 9, 5 → 1-5-9 complete
    const a = getPythagoreanArrows(parseBirthDate('1995-09-15')!)
    expect(a.strengths.map(s => s.name)).toContain('Arrow of Determination')
  })
})
