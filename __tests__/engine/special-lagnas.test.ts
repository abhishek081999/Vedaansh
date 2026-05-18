import { describe, it, expect } from 'vitest'
import {
  calcBhavaLagna,
  calcHoraLagna,
  calcGhatiLagna,
  calcPranapada,
} from '@/lib/engine/specialLagnas'
import { calcInduLagna, hydrateSpecialLagnas } from '@/lib/engine/astroDetailsDerived'
import type { GrahaData, LagnaData, Rashi } from '@/types/astrology'

/** BPHS Ch.5 worked example: Sun at sunrise 4s 12°, ishta 12gh 30vi. */
const SUN_RISE_LON = 132 // 4° Leo 12°
const ISHTA_GHATIS = 12.5
const ISHTA_VIGHATIKAS = 12 * 60 + 30

describe('special lagnas (BPHS Ch.5 example)', () => {
  it('Bhava Lagna = Libra 27°', () => {
    const lon = calcBhavaLagna(SUN_RISE_LON, ISHTA_GHATIS)
    expect(lon).toBeCloseTo(207, 0) // 180 + 27
  })

  it('Hora Lagna = Capricorn 12°', () => {
    const lon = calcHoraLagna(SUN_RISE_LON, ISHTA_GHATIS)
    expect(lon).toBeCloseTo(282, 0) // 270 + 12
  })

  it('Ghati Lagna = Leo 27°', () => {
    const lon = calcGhatiLagna(SUN_RISE_LON, ISHTA_GHATIS, ISHTA_VIGHATIKAS)
    expect(lon).toBeCloseTo(147, 0) // 120 + 27
  })
})

describe('calcInduLagna (BPHS / Astrobix)', () => {
  it('kala 18 → count 6 from Moon Cancer → Sagittarius (Astrobix / Powerofastro)', () => {
    // 9th from Libra(7)=Gemini→Me(8); 9th from Cancer(4)=Pisces→Ju(10); sum=18, rem=6
    const lon = calcInduLagna(100, 4 as Rashi, 7 as Rashi)
    expect(Math.floor(lon / 30) + 1).toBe(9)
    // Same with Capricorn asc (published worked example)
    expect(Math.floor(calcInduLagna(50, 4 as Rashi, 10 as Rashi) / 30) + 1).toBe(9)
  })

  it('remainder 1 → Moon’s own sign', () => {
    // Taurus asc(2): 9th Cap→Sa(1); Moon Virgo(6): 9th Tau→Ve(12); total 13, rem 1
    expect(Math.floor(calcInduLagna(12, 6 as Rashi, 2 as Rashi) / 30) + 1).toBe(6)
  })

  it('remainder 2 → 2nd sign from Moon', () => {
    // Gemini asc(3): 9th Aqu→Sa(1); Moon Gemini: 9th Aqu→Sa(1); total 2, rem 2
    expect(Math.floor(calcInduLagna(10, 3 as Rashi, 3 as Rashi) / 30) + 1).toBe(4)
  })

  it('total divisible by 12 → sign before Moon', () => {
    // Leo asc + Leo moon: 9th Aries→Ma(6) + Ma(6) = 12, rem 0 → Cancer (before Leo)
    expect(Math.floor(calcInduLagna(10, 5 as Rashi, 5 as Rashi) / 30) + 1).toBe(4)
  })
})

describe('hydrateSpecialLagnas', () => {
  it('overwrites stale cached Indu Lagna (old formula gave Pisces instead of Aquarius)', () => {
    const lagnas = {
      ascDegree: 174.38,
      ascRashi: 6 as Rashi,
      ascDegreeInRashi: 24.38,
      horaLagna: 100,
      ghatiLagna: 100,
      bhavaLagna: 100,
      vighatiLagna: 100,
      pranapada: 73.85,
      sriLagna: 100,
      varnadaLagna: 100,
      induLagna: 333, // Pisces ~3° — wrong cached value (Moon Sco +4 signs)
      bhriguBindu: 100,
      cusps: [],
    } satisfies LagnaData
    const grahas = [
      { id: 'Mo', totalDegree: 213.16, rashi: 8 as Rashi },
      { id: 'Ra', totalDegree: 45.2, rashi: 2 as Rashi },
    ] as GrahaData[]
    const out = hydrateSpecialLagnas(lagnas, grahas)
    expect(Math.floor(out.induLagna / 30) + 1).toBe(11) // Aquarius
  })

  it('fills missing Indu Lagna and Bhrigu Bindu from grahas', () => {
    const lagnas = {
      ascDegree: 174.38,
      ascRashi: 6 as Rashi,
      ascDegreeInRashi: 24.38,
      horaLagna: 100,
      ghatiLagna: 100,
      bhavaLagna: 100,
      vighatiLagna: 100,
      pranapada: 73.85,
      sriLagna: 100,
      varnadaLagna: 100,
      induLagna: undefined as unknown as number,
      bhriguBindu: undefined as unknown as number,
      cusps: [],
    } satisfies LagnaData
    const grahas = [
      { id: 'Mo', totalDegree: 213.16, rashi: 8 as Rashi },
      { id: 'Ra', totalDegree: 45.2, rashi: 2 as Rashi },
    ] as GrahaData[]
    const out = hydrateSpecialLagnas(lagnas, grahas)
    expect(Number.isFinite(out.induLagna)).toBe(true)
    expect(Number.isFinite(out.bhriguBindu)).toBe(true)
  })
})

describe('Pranapada (BPHS Ch.3 example)', () => {
  it('movable Sun: Libra 5° when Sun at Aries 15°', () => {
    const vighatikas = 16 * 60 + 25 // 985
    const sunAries15 = 15
    const pp = calcPranapada(sunAries15, vighatikas)
    expect(pp).toBeCloseTo(185, 0) // Libra 5°
  })

  it('fixed Sun: Cancer 5° when Sun at Taurus 15°', () => {
    const vighatikas = 16 * 60 + 25
    const sunTaurus15 = 45
    const pp = calcPranapada(sunTaurus15, vighatikas)
    expect(pp).toBeCloseTo(95, 0) // Cancer 5°
  })
})
