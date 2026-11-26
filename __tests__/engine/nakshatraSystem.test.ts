// Nakshatra system: special stars, star-lord chain, Latta, sensitive degrees, Moon timing.
import { beforeAll, describe, expect, it } from 'vitest'
import { calculateChart } from '@/lib/engine/calculator'
import type { ChartOutput, GrahaId } from '@/types/astrology'
import { NAKSHATRA_LORDS } from '@/types/astrology'
import {
  analyzeSensitiveDegrees,
  analyzeSpecialStars,
  analyzeStarLords,
  buildSpecialStars,
  analyzeYogiStars,
  computeLattas,
  countFrom,
  dashaNadi,
  nadiCompatibility,
  navataraGrid,
  povNakshatra,
  taraFix,
  housesRuledBy,
  lattaHits,
  lattaTarget,
  nakAtCount,
  specialStarTransits,
} from '@/lib/engine/nakshatraSystem'
import {
  ephemerisSampler,
  janmaNakshatraDays,
  jdFromMs,
  moonCalendarMonth,
  moonNakshatraSpans,
  vedicBirthdays,
} from '@/lib/engine/nakshatraReturns'

let chart: ChartOutput

beforeAll(async () => {
  chart = await calculateChart({
    name: 'Test',
    birthDate: '1990-05-15',
    birthTime: '10:30',
    utcDate: '1990-05-15',
    utcTime: '05:00:00',
    birthPlace: 'New Delhi',
    latitude: 28.61,
    longitude: 77.21,
    timezone: 'Asia/Kolkata',
    gender: 'male',
  })
})

describe('counting', () => {
  it('counts inclusively and wraps round 27', () => {
    expect(countFrom(5, 5)).toBe(1)
    expect(countFrom(5, 14)).toBe(10)
    expect(countFrom(20, 2)).toBe(10)
    expect(nakAtCount(20, 10)).toBe(2)
    expect(nakAtCount(0, 27)).toBe(26)
  })
})

describe('special stars', () => {
  it('places each special star at its count from Ashwini', () => {
    const stars = buildSpecialStars(0)
    const at = Object.fromEntries(stars.map(s => [s.id, s.nakshatraIndex]))
    expect(at).toEqual({
      janma: 0, jati: 3, matru: 7, karma: 9, sanghatika: 15, samudaya: 17,
      adhana: 18, vainashika: 22, manasa: 24, abhisheka: 26,
    })
    expect(buildSpecialStars(0, [], 22).find(s => s.id === 'vainashika')?.nakshatraIndex).toBe(21)
  })

  it('Janma star holds the natal Moon', () => {
    const janma = analyzeSpecialStars(chart).find(s => s.id === 'janma')!
    expect(janma.natal).toContain('Mo')
  })

  it('grades transits by graha nature and star nature', () => {
    const stars = buildSpecialStars(0)
    const hits = specialStarTransits(stars, [
      { id: 'Sa', nakshatraIndex: 15 }, // malefic on Sanghatika → alert
      { id: 'Ma', nakshatraIndex: 9 },  // malefic on Karma → caution
      { id: 'Ju', nakshatraIndex: 0 },  // benefic on Janma → support
      { id: 'Ve', nakshatraIndex: 5 },  // not on a special star
    ])
    expect(hits.map(h => [h.starId, h.graha, h.tone])).toEqual([
      ['sanghatika', 'Sa', 'alert'],
      ['karma', 'Ma', 'caution'],
      ['janma', 'Ju', 'support'],
    ])
  })
})

describe('navatara grid and nadi roles', () => {
  it('lays out 27 cells in three paryays with tara and role', () => {
    const moonNak = chart.grahas.find(g => g.id === 'Mo')!.nakshatraIndex
    const grid = navataraGrid(chart, moonNak)
    expect(grid).toHaveLength(27)
    expect(grid[0]).toMatchObject({ count: 1, tara: 'Janma', paryay: 0, role: 'janma', nakshatraIndex: moonNak })
    expect(grid[9]).toMatchObject({ count: 10, tara: 'Janma', paryay: 1, role: 'karma' })
    expect(grid[26]).toMatchObject({ count: 27, tara: 'Ati-Mitra', paryay: 2, role: 'abhisheka' })
    expect(grid[0].bodies).toContain('Mo')
    expect(grid.flatMap(c => c.bodies).sort()).toEqual(['As', 'Ju', 'Ke', 'Ma', 'Me', 'Mo', 'Ra', 'Sa', 'Su', 'Ve'])
  })

  it('counts from the chosen point of view', () => {
    const lagna = povNakshatra(chart, 'lagna')
    expect(lagna.nakshatraIndex).toBe(Math.floor(chart.lagnas.ascDegree / (360 / 27)))
    expect(povNakshatra(chart, 'sun').lord).toBe('Su')
    expect(taraFix(lagna.nakshatraIndex, lagna.nakshatraIndex).role).toBe('janma')
  })

  it('reads the dasha lords: maha from the Moon, antars from the maha lord', () => {
    const d = dashaNadi(chart, 23, Date.UTC(2026, 10, 26))
    expect(d).not.toBeNull()
    const moonNak = chart.grahas.find(g => g.id === 'Mo')!.nakshatraIndex
    expect(d!.maha.count).toBe(countFrom(moonNak, d!.maha.nakshatraIndex))
    expect(d!.antars.length).toBe(9)
    expect(d!.antars.filter(a => a.current)).toHaveLength(1)
    for (const a of d!.antars) expect(a.count).toBe(countFrom(d!.maha.nakshatraIndex, a.nakshatraIndex))
  })
})

