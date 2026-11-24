import { describe, expect, it } from 'vitest'
import {
  analyzeHome,
  ayadi,
  ayadiSuggest,
  combineHousehold,
  HOUSEHOLD_MAX,
  householdWeights,
  analyzeVastuZones,
  dashaVastuFocus,
  GRAHA_VASTU_DIR,
  headingFromOrientation,
  smoothHeading,
  transitVastuYear,
  homeDoshas,
  houseBearing,
  ROOM_IDS,
  ROOM_RULES,
  roomFit,
  digBalaBand,
  digBalaShash,
  doshaIndication,
  entranceVerdict,
  lagnaDirection,
  planBearing,
  planHomeZone,
  planScreenAngle,
  roomsForZone,
  vastuBearing,
  VASTU_ZONES_8,
  zoneForBearing,
} from '@/lib/engine/astroVastu'
import { DIG_BALA, NAVAGRAHA_ZONES, PANCHA_BHUTAS, VASTU_DOSHAS, ZONES_16, ZONES_8 } from '@/components/ui/vastu/tables'

describe('vastuBearing — Lagna = East frame', () => {
  it('maps the kendras to the cardinal directions', () => {
    const asc = 5 // Leo rising
    expect(vastuBearing(5, 15, asc)).toBe(90)   // 1st → East
    expect(vastuBearing(8, 15, asc)).toBe(0)    // 4th → North
    expect(vastuBearing(11, 15, asc)).toBe(270) // 7th → West
    expect(vastuBearing(2, 15, asc)).toBe(180)  // 10th → South
  })

  it('puts the 2nd/3rd houses in the north-east quadrant', () => {
    const b = vastuBearing(2, 15, 1) // 2nd house
    expect(b).toBe(60)
    expect(zoneForBearing(b, ZONES_8).id).toBe('NE')
  })

  it('does not depend on the zodiac sign alone', () => {
    // Aries in the 1st (East) vs Aries in the 7th (West)
    expect(vastuBearing(1, 15, 1)).toBe(90)
    expect(vastuBearing(1, 15, 7)).toBe(270)
  })
})

describe('analyzeVastuZones', () => {
  it('places each planet in exactly one zone', () => {
    const grahas = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke'].map((id, i) => ({ id, rashi: (i % 12) + 1, degree: 10 }))
    const zones = analyzeVastuZones(grahas, 1, ZONES_16)
    expect(zones.flatMap(z => z.occupantIds).sort()).toEqual(grahas.map(g => g.id).sort())
  })

  it('penalises a malefic in the north-east', () => {
    const base = analyzeVastuZones([], 1, ZONES_8).find(z => z.id === 'NE')!
    const withSa = analyzeVastuZones([{ id: 'Sa', rashi: 2, degree: 15 }], 1, ZONES_8).find(z => z.id === 'NE')!
    expect(withSa.occupantIds).toContain('Sa')
    expect(withSa.score).toBe(base.score - 15)
  })

  it('adds Dig Bala of the zone ruler to the score', () => {
    const grahas = [{ id: 'Me', rashi: 1, degree: 15 }]
    const shadbala = { planets: { Me: { componentShash: { dig: 60 } } } }
    const n = analyzeVastuZones(grahas, 1, ZONES_8, shadbala).find(z => z.id === 'N')!
    expect(n.score).toBe(60)
  })

  it('lets Ketu (co-ruler) affect the north-west', () => {
    const ke = analyzeVastuZones([{ id: 'Ke', rashi: 1, degree: 1, dignity: 'debilitated' }], 1, ZONES_8)
    expect(ke.find(z => z.id === 'NW')!.score).toBe(35)
  })
})

