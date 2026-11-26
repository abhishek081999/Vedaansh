// Kota Chakra layout, Abhijit, entering/exiting, Kota Swami / Pala, fort verdicts.
import { describe, expect, it } from 'vitest'
import {
  ABHIJIT_28,
  kotaCells,
  kotaMoonTwelfthCaution,
  kotaPalaFromLon,
  kotaPalaOf,
  readKota,
  readNatalKota,
  star27Of,
  star28Of,
} from '@/lib/engine/nakshatraKota'

const SPAN = 360 / 27

describe('28-star ring', () => {
  it('inserts Abhijit between Uttara Ashadha and Shravana', () => {
    expect(star28Of(20 * SPAN + 1)).toBe(20)        // early Uttara Ashadha
    expect(star28Of(277)).toBe(ABHIJIT_28)          // Abhijit window
    expect(star28Of(282)).toBe(22)                  // Shravana after Abhijit
    expect(star28Of(359)).toBe(27)                  // Revati
    expect(star27Of(ABHIJIT_28)).toBeNull()
    expect(star27Of(22)).toBe(21)
  })
})

describe('fort layout', () => {
  it('puts the 4th, 11th, 18th and 25th stars in the Stambha', () => {
    const cells = kotaCells(0)
    expect(cells.filter(c => c.layer === 'stambha').map(c => c.count)).toEqual([4, 11, 18, 25])
    expect(cells.filter(c => c.layer === 'madhya').map(c => c.count)).toEqual([3, 5, 10, 12, 17, 19, 24, 26])
  })

  it('matches the Rohini example: Punarvasu, Chitra, Uttara Ashadha, Revati in the Stambha', () => {
    const rohini28 = 3
    const stambha = kotaCells(rohini28).filter(c => c.layer === 'stambha').map(c => c.star28)
    // 28-ring: Punarvasu 6, Chitra 13, Uttara Ashadha 20, Revati 27
    expect(stambha).toEqual([6, 13, 20, 27])
  })

  it('splits each side into entering, stambha and exiting', () => {
    const side = kotaCells(0).slice(0, 7).map(c => c.path)
    expect(side).toEqual(['entering', 'entering', 'entering', 'stambha', 'exiting', 'exiting', 'exiting'])
  })
})

describe('reading', () => {
  const at = (k28: number) => (k28 <= 20 ? k28 : k28 - 1) * SPAN + 1 // longitude inside a non-Abhijit star

  it('a malefic entering the middle ring or in the Stambha is an alert', () => {
    const r = readKota(0, 1, [{ id: 'Sa', lonSidereal: at(2) }, { id: 'Ma', lonSidereal: at(3) }])
    expect(r.placements.map(p => p.tone)).toEqual(['alert', 'alert'])
  })

  it('retrograde (and always Rahu/Ketu) swaps entering and exiting', () => {
    const r = readKota(0, 1, [{ id: 'Ju', lonSidereal: at(1), isRetro: true }, { id: 'Ra', lonSidereal: at(5) }])
    expect(r.placements[0].effectivePath).toBe('exiting')
    expect(r.placements[1].effectivePath).toBe('entering')
  })

  it('reads a waning Moon and a Mercury with malefics as malefic', () => {
    const r = readKota(0, 1, [
      { id: 'Su', lonSidereal: 10 },
      { id: 'Mo', lonSidereal: 250 },   // 240° past the Sun → waning
      { id: 'Me', lonSidereal: 12 },    // same nakshatra (Ashwini) as the Sun
      { id: 'Ve', lonSidereal: 100 },
    ])
    const by = Object.fromEntries(r.placements.map(p => [p.id, p]))
    expect(by.Mo).toMatchObject({ malefic: true, natureReason: 'waningMoon' })
    expect(by.Me).toMatchObject({ malefic: true, natureReason: 'mercuryWithMalefic' })
    expect(by.Ve).toMatchObject({ malefic: false, natureReason: null })

    // Same sign but a different nakshatra does not make Mercury malefic
    const waxing = readKota(0, 1, [{ id: 'Su', lonSidereal: 10 }, { id: 'Mo', lonSidereal: 90 }, { id: 'Me', lonSidereal: 20 }])
    const w = Object.fromEntries(waxing.placements.map(p => [p.id, p]))
    expect(w.Mo.malefic).toBe(false)
    expect(w.Me.malefic).toBe(false)
  })

  it('names the Moon-sign lord as Kota Swami and flags the fort verdict', () => {
    const r = readKota(0, 4, [
      { id: 'Sa', lonSidereal: at(1) },   // malefic entering
      { id: 'Ve', lonSidereal: at(5) },   // benefic exiting
      { id: 'Mo', lonSidereal: at(4) },   // Kota Swami (Cancer → Moon) in the Madhya
    ])
    expect(r.kotaSwami).toBe('Mo')
    expect(r.swamiInside).toBe(true)
    // Stambha is also a Swami seat (palace pillar)
    expect(readKota(0, 4, [{ id: 'Mo', lonSidereal: at(3) }]).swamiInside).toBe(true)
    expect(r.durgaBhanga).toBe(true)
    expect(r.vijaya).toBe(false)
  })
})

