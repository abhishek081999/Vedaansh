import { describe, expect, it } from 'vitest'
import { calculateACG, computeParans, horizonCurves, normLon } from '@/lib/engine/astrocartography'
import {
  distanceToCurveKm,
  distanceToMeridianKm,
  haversineKm,
  linesNear,
  scoreLocation,
  type ACGLineGeometry,
} from '@/lib/engine/acgProximity'

const RAD = Math.PI / 180
// 2000-01-01 12:00 UT
const JD = 2451545.0

describe('acgProximity', () => {
  it('measures distance to a meridian along the parallel-adjusted great circle', () => {
    expect(distanceToMeridianKm(0, 10, 0)).toBeCloseTo(1111.95, 0)
    // At 60°N one degree of longitude is about half as wide.
    expect(distanceToMeridianKm(60, 1, 0)).toBeCloseTo(55.6, 0)
    // Wraps across the date line.
    expect(distanceToMeridianKm(0, 179.5, -179.5)).toBeCloseTo(111.2, 0)
  })

  it('measures distance to a polyline, including across the date line', () => {
    const seg: [number, number][][] = [[[-10, 179], [10, 179]]]
    expect(distanceToCurveKm(0, 178, seg)).toBeCloseTo(111.2, 0)
    expect(distanceToCurveKm(0, -179, seg)).toBeCloseTo(222.4, 0)
  })

  it('haversine matches a known distance', () => {
    // Delhi → Mumbai ≈ 1150 km
    expect(haversineKm(28.6139, 77.209, 19.076, 72.8777)).toBeGreaterThan(1130)
    expect(haversineKm(28.6139, 77.209, 19.076, 72.8777)).toBeLessThan(1170)
  })

  it('ranks closer lines higher and respects the graha filter', () => {
    const lines: ACGLineGeometry[] = [
      { grahaId: 'Ju', mcLine: 77.5, icLine: -102.5, asCurve: [], dsCurve: [] },
      { grahaId: 'Sa', mcLine: 80, icLine: -100, asCurve: [], dsCurve: [] },
    ]
    const hits = linesNear(28.6, 77.2, lines)
    expect(hits.map(h => h.grahaId)).toEqual(['Ju', 'Sa'])
    expect(hits[0].intensity).toBe('High')
    const onlySa = scoreLocation(28.6, 77.2, lines, [], { grahas: new Set(['Sa']) })
    expect(onlySa.lines.every(h => h.grahaId === 'Sa')).toBe(true)
    const both = scoreLocation(28.6, 77.2, lines, [])
    expect(both.score).toBeGreaterThan(onlySa.score)
  })

  it('counts each paran once, not once per planet', () => {
    const lines: ACGLineGeometry[] = ['Su', 'Mo', 'Ju'].map(g => ({ grahaId: g as 'Su', mcLine: 0, icLine: 180, asCurve: [], dsCurve: [] }))
    const res = scoreLocation(40, 120, lines, [{ p1: 'Su', p2: 'Mo', lat: 40, lon: 0 }])
    expect(res.parans).toHaveLength(1)
    expect(res.score).toBe(40)
  })
})

describe('calculateACG', () => {
  const res = calculateACG(JD, 28.6, 77.2)

  it('draws nine grahas including Ketu opposite Rahu', () => {
    expect(res.lines.map(l => l.grahaId)).toEqual(['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke'])
    const ra = res.lines.find(l => l.grahaId === 'Ra')!
    const ke = res.lines.find(l => l.grahaId === 'Ke')!
    expect(normLon(ke.mcLine - ra.icLine)).toBeCloseTo(0, 6)
    expect(ke.zenith[0]).toBeCloseTo(-ra.zenith[0], 6)
  })

  it('puts the AS curve west of the MC line and the DS curve east', () => {
    for (const l of res.lines) {
      const [lat, lon] = l.asCurve[0][Math.floor(l.asCurve[0].length / 2)]
      expect(Math.abs(lat)).toBeLessThanOrEqual(80)
      // Rising body: hour angle negative, so the AS line sits west of the MC line on the map.
      expect(normLon(lon - l.mcLine)).toBeLessThan(0)
      const [, dsLon] = l.dsCurve[0][Math.floor(l.dsCurve[0].length / 2)]
      expect(normLon(dsLon - l.mcLine)).toBeGreaterThan(0)
    }
  })

  it('places every paran on the horizon of its second graha', () => {
    expect(res.parans.length).toBeGreaterThan(20)
    const types = new Set(res.parans.map(p => p.type))
    expect(types).toEqual(new Set(['MC / AS', 'MC / DS', 'IC / AS', 'IC / DS']))
    for (const p of res.parans) {
      const l2 = res.lines.find(l => l.grahaId === p.p2)!
      const curve = p.angle2 === 'AS' ? l2.asCurve : l2.dsCurve
      // Horizon curves are sampled polylines; the crossing must lie on them within chord sag.
      expect(distanceToCurveKm(p.lat, p.lon, curve), `${p.p1} ${p.type} ${p.p2}`).toBeLessThan(30)
    }
  })

  it('bearings are compass bearings', () => {
    for (const l of res.lines) {
      expect(l.localSpaceBearing).toBeGreaterThanOrEqual(0)
      expect(l.localSpaceBearing).toBeLessThan(360)
    }
  })
})

describe('computeParans', () => {
  it('labels rising vs setting from the hour angle', () => {
    // A at RA 0 on MC; B at RA 30 has HA −30 → east of meridian → rising.
    const [mc] = computeParans([
      { id: 'Su', ra: 0, dec: 0, mcLine: 0 },
      { id: 'Ju', ra: 30, dec: 20, mcLine: 30 },
    ]).filter(p => p.p1 === 'Su' && p.angle1 === 'MC')
    expect(mc.angle2).toBe('AS')
    const expected = Math.atan(-Math.cos(-30 * RAD) / Math.tan(20 * RAD)) / RAD
    expect(mc.lat).toBeCloseTo(expected, 9)
  })

  it('skips Rahu–Ketu pairs', () => {
    const out = computeParans([
      { id: 'Ra', ra: 10, dec: 5, mcLine: 10 },
      { id: 'Ke', ra: 190, dec: -5, mcLine: -170 },
    ])
    expect(out).toHaveLength(0)
  })

  it('horizon curves stay inside the latitude band', () => {
    const { as, ds } = horizonCurves(100, 23, 0)
    for (const seg of [...as, ...ds]) for (const [lat] of seg) expect(Math.abs(lat)).toBeLessThanOrEqual(80)
  })
})
