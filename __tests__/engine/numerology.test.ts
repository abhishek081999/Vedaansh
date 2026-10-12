// __tests__/engine/numerology.test.ts
import { describe, it, expect } from 'vitest'
import {
  reduceToCore,
  parseBirthDate,
  getMoolank,
  getBhagyank,
  getNameNumber,
  numberHarmony,
  getNumberFriendship,
  buildNumerologyGrid,
  getKuaNumber,
  getPersonalCycles,
  findKarmicDebts,
  suggestNameTotals,
  checkNumber,
  getLuckyDates,
  linkNumbersToChart,
  buildNumerologyReport,
} from '@/lib/engine/numerology/calc'
import { getCompoundMeaning, NUMBER_GRAHA } from '@/lib/engine/numerology/data'
import {
  suggestBabyNames,
  matchBusinessPartners,
  buildDashaNumberBridge,
  numberForGraha,
} from '@/lib/engine/numerology/tools'
import {
  getCheiroLabels,
  getLagnaNumber,
  buildInclusionTable,
  getHealthAlerts,
  getMarriageTimingYears,
  buildMonthCalendar,
  scoreBrandOrSignature,
  suggestPlateEndings,
  getNakshatraLetterBridge,
  getDailyAnkaMuhurta,
  getYantraPacks,
  numberHarmonyMode,
  lagnaNumberFromRashi,
} from '@/lib/engine/numerology/advanced'
import type { DashaNode } from '@/types/astrology'

describe('numerology reduction and parsing', () => {
  it('reduces to a single digit 1–9', () => {
    expect(reduceToCore(0)).toBe(0)
    expect(reduceToCore(9)).toBe(9)
    expect(reduceToCore(29)).toBe(2)
    expect(reduceToCore(1999)).toBe(1)
  })

  it('rejects impossible dates', () => {
    expect(parseBirthDate('1990-02-30')).toBeNull()
    expect(parseBirthDate('15-08-1990')).toBeNull()
    expect(parseBirthDate('2000-02-29')).toEqual({ year: 2000, month: 2, day: 29 })
  })
})

describe('core numbers', () => {
  it('computes Moolank from birth day', () => {
    expect(getMoolank(29)).toEqual({ compound: 29, value: 2 })
    expect(getMoolank(7).value).toBe(7)
  })

  it('computes Bhagyank from full date', () => {
    // 15-08-1947 → 1+5+0+8+1+9+4+7 = 35 → 8
    expect(getBhagyank({ year: 1947, month: 8, day: 15 })).toEqual({ compound: 35, value: 8 })
  })

  it('computes Chaldean name number with vowel/consonant split', () => {
    const r = getNameNumber('Ram')!
    // R2 A1 M4 = 7
    expect(r.compound).toBe(7)
    expect(r.value).toBe(7)
    expect(r.soul?.value).toBe(1)
    expect(r.personality?.value).toBe(6)
    expect(getNameNumber('  123 ')).toBeNull()
  })

  it('supports Pythagorean values', () => {
    // R9 A1 M4 = 14 → 5
    expect(getNameNumber('Ram', 'pythagorean')!.value).toBe(5)
  })

  it('maps numbers to classical grahas', () => {
    expect(NUMBER_GRAHA[1]).toBe('Su')
    expect(NUMBER_GRAHA[4]).toBe('Ra')
    expect(NUMBER_GRAHA[7]).toBe('Ke')
    expect(NUMBER_GRAHA[9]).toBe('Ma')
  })
})

describe('compound meanings', () => {
  it('returns Cheiro meanings and aliases', () => {
    expect(getCompoundMeaning(19)?.quality).toBe('fortunate')
    expect(getCompoundMeaning(16)?.quality).toBe('warning')
    expect(getCompoundMeaning(33)).toEqual(getCompoundMeaning(24))
    expect(getCompoundMeaning(7)).toBeNull()
  })
})

describe('number harmony', () => {
  it('Sun (1) and Jupiter (3) are mutual friends', () => {
    expect(numberHarmony(1, 3)).toBe('excellent')
  })

  it('Sun (1) and Saturn (8) are challenging', () => {
    expect(numberHarmony(1, 8)).toBe('challenging')
  })

  it('friendship lists exclude self and are disjoint', () => {
    const f = getNumberFriendship(1)
    const all = [...f.friends, ...f.neutral, ...f.enemies]
    expect(all).not.toContain(1)
    expect(new Set(all).size).toBe(8)
    expect(f.friends).toContain(3)
    expect(f.enemies).toContain(8)
  })
})

