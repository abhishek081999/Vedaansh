// __tests__/engine/prashnaGlance.test.ts
// Avasthas, planetary war and the prashna-at-a-glance summary. Pure engine only.

import { describe, expect, it } from 'vitest'
import { buildPrashnaGlance, computeAvasthas, houseOf, planetaryWars, type GlancePlanet } from '@/lib/engine/prashnaGlance'
import type { GrahaId, Rashi } from '@/types/astrology'

const P = (id: GrahaId, rashi: Rashi, degree: number, extra: Partial<GlancePlanet> = {}): GlancePlanet =>
  ({ id, rashi, degree, lonSidereal: (rashi - 1) * 30 + degree, latitude: 0, isCombust: false, isRetro: false, ...extra })

describe('prashna glance', () => {
  it('planetary war: within 1°, the northern planet wins', () => {
    const wars = planetaryWars([P('Ma', 3, 10, { latitude: 1 }), P('Ju', 3, 10.6, { latitude: -0.5 }), P('Sa', 9, 1)])
    expect(wars).toEqual([{ winner: 'Ma', loser: 'Ju' }])
    expect(planetaryWars([P('Su', 3, 10), P('Mo', 3, 10.2)])).toEqual([])
  })

  it('assigns all ten avasthas from the chart', () => {
    const a = computeAvasthas([
      P('Su', 1, 10),
      P('Mo', 2, 1),                                    // exalted, visible
      P('Me', 1, 15, { isCombust: true }),              // combust, enemy sign, joined with Sun, within 10° of it
      P('Ju', 10, 5),                                   // debilitated
      P('Ve', 3, 10, { latitude: -1 }),                 // loses war to Mars
      P('Ma', 3, 10.5, { latitude: 2 }),
      P('Sa', 11, 25),                                  // own sign
    ], { Mo: [2, 4, 3, 6, 12, 7], Sa: [11, 5, 1, 8, 10, 11] })
    expect(a.Mo!.kinds).toEqual(['deepta', 'shanta', 'shakta'])
    expect(a.Me!.kinds).toEqual(['peedita', 'khala', 'vikala', 'bheeta'])
    expect(a.Ju!.kinds).toContain('deena')
    expect(a.Ve!.kinds).toContain('khala')
    expect(a.Ve!.war).toEqual({ with: 'Ma', won: false })
    expect(a.Ma!.war).toEqual({ with: 'Ve', won: true })
    expect(a.Sa!.kinds).toContain('swastha')
    expect(a.Sa!.kinds).not.toContain('shanta')
    expect(a.Su!.kinds).not.toContain('shakta')
  })

  it('summarises the chart', () => {
    // Sagittarius lagna at 20° (second half: quadruped), by night; Jupiter in Pisces (house 4).
    const g = buildPrashnaGlance({
      ascRashi: 9, ascDegree: 240 + 20, isDay: false, tithi: 10,
      planets: [P('Su', 7, 5), P('Mo', 9, 2), P('Ju', 12, 3), P('Me', 1, 4)],
    })
    expect(g.lagna.lord).toBe('Ju')
    expect(g.lagna.dualTilt).toBe('movable')
    expect(g.lagna.timeStrong).toBe(true)
    expect(g.lagna.traits.map(x => x.id)).toEqual(['mobility-dual', 'element-fire', 'direction-east', 'feet-quadruped', 'gender-male', 'rising-hind'])
    expect(g.lagnaLord).toMatchObject({ id: 'Ju', rashi: 12, house: 4 })
    expect(g.moon).toMatchObject({ rashi: 9, house: 1, benefic: true })
    expect(g.kendras).toEqual([
      { house: 1, planets: ['Mo'] }, { house: 4, planets: ['Ju'] }, { house: 7, planets: [] }, { house: 10, planets: [] },
    ])
    expect(g.eventTimes).toEqual(['afternoon'])
    expect(houseOf(9, 5)).toBe(9)
  })
})