describe('yogi stars', () => {
  it('Yogi and Avayogi grahas are the lords of their points\' nakshatras', () => {
    const y = analyzeYogiStars(chart)!
    expect(NAKSHATRA_LORDS[y.yogiNak]).toBe(y.yogiGraha)
    expect(NAKSHATRA_LORDS[y.avayogiNak]).toBe(y.avayogiGraha)
    // Avayogi point is 186°40' (14 stars) after the Yogi point
    expect((y.avayogiNak - y.yogiNak + 27) % 27).toBe(14)
    for (const b of y.ruledByYogi) {
      const nak = b === 'As' ? Math.floor(chart.lagnas.ascDegree / (360 / 27)) : chart.grahas.find(g => g.id === b)!.nakshatraIndex
      expect(NAKSHATRA_LORDS[nak]).toBe(y.yogiGraha)
    }
  })
})

describe('nadi compatibility', () => {
  it('reads each partner\'s star from the other side', () => {
    const r = nadiCompatibility(0, 15) // Vishakha is Ashwini's 16th → Sanghatika
    expect(r.theirStarForMe.role).toBe('sanghatika')
    expect(r.myStarForThem.count).toBe(13)
    expect(nadiCompatibility(6, 15).theirStarForMe.role).toBe('karma') // Punarvasu → Vishakha is the 10th
  })
})

describe('star-lord chain', () => {
  it('links every body to its nakshatra lord', () => {
    const { links } = analyzeStarLords(chart)
    expect(links).toHaveLength(10) // Lagna + 9 grahas
    for (const l of links) {
      expect(l.starLord).toBe(NAKSHATRA_LORDS[l.nakshatraIndex])
      expect(l.chain[0]).toBe(l.starLord)
      expect(new Set(l.chain).size).toBe(l.chain.length)
      expect(l.deliveredHouses).toContain(l.house)
    }
  })

  it('house lordships follow whole signs from the Lagna', () => {
    expect(housesRuledBy('Ma', 1)).toEqual([1, 8])
    expect(housesRuledBy('Sa', 4)).toEqual([7, 8])
    expect(housesRuledBy('Ra', 1)).toEqual([])
  })

  it('star exchanges are symmetric', () => {
    const { exchanges } = analyzeStarLords(chart)
    const lordOf = (id: GrahaId) => NAKSHATRA_LORDS[chart.grahas.find(g => g.id === id)!.nakshatraIndex]
    for (const { a, b } of exchanges) {
      expect(lordOf(a)).toBe(b)
      expect(lordOf(b)).toBe(a)
    }
  })
})

describe('latta', () => {
  it('kicks forward and backward with inclusive counts', () => {
    expect(lattaTarget(0, 'forward', 12)).toBe(11)  // Sun from Ashwini → Uttara Phalguni
    expect(lattaTarget(0, 'backward', 22)).toBe(6)  // Moon from Ashwini → Punarvasu
    expect(lattaTarget(3, 'backward', 5)).toBe(26)
  })

  it('reports lattas landing on the Janma star', () => {
    const rows = computeLattas([{ id: 'Sa', nakshatraIndex: 20 }])
    expect(rows[0].targetNak).toBe(0)
    expect(lattaHits(rows, [{ key: 'janma', nakshatraIndex: 0 }])).toHaveLength(1)
  })
})

describe('sensitive degrees', () => {
  it('returns a row for the Lagna and the nine grahas', () => {
    const rows = analyzeSensitiveDegrees(chart)
    expect(rows.map(r => r.body)).toEqual(['As', 'Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke'])
    for (const r of rows) {
      expect(r.degreeInSign).toBeGreaterThanOrEqual(0)
      expect(r.degreeInSign).toBeLessThan(30)
      if (r.nakshatraSandhi != null) expect(r.nakshatraSandhi).toBeLessThanOrEqual(0.5)
    }
  })
})

describe('moon timing (Swiss Ephemeris)', () => {
  const moon = ephemerisSampler('Mo', 'lahiri_vp285')
  const sun = ephemerisSampler('Su', 'lahiri_vp285')

  it('spans are contiguous and step one star at a time', () => {
    const start = jdFromMs(Date.UTC(2026, 0, 1))
    const spans = moonNakshatraSpans(start, start + 30, moon)
    expect(spans.length).toBeGreaterThanOrEqual(28)
    for (let i = 1; i < spans.length; i++) {
      expect(spans[i].startJd).toBeCloseTo(spans[i - 1].endJd, 6)
      expect(spans[i].index).toBe((spans[i - 1].index + 1) % 27)
    }
  })

  it('the Moon returns to a star about every 27.3 days', () => {
    const rets = janmaNakshatraDays(5, Date.UTC(2026, 0, 1), 120, moon)
    expect(rets.length).toBeGreaterThanOrEqual(4)
    const gap = (Date.parse(rets[2].start) - Date.parse(rets[1].start)) / 86_400_000
    expect(gap).toBeGreaterThan(26.5)
    expect(gap).toBeLessThan(28.5)
  })

  it('vedic birthday falls while the Sun is in the natal sign', () => {
    const [b] = vedicBirthdays(5, 2, 2026, 1, moon, sun) // Ardra, Sun in Taurus
    expect(b.year).toBe(2026)
    expect(b.occurrences.length).toBeGreaterThanOrEqual(1)
    for (const o of b.occurrences) {
      expect(Date.parse(o.start)).toBeGreaterThanOrEqual(Date.parse(b.solarMonth.start))
      expect(Date.parse(o.end)).toBeLessThanOrEqual(Date.parse(b.solarMonth.end))
    }
  })

  it('month calendar has one entry per day', () => {
    const days = moonCalendarMonth(2026, 2, 330, moon)
    expect(days).toHaveLength(28)
    expect(days[0].date).toBe('2026-02-01')
    expect(days.every(d => d.nakshatraIndex >= 0 && d.nakshatraIndex < 27)).toBe(true)
  })
})