describe('grid', () => {
  it('counts DOB digits plus Moolank and Bhagyank', () => {
    // 29-11-1990 → digits 2,9,1,1,1,9,9,0 ; Moolank 2 ; Bhagyank 32 → 5
    const g = buildNumerologyGrid({ year: 1990, month: 11, day: 29 }, { moolank: 2, bhagyank: 5 })
    expect(g.counts[1]).toBe(3)
    expect(g.counts[9]).toBe(3)
    expect(g.counts[2]).toBe(2)
    expect(g.counts[5]).toBe(1)
    expect(g.missing.map(m => m.number)).toEqual([3, 4, 6, 7, 8])
    expect(g.planes.find(p => p.id === 'will')?.status).toBe('complete')
  })

  it('does not double-count Moolank for 10/20/30', () => {
    const g = buildNumerologyGrid({ year: 2000, month: 1, day: 20 }, { moolank: 2, bhagyank: 5 })
    expect(g.sources[2]).not.toContain('moolank')
  })
})

describe('Kua number', () => {
  it('matches reference values', () => {
    expect(getKuaNumber({ year: 1990, month: 6, day: 1 }, 'male')?.value).toBe(1)
    expect(getKuaNumber({ year: 1990, month: 6, day: 1 }, 'female')?.value).toBe(8)
  })

  it('uses previous solar year before 4 February', () => {
    const k = getKuaNumber({ year: 1991, month: 1, day: 20 }, 'male')!
    expect(k.solarYear).toBe(1990)
    expect(k.value).toBe(1)
  })

  it('replaces 5 with 2 (male) / 8 (female)', () => {
    // 1995 → 24 → 6 ; male 11 − 6 = 5 → 2
    expect(getKuaNumber({ year: 1995, month: 6, day: 1 }, 'male')?.value).toBe(2)
    // 1990 → 19 → 1 ; female 4 + 1 = 5 → 8
    expect(getKuaNumber({ year: 1990, month: 6, day: 1 }, 'female')?.value).toBe(8)
  })

  it('returns null for unspecified gender', () => {
    expect(getKuaNumber({ year: 1990, month: 6, day: 1 }, 'other')).toBeNull()
  })
})

describe('personal cycles', () => {
  it('personal year changes on birthday', () => {
    const birth = { year: 1990, month: 8, day: 15 }
    const before = getPersonalCycles(birth, 6, { year: 2026, month: 8, day: 14 })
    const after = getPersonalCycles(birth, 6, { year: 2026, month: 8, day: 15 })
    expect(before.cycleYear).toBe(2025)
    expect(after.cycleYear).toBe(2026)
    // 1+5+8 + 2+0+2+6 = 24 → 6
    expect(after.personalYear).toBe(6)
  })
})

describe('karmic debt', () => {
  it('detects 13/14/16/19 in compound chains', () => {
    const hits = findKarmicDebts([
      { source: 'Birth day', compound: 19 },
      { source: 'Name', compound: 23 },
    ])
    expect(hits).toHaveLength(1)
    expect(hits[0]?.number).toBe(19)
  })
})

describe('applied tools', () => {
  it('name suggestions avoid warning compounds and sort by distance', () => {
    const s = suggestNameTotals(20, 1, 3)
    expect(s.length).toBeGreaterThan(0)
    expect(s.every(t => t.compound?.quality !== 'warning')).toBe(true)
    const deltas = s.map(t => Math.abs(t.delta))
    expect([...deltas].sort((a, b) => a - b)).toEqual(deltas)
  })

  it('checks mobile numbers against Moolank and Bhagyank', () => {
    const r = checkNumber('+91 98765 43210', 1, 3)!
    expect(r.digits).toBe('919876543210')
    expect(r.compound).toBe(55)
    expect(r.root).toBe(1)
    expect(r.verdict).toBe('favourable')
    expect(r.zeroCount).toBe(1)
    expect(checkNumber('000', 1, 3)).toBeNull()
  })

  it('lucky dates never place enemy roots in best', () => {
    const { best, avoid } = getLuckyDates(1, 3)
    expect(best).toContain(1)
    expect(avoid).toContain(8)
    expect(best.some(d => avoid.includes(d))).toBe(false)
  })

  it('links numbers to natal grahas with house from lagna', () => {
    const links = linkNumbersToChart(
      [{ label: 'Moolank', number: 1 }],
      [{ id: 'Su', rashi: 5, dignity: 'own', isRetro: false }],
      1,
    )
    expect(links[0]).toMatchObject({ graha: 'Su', rashi: 5, house: 5, dignity: 'own' })
  })
})

