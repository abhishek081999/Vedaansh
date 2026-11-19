import { describe, expect, it } from 'vitest'
import type { DashaNode, GrahaId, Rashi } from '@/types/astrology'
import {
  buildAcgChartProfile,
  currentPeriods,
  digBalaAt,
  dashaWindowsFor,
  flattenVimshottari,
  functionalScore,
  housesRuledBy,
  lineFavor,
  scoreLocationForChart,
  type AcgChartInput,
} from '@/lib/engine/acgChartProfile'
import { buildRelocatedChart, localSpaceLine } from '@/lib/engine/acgRelocation'
import { FUNCTIONAL_NATURE, functionalClass } from '@/lib/engine/functionalNature'
import { precessFromJ2000, YOGATARAS, yogatarasAt } from '@/lib/engine/yogataras'
import sweph from 'sweph'
import { acgTransitWindows, calculateACG, eclipticToRa, meanObliquity, normLon, SPECIAL_DRISHTI } from '@/lib/engine/astrocartography'
import { getPlanetPosition, PLANET_IDS } from '@/lib/engine/ephemeris'
import type { ACGLineGeometry } from '@/lib/engine/acgProximity'

const RAD = Math.PI / 180
const JD = 2451545.0

function node(lord: string, start: string, end: string, level: number, children: DashaNode[] = []): DashaNode {
  return { lord, start: new Date(start), end: new Date(end), durationMs: Date.parse(end) - Date.parse(start), level, isCurrent: false, children }
}

const DASHAS: DashaNode[] = [
  node('Ve', '2010-01-01', '2030-01-01', 1, [
    node('Ve', '2010-01-01', '2013-05-01', 2),
    node('Sa', '2024-01-01', '2027-03-01', 2),
    node('Me', '2027-03-01', '2030-01-01', 2),
  ]),
  node('Su', '2030-01-01', '2036-01-01', 1, [node('Su', '2030-01-01', '2030-04-20', 2), node('Mo', '2030-04-20', '2030-10-20', 2)]),
]

function chart(asc: Rashi): AcgChartInput {
  const rashi = (n: number) => n as Rashi
  return {
    lagnas: { ascRashi: asc },
    grahas: [
      { id: 'Su', rashi: rashi(5), dignity: 'own' }, { id: 'Mo', rashi: rashi(2), dignity: 'exalted' },
      { id: 'Ma', rashi: rashi(4), dignity: 'debilitated' }, { id: 'Me', rashi: rashi(6), dignity: 'exalted' },
      { id: 'Ju', rashi: rashi(9), dignity: 'moolatrikona' }, { id: 'Ve', rashi: rashi(12), dignity: 'exalted' },
      { id: 'Sa', rashi: rashi(1), dignity: 'debilitated' }, { id: 'Ra', rashi: rashi(3) }, { id: 'Ke', rashi: rashi(9) },
    ],
    shadbala: { planets: { Ve: { total: 9, required: 5.5 }, Sa: { total: 3, required: 5 } } },
    dashas: { vimshottari: DASHAS },
  }
}