describe('Dig Bala', () => {
  it('reads shashtiamsa, falling back to rupas', () => {
    expect(digBalaShash({ planets: { Su: { componentShash: { dig: 42 } } } }, 'Su')).toBe(42)
    expect(digBalaShash({ planets: { Su: { digBala: 0.5 } } }, 'Su')).toBe(30)
    expect(digBalaShash({ planets: {} }, 'Ra')).toBeUndefined()
  })

  it('bands strength', () => {
    expect(digBalaBand(55)).toBe('strong')
    expect(digBalaBand(30)).toBe('neutral')
    expect(digBalaBand(10)).toBe('weak')
    expect(digBalaBand(undefined)).toBe('neutral')
  })

  it('lists the classical seven with the right directions', () => {
    const dirs = Object.fromEntries(DIG_BALA.map(d => [d.planet, d.dir.split(' ')[0]]))
    expect(dirs).toEqual({ Ju: 'East', Me: 'East', Mo: 'North', Ve: 'North', Sa: 'West', Su: 'South', Ma: 'South' })
  })
})

describe('doshaIndication', () => {
  const scores = [
    { id: 'NE', occupantIds: ['Sa'], score: 60 },
    { id: 'SE', occupantIds: [], score: 70 },
    { id: 'SW', occupantIds: [], score: 30 },
  ]
  it('flags malefics or low scores and leaves property doshas to the site', () => {
    expect(doshaIndication('NE', scores)).toBe('indicated')
    expect(doshaIndication('SW', scores)).toBe('indicated')
    expect(doshaIndication('SE', scores)).toBe('clear')
    expect(doshaIndication(undefined, scores)).toBe('property')
  })
})

describe('Ketu direction is consistent', () => {
  it('Navagraha table and zone co-ruler agree', () => {
    const ke = NAVAGRAHA_ZONES.find(n => n.planet === 'Ke')!
    expect(ZONES_8.find(z => z.id === ke.dir)?.coRuling).toBe('Ke')
  })
})

describe('entranceVerdict', () => {
  it('reads the Lagna sign direction', () => {
    expect(lagnaDirection(1)).toBe('E') // Aries
    expect(lagnaDirection(2)).toBe('S') // Taurus
    expect(lagnaDirection(7)).toBe('W') // Libra
    expect(lagnaDirection(12)).toBe('N') // Pisces
  })

  it('scores the chosen door and rewards a Lagna match', () => {
    const scores = [{ id: 'E', occupantIds: [], score: 55 }, { id: 'N', occupantIds: [], score: 40 }]
    const e = entranceVerdict('E', scores, 5) // Leo → East
    expect(e).toMatchObject({ matchesLagna: true, score: 65, band: 'good' })
    const n = entranceVerdict('N', scores, 5)
    expect(n).toMatchObject({ matchesLagna: false, score: 40, band: 'weak', lagnaDir: 'E' })
  })
})

describe('Pancha Bhuta zones', () => {
  it('every element owns at least one zone in both compass modes', () => {
    for (const zones of [ZONES_8, ZONES_16]) {
      for (const b of PANCHA_BHUTAS) expect(zones.some(z => z.element === b.bhuta)).toBe(true)
    }
  })
})

describe('My Home room mapper', () => {
  const scores = [
    { id: 'NE', occupantIds: [], score: 60 },
    { id: 'SE', occupantIds: [], score: 30 },
    { id: 'NW', occupantIds: [], score: 40 },
  ]

  it('rules never list a zone twice', () => {
    for (const id of ROOM_IDS) {
      const r = ROOM_RULES[id]
      const all = [...r.best, ...r.good, ...r.avoid]
      expect(new Set(all).size).toBe(all.length)
    }
  })

  it('grades placements', () => {
    expect(roomFit('kitchen', 'SE')).toBe('best')
    expect(roomFit('toilet', 'NE')).toBe('avoid')
    expect(roomFit('master', 'N')).toBe('neutral')
  })

  it('puts wrong placements first and flags weak chart zones', () => {
    const f = analyzeHome({ kitchen: ['SE'], toilet: ['NE'], study: ['S'], children: ['NW'] }, scores)
    expect(f[0]).toMatchObject({ room: 'toilet', zone: 'NE', priority: 'high' })
    expect(f.find(x => x.room === 'kitchen')).toMatchObject({ fit: 'best', priority: 'low', zoneScore: 30 })
    expect(f.find(x => x.room === 'children')).toMatchObject({ fit: 'best', priority: 'low' })
    expect(f.find(x => x.room === 'study')).toMatchObject({ fit: 'neutral', priority: 'none' })
  })
})

