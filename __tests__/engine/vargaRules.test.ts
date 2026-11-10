// ─────────────────────────────────────────────────────────────
//  __tests__/engine/vargaRules.test.ts
//  Parashara + PVR + named-variant varga sign rules
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import {
  D2, D3, D4, D5, D6, D7, D8, D9, D10, D12, D16, D20, D24, D24_Paravidya,
  D27, D30, D40, D45, D60, D81, D144,
  D2_Parivritti, D2_Kasinath, D2_Samasaptama, D2_Raman,
  D3_Jagannath, D3_Somanath,
  D4_Parivritti,
  D9_Pada, D9_Nadi, D9_Somanatha,
} from '@/lib/engine/vargas'

describe('Parashara / PVR core varga sign rules', () => {
  it('D2 Hora: odd first half Leo, even first half Cancer', () => {
    expect(D2(0.1)).toBe(5)
    expect(D2(16)).toBe(4)
    expect(D2(30.1)).toBe(4)
    expect(D2(46)).toBe(5)
  })

  it('D3 Drekkana: own / 5th / 9th', () => {
    expect(D3(0.1)).toBe(1)
    expect(D3(11)).toBe(5)
    expect(D3(21)).toBe(9)
  })

  it('D4 Chaturthamsha: own / 4th / 7th / 10th', () => {
    expect(D4(0.1)).toBe(1)
    expect(D4(8)).toBe(4)
    expect(D4(16)).toBe(7)
    expect(D4(24)).toBe(10)
  })

  it('D5 Panchamsha: odd Ar/Aq/Sg/Ge/Li, even Ta/Vi/Pi/Cp/Sc', () => {
    expect(D5(0.1)).toBe(1)
    expect(D5(7)).toBe(11)
    expect(D5(13)).toBe(9)
    expect(D5(19)).toBe(3)
    expect(D5(25)).toBe(7)
    expect(D5(30.1)).toBe(2)
    expect(D5(37)).toBe(6)
    expect(D5(43)).toBe(12)
    expect(D5(49)).toBe(10)
    expect(D5(55)).toBe(8)
  })

  it('D6 Shashthamsha: odd from Aries, even from Libra', () => {
    expect(D6(0.1)).toBe(1)
    expect(D6(11)).toBe(3)     // Aries 11° → 3rd part → Ge
    expect(D6(30.1)).toBe(7)   // Taurus → Li
    expect(D6(49)).toBe(10)    // Scorpio 19° style: Ta 19° → 4th from Li → Cp
    // PVR ex: Me 11° Ge → Ge; Ju 19° Sc → Cp
    expect(D6(60 + 11)).toBe(3)
    expect(D6(210 + 19)).toBe(10)
  })

  it('D7 Saptamsha: odd from own, even from 7th', () => {
    expect(D7(0.1)).toBe(1)
    expect(D7(30.1)).toBe(8)
  })

  it('D8 Ashtamsha: movable→Ar, fixed→Sg, dual→Le', () => {
    expect(D8(0.1)).toBe(1)
    expect(D8(30.1)).toBe(9)
    expect(D8(60.1)).toBe(5)
    // PVR ex: Me 10° Ge (dual, 3rd) → Li; Ju 19° Sc (fixed, 6th) → Ta
    expect(D8(60 + 10)).toBe(7)
    expect(D8(210 + 19)).toBe(2)
  })

  it('D9 Navamsha: fire from Ar, earth from Cp, air from Li, water from Cn', () => {
    expect(D9(0.1)).toBe(1)
    expect(D9(30.1)).toBe(10)
    expect(D9(60.1)).toBe(7)
    expect(D9(90.1)).toBe(4)
  })

  it('D10 Dashamsha: odd from own, even from 9th', () => {
    expect(D10(0.1)).toBe(1)
    expect(D10(30.1)).toBe(10)
    expect(D10(33.1)).toBe(11)
  })

  it('D12 Dwadashamsha: from own sign', () => {
    expect(D12(0.1)).toBe(1)
    expect(D12(2.6)).toBe(2)
    expect(D12(30.1)).toBe(2)
  })

  it('D16: movable→Ar, fixed→Le, dual→Sg', () => {
    expect(D16(0.1)).toBe(1)
    expect(D16(30.1)).toBe(5)
    expect(D16(60.1)).toBe(9)
  })

  it('D20: movable→Ar, fixed→Sg, dual→Le', () => {
    expect(D20(0.1)).toBe(1)    // movable
    expect(D20(30.1)).toBe(9)   // fixed
    expect(D20(60.1)).toBe(5)   // dual
    // Pisces 18°39′ ≈ 13th from Leo → Leo
    expect(D20(330 + 18.65)).toBe(5)
  })

  it('D24 Siddhamsha: odd from Leo, even from Cancer', () => {
    expect(D24(0.1)).toBe(5)
    expect(D24(1.3)).toBe(6)
    expect(D24(17)).toBe(6)
    expect(D24(30.1)).toBe(4)
    expect(D24(31.3)).toBe(5)
    expect(D24(47)).toBe(5)
  })

  it('D24_Paravidya: even signs reverse from Cancer', () => {
    expect(D24_Paravidya(0.1)).toBe(5)
    expect(D24_Paravidya(30.1)).toBe(4)
    expect(D24_Paravidya(31.3)).toBe(3)
  })

  it('D27 Bhamsha: Fire→Ar, Earth→Cn, Air→Li, Water→Cp', () => {
    expect(D27(0.1)).toBe(1)
    expect(D27(17)).toBe(4)
    expect(D27(30.1)).toBe(4)
    expect(D27(31.2)).toBe(5)
    expect(D27(60.1)).toBe(7)
    expect(D27(90.1)).toBe(10)
  })

  it('D30 Trimshamsha unequal arcs', () => {
    expect(D30(1)).toBe(1)
    expect(D30(6)).toBe(11)
    expect(D30(31)).toBe(2)
    expect(D30(36)).toBe(6)
  })

  it('D40: odd from Aries, even from Libra', () => {
    expect(D40(0.1)).toBe(1)
    expect(D40(30.1)).toBe(7)
  })

  it('D45: movable→Ar, fixed→Le, dual→Sg', () => {
    expect(D45(0.1)).toBe(1)
    expect(D45(30.1)).toBe(5)
    expect(D45(60.1)).toBe(9)
  })

  it('D60: counts forward from occupied sign', () => {
    expect(D60(0.1)).toBe(1)
    expect(D60(0.6)).toBe(2)
    expect(D60(30.1)).toBe(2)
  })

  it('D81 is navamsha applied to the fractional pada longitude', () => {
    expect(D81(0.1)).toBe(1)
    expect(D81(1)).toBe(3)
    expect(D81(3.4)).toBe(10)
  })

  it('D144 is D12 applied twice with intermediate degree', () => {
    // 11° Aries → D12 = Leo 12° → D12 again = Sagittarius
    expect(D12(11)).toBe(5)
    expect(D144(11)).toBe(9)
    // 11° Taurus → D12 = Virgo 12° → Capricorn
    expect(D12(30 + 11)).toBe(6)
    expect(D144(30 + 11)).toBe(10)
  })
})

