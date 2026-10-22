// ─────────────────────────────────────────────────────────────
//  __tests__/engine/dashamsaAdvanced.test.ts
//  D10 Advanced — dispositors, drishti, raja, karakas, timeline
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import type { ChartOutput, Dignity, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { analyzeDashamsa } from '@/lib/engine/dashamsaAnalysis'
import { buildDashamsaClassical } from '@/lib/engine/dashamsaClassical'
import { buildDashamsaAdvanced } from '@/lib/engine/dashamsaAdvanced'

function g(id: GrahaId, rashi: Rashi, dignity: Dignity, nak = 0): GrahaData {
  return {
    id,
    rashi,
    degree: 10,
    dignity,
    name: id,
    nakshatraIndex: nak,
    pada: 1,
    isCombust: false,
    isRetro: false,
    pushkara: {
      isPushkara: id === 'Ju',
      type: id === 'Ju' ? 'pushkara_navamsha' : null,
      rashi,
      degreeInSign: 10,
      navamsha: 1,
      isPushkaraNavamsha: id === 'Ju',
      remedy: null,
    },
  } as GrahaData
}

const PLACED: { id: GrahaId; rashi: Rashi; dignity: Dignity; nak: number }[] = [
  { id: 'Su', rashi: 10, dignity: 'enemy', nak: 19 },
  { id: 'Mo', rashi: 4, dignity: 'own', nak: 7 },
  { id: 'Ma', rashi: 1, dignity: 'own', nak: 0 },
  { id: 'Me', rashi: 3, dignity: 'own', nak: 5 },
  { id: 'Ju', rashi: 1, dignity: 'friend', nak: 1 },
  { id: 'Ve', rashi: 7, dignity: 'own', nak: 14 },
  { id: 'Sa', rashi: 1, dignity: 'debilitated', nak: 2 },
  { id: 'Ra', rashi: 5, dignity: 'neutral', nak: 9 },
  { id: 'Ke', rashi: 11, dignity: 'neutral', nak: 22 },
]

function chart(): ChartOutput {
  const planets = PLACED.map((p) => g(p.id, p.rashi, p.dignity, p.nak))
  const now = Date.now()
  return {
    meta: {
      name: 'Test Native',
      birthDate: '1988-08-04',
      birthTime: '20:45:00',
      birthPlace: 'New Delhi',
      latitude: 28.6,
      longitude: 77.2,
      timezone: 'Asia/Kolkata',
    },
    grahas: planets,
    lagnas: { ascRashi: 1 as Rashi, ascDegree: 10, ascDegreeInRashi: 10 },
    arudhas: {
      AL: 1, A2: 2, A3: 3, A4: 4, A5: 5, A6: 6,
      A7: 7, A8: 8, A9: 9, A10: 10, A11: 11, A12: 12,
    },
    karakas: {
      AK: 'Sa',
      AmK: 'Ju',
      BK: 'Ma',
      MK: 'Mo',
      PK: 'Me',
      GK: 'Su',
      DK: 'Ve',
      PiK: null,
    },
    vargas: {
      D10: planets,
      D9: planets,
    },
    vargaLagnas: { D10: 1 as Rashi },
    shadbala: {
      planets: {
        Sa: {
          id: 'Sa',
          sthanaBala: 100, digBala: 40, kalaBala: 80, chestaBala: 50,
          naisargikaBala: 30, drikBala: 10, total: 310, totalShash: 310,
          required: 300, ratio: 1.03, isStrong: true, qualityBand: 'strong',
        },
        Ju: {
          id: 'Ju',
          sthanaBala: 120, digBala: 50, kalaBala: 90, chestaBala: 60,
          naisargikaBala: 40, drikBala: 20, total: 380, totalShash: 380,
          required: 390, ratio: 0.97, isStrong: false, qualityBand: 'average',
        },
        Ma: {
          id: 'Ma',
          sthanaBala: 140, digBala: 55, kalaBala: 100, chestaBala: 70,
          naisargikaBala: 45, drikBala: 15, total: 425, totalShash: 425,
          required: 300, ratio: 1.42, isStrong: true, qualityBand: 'excellent',
        },
      },
      strongest: 'Ma',
      weakest: 'Ju',
    },
    bhavaBala: {
      houses: {
        10: {
          house: 10, rashi: 10 as Rashi,
          adhipatiBala: 300, digBala: 40, drishtiBala: 20,
          totalShash: 360, totalRupa: 6, isStrong: true,
        },
        11: {
          house: 11, rashi: 11 as Rashi,
          adhipatiBala: 280, digBala: 30, drishtiBala: 10,
          totalShash: 320, totalRupa: 5.33, isStrong: false,
        },
      },
      strongestHouse: 10,
      weakestHouse: 11,
    },
    ashtakavarga: {
      sav: [28, 30, 25, 29, 27, 24, 31, 26, 28, 33, 22, 29],
      savTotal: 332,
      bav: {},
    },
    dashas: {
      vimshottari: [{
        lord: 'Ju',
        start: new Date(now - 86_400_000),
        end: new Date(now + 86_400_000 * 400),
        level: 1,
        children: [
          {
            lord: 'Sa',
            start: new Date(now - 86_400_000),
            end: new Date(now + 86_400_000 * 90),
            level: 2,
            children: [],
          },
          {
            lord: 'Me',
            start: new Date(now + 86_400_000 * 90),
            end: new Date(now + 86_400_000 * 180),
            level: 2,
            children: [],
          },
        ],
      }],
    },
  } as unknown as ChartOutput
}

describe('buildDashamsaAdvanced', () => {
  it('builds dispositor, drishti, strength, karakas, raja, timeline', () => {
    const c = chart()
    const analysis = analyzeDashamsa(c)!
    const classical = buildDashamsaClassical(analysis, c)!
    const adv = buildDashamsaAdvanced(analysis, classical, c)

    expect(adv).not.toBeNull()
    const a = adv!

    expect(a.dispositor.length).toBeGreaterThan(0)
    expect(a.dispositor[0].links.length).toBeGreaterThanOrEqual(1)
    expect(a.dispositor[0].prediction.length).toBeGreaterThan(20)

    expect(a.drishti.prediction.length).toBeGreaterThan(10)

    expect(a.shadbala.available).toBe(true)
    expect(a.shadbala.rows.some((r) => r.id === 'Sa' && r.isStrong === true)).toBe(true)

    expect(a.bhavaBala.available).toBe(true)
    expect(a.bhavaBala.tenth?.isStrong).toBe(true)

    expect(a.ashtakavarga.available).toBe(true)
    expect(a.ashtakavarga.houses.find((h) => h.house === 10)?.bindus).toBe(33)

    expect(a.karakas.some((k) => k.code === 'AmK' && k.id === 'Ju')).toBe(true)
    expect(a.karakas.some((k) => k.code === 'AK')).toBe(true)

    expect(a.flags.some((f) => f.id === 'Ju' && f.flags.includes('Pushkara'))).toBe(true)

    expect(a.raja.length).toBe(5)
    expect(a.raja.every((r) => typeof r.formed === 'boolean')).toBe(true)

    expect(a.timeline.items.length).toBeGreaterThan(0)
    expect(a.timeline.items.some((t) => t.careerHit)).toBe(true)

    expect(a.takeaways.length).toBeGreaterThanOrEqual(4)
    expect(a.headline.length).toBeGreaterThan(5)
  })

  it('returns null without D10 planets', () => {
    const c = chart()
    const analysis = analyzeDashamsa(c)!
    const classical = buildDashamsaClassical(analysis, c)!
    const empty = { ...analysis, planets: [] }
    expect(buildDashamsaAdvanced(empty, classical, c)).toBeNull()
  })
})