describe('homeDoshas', () => {
  it('reads doshas from the layout and the door', () => {
    const found = homeDoshas({ toilet: ['NE'], water: ['SW'], staircase: ['Center'] }, 'E')
    expect([...found].sort()).toEqual(['brahma-dosha', 'ishan-dosha', 'nairiti-dosha', 'staircase-dosha', 'underground-water'])
    expect(homeDoshas({}, 'SW').has('nairiti-dosha')).toBe(true)
    expect(homeDoshas({ kitchen: ['SE'] }).size).toBe(0)
  })

  it('only returns ids that exist in the dosha table', () => {
    const ids = new Set(VASTU_DOSHAS.map(d => d.id))
    const all = homeDoshas({ toilet: ['NE', 'SE', 'SW', 'Center'], water: ['S'], staircase: ['NE'] }, 'SW')
    for (const id of all) expect(ids.has(id)).toBe(true)
  })
})

describe('dashaVastuFocus', () => {
  const d = (y: number) => new Date(Date.UTC(y, 0, 1))
  const tree = [
    { lord: 'Ve', start: d(2000), end: d(2020), children: [] },
    {
      lord: 'Su', start: d(2020).toISOString(), end: d(2026).toISOString(), children: [
        { lord: 'Su', start: d(2020), end: d(2021) },
        { lord: 'Mo', start: d(2021), end: d(2023) },
        { lord: 'Ma', start: d(2023), end: d(2026) },
      ],
    },
    { lord: 'Mo', start: d(2026), end: d(2036), children: [{ lord: 'Mo', start: d(2026), end: d(2027) }, { lord: 'Ma', start: d(2027), end: d(2028) }] },
  ]
  const scores = [{ id: 'E', occupantIds: [], score: 70 }, { id: 'NW', occupantIds: [], score: 30 }, { id: 'S', occupantIds: [], score: 50 }]

  it('finds the running periods and their zones, accepting string dates', () => {
    const f = dashaVastuFocus(tree, scores, d(2022))!
    expect(f.maha).toMatchObject({ lord: 'Su', zone: 'E', action: 'activate' })
    expect(f.antar).toMatchObject({ lord: 'Mo', zone: 'NW', action: 'balance' })
    expect(f.upcoming.map(u => u.lord)).toEqual(['Ma', 'Mo', 'Ma'])
    expect(f.upcoming[0].action).toBe('maintain')
  })

  it('returns null outside the dasha range', () => {
    expect(dashaVastuFocus(tree, scores, d(2050))).toBeNull()
    expect(dashaVastuFocus(undefined, scores)).toBeNull()
  })

  it('graha directions agree with the Navagraha table', () => {
    for (const n of NAVAGRAHA_ZONES) expect(GRAHA_VASTU_DIR[n.planet]).toBe(n.dir)
  })
})

describe('ayadi', () => {
  it('computes the six values from the area', () => {
    const r = ayadi(30, 40)! // area 1200
    expect(r.area).toBe(1200)
    expect(r.aaya).toBe(12)      // 9600 % 12 = 0 → 12
    expect(r.vyaya).toBe(10)     // 10800 % 10 = 0 → 10
    expect(r.yoni).toBe(8)       // 3600 % 8 = 0 → 8
    expect(r.yoniId).toBe('kaka')
    expect(r.nakshatra).toBe(15) // 9600 % 27 = 15
    expect(r.vara).toBe(6)       // 10800 % 7 = 6
    expect(r.tithi).toBe(30)     // 7200 % 30 = 0 → 30
    expect(r.checks.aayaOverVyaya.ok).toBe(true)
    expect(r.checks.yoni.ok).toBe(false)
    expect(r.checks.tithi.ok).toBe(false)
    expect(r.total).toBe(4)
  })

  it('counts tara from the birth nakshatra', () => {
    const r = ayadi(30, 40, 14)! // house nak 15, birth 14 → 2nd = Sampat
    expect(r.tara).toBe('sampat')
    expect(r.checks.tara?.ok).toBe(true)
    expect(r.total).toBe(5)
    expect(ayadi(30, 40, 15)!.tara).toBe('janma')
    expect(ayadi(30, 40, 16)!.tara).toBe('paramaMitra') // 27th → 9th tara
  })

  it('rejects empty sizes', () => {
    expect(ayadi(0, 40)).toBeNull()
    expect(ayadi(Number.NaN, 4)).toBeNull()
  })
})

