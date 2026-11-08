// House tab Hindi: every English entry the House sub-tabs show has a
// Devanagari counterpart with the same shape, ids and numbers, and
// English output is unchanged when lang is omitted.
import { describe, expect, it } from 'vitest'
import type { Rashi } from '@/types/astrology'
import {
  CLASSICAL_GRAHAS,
  getHouseGuideNotes,
  getHouseTheme,
  getKendradhipatiNoteForLagna,
  getPlanetInHouse,
  getSignInHouse,
  HOUSE_THEMES,
  LAGNA_STRENGTH_CHECKS,
  PLANET_IN_HOUSE_FULL,
  SIGN_IN_HOUSE,
  type HouseNumber,
} from '@/lib/engine/houseInterpretations'
import {
  getLagnaCharacterMethodNotes,
  getLagnaCharacterNote,
  getLagnaCharacterProfile,
  getLagnaCharacterProfileHi,
  getLagnaHouseReading,
  LAGNA_CHARACTER_METHOD_NOTES,
  LAGNA_CHARACTER_NOTE,
} from '@/lib/engine/lagnaCharacter'
import {
  getNaturalHouseKarakaRows,
  getNaturalHouseKarakasNote,
  NATURAL_HOUSE_KARAKAS_NOTE,
} from '@/lib/engine/naturalHouseKarakas'

const DEVA = /[ऀ-ॿ]/
const HOUSES = Array.from({ length: 12 }, (_, i) => (i + 1) as HouseNumber)
const RASHIS = Array.from({ length: 12 }, (_, i) => (i + 1) as Rashi)

/**
 * Plain numbers (degrees, ages, ranges, house lists, percentages) must survive
 * translation. English ordinals ("2nd", "10th") become Hindi words, so they
 * are left out, as are trailing "H" labels.
 */
function nums(s: string): string[] {
  return (s.match(/\d+(?:\.\d+)?(?!\d|\.\d|st\b|nd\b|rd\b|th\b)/g) ?? []).sort()
}

function expectHindi(s: string | null | undefined, label: string) {
  expect(s, label).toBeTruthy()
  expect(s!, label).toMatch(DEVA)
}

describe('houseInterpretations Hindi', () => {
  it('keeps English output unchanged by default', () => {
    expect(getSignInHouse(2, 1)).toBe(SIGN_IN_HOUSE[2]![1])
    expect(getPlanetInHouse('Su', 1, 'full')).toBe(PLANET_IN_HOUSE_FULL.Su[1])
    expect(getHouseTheme(1)).toBe(HOUSE_THEMES[1])
    expect(getHouseGuideNotes().lagnaStrengthChecks).toBe(LAGNA_STRENGTH_CHECKS)
    expect(getKendradhipatiNoteForLagna(3)).toMatch(/Jupiter as kendra/)
  })

  it('has Hindi for every sign-in-house note', () => {
    for (const h of HOUSES) {
      for (const r of RASHIS) {
        const en = getSignInHouse(h, r)
        const hi = getSignInHouse(h, r, 'hi')
        if (en === null) {
          expect(hi, `${h}/${r}`).toBeNull()
          continue
        }
        expectHindi(hi, `sign ${r} in house ${h}`)
      }
    }
  })

  it('has Hindi for every full planet-in-house reading, numbers kept', () => {
    for (const g of CLASSICAL_GRAHAS) {
      for (const h of HOUSES) {
        const en = getPlanetInHouse(g, h, 'full')!
        const hi = getPlanetInHouse(g, h, 'full', 'hi')
        expectHindi(hi, `${g} in ${h} (full)`)
        expect(nums(hi!), `${g} in ${h} numbers`).toEqual(nums(en))
        expectHindi(getPlanetInHouse(g, h, 'summary', 'hi'), `${g} in ${h} (summary)`)
      }
    }
  })

  it('has Hindi house guide detail with the same list lengths', () => {
    for (const h of HOUSES) {
      const en = getHouseTheme(h)!
      const hi = getHouseTheme(h, 'hi')!
      expect(hi.house).toBe(h)
      expectHindi(hi.intro, `house ${h} intro`)
      expectHindi(hi.english, `house ${h} english`)
      expect(hi.coreThemes).toHaveLength(en.coreThemes.length)
      hi.coreThemes.forEach((c, i) => expectHindi(c, `house ${h} theme ${i}`))
    }
  })

  it('has Hindi teaching notes with the same list lengths', () => {
    const en = getHouseGuideNotes()
    const hi = getHouseGuideNotes('hi')
    for (const key of Object.keys(en) as (keyof typeof en)[]) {
      const e = en[key]
      const h = hi[key]
      if (Array.isArray(e)) {
        expect(h, key).toHaveLength(e.length)
        ;(h as string[]).forEach((x, i) => expectHindi(x, `${key}[${i}]`))
      } else {
        expectHindi(h as string, key)
      }
    }
    for (const r of RASHIS) {
      const e = getKendradhipatiNoteForLagna(r)
      const h = getKendradhipatiNoteForLagna(r, 'hi')
      expect(h === null, `kendradhipati ${r}`).toBe(e === null)
      if (h) expectHindi(h, `kendradhipati ${r}`)
    }
  })

  it('has Hindi natural karaka themes; karaka ids unchanged', () => {
    expect(getNaturalHouseKarakasNote()).toBe(NATURAL_HOUSE_KARAKAS_NOTE)
    expectHindi(getNaturalHouseKarakasNote('hi'), 'karaka note')
    const en = getNaturalHouseKarakaRows()
    const hi = getNaturalHouseKarakaRows('hi')
    hi.forEach((row, i) => {
      expect(row.house).toBe(en[i].house)
      expect(row.karakas).toEqual(en[i].karakas)
      expectHindi(row.themes, `karaka themes ${row.house}`)
    })
  })
})

