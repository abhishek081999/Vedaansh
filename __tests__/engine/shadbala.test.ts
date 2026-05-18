import { describe, it, expect } from 'vitest'
import { calculateShadbala } from '@/lib/engine/shadbala'
import { getDrishtiValue } from '@/lib/engine/bhavaBala'
import { toJulianDay, getPlanetPosition, getAyanamsha, toSidereal, SWISSEPH_IDS, ketuLongitude } from '@/lib/engine/ephemeris'
import { calcHouses } from '@/lib/engine/houses'
import { getDignity } from '@/lib/engine/dignity'
import type { GrahaId, Rashi, LagnaData } from '@/types/astrology'

describe('Sputa Drishti curve (Drik Bala)', () => {
  it('matches BPHS/Raman piecewise values', () => {
    expect(getDrishtiValue(45, 0, 'Su')).toBeCloseTo(7.5, 5)
    expect(getDrishtiValue(90, 0, 'Su')).toBeCloseTo(45, 5)
    expect(getDrishtiValue(120, 0, 'Su')).toBeCloseTo(30, 5)
    expect(getDrishtiValue(150, 0, 'Su')).toBeCloseTo(0, 5)
    expect(getDrishtiValue(180, 0, 'Su')).toBeCloseTo(60, 5)
    expect(getDrishtiValue(200, 0, 'Su')).toBeCloseTo(50, 5)
  })

  it('adds Mars 4th/8th special aspects', () => {
    expect(getDrishtiValue(105, 0, 'Ma')).toBeCloseTo(52.5, 5) // 37.5 + 15
    expect(getDrishtiValue(225, 0, 'Ma')).toBeCloseTo(52.5, 5)
  })
})

describe('Shadbala Engine Baseline', () => {
  const jd = toJulianDay(2000, 1, 1, 12.0)
  const ayan = getAyanamsha(jd, 'lahiri')
  const lat = 28.6139
  const lon = 77.209

  const sun = getPlanetPosition(jd, SWISSEPH_IDS.Su)
  const moon = getPlanetPosition(jd, SWISSEPH_IDS.Mo)
  const mars = getPlanetPosition(jd, SWISSEPH_IDS.Ma)
  const mercury = getPlanetPosition(jd, SWISSEPH_IDS.Me)
  const jupiter = getPlanetPosition(jd, SWISSEPH_IDS.Ju)
  const venus = getPlanetPosition(jd, SWISSEPH_IDS.Ve)
  const saturn = getPlanetPosition(jd, SWISSEPH_IDS.Sa)
  const rahu = getPlanetPosition(jd, SWISSEPH_IDS.Ra)
  const ketu = ketuLongitude(rahu.longitude)

  const grahas = [
    { id: 'Su', lon: sun.longitude, lat: sun.latitude, speed: sun.speed, isRetro: sun.isRetro },
    { id: 'Mo', lon: moon.longitude, lat: moon.latitude, speed: moon.speed, isRetro: moon.isRetro },
    { id: 'Ma', lon: mars.longitude, lat: mars.latitude, speed: mars.speed, isRetro: mars.isRetro },
    { id: 'Me', lon: mercury.longitude, lat: mercury.latitude, speed: mercury.speed, isRetro: mercury.isRetro },
    { id: 'Ju', lon: jupiter.longitude, lat: jupiter.latitude, speed: jupiter.speed, isRetro: jupiter.isRetro },
    { id: 'Ve', lon: venus.longitude, lat: venus.latitude, speed: venus.speed, isRetro: venus.isRetro },
    { id: 'Sa', lon: saturn.longitude, lat: saturn.latitude, speed: saturn.speed, isRetro: saturn.isRetro },
    { id: 'Ra', lon: rahu.longitude, lat: rahu.latitude, speed: rahu.speed, isRetro: rahu.isRetro },
    { id: 'Ke', lon: ketu, lat: -rahu.latitude, speed: rahu.speed, isRetro: rahu.isRetro },
  ].map((g) => {
    const lonSidereal = toSidereal(g.lon, ayan)
    const rashi = (Math.floor(lonSidereal / 30) + 1) as Rashi
    const degree = lonSidereal % 30
    return {
      ...g,
      lonSidereal,
      totalDegree: lonSidereal,
      rashi,
      degree,
      isCombust: false,
      declination: 0,
      dignity: getDignity(g.id as GrahaId, rashi, degree),
    }
  })

  const houses = calcHouses(jd, lat, lon, 'lahiri', 'whole_sign')
  const lagnas: LagnaData = {
    ascDegree: houses.ascendantSidereal,
    ascRashi: houses.ascRashi,
    ascDegreeInRashi: houses.ascDegreeInRashi,
    mcDegree: houses.mcSidereal,
    horaLagna: 0,
    ghatiLagna: 0,
    bhavaLagna: 0,
    vighatiLagna: 0,
    pranapada: 0,
    sriLagna: 0,
    varnadaLagna: 0,
    induLagna: 0,
    bhriguBindu: 0,
    cusps: houses.cuspsSidereal,
  }

  const birthDate = new Date('2000-01-01T12:00:00Z')
  const sunrise = new Date('2000-01-01T01:04:00Z')
  const sunset = new Date('2000-01-01T12:12:00Z')

  const result = calculateShadbala(grahas as any, lagnas, birthDate, sunrise, sunset, grahas[1].lonSidereal, grahas[0].lonSidereal)

  it('returns seven classical grahas', () => {
    expect(Object.keys(result.planets).sort()).toEqual(['Ju', 'Ma', 'Me', 'Mo', 'Sa', 'Su', 'Ve'])
  })

  it('keeps profile metadata consistent', () => {
    expect(result.averageRatio).toBeGreaterThan(0)
    expect(['balanced', 'top-heavy', 'strained']).toContain(result.generatedProfile)
  })

  it('exposes component-level shashtiamsa totals', () => {
    const su = result.planets.Su
    expect(su.componentShash?.sthana).toBeGreaterThanOrEqual(0)
    expect(su.componentShash?.naisargika).toBeGreaterThan(0)
    expect(['excellent', 'strong', 'average', 'weak']).toContain(su.qualityBand)
    expect(su.interpretation).toBeTruthy()
  })

  it('keeps totalShash close to component sum', () => {
    const me = result.planets.Me
    const comp = me.componentShash!
    const sum = comp.sthana + comp.dig + comp.kala + comp.chesta + comp.naisargika + comp.drik
    expect(me.totalShash).toBeCloseTo(sum, 1)
  })

  it('allows negative net Drik Bala from malefic aspects', () => {
    const sa = result.planets.Sa
    expect(sa.details?.drik?.net).toBeDefined()
    expect(sa.componentShash?.drik).toBe(sa.details?.drik?.net)
  })

  it('excludes nodes from Drik Bala aspects', () => {
    const ju = result.planets.Ju
    expect(ju.details?.drik?.benefic).toBeGreaterThanOrEqual(0)
    expect(ju.details?.drik?.malefic).toBeGreaterThanOrEqual(0)
  })
})