describe('ayadiSuggest', () => {
  it('finds a nearby size that passes more checks', () => {
    const base = ayadi(30, 40, 14)!
    const s = ayadiSuggest(30, 40, 14)!
    expect(s.result.passed).toBeGreaterThan(base.passed)
    expect(Math.abs(s.length - 30)).toBeLessThanOrEqual(2)
    expect(Math.abs(s.breadth - 40)).toBeLessThanOrEqual(2)
  })
})

describe('live compass heading', () => {
  it('prefers the iOS compass heading', () => {
    expect(headingFromOrientation({ alpha: 10, webkitCompassHeading: 250 })).toBe(250)
  })
  it('converts absolute alpha and corrects for screen rotation', () => {
    expect(headingFromOrientation({ alpha: 90, absolute: true })).toBe(270)
    expect(headingFromOrientation({ alpha: 90, absolute: true, screenAngle: 90 })).toBe(0)
  })
  it('ignores relative readings', () => {
    expect(headingFromOrientation({ alpha: 90, absolute: false })).toBeNull()
  })
  it('smooths across north without spinning the long way', () => {
    const h = smoothHeading(350, 10, 0.5)
    expect(h).toBe(0)
    expect(smoothHeading(null, 42)).toBe(42)
  })
})

describe('houseBearing', () => {
  it('matches vastuBearing at the middle of each house', () => {
    for (let h = 1; h <= 12; h++) {
      const rashi = ((5 - 1 + h - 1) % 12) + 1 // Leo rising
      expect(houseBearing(h)).toBe(vastuBearing(rashi, 15, 5))
    }
  })
})

describe('VASTU_ZONES_8 mirrors the UI table', () => {
  it('has the same ids, angles and rulers', () => {
    expect(VASTU_ZONES_8.map(z => [z.id, z.angle, z.ruling, z.coRuling])).toEqual(ZONES_8.map(z => [z.id, z.angle, z.ruling, z.coRuling]))
  })
})

describe('transitVastuYear', () => {
  const spans = [
    { id: 'Ju', rashi: 3, start: '2026-05-01', end: '2027-06-01' },
    { id: 'Ju', rashi: 4, start: '2027-06-01', end: '2028-06-01' },
    { id: 'Sa', rashi: 12, start: '2025-03-29', end: '2027-06-03' },
    { id: 'Ra', rashi: 11, start: '2025-05-18', end: '2026-12-05' },
    { id: 'Sa', rashi: 1, start: '2030-01-01', end: '2032-01-01' },
  ]
  const scores = VASTU_ZONES_8.map(z => ({ id: z.id, occupantIds: [], score: z.id === 'N' ? 70 : 50 }))

  it('maps Jupiter and Saturn in the window to zones from the Lagna', () => {
    const r = transitVastuYear(spans, 12, scores, new Date('2026-11-24T00:00:00Z'))
    expect(r.map(p => [p.planet, p.house, p.zone, p.current])).toEqual([
      ['Ju', 4, 'N', true],   // Gemini from Pisces = 4th → North
      ['Ju', 5, 'NW', false], // Cancer = 5th → bearing 330°, nearest of the 8 zones is NW
      ['Sa', 1, 'E', true],   // Pisces = 1st → East
    ])
    expect(r[0]).toMatchObject({ start: '2026-11-24', end: '2027-06-01', zoneScore: 70 })
  })
})