describe('lagna character Hindi', () => {
  it('keeps English output unchanged by default', () => {
    expect(getLagnaCharacterMethodNotes()).toBe(LAGNA_CHARACTER_METHOD_NOTES)
    expect(getLagnaCharacterNote()).toBe(LAGNA_CHARACTER_NOTE)
    expect(getLagnaCharacterProfile(1)!.title).toBe('Aries Ascendant (Mesh Lagna)')
    expect(getLagnaHouseReading(1, 2)!.points[0]).toMatch(/^Speaks about money/)
  })

  it('has method notes in Hindi', () => {
    expect(getLagnaCharacterMethodNotes('hi')).toHaveLength(LAGNA_CHARACTER_METHOD_NOTES.length)
    getLagnaCharacterMethodNotes('hi').forEach((n, i) => expectHindi(n, `method ${i}`))
    expectHindi(getLagnaCharacterNote('hi'), 'note')
  })

  for (const r of RASHIS) {
    it(`translates every entry of lagna ${r} with the English shape`, () => {
      const en = getLagnaCharacterProfile(r)!
      const raw = getLagnaCharacterProfileHi(r)!
      expect(raw, 'hindi table').toBeTruthy()
      // Raw table shape matches English exactly
      expect(raw.traits).toHaveLength(en.traits.length)
      raw.traits.forEach((t, i) => expect(t.points, `trait ${en.traits[i].id}`).toHaveLength(en.traits[i].points.length))
      for (const h of HOUSES) expect(raw.houses[h], `house ${h}`).toHaveLength(en.houses[h].points.length)
      expect(raw.exceptions).toHaveLength(en.exceptions.length)
      expect(raw.readingNotes).toHaveLength(en.readingNotes.length)

      const hi = getLagnaCharacterProfile(r, 'hi')!
      expect(hi.rashi).toBe(en.rashi)
      expectHindi(hi.title, 'title')
      expectHindi(hi.intro, 'intro')
      hi.traits.forEach((t, i) => {
        expect(t.id).toBe(en.traits[i].id)
        expectHindi(t.title, `trait ${t.id}`)
        t.points.forEach((p, j) => {
          expectHindi(p, `trait ${t.id}[${j}]`)
          expect(nums(p), `trait ${t.id}[${j}] numbers`).toEqual(nums(en.traits[i].points[j]))
        })
      })
      for (const h of HOUSES) {
        const eh = en.houses[h]
        const hh = hi.houses[h]
        expect(hh.house).toBe(h)
        expectHindi(hh.signName, `house ${h} sign`)
        expectHindi(hh.theme, `house ${h} theme`)
        hh.points.forEach((p, j) => {
          expectHindi(p, `house ${h}[${j}]`)
          expect(nums(p), `house ${h}[${j}] numbers`).toEqual(nums(eh.points[j]))
        })
        expect(getLagnaHouseReading(r, h, 'hi')!.points).toEqual(hh.points)
      }
      hi.exceptions.forEach((x, i) => expectHindi(x, `exception ${i}`))
      hi.readingNotes.forEach((x, i) => {
        expectHindi(x, `note ${i}`)
        expect(nums(x), `note ${i} numbers`).toEqual(nums(en.readingNotes[i]))
      })
    })
  }
})