// Worked examples from M. Imran, "Kota Chakra & Professional Setback" (Saptarishis Astrology)
describe('article examples', () => {
  const SPAN27 = 360 / 27
  const mid = (nak27: number) => nak27 * SPAN27 + SPAN27 / 2

  it('lists every layer as the article does', () => {
    const counts = (layer: string) => kotaCells(0).filter(c => c.layer === layer).map(c => c.count)
    expect(counts('prakara')).toEqual([2, 6, 9, 13, 16, 20, 23, 27])
    expect(counts('bahya')).toEqual([1, 7, 8, 14, 15, 21, 22, 28])
  })

  it('Rohini janma: Uttara Phalguni is the SE entrance; retrograde Saturn there acts as leaving', () => {
    const r = readKota(star28Of(mid(3)), 2, [{ id: 'Sa', lonSidereal: mid(11), isRetro: true }])
    expect(r.placements[0].cell).toMatchObject({ side: 'se-s', path: 'entering', layer: 'prakara' })
    expect(r.placements[0].effectivePath).toBe('exiting')
  })

  it('Punarvasu janma: Uttara Phalguni is the East exit', () => {
    const r = readKota(star28Of(mid(6)), 3, [{ id: 'Sa', lonSidereal: mid(11) }])
    expect(r.placements[0].cell).toMatchObject({ side: 'ne-e', path: 'exiting' })
  })

  it('Case 1 (Purva Phalguni Moon): Saturn in Hasta is the NE entrance of the Durgantara', () => {
    const r = readKota(star28Of(mid(10)), 5, [{ id: 'Sa', lonSidereal: mid(12) }])
    expect(r.placements[0].cell).toMatchObject({ side: 'ne-e', path: 'entering', layer: 'madhya' })
    expect(r.placements[0].tone).toBe('alert')
  })

  it('Case 2 (Chitra Moon): retrograde Saturn in Uttara Phalguni is on a Prakara exit, read as entering', () => {
    const r = readKota(star28Of(mid(13)), 7, [{ id: 'Sa', lonSidereal: mid(11), isRetro: true }])
    expect(r.placements[0].cell).toMatchObject({ path: 'exiting', layer: 'prakara' })
    expect(r.placements[0].effectivePath).toBe('entering')
  })
})

describe('core and swami rules (Kota Chakra article, 28-nakshatra system)', () => {
  const at = (k28: number) => (k28 <= 20 ? k28 : k28 - 1) * SPAN + 1

  it('flags an exposed core and a guarded one', () => {
    // janma Ashwini (0): Stambha stars are 28-ring 3, 10, 17, 24
    const weak = readKota(0, 1, [{ id: 'Ma', lonSidereal: at(3) }, { id: 'Sa', lonSidereal: at(10) }])
    expect(weak.stambhaWeak).toBe(true)
    const guarded = readKota(0, 1, [{ id: 'Ma', lonSidereal: at(3) }, { id: 'Sa', lonSidereal: at(10) }, { id: 'Ju', lonSidereal: at(17) }])
    expect(guarded.stambhaGuarded).toBe(true)
    expect(guarded.stambhaWeak).toBe(false)
    // one malefic in the core and another entering the Madhya (count 3 = 28-ring 2)
    expect(readKota(0, 1, [{ id: 'Ma', lonSidereal: at(3) }, { id: 'Sa', lonSidereal: at(2) }]).stambhaWeak).toBe(true)
    expect(readKota(0, 1, [{ id: 'Ma', lonSidereal: at(3) }]).stambhaWeak).toBe(false)
  })

  it('makes the Moon a secondary Kota Swami when it exchanges signs with the Swami', () => {
    // Moon in Aries (Swami Mars) with Mars in Cancer → exchange
    expect(readKota(0, 1, [], 4).gounaSwami).toBe('Mo')
    expect(readKota(0, 1, [], 8).gounaSwami).toBeNull()
    expect(readKota(0, 4, [], 4).gounaSwami).toBeNull() // Cancer Moon is its own Swami
  })
})

describe('natal reading', () => {
  const at = (k28: number) => (k28 <= 20 ? k28 : k28 - 1) * SPAN + 1
  it('lists inner malefics, flags those running as dasha lords, and core guards', () => {
    const r = readKota(0, 1, [
      { id: 'Sa', lonSidereal: at(3) },  // Stambha
      { id: 'Ma', lonSidereal: at(4) },  // Madhya
      { id: 'Ra', lonSidereal: at(6) },  // Bahya — outside
      { id: 'Ju', lonSidereal: at(10) }, // Stambha benefic
    ])
    const n = readNatalKota(r, ['Ma', 'Ve'])
    expect(n.innerMalefics.sort()).toEqual(['Ma', 'Sa'])
    expect(n.activeNow).toEqual(['Ma'])
    expect(n.guards).toEqual(['Ju'])
  })
})