describe('acgChartProfile', () => {
  it('reads lordship by lagna', () => {
    expect(housesRuledBy(1, 'Ju')).toEqual([9, 12])
    expect(functionalScore(2, 'Sa')).toBe(1) // Taurus: Saturn yogakaraka
    expect(functionalScore(1, 'Ju')).toBeGreaterThan(0.5) // Aries: Jupiter rules the 9th
    expect(functionalScore(1, 'Me')).toBeLessThan(-0.4) // Aries: Mercury rules the 3rd and 6th
    expect(functionalScore(8, 'Ma')).toBeGreaterThanOrEqual(0.5) // Scorpio: lagna lord also owns the 6th
  })

  it('flags the running maha and antar lords', () => {
    const p = buildAcgChartProfile(chart(2), new Date('2025-06-01'))
    expect(p.mahaLord).toBe('Ve')
    expect(p.antarLord).toBe('Sa')
    expect(p.grahas.Ve?.dashaRole).toBe('maha')
    expect(p.grahas.Sa?.dashaRole).toBe('antar')
    expect(p.grahas.Sa?.nature).toBe('yogakaraka')
    expect(p.grahas.Ve?.strength).toBeGreaterThan(1)
    expect(p.grahas.Sa?.strength).toBeLessThan(1)
  })

  it('accepts dasha dates serialised as strings', () => {
    const periods = flattenVimshottari(JSON.parse(JSON.stringify(DASHAS)))
    expect(currentPeriods(periods, new Date('2030-05-01'))).toEqual({ maha: 'Su', antar: 'Mo' })
  })

  it('applies BPHS dig bala on the angles', () => {
    expect(digBalaAt('Ju', 'AS')).toBe('full')
    expect(digBalaAt('Ju', 'DS')).toBe('none')
    expect(digBalaAt('Sa', 'DS')).toBe('full')
    expect(digBalaAt('Mo', 'IC')).toBe('full')
    expect(digBalaAt('Su', 'MC')).toBe('full')
    expect(digBalaAt('Ve', 'AS')).toBeNull()
    expect(digBalaAt('Ra', 'AS')).toBeNull()
    const p = buildAcgChartProfile(chart(1))
    expect(lineFavor(p, 'Ju', 'AS')).toBeGreaterThan(lineFavor(p, 'Ju', 'DS'))
    expect(lineFavor(p, 'Sa', 'DS')).toBeGreaterThan(lineFavor(p, 'Sa', 'AS'))
  })

  it('lifts natural malefics on the MC (upachaya)', () => {
    const p = buildAcgChartProfile(chart(1))
    expect(lineFavor(p, 'Sa', 'MC')).toBeGreaterThan(lineFavor(p, 'Sa', 'AS'))
  })

  it('splits supportive and challenging lines', () => {
    const p = buildAcgChartProfile(chart(2), new Date('2025-06-01'))
    const lines: ACGLineGeometry[] = [
      { grahaId: 'Sa', mcLine: 77, icLine: -103, asCurve: [], dsCurve: [] },
      { grahaId: 'Ma', mcLine: 77.5, icLine: -102.5, asCurve: [], dsCurve: [] },
    ]
    const s = scoreLocationForChart(28.6, 77.2, lines, [], p, { useDasha: true })
    expect(s.hits).toHaveLength(2)
    expect(s.supportive).toBeGreaterThan(0)
    expect(s.net).toBe(s.supportive - s.challenging)
    const noDasha = scoreLocationForChart(28.6, 77.2, lines, [], p, { useDasha: false })
    expect(s.intensity).toBeGreaterThan(noDasha.intensity)
  })

  it('lists when a place switches on, skipping antardashas inside a listed mahadasha', () => {
    const p = buildAcgChartProfile(chart(2), new Date('2025-06-01'))
    const w = dashaWindowsFor(['Ve', 'Su', 'Me'] as GrahaId[], p, { from: new Date('2025-06-01'), limit: 10 })
    expect(w.map(x => `${x.lord}${x.level}`)).toEqual(['Ve1', 'Su1'])
    const onlyMe = dashaWindowsFor(['Me'] as GrahaId[], p, { from: new Date('2025-06-01') })
    expect(onlyMe[0]).toMatchObject({ lord: 'Me', level: 2, parent: 'Ve' })
  })
})