describe('house tab second batch Hindi', () => {
  it('builds the Lagna cheat sheet in Hindi for every Lagna; English unchanged', async () => {
    const { buildLagnaCheatSheet } = await import('@/lib/engine/lagnaCheatSheet')
    const grahas = [
      { id: 'Su', rashi: 1 }, { id: 'Mo', rashi: 4 }, { id: 'Ma', rashi: 4 }, { id: 'Me', rashi: 2 },
      { id: 'Ju', rashi: 9 }, { id: 'Ve', rashi: 12 }, { id: 'Sa', rashi: 10 }, { id: 'Ra', rashi: 11 }, { id: 'Ke', rashi: 5 },
    ] as unknown as import('@/types/astrology').GrahaData[]
    for (const r of RASHIS) {
      const en = buildLagnaCheatSheet(r, grahas)!
      const hi = buildLagnaCheatSheet(r, grahas, 'hi')!
      expect(en.title).toMatch(/Lagna cheat-sheet$/)
      expectHindi(hi.title, 'title')
      expectHindi(hi.headline, 'headline')
      expect(hi.thisChart).toHaveLength(en.thisChart.length)
      hi.thisChart.forEach((x) => expectHindi(x, 'thisChart'))
      expect(hi.keyPoints).toHaveLength(en.keyPoints.length)
      expect(hi.houses.map((h) => h.house)).toEqual(en.houses.map((h) => h.house))
      expect(hi.houses.map((h) => h.occupants.length)).toEqual(en.houses.map((h) => h.occupants.length))
    }
  })

  it('gives Manglik teaching in Hindi with the same status and flags', async () => {
    const { getManglikTeaching } = await import('@/lib/engine/manglikTeaching')
    const grahas = [
      { id: 'Ma', rashi: 8 }, { id: 'Mo', rashi: 1 }, { id: 'Ve', rashi: 8 }, { id: 'Ju', rashi: 4 },
    ] as unknown as import('@/types/astrology').GrahaData[]
    const cases = [
      { isManglik: true, intensity: 'High', house: 8, cancellations: [], score: 1 },
      { isManglik: false, intensity: 'None', house: 7, cancellations: ['Jupiter Aspect/Conjunction (Guru Drishti)'], score: 0 },
      { isManglik: false, intensity: 'None', house: 3, cancellations: [], score: 0 },
      { isManglik: false, intensity: 'None', house: 0, cancellations: [], score: 0 },
    ] as const
    for (const c of cases) {
      const en = getManglikTeaching(c as never, grahas, 1)
      const hi = getManglikTeaching(c as never, grahas, 1, 'hi')
      expect(hi.status).toBe(en.status)
      expectHindi(hi.headline, 'headline')
      expectHindi(hi.statusDetail, 'statusDetail')
      expectHindi(hi.overview, 'overview')
      expectHindi(hi.controlNote, 'control')
      expect(hi.houseNote === null).toBe(en.houseNote === null)
      if (hi.houseNote) expectHindi(hi.houseNote, 'houseNote')
      expect(hi.cancellationNotes).toHaveLength(en.cancellationNotes.length)
      hi.cancellationNotes.forEach((x) => expectHindi(x, 'cancel'))
      expect(hi.perspectives?.scope).toBe(en.perspectives?.scope)
      expectHindi(hi.perspectives!.scopeLabel, 'scopeLabel')
      expectHindi(hi.perspectives!.scopeDetail, 'scopeDetail')
    }
  })

  it('has the Lagna spiritual guide in Hindi for all twelve Lagnas', async () => {
    const S = await import('@/lib/engine/lagnaSpirituality')
    for (const r of RASHIS) {
      const en = S.getChartLagnaSpirituality(r)
      const hi = S.getChartLagnaSpirituality(r, 'hi')
      expect(hi.lagna.rashi).toBe(en.lagna.rashi)
      expect(hi.element.id).toBe(en.element.id)
      expect(hi.element.signs).toEqual(en.element.signs)
      for (const k of ['name', 'primaryConsciousness', 'subconsciousEnergy', 'invisibleFear', 'egoType', 'purpose', 'lifePattern', 'whatBreaksPattern'] as const) {
        expectHindi(hi.lagna[k], `lagna ${r} ${k}`)
      }
      for (const k of ['name', 'sanskrit', 'birthConsciousness', 'spiritualPath', 'understandingMethod', 'challenge', 'liberationPath', 'exitPattern', 'fearPattern'] as const) {
        expectHindi(hi.element[k], `element ${k}`)
      }
      expectHindi(hi.note, 'note')
      expect(hi.principles.map((p) => p.id)).toEqual(en.principles.map((p) => p.id))
      hi.principles.forEach((p) => { expectHindi(p.title, p.id); expectHindi(p.body, p.id) })
    }
    expect(S.getChartLagnaSpirituality(1).lagna.name).toBe('Aries')
  })

  it('has the rashi deep guide in Hindi with the English shape', async () => {
    const D = await import('@/lib/engine/rashiDeepGuide')
    const listKeys = ['symbolMeaning', 'spiritual', 'positiveTraits', 'challengingTraits', 'behavioralNotes', 'careers', 'healthThemes', 'practicalNotes'] as const
    for (const r of RASHIS) {
      const en = D.getRashiDeepGuide(r)!
      const hi = D.getRashiDeepGuide(r, 'hi')!
      expect(hi.rashi).toBe(en.rashi)
      expect(hi.element).toBe(en.element)
      expect(hi.motion).toBe(en.motion)
      expect(hi.activationAge).toBe(en.activationAge)
      for (const k of ['keyword', 'temperament', 'lordName', 'strongTime', 'kaalPurushPart'] as const) expectHindi(hi[k], `${r} ${k}`)
      for (const k of ['exaltedPlanet', 'weakTime', 'direction', 'varna', 'guna', 'deity', 'chakraHint', 'gemstone', 'lordContrast'] as const) {
        expect(hi[k] === undefined, `${r} ${k} presence`).toBe(en[k] === undefined)
        if (hi[k]) expectHindi(hi[k], `${r} ${k}`)
      }
      for (const k of listKeys) {
        expect(hi[k], `${r} ${k}`).toHaveLength(en[k].length)
        hi[k].forEach((x, i) => expectHindi(x, `${r} ${k}[${i}]`))
      }
      expect(hi.nakshatras).toHaveLength(en.nakshatras.length)
      hi.nakshatras.forEach((n, i) => {
        expectHindi(n.name, `${r} nak ${i}`)
        expectHindi(n.padas, `${r} padas ${i}`)
        expect(n.note === undefined).toBe(en.nakshatras[i].note === undefined)
        if (n.note) expectHindi(n.note, `${r} nak note ${i}`)
      })
      expect(hi.compatibility === undefined).toBe(en.compatibility === undefined)
      if (hi.compatibility && en.compatibility) {
        expect(hi.compatibility.best).toHaveLength(en.compatibility.best.length)
        hi.compatibility.best.forEach((x) => expectHindi(x, 'best'))
        expectHindi(hi.compatibility.principle, 'principle')
      }
      if (en.luckyColors) hi.luckyColors!.forEach((x) => expectHindi(x, 'lucky'))
    }
    const en = D.getRashiSharedTeachings()
    const hi = D.getRashiSharedTeachings('hi')
    expect(hi.map((t) => t.id)).toEqual(en.map((t) => t.id))
    hi.forEach((t, i) => {
      expectHindi(t.title, t.id)
      expect(t.points).toHaveLength(en[i].points.length)
      t.points.forEach((p) => expectHindi(p, t.id))
    })
    expect(D.getRashiDeepGuide(1)!.keyword).toBe('Willpower / “I am”')
  })

  it('has Hindi rashi profile text and the full planet-in-sign layer', async () => {
    const L = await import('@/lib/engine/rashiGuideLang')
    const { getPlanetInSign } = await import('@/lib/engine/rashiInterpretations')
    for (const r of RASHIS) {
      const hi = L.getRashiProfileInLang(r, 'hi')!
      for (const k of ['coreSummary', 'lordSummary'] as const) expectHindi(hi[k], `${r} ${k}`)
      for (const k of ['coreNature', 'lordNotes', 'remedies', 'specialRules'] as const) hi[k].forEach((x) => expectHindi(x, `${r} ${k}`))
      for (const h of HOUSES) expectHindi(L.getRashiInHouseInLang(r, h, 'hi'), `${r} in ${h}`)
      for (const g of CLASSICAL_GRAHAS) {
        expectHindi(L.getPlanetInSignInLang(g, r, 'full', 'hi'), `${g} in ${r} full`)
        expect(L.getPlanetInSignInLang(g, r, 'full')).toBe(getPlanetInSign(g, r, 'full'))
      }
    }
  })
})