describe('Kota Pala (Avakahada letter-class)', () => {
  it('maps known padas by Devanagari letter-class', () => {
    // Krittika a/i/u/e → vowels → Sun
    expect([1, 2, 3, 4].map(p => kotaPalaOf(2, p as 1 | 2 | 3 | 4))).toEqual(['Su', 'Su', 'Su', 'Su'])
    // Pushya hu/he/ho → śa-class → Rahu; da (डा) → ṭa-class → Mercury
    expect([1, 2, 3, 4].map(p => kotaPalaOf(7, p as 1 | 2 | 3 | 4))).toEqual(['Ra', 'Ra', 'Ra', 'Me'])
    // Ashwini chu/che/cho → ca-class → Venus; la → ya-class → Moon
    expect([1, 2, 3, 4].map(p => kotaPalaOf(0, p as 1 | 2 | 3 | 4))).toEqual(['Ve', 'Ve', 'Ve', 'Mo'])
    // Magha ma/mi/mu/me → pa-class → Saturn
    expect([1, 2, 3, 4].map(p => kotaPalaOf(9, p as 1 | 2 | 3 | 4))).toEqual(['Sa', 'Sa', 'Sa', 'Sa'])
    // Abhijit → Venus; Ketu never appears as Pala
    expect(kotaPalaOf(null)).toBe('Ve')
    expect(kotaPalaFromLon(277)).toBe('Ve')
  })

  it('sets Pala from natal Moon longitude in readKota', () => {
    const SPAN27 = 360 / 27
    // Swati pada 1 (रू) → Moon as Pala; Moon in Libra → Venus as Swami
    const swatiPada1 = 14 * SPAN27 + 1
    const r = readKota(star28Of(swatiPada1), 7, [], undefined, swatiPada1)
    expect(r.kotaSwami).toBe('Ve')
    expect(r.kotaPala).toBe('Mo')
    expect(r.janmaPada).toBe(1)
    expect(r.dualRole).toBe(false)
  })
})

describe('Swami / Pala seats', () => {
  const at = (k28: number) => (k28 <= 20 ? k28 : k28 - 1) * SPAN + 1

  it('flags inverted seats when Swami is outside and Pala is inside', () => {
    // Ashwini janma, Moon in Aries → Swami Mars. Pada 1 → Pala Venus.
    const moonLon = 1 // Ashwini pada 1
    const r = readKota(0, 1, [
      { id: 'Ma', lonSidereal: at(0) }, // Bahya — outside
      { id: 'Ve', lonSidereal: at(3) }, // Stambha — inside
    ], undefined, moonLon)
    expect(r.kotaSwami).toBe('Ma')
    expect(r.kotaPala).toBe('Ve')
    expect(r.swamiInside).toBe(false)
    expect(r.palaInside).toBe(true)
    expect(r.invertedSeats).toBe(true)
  })

  it('reads dual-role seat by natural nature', () => {
    // Magha pada 1 → Pala Saturn; Moon in Capricorn → Swami Saturn (dual)
    const SPAN27 = 360 / 27
    const magha1 = 9 * SPAN27 + 1
    const janma = star28Of(magha1) // 9
    // From Magha: +1 = Prakara (star 10), +3 = Stambha (star 12)
    const ok = readKota(janma, 10, [
      { id: 'Sa', lonSidereal: at(10) },
    ], undefined, magha1)
    expect(ok.dualRole).toBe(true)
    expect(ok.swamiPlacement?.cell.layer).toBe('prakara')
    expect(ok.dualRoleSeatOk).toBe(true)

    const off = readKota(janma, 10, [
      { id: 'Sa', lonSidereal: at(12) },
    ], undefined, magha1)
    expect(off.dualRole).toBe(true)
    expect(off.swamiPlacement?.cell.layer).toBe('stambha')
    expect(off.dualRoleSeatOk).toBe(false)
  })

  it('marks Pala on the Prakara as well placed', () => {
    const moonLon = 1 // Ashwini 1 → Pala Venus
    const r = readKota(0, 1, [{ id: 'Ve', lonSidereal: at(1) }], undefined, moonLon)
    expect(r.palaOnPrakara).toBe(true)
    expect(r.invertedSeats).toBe(false)
  })
})

describe('Moon-12th dasha caution', () => {
  it('flags the 12th lord from the Moon and occupants in that sign', () => {
    // Moon in Gemini (3) → 12th is Taurus (2), lord Venus
    const c = kotaMoonTwelfthCaution(3, [
      { id: 'Ve', rashi: 5 },
      { id: 'Ma', rashi: 2 },
    ], ['Ve', 'Ma'])
    expect(c.twelfthSign).toBe(2)
    expect(c.twelfthLord).toBe('Ve')
    expect(c.active).toBe(true)
    expect(c.reason).toBe('both')
    expect(c.lords.sort()).toEqual(['Ma', 'Ve'])
  })
})