describe('Named variant varga schemes', () => {
  it('D2_Parivritti cycles consecutive halves across the zodiac', () => {
    expect(D2_Parivritti(0.1)).toBe(1)    // Ar 1st → Ar
    expect(D2_Parivritti(16)).toBe(2)     // Ar 2nd → Ta
    expect(D2_Parivritti(30.1)).toBe(3)   // Ta 1st → Ge
    expect(D2_Parivritti(46)).toBe(4)     // Ta 2nd → Cn
  })

  it('D2_Kasinath uses day/night strong signs of the sign lord', () => {
    // Ju 25° Ta (even, 2nd half) → Sun hora → Venus day-strong = Li
    expect(D2_Kasinath(30 + 25)).toBe(7)
    // Ma 18° Sg (odd, 2nd half) → Moon hora → Jupiter night-strong = Sg
    expect(D2_Kasinath(240 + 18)).toBe(9)
  })

  it('D2_Samasaptama uses own / 7th by odd-even half', () => {
    expect(D2_Samasaptama(0.1)).toBe(1)
    expect(D2_Samasaptama(16)).toBe(7)
    expect(D2_Samasaptama(30.1)).toBe(8)
    expect(D2_Samasaptama(46)).toBe(2)
  })

  it('D2_Raman follows the Raman Suprajarama table', () => {
    expect(D2_Raman(0.1)).toBe(8)     // Ar 1st → Sc
    expect(D2_Raman(16)).toBe(10)     // Ar 2nd → Cp
    expect(D2_Raman(30.1)).toBe(2)    // Ta 1st → Ta
    expect(D2_Raman(46)).toBe(12)     // Ta 2nd → Pi
  })

  it('D3_Jagannath: movable 1/5/9, fixed 9/1/5, dual 5/9/1', () => {
    expect(D3_Jagannath(0.1)).toBe(1)
    expect(D3_Jagannath(11)).toBe(5)
    expect(D3_Jagannath(21)).toBe(9)
    expect(D3_Jagannath(30.1)).toBe(10) // Ta 1st → Cp
    expect(D3_Jagannath(41)).toBe(2)    // Ta 2nd → Ta
    expect(D3_Jagannath(51)).toBe(6)    // Ta 3rd → Vi
    expect(D3_Jagannath(60.1)).toBe(7)  // Ge 1st → Li
    expect(D3_Jagannath(71)).toBe(11)   // Ge 2nd → Aq
    expect(D3_Jagannath(81)).toBe(3)    // Ge 3rd → Ge
  })

  it('D3_Somanath odd forward / even reverse hybrid', () => {
    expect(D3_Somanath(0.1)).toBe(1)
    expect(D3_Somanath(11)).toBe(2)
    expect(D3_Somanath(21)).toBe(3)
    expect(D3_Somanath(30.1)).toBe(9)
    expect(D3_Somanath(41)).toBe(8)
    expect(D3_Somanath(51)).toBe(7)
  })

  it('D4_Parivritti cycles consecutive quarters from Aries', () => {
    expect(D4_Parivritti(0.1)).toBe(1)
    expect(D4_Parivritti(8)).toBe(2)
    expect(D4_Parivritti(16)).toBe(3)
    expect(D4_Parivritti(24)).toBe(4)
    expect(D4_Parivritti(30.1)).toBe(5) // Ta 1st → Le
  })

  it('D9_Pada equals Parashara D9 (108 padas from 0° Aries)', () => {
    for (let lon = 0.5; lon < 360; lon += 17.5) {
      expect(D9_Pada(lon)).toBe(D9(lon))
    }
  })

  it('D9_Nadi / D9_Somanatha: Uniform Krishna Mishra table', () => {
    expect(D9_Somanatha(0.1)).toBe(1)     // Ar → Ar
    expect(D9_Somanatha(30.1)).toBe(6)    // Ta → Vi
    expect(D9_Somanatha(33.4)).toBe(5)    // Ta 2nd → Le
    expect(D9_Somanatha(60.1)).toBe(7)    // Ge → Li
    expect(D9_Somanatha(90.1)).toBe(12)   // Cn → Pi
    expect(D9_Nadi(30.1)).toBe(D9_Somanatha(30.1))
  })
})