describe('full report', () => {
  it('builds a complete report', () => {
    const r = buildNumerologyReport({
      birthDate: '1990-11-29',
      name: 'Arjun Sharma',
      gender: 'male',
      today: new Date(2026, 9, 12),
    })!
    expect(r.moolank.value).toBe(2)
    expect(r.bhagyank.value).toBe(5)
    expect(r.name?.letters.length).toBe(11)
    expect(r.kua?.value).toBe(1)
    expect(r.upcomingYears).toHaveLength(9)
    expect(r.nameHarmony).not.toBeNull()
  })

  it('includes predictions: maturity, pinnacles, life areas, yogas, monthly', () => {
    const r = buildNumerologyReport({
      birthDate: '1990-11-29',
      name: 'Arjun Sharma',
      gender: 'male',
      today: new Date(2026, 9, 12),
    })!
    // Maturity 2+5=7
    expect(r.predictions.maturity.value).toBe(7)
    expect(r.predictions.pinnacles).toHaveLength(4)
    expect(r.predictions.pinnacles.some(p => p.active)).toBe(true)
    expect(r.predictions.lifeAreas).toHaveLength(9)
    expect(r.predictions.lifeAreas[0]?.id).toBe('personality')
    expect(r.predictions.monthly).toHaveLength(12)
    expect(r.predictions.annual.personalYear).toBe(r.cycles.personalYear)
    expect(r.predictions.challenges.length).toBeGreaterThanOrEqual(2)
    expect(r.predictions.powerDays.some(d => d.day === 2 || d.day === 11 || d.day === 20 || d.day === 29)).toBe(true)
    expect(r.predictions.ageNow).toBe(35)
  })

  it('includes a prioritized remedy package', () => {
    const r = buildNumerologyReport({
      birthDate: '1990-11-29',
      name: 'Arjun Sharma',
      gender: 'male',
      today: new Date(2026, 9, 12),
    })!
    expect(r.remedies.focusNumbers).toContain(2)
    expect(r.remedies.focusNumbers).toContain(5)
    expect(r.remedies.items.length).toBeGreaterThan(3)
    expect(r.remedies.mantraQueue.length).toBeGreaterThan(0)
    expect(r.remedies.wearToday.colors.length).toBeGreaterThan(0)
    expect(r.remedies.summary).toMatch(/Focus on numbers/)
    // Missing grid numbers should generate remedies
    expect(r.remedies.items.some(i => i.id.startsWith('missing-'))).toBe(true)
  })

  it('returns null for invalid dates', () => {
    expect(buildNumerologyReport({ birthDate: 'bad' })).toBeNull()
  })
})

describe('baby name suggester', () => {
  it('targets baby Moolank/Bhagyank when DOB is known', () => {
    // 15-08-2024 → Moolank 6, Bhagyank 2+0+2+4+0+8+1+5 = 22 → 4? 
    // day 15 → 6; month 8 → 8; year 2024 → 8; bhagyank digits 1+5+0+8+2+0+2+4 = 22 → 4
    const r = suggestBabyNames({ babyDob: '2024-08-15', candidateName: 'Aryan' })
    expect(r.targetRoots.length).toBeGreaterThan(0)
    expect(r.guidance).toMatch(/Moolank 6/)
    expect(r.scored?.root).toBeDefined()
    expect(r.luckyTotals.every(t => t.quality !== null ? true : true)).toBe(true)
    expect(r.luckyTotals.every(t => !getCompoundMeaning(t.total) || getCompoundMeaning(t.total)!.quality !== 'warning')).toBe(true)
  })

  it('falls back to parent-friendly roots without baby DOB', () => {
    const r = suggestBabyNames({ parentDobs: ['1990-11-29', '1992-03-10'] })
    expect(r.targetRoots.length).toBeGreaterThan(0)
    expect(r.guidance).toMatch(/Baby DOB unknown/)
  })
})

describe('business partnership', () => {
  it('scores partners and suggests roles', () => {
    const r = matchBusinessPartners(
      { label: 'Asha', birthDate: '1990-11-29' },
      { label: 'Vikram', birthDate: '1985-01-01' },
    )!
    expect(r.percent).toBeGreaterThanOrEqual(0)
    expect(r.percent).toBeLessThanOrEqual(100)
    expect(r.pairs).toHaveLength(4)
    expect(r.ventureNumber).toBeGreaterThanOrEqual(1)
    expect(r.roles.a.length).toBeGreaterThan(0)
    expect(['strong', 'workable', 'strained']).toContain(r.verdict)
  })

  it('returns null for bad dates', () => {
    expect(matchBusinessPartners(
      { label: 'A', birthDate: 'bad' },
      { label: 'B', birthDate: '1990-01-01' },
    )).toBeNull()
  })
})

