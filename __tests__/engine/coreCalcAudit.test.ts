// Regression tests for the Nov 2026 core-calculation audit:
// first-dasha antardashas, Gulika Kalam, Abhijit, Purnima lord, vara helpers.
import { describe, expect, it } from 'vitest'
import { calcVimshottari } from '@/lib/engine/dasha/vimshottari'
import { calcAshtottari } from '@/lib/engine/dasha/ashtottari'
import { calcYoginiDasha } from '@/lib/engine/dasha/yogini'
import {
  getAbhijitMuhurta, getGulikaKalam, getRahuKalam, getTithi,
  varaFromDateStr, varaFromNumber,
} from '@/lib/engine/nakshatra'
import { D2_Somanath, D3_Somanath, D9_Nadi, D9_Somanatha, D150, mod12 } from '@/lib/engine/vargas'

const HOUR = 3600_000

describe('first mahadasha antardashas use the full period', () => {
  // Bhoranj 19 Aug 1999 10:00 IST — Moon 213.162° (Vishakha, Jupiter dasha, ~2.5 months left)
  const birth = new Date('1999-08-19T04:30:00Z')

  it('Vimshottari: birth falls in Jupiter–Rahu, not a compressed Jupiter–Jupiter', () => {
    const md = calcVimshottari(213.162, birth, 2)
    expect(md[0].lord).toBe('Ju')
    expect(md[0].start.getTime()).toBeLessThan(birth.getTime())
    const atBirth = md[0].children!.find(c => c.start <= birth && c.end > birth)!
    expect(atBirth.lord).toBe('Ra')
    // Ju–Ra lasts 16 × 18 / 120 = 2.4 years
    const years = atBirth.durationMs / (365.256363004 * 24 * HOUR)
    expect(years).toBeCloseTo(2.4, 6)
    // Mahadasha still ends at birth + balance
    const balance = (md[0].end.getTime() - birth.getTime()) / (365.256363004 * 24 * HOUR)
    const traversed = (213.162 % (360 / 27)) / (360 / 27)
    expect(balance).toBeCloseTo((1 - traversed) * 16, 6)
  })

  it('Ashtottari and Yogini: first period is full length and contains birth', () => {
    const ash = calcAshtottari(213.162, birth, 2)
    expect(ash[0].start.getTime()).toBeLessThanOrEqual(birth.getTime())
    expect(ash[0].end.getTime()).toBeGreaterThan(birth.getTime())
    const yog = calcYoginiDasha(15, 213.162 % (360 / 27), birth, 2)
    expect(yog[0].start.getTime()).toBeLessThanOrEqual(birth.getTime())
    const kids = yog[0].children!
    expect(kids[kids.length - 1].end.getTime()).toBeCloseTo(yog[0].end.getTime(), -1)
  })
})

describe('panchang kalams', () => {
  const sr = new Date('2024-01-15T00:00:00Z')
  const ss = new Date('2024-01-15T08:00:00Z') // 8 slots of 1 hour

  it('Gulika Kalam is Saturn’s portion: Sun 7th … Sat 1st', () => {
    const expected = [7, 6, 5, 4, 3, 2, 1]
    expected.forEach((slot, vara) => {
      const g = getGulikaKalam(sr, ss, vara)
      expect(g.start.getTime() - sr.getTime()).toBe((slot - 1) * HOUR)
    })
  })

  it('Gulika Kalam never equals Rahu Kalam', () => {
    for (let v = 0; v < 7; v++) {
      expect(getGulikaKalam(sr, ss, v).start).not.toEqual(getRahuKalam(sr, ss, v).start)
    }
  })

  it('Abhijit is one muhurta (day ÷ 15) centred on noon', () => {
    const ab = getAbhijitMuhurta(sr, ss)!
    expect(ab.end.getTime() - ab.start.getTime()).toBe((8 * HOUR) / 15)
  })

  it('Purnima lord is Chandra, Amavasya lord is Pitrus', () => {
    expect(getTithi(174 + 6, 6).lord).toBe('Chandra')   // tithi 15 (Purnima)
    expect(getTithi(354 + 6, 6).lord).toBe('Pitrus')    // tithi 30 (Amavasya)
  })
})

describe('vara helpers', () => {
  it('uses the local date, not UTC', () => {
    expect(varaFromDateStr('2000-01-01').name).toBe('Saturday')
    expect(varaFromDateStr('2026-11-26').name).toBe('Thursday')
    expect(varaFromNumber(-1).name).toBe('Saturday')
  })
})

// Expected values from PyJHora (naturalstupid/PyJHora charts.py), 1-based signs.
describe('niche varga variants match PyJHora', () => {
  const at = (sign: number, deg: number) => (sign - 1) * 30 + deg

  it('Somanatha hora: Ar→(Ar,Ta), Ta→(Pi,Aq), Ge→(Ge,Cn), Cn→(Cp,Sg)', () => {
    expect([D2_Somanath(at(1, 5)), D2_Somanath(at(1, 20))]).toEqual([1, 2])
    expect([D2_Somanath(at(2, 5)), D2_Somanath(at(2, 20))]).toEqual([12, 11])
    expect([D2_Somanath(at(3, 5)), D2_Somanath(at(3, 20))]).toEqual([3, 4])
    expect([D2_Somanath(at(4, 5)), D2_Somanath(at(4, 20))]).toEqual([10, 9])
  })

  it('Somanatha drekkana: Ta→(Pi,Aq,Cp), Ge→(Cn,Le,Vi)', () => {
    expect([5, 15, 25].map(d => D3_Somanath(at(2, d)))).toEqual([12, 11, 10])
    expect([5, 15, 25].map(d => D3_Somanath(at(3, d)))).toEqual([4, 5, 6])
  })

  it('Somanatha navamsha: Ar starts Ar, Ta starts Pi backwards, Ge starts Li', () => {
    expect(D9_Somanatha(at(1, 1))).toBe(1)
    expect(D9_Somanatha(at(2, 1))).toBe(12)
    expect(D9_Somanatha(at(2, 29))).toBe(4)
    expect(D9_Somanatha(at(3, 1))).toBe(10)
  })

  it('Nadi navamsha (Rangacharya): fire Ar fwd, earth Cp rev, air Li fwd, water Cn rev', () => {
    expect([D9_Nadi(at(1, 1)), D9_Nadi(at(1, 4))]).toEqual([1, 2])
    expect([D9_Nadi(at(2, 1)), D9_Nadi(at(2, 4))]).toEqual([10, 9])
    expect([D9_Nadi(at(3, 1)), D9_Nadi(at(3, 4))]).toEqual([7, 8])
    expect([D9_Nadi(at(4, 1)), D9_Nadi(at(4, 4))]).toEqual([4, 3])
  })

  it('D150 counts from the sign itself', () => {
    expect(D150(at(5, 0.1))).toBe(5)
    expect(D150(at(5, 0.3))).toBe(6)
    expect(D150(at(12, 29.9))).toBe(mod12(12 + 149))
  })
})
