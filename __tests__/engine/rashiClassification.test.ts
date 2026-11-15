// __tests__/engine/rashiClassification.test.ts
import { describe, it, expect } from 'vitest'
import {
  effectiveMotion,
  getRashiClassification,
  grahaDisha,
  isInSignEdgeDegrees,
  listRashiClassifications,
  CLASSIFICATION_FIELD_EN,
  CLASSIFICATION_VALUE_EN,
  RASHI_BODY_PARTS_EN,
  RASHI_PLACES_EN,
  RASHI_CLASSIFICATION_NOTES_EN,
} from '@/lib/engine/rashiClassification'
import {
  CLASSIFICATION_FIELD_HI,
  CLASSIFICATION_VALUE_HI,
  RASHI_BODY_PARTS_HI,
  RASHI_PLACES_HI,
  RASHI_CLASSIFICATION_NOTES_HI,
} from '@/lib/engine/locale/rashiClassification.hi'
import { getRashiSharedTeachings } from '@/lib/engine/rashiDeepGuide'

const LATIN_WORD = /[A-Za-z]{4,}/

describe('rashiClassification', () => {
  it('every sign falls in exactly one group per classification', () => {
    const all = listRashiClassifications()
    expect(all.map((c) => c.rashi)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
    const count = (k: 'motion' | 'tattva' | 'bala' | 'guna' | 'nature') =>
      all.reduce<Record<string, number>>((m, c) => ({ ...m, [c[k]]: (m[c[k]] ?? 0) + 1 }), {})
    expect(count('motion')).toEqual({ char: 4, sthir: 4, dwiswabhav: 4 })
    expect(count('tattva')).toEqual({ agni: 3, prithvi: 3, vayu: 3, jal: 3 })
    expect(count('bala')).toEqual({ diva: 6, ratri: 6 })
    expect(count('guna')).toEqual({ sattvic: 4, rajasic: 4, tamasic: 4 })
    expect(count('nature')).toEqual({ nirankush: 5, darshnik: 4, ojasvi: 1, aalsi: 2 })
  })

  it('matches the class-note tables', () => {
    const aries = getRashiClassification(1)!
    expect([aries.motion, aries.tattva, aries.parity, aries.bala, aries.varna, aries.dosha, aries.direction, aries.guna])
      .toEqual(['char', 'agni', 'visham', 'ratri', 'kshatriya', 'pitta', 'east', 'tamasic'])
    const scorpio = getRashiClassification(8)!
    expect([scorpio.creature, scorpio.nature, scorpio.bala, scorpio.varna]).toEqual([['keet'], 'ojasvi', 'diva', 'brahmin'])
    expect(getRashiClassification(10)!.dosha).toBe('tridosha')
    expect(getRashiClassification(12)!.direction).toBe('north')
  })

  it('dual signs act Sthir below 15° and Char from 15°', () => {
    expect(effectiveMotion(3, 14.99)).toBe('sthir')
    expect(effectiveMotion(3, 15)).toBe('char')
    expect(effectiveMotion(1, 20)).toBe('char')
    expect(effectiveMotion(2, 20)).toBe('sthir')
    expect(getRashiClassification(12, 20)!.effectiveMotion).toBe('char')
    expect(getRashiClassification(1, 20)!.effectiveMotion).toBeUndefined()
  })

  it('splits Dhanu and Makara creature type at 15°', () => {
    expect(getRashiClassification(9, 5)!.creature).toEqual(['manushya'])
    expect(getRashiClassification(9, 20)!.creature).toEqual(['chatushpad'])
    expect(getRashiClassification(10, 5)!.creature).toEqual(['chatushpad'])
    expect(getRashiClassification(10, 20)!.creature).toEqual(['jalchar'])
    const noDeg = getRashiClassification(9)!
    expect(noDeg.creature).toEqual(['manushya', 'chatushpad'])
    expect(noDeg.rows.find((r) => r.field === 'creature')!.value).toContain('15–30°')
  })

  it('sign-edge rule: odd 24–30°, even 0–6°', () => {
    expect(isInSignEdgeDegrees(1, 24)).toBe(true)
    expect(isInSignEdgeDegrees(1, 23.9)).toBe(false)
    expect(isInSignEdgeDegrees(2, 5.9)).toBe(true)
    expect(isInSignEdgeDegrees(2, 6)).toBe(false)
    expect(getRashiClassification(4, 2)!.inEdgeDegrees).toBe(true)
    expect(getRashiClassification(4)!.inEdgeDegrees).toBeUndefined()
  })

  it('graha directions', () => {
    expect(grahaDisha('Su')).toBe('east')
    expect(grahaDisha('Ju')).toBe('northEast')
    expect(grahaDisha('Ke')).toBe('southWest')
  })

  it('rejects out-of-range rashi', () => {
    expect(getRashiClassification(0)).toBeNull()
    expect(getRashiClassification(13)).toBeNull()
  })

  it('Hindi tables mirror English shape and contain no English words', () => {
    expect(Object.keys(CLASSIFICATION_FIELD_HI).sort()).toEqual(Object.keys(CLASSIFICATION_FIELD_EN).sort())
    expect(Object.keys(CLASSIFICATION_VALUE_HI).sort()).toEqual(Object.keys(CLASSIFICATION_VALUE_EN).sort())
    for (let r = 1; r <= 12; r++) {
      expect(RASHI_PLACES_HI[r as 1]).toHaveLength(RASHI_PLACES_EN[r as 1].length)
      expect(RASHI_BODY_PARTS_HI[r as 1]).toHaveLength(RASHI_BODY_PARTS_EN[r as 1].length)
    }
    expect(RASHI_CLASSIFICATION_NOTES_HI.points).toHaveLength(RASHI_CLASSIFICATION_NOTES_EN.points.length)
    for (const c of listRashiClassifications('hi')) {
      const text = [...c.rows.flatMap((r) => [r.label, r.value]), ...c.places, ...c.bodyParts, c.color]
      for (const s of text) expect(s, s).not.toMatch(LATIN_WORD)
    }
    for (const c of getRashiClassification(9, 20, 'hi')!.rows) expect(c.value).not.toMatch(LATIN_WORD)
  })

  it('adds the sign-groups block to Rashi shared teachings in both languages', () => {
    const en = getRashiSharedTeachings('en').find((t) => t.id === 'sign-groups')!
    const hi = getRashiSharedTeachings('hi').find((t) => t.id === 'sign-groups')!
    expect(en.points).toHaveLength(RASHI_CLASSIFICATION_NOTES_EN.points.length)
    expect(hi.title).toBe(RASHI_CLASSIFICATION_NOTES_HI.title)
    for (const p of hi.points) expect(p).not.toMatch(LATIN_WORD)
  })
})