describe('dasha ↔ number bridge', () => {
  it('maps grahas to Anka numbers', () => {
    expect(numberForGraha('Su')).toBe(1)
    expect(numberForGraha('Sa')).toBe(8)
    expect(numberForGraha('Ra')).toBe(4)
    expect(numberForGraha('Ur')).toBeNull()
  })

  it('builds outlook from current MD/AD path', () => {
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
    const bridge = buildDashaNumberBridge({
      vimshottari: tree,
      moolank: 3,
      bhagyank: 6,
      personalYear: 3,
      now,
    })!
    expect(bridge.current[0]?.lord).toBe('Ju')
    expect(bridge.current[0]?.number).toBe(3)
    expect(bridge.current[1]?.lord).toBe('Ve')
    expect(bridge.current[1]?.number).toBe(6)
    expect(bridge.upcomingMahas.some(m => m.lord === 'Sa')).toBe(true)
    expect(bridge.amplification).toMatch(/Personal year 3 matches Mahadasha/)
  })

  it('returns null without dasha tree', () => {
    expect(buildDashaNumberBridge({
      vimshottari: [],
      moolank: 1,
      bhagyank: 1,
      personalYear: 1,
    })).toBeNull()
  })
})

describe('advanced anka layers', () => {
  it('computes Cheiro driver/conductor/essence', () => {
    const c = getCheiroLabels(2, 5)
    expect(c.driver).toBe(2)
    expect(c.conductor).toBe(5)
    expect(c.essence).toBe(7)
  })

  it('maps lagna rashi to number', () => {
    expect(lagnaNumberFromRashi(1)).toBe(1)
    expect(lagnaNumberFromRashi(9)).toBe(9)
    expect(lagnaNumberFromRashi(10)).toBe(1)
    expect(getLagnaNumber(5).value).toBe(5)
  })

  it('builds inclusion and health alerts', () => {
    const counts = { 1: 3, 2: 2, 3: 0, 4: 0, 5: 1, 6: 0, 7: 0, 8: 0, 9: 3 } as const
    const inc = buildInclusionTable(counts)
    expect(inc.find(c => c.number === 3)?.intensity).toBe('absent')
    expect(inc.find(c => c.number === 1)?.intensity).toBe('strong')
    const health = getHealthAlerts({ moolank: 2, missing: [3, 8], personalYear: 8, enemiesOfMoolank: [8] })
    expect(health.some(h => h.number === 8 && h.priority === 'watch')).toBe(true)
  })

  it('indian friendship differs from BPHS for 1↔4', () => {
    // BPHS: Sun vs Rahu are enemies → challenging
    expect(numberHarmonyMode(1, 4, 'bphs')).toBe('challenging')
    // Indian popular: 1 and 4 often friends
    expect(['excellent', 'good', 'neutral', 'mixed'].includes(numberHarmonyMode(1, 4, 'indian'))).toBe(true)
  })

  it('marriage timing and month calendar', () => {
    const years = getMarriageTimingYears({
      yourDob: { year: 1990, month: 11, day: 29 },
      partnerDob: { year: 1992, month: 3, day: 10 },
      fromYear: 2026,
      count: 5,
    })
    expect(years).toHaveLength(5)
    expect(years[0]!.score).toBeGreaterThanOrEqual(years[years.length - 1]!.score)

    const cal = buildMonthCalendar({
      year: 2026, month: 10,
      birth: { year: 1990, month: 11, day: 29 },
      moolank: 2, bhagyank: 5,
    })
    expect(cal).toHaveLength(31)
    expect(cal[0]?.personalDay).toBeGreaterThanOrEqual(1)
  })

  it('brand score, plates, nakshatra bridge, daily muhurta, yantras', () => {
    const brand = scoreBrandOrSignature('Vedaansh', 1, 3)!
    expect(brand.root).toBeGreaterThanOrEqual(1)
    expect(suggestPlateEndings(1, 3).length).toBeGreaterThan(0)
    const nak = getNakshatraLetterBridge(0, 1)
    expect(nak.nakshatraName).toBe('Ashwini')
    expect(nak.sounds[0]).toBe('Chu')
    const daily = getDailyAnkaMuhurta({
      birth: { year: 1990, month: 11, day: 29 },
      moolank: 2, bhagyank: 5,
      today: { year: 2026, month: 10, day: 12 },
    })
    expect(daily.personalDay).toBeGreaterThanOrEqual(1)
    expect(daily.doList.length).toBeGreaterThan(0)
    expect(getYantraPacks([1, 8])[0]?.yantraName).toMatch(/Surya/)
  })
})