describe('floor-plan overlay', () => {
  it('reads bearings with North up', () => {
    expect(planBearing(0, -10, 0)).toBe(0)    // straight up = North
    expect(planBearing(10, 0, 0)).toBe(90)    // right = East
    expect(planBearing(0, 10, 0)).toBe(180)
    expect(planBearing(-10, 0, 0)).toBe(270)
  })

  it('accounts for a rotated plan', () => {
    // North points right on this plan, so "up" on the plan is West
    expect(planBearing(0, -10, 90)).toBe(270)
    expect(planBearing(10, 0, 90)).toBe(0)
    expect(planScreenAngle(0, 90)).toBe(90)
    for (const b of [0, 45, 135, 300]) expect(planBearing(Math.sin(planScreenAngle(b, 37) * Math.PI / 180), -Math.cos(planScreenAngle(b, 37) * Math.PI / 180), 37)).toBeCloseTo(b, 6)
  })

  it('finds the home zone, with a centre circle', () => {
    expect(planHomeZone(2, 2, 0, 5)).toBe('Center')
    expect(planHomeZone(50, -50, 0, 5)).toBe('NE')
    expect(planHomeZone(-50, 50, 0, 5)).toBe('SW')
    expect(planHomeZone(50, -50, 180, 5)).toBe('SW')
  })

  it('lists rooms that belong in and out of a zone', () => {
    const se = roomsForZone('SE')
    expect(se.best).toContain('kitchen')
    expect(se.avoid).toContain('toilet')
    expect(roomsForZone('Center').avoid).toEqual(expect.arrayContaining(['toilet', 'staircase']))
  })
})

describe('household view', () => {
  const z = (s: Record<string, number>) => VASTU_ZONES_8.map(v => ({ id: v.id, occupantIds: [], score: s[v.id] ?? 50 }))

  it('weights the owner at half', () => {
    expect(householdWeights(1)).toEqual([1])
    expect(householdWeights(2)).toEqual([0.5, 0.5])
    expect(householdWeights(3)).toEqual([0.5, 0.25, 0.25])
    expect(householdWeights(5).reduce((a, b) => a + b, 0)).toBeCloseTo(1)
  })

  it('combines scores, picks bedrooms within the rules and flags conflicts', () => {
    const r = combineHousehold([
      { key: 'a', name: 'Owner', zones: z({ NE: 90, SW: 70, W: 30 }) },
      { key: 'b', name: 'Spouse', zones: z({ NE: 30, SW: 30, W: 80 }) },
      { key: 'c', name: 'Child', zones: z({ SE: 95, NW: 75 }) },
    ])
    expect(r.combined.find(c => c.id === 'NE')!.score).toBe(Math.round(0.5 * 90 + 0.25 * 30 + 0.25 * 50))
    // Owner's best is NE (90) but master bedroom avoids NE → next allowed is SW
    expect(r.members[0]).toMatchObject({ isOwner: true, bestRoomZone: 'SW', bestRoomScore: 70 })
    // Child's best is SE (95) but children's rooms avoid SE → NW
    expect(r.members[2].bestRoomZone).toBe('NW')
    expect(r.conflicts).toEqual(expect.arrayContaining([
      { zone: 'NE', strongFor: ['Owner'], weakFor: ['Spouse'] },
      { zone: 'W', strongFor: ['Spouse'], weakFor: ['Owner'] },
    ]))
  })

  it('has no conflicts for one person and caps the household size', () => {
    expect(combineHousehold([{ key: 'a', name: 'A', zones: z({ N: 90, S: 10 }) }]).conflicts).toEqual([])
    const many = Array.from({ length: 9 }, (_, i) => ({ key: String(i), name: String(i), zones: z({}) }))
    expect(combineHousehold(many).members).toHaveLength(HOUSEHOLD_MAX)
  })
})