describe('acgRelocation', () => {
  it('builds whole-sign houses from the relocated sidereal lagna', () => {
    // Tropical 30° minus ayanamsha 24° = sidereal 6° Aries.
    const r = buildRelocatedChart(30, 24, 10, [{ id: 'Su', totalDegree: 100 }, { id: 'Sa', totalDegree: 8 }], 300)
    expect(r.ascRashi).toBe(1)
    expect(r.grahas.find(g => g.grahaId === 'Su')).toMatchObject({ house: 4, natalHouse: 7 })
    expect(r.grahas.find(g => g.grahaId === 'Sa')?.nearAngle).toBe('AS')
    expect(r.kendra).toEqual(['Su', 'Sa'])
    expect(r.d9Lagna).toBe(2) // 6° Aries is the second navamsha
    expect(r.d10Lagna).toBe(3)
  })

  it('local space lines start at the place and head along the bearing', () => {
    const [seg] = localSpaceLine(28.6, 77.2, 0, 2000, 100)
    expect(seg[0][0]).toBeCloseTo(28.6, 6)
    expect(seg[seg.length - 1][0]).toBeGreaterThan(45)
    expect(seg[seg.length - 1][1]).toBeCloseTo(77.2, 3)
    const east = localSpaceLine(0, 0, 90, 1000, 100)[0]
    expect(east[east.length - 1][1]).toBeCloseTo(8.99, 1)
  })
})

describe('yogataras', () => {
  it('has all 27 junction stars', () => {
    expect(YOGATARAS.map(y => y.nakshatraIndex)).toEqual([...Array(27).keys()])
  })

  it('precesses about 50″ a year in longitude', () => {
    const spica = YOGATARAS[13]
    const p = precessFromJ2000(spica.ra2000, spica.dec2000, JD + 36525) // a century later
    expect(p.ra - spica.ra2000).toBeGreaterThan(1.1)
    expect(p.ra - spica.ra2000).toBeLessThan(1.5)
    const same = precessFromJ2000(spica.ra2000, spica.dec2000, JD)
    expect(same.ra).toBeCloseTo(spica.ra2000, 9)
    expect(same.dec).toBeCloseTo(spica.dec2000, 9)
  })
})

describe('astrocartography extensions', () => {
  it('star parans lie on the horizon of the body that is rising or setting', () => {
    const res = calculateACG(JD, 28.6, 77.2, { stars: true })
    expect(res.starParans!.length).toBeGreaterThan(100)
    const gst = sweph.sidtime(JD) * 15
    const stars = yogatarasAt(JD)
    for (const s of res.starParans!) {
      const star = stars[s.nakshatraIndex]
      const line = res.lines.find(l => l.grahaId === s.grahaId)!
      const graha = { ra: line.mcLine + gst, dec: line.zenith[0] }
      const [onMeridian, onHorizon] = s.meridian === 'graha' ? [graha, star] : [star, graha]
      const lst = s.angle1 === 'MC' ? onMeridian.ra : onMeridian.ra + 180
      const ha = normLon(lst - onHorizon.ra)
      // Horizon equation: cos H = −tan φ · tan δ, and the sign of H says rising (AS) or setting (DS).
      expect(Math.cos(ha * RAD)).toBeCloseTo(-Math.tan(s.lat * RAD) * Math.tan(onHorizon.dec * RAD), 6)
      expect(s.angle2).toBe(ha < 0 ? 'AS' : 'DS')
    }
  })

  it('cyclocartography frame keeps lines still when the planet does not move', () => {
    const natal = calculateACG(JD)
    const same = calculateACG(JD, undefined, undefined, { frameJd: JD })
    expect(same.lines[0].mcLine).toBeCloseTo(natal.lines[0].mcLine, 9)
    // A day later in the natal frame, the Sun's MC line moves about one degree, not 360.
    const next = calculateACG(JD + 1, undefined, undefined, { frameJd: JD })
    const d = Math.abs(normLon(next.lines[0].mcLine - natal.lines[0].mcLine))
    expect(d).toBeGreaterThan(0.8)
    expect(d).toBeLessThan(1.3)
  })

  it('finds Jupiter passing over a place it must cross within a year', () => {
    const natal = calculateACG(JD)
    const ju = natal.lines.find(l => l.grahaId === 'Ju')!
    // Pick a point 5° east of natal Jupiter's MC; transiting Jupiter (≈30°/yr) reaches it within months.
    const lon = normLon(ju.mcLine + 5)
    const windows = acgTransitWindows(JD, 0, lon, JD, 365, 250, ['Ju'])
    const mc = windows.filter(w => w.angle === 'MC')
    expect(mc.length).toBeGreaterThan(0)
    expect(mc[0].minKm).toBeLessThan(60)
    expect(Date.parse(mc[0].start)).toBeLessThanOrEqual(Date.parse(mc[0].peak))
    expect(Date.parse(mc[0].peak)).toBeLessThanOrEqual(Date.parse(mc[0].end))
  })
})

describe('Vedic drishti lines', () => {
  it('draws only the special aspects of Mars, Jupiter and Saturn', () => {
    const res = calculateACG(JD)
    for (const l of res.lines) {
      expect(l.aspects.map(a => a.house)).toEqual(SPECIAL_DRISHTI[l.grahaId] ?? [])
    }
  })

  it('puts the MC exactly the aspected number of signs from the graha', () => {
    const res = calculateACG(JD)
    const gst = sweph.sidtime(JD) * 15
    const eps = meanObliquity(JD)
    for (const id of ['Ma', 'Ju', 'Sa'] as const) {
      const lam = getPlanetPosition(JD, PLANET_IDS[id], false, false).longitude
      for (const a of res.lines.find(l => l.grahaId === id)!.aspects) {
        const ra = (a.lon + gst) * RAD
        // Ecliptic longitude of the MC from its right ascension.
        const mcLam = ((Math.atan2(Math.sin(ra), Math.cos(ra) * Math.cos(eps * RAD)) / RAD) + 360) % 360
        expect(normLon(mcLam - lam - (a.house - 1) * 30)).toBeCloseTo(0, 6)
      }
    }
    expect(eclipticToRa(90, eps)).toBeCloseTo(90, 9)
  })
})

describe('Laghu Parashari functional nature', () => {
  const LAGNA_LORD: Record<number, GrahaId> = { 1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me', 7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju' }

  it('never lists a graha as both benefic and malefic, and keeps every lagna lord auspicious', () => {
    for (let r = 1; r <= 12; r++) {
      const row = FUNCTIONAL_NATURE[r as Rashi]
      expect(row.benefics.filter(g => row.malefics.includes(g))).toEqual([])
      expect(functionalClass(r as Rashi, LAGNA_LORD[r])).toBe('benefic')
      expect(functionalScore(r as Rashi, LAGNA_LORD[r])).toBeGreaterThanOrEqual(0.6)
    }
  })

  it('follows the classical lists over the raw lordship sum', () => {
    expect(functionalScore(3, 'Ju')).toBeLessThanOrEqual(-0.5) // Gemini: Jupiter (7, 10) malefic
    expect(functionalScore(4, 'Ju')).toBeGreaterThanOrEqual(0.6) // Cancer: Jupiter (6, 9) benefic
    expect(functionalScore(12, 'Mo')).toBeGreaterThanOrEqual(0.6) // Pisces: Moon (5) benefic
    expect(functionalScore(1, 'Mo')).toBeGreaterThan(-0.4) // Aries: Moon (4) neutral
    expect(functionalScore(1, 'Mo')).toBeLessThan(0.4)
  })
})

describe('transit windows on rising lines', () => {
  it('measures great-circle distance to the AS curve', () => {
    const natal = calculateACG(JD)
    const ju = natal.lines.find(l => l.grahaId === 'Ju')!
    // A point on natal Jupiter's AS curve at about 40°N, nudged west so transiting Jupiter reaches it.
    const seg = ju.asCurve.find(s => s.some(([la]) => la === 40))!
    const [la, lo] = seg.find(([x]) => x === 40)!
    const windows = acgTransitWindows(JD, la, normLon(lo + 4), JD, 365, 250, ['Ju'])
    const as = windows.filter(w => w.angle === 'AS')
    expect(as.length).toBeGreaterThan(0)
    expect(as[0].minKm).toBeLessThan(40)
  })
})
