import { describe, expect, it } from 'vitest'
import { NADI_GRAHAS, NADI_HOUSES, NADI_PAPA_GRAHAS } from '@/lib/engine/nadi'
import { houseCountedFrom, readNadiHouses, rolesOfHouse } from '@/lib/engine/nadi/read'
import { bcpHouse } from '@/lib/engine/nadi/bcp'
import { lomashYear } from '@/lib/engine/nadi/degrees'
import { readNadiLiveTransits } from '@/lib/engine/nadi/live'
import { specialDegreeNotes } from '@/lib/engine/nadi/special'
import { nadiNodeNote, propertyNotes, vehicleNotes } from '@/lib/engine/nadi/property'
import { NADI_SHASHTIAMSA_NOTE, shashtiamsaNotes } from '@/lib/engine/nadi/shashtiamsa'
import { NADI_BHRIGU_NOTE, bhriguBhavaNotes } from '@/lib/engine/nadi/bhrigu'
import { NADI_MARRIAGE_RULE_NOTE, readChartLectures } from '@/lib/engine/nadi/marriageRules'
import { NADI_RASHI_AGE_NOTE, rashiAgeNotes } from '@/lib/engine/nadi/rashiAge'
import type { Rashi } from '@/types/astrology'

describe('Nadi foundations', () => {
  it('counts houses anti-clockwise from any start', () => {
    expect(houseCountedFrom(4, 10)).toBe(1)
    expect(houseCountedFrom(4, 8)).toBe(11)
    expect(houseCountedFrom(7, 7)).toBe(1)
    expect(houseCountedFrom(1, 7)).toBe(7)
    expect(houseCountedFrom(5, 10)).toBe(2)
  })

  it('keeps a profile for every house and classical graha', () => {
    expect(Object.keys(NADI_HOUSES)).toHaveLength(12)
    expect(Object.keys(NADI_GRAHAS)).toEqual(['Ju', 'Ve', 'Mo', 'Me', 'Ma', 'Sa', 'Su', 'Ra', 'Ke'])
    expect(NADI_PAPA_GRAHAS).toEqual(['Ma', 'Sa', 'Ra', 'Ke'])
  })

  it('reads the 4th as the spouse career house and the mother’s own house', () => {
    expect(rolesOfHouse(4)).toContain('Mother')
    expect(rolesOfHouse(4)).toContain('Spouse’s career')
    expect(rolesOfHouse(10)).toContain('Father')
    expect(rolesOfHouse(10)).toContain('Native’s career')
  })

  it('joins sign, lord, occupants, and a lord link on a whole-sign chart', () => {
    const asc = 1 as Rashi
    const reading = readNadiHouses({
      ascRashi: asc,
      grahas: [
        { id: 'Ve', rashi: 4 },
        { id: 'Ma', rashi: 1 },
        { id: 'Su', rashi: 1 },
        { id: 'Mo', rashi: 4 },
        { id: 'Me', rashi: 3 },
        { id: 'Ju', rashi: 9 },
        { id: 'Sa', rashi: 10, isRetro: true },
        { id: 'Ra', rashi: 6 },
        { id: 'Ke', rashi: 12 },
      ],
    })

    const lagna = reading.houses[0]
    expect(lagna?.signName).toBe('Aries')
    expect(lagna?.lord).toBe('Ma')
    expect(lagna?.papaPresent).toBe(true)
    expect(lagna?.occupants.map((g) => g.id).sort()).toEqual(['Ma', 'Su'])
    expect(lagna?.signNature).toBeTruthy()
    expect(lagna?.classicalThemes.length).toBeGreaterThan(0)

    const second = reading.houses[1]
    expect(second?.sign).toBe(2)
    expect(second?.lord).toBe('Ve')
    expect(second?.lordHouse).toBe(4)

    expect(reading.links.map((l) => l.id)).toContain('2-4-rent')
    expect(reading.saturnRetroNote).toMatch(/Saturn retrograde/)
    expect(reading.relatives.find((r) => r.id === 'children')?.careerHouse).toBe(2)
    expect(reading.deathIndicators.find((row) => row.id === 'father')?.house).toBe(5)
    expect(reading.deathIndicators.find((row) => row.id === 'mother')?.house).toBe(11)
    expect(reading.jupiterTransit.map((row) => row.planet)).toContain('Rahu')
    expect(reading.yogas).toEqual([])
  })

  it('reads Rahu in the 2nd as the children’s foreign career, and shloka 731 navamsha', () => {
    const reading = readNadiHouses({
      ascRashi: 11 as Rashi,
      grahas: [
        { id: 'Ra', rashi: 12 },
        { id: 'Ke', rashi: 6 },
      ],
      navamsha: { Me: 5 },
      dashaLords: ['Ju', 'Ra'],
    })

    const children = reading.relatives.find((rel) => rel.id === 'children')
    expect(children?.careerHouse).toBe(2)
    expect(children?.careerWork).toMatch(/foreign/i)
    expect(reading.timings.find((row) => row.id === 'children-foreign')?.running).toBe(true)
    expect(reading.timings.find((row) => row.id === 'children-career')?.running).toBe(true)
    const father = reading.deathIndicators.find((row) => row.id === 'father')
    expect(father?.house).toBe(5)
    expect(father?.lordName).toBe('Mercury')
    expect(father?.navamshaName).toBe('Leo')
  })

  it('marks the 8th lord in the 11th, and a 6–7 exchange as the maternal uncle’s wealth', () => {
    const astrology = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [{ id: 'Ma', rashi: 11 }],
    })
    expect(astrology.links.map((link) => link.id)).toContain('8-11-astrology')

    const mama = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [
        { id: 'Me', rashi: 7 },
        { id: 'Ve', rashi: 6 },
      ],
    })
    expect(mama.parivartana).toEqual([{ a: 6, b: 7 }])
    expect(mama.wealthNotes.join(' ')).toMatch(/maternal uncle/i)
  })

  it('keeps a late result when Saturn is retrograde and the 10th lord is strong', () => {
    const reading = readNadiHouses({
      ascRashi: 5 as Rashi,
      grahas: [
        { id: 'Sa', rashi: 9, isRetro: true },
        { id: 'Ve', rashi: 12, dignity: 'exalted' },
      ],
    })
    expect(reading.saturnRetroNote).toMatch(/5th/)
    expect(reading.saturnRetroNote).toMatch(/mid-thirties/)
  })

  it('reads a close conjunction as a khaarab yoga and ignores a wide one', () => {
    const close = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [
        { id: 'Ma', rashi: 4, degree: 10, dignity: 'debilitated' },
        { id: 'Sa', rashi: 4, degree: 18 },
      ],
    })
    const marsSaturn = close.yogas.find((yoga) => yoga.name === 'Mars + Saturn')
    expect(marsSaturn?.house).toBe(4)
    expect(marsSaturn?.bearer).toBe('native')
    expect(marsSaturn?.effect).toMatch(/accident/i)
    expect(marsSaturn?.career).toMatch(/Engineering/)

    const wide = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [
        { id: 'Ma', rashi: 4, degree: 1 },
        { id: 'Sa', rashi: 4, degree: 20 },
      ],
    })
    expect(wide.yogas).toEqual([])

    const undegreed = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [
        { id: 'Ju', rashi: 8 },
        { id: 'Ra', rashi: 8 },
      ],
    })
    expect(undegreed.yogas.find((yoga) => yoga.name === 'Jupiter + Rahu')?.effect).toMatch(/Guru Chandal/)
  })

  it('keeps the triple and drops the pairs it already covers', () => {
    const reading = readNadiHouses({
      ascRashi: 2 as Rashi,
      grahas: [
        { id: 'Ve', rashi: 12, dignity: 'exalted' },
        { id: 'Sa', rashi: 5, degree: 2 },
        { id: 'Ma', rashi: 5, degree: 6 },
        { id: 'Ra', rashi: 5, degree: 10 },
      ],
    })
    const names = reading.yogas.map((yoga) => yoga.name)
    expect(names).toContain('Saturn + Mars + Rahu')
    expect(names).not.toContain('Mars + Saturn')
    expect(names).not.toContain('Mars + Rahu')
    expect(reading.yogas.find((yoga) => yoga.name === 'Saturn + Mars + Rahu')?.bearer).toBe('family')
  })

  it('reads Mars with Ketu in Navamsha even when the birth chart lacks the pair', () => {
    const reading = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [{ id: 'Ma', rashi: 1 }, { id: 'Ke', rashi: 7 }],
      navamshaChart: {
        ascRashi: 5 as Rashi,
        grahas: [
          { id: 'Ma', rashi: 8, degree: 4 },
          { id: 'Ke', rashi: 8, degree: 9 },
        ],
      },
    })
    expect(reading.yogas.map((yoga) => yoga.chart)).toEqual(['D9'])
    expect(reading.yogas[0]?.name).toBe('Mars + Ketu')
    expect(reading.yogas[0]?.house).toBe(4)
  })

  it('reads Jupiter with Ketu as the supportive exception', () => {
    const reading = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [
        { id: 'Ju', rashi: 9, degree: 3 },
        { id: 'Ke', rashi: 9, degree: 8 },
      ],
    })
    expect(reading.yogas.map((yoga) => yoga.kind)).toEqual(['supportive'])
    expect(reading.yogas[0]?.effect).toMatch(/astrology/)
  })

  it('puts a malefic in the lagna ahead of a strong lagna lord', () => {
    const reading = readNadiHouses({
      ascRashi: 2 as Rashi,
      grahas: [
        { id: 'Ve', rashi: 12, dignity: 'exalted' },
        { id: 'Su', rashi: 2, degree: 4 },
        { id: 'Sa', rashi: 2, degree: 11 },
      ],
    })
    const yoga = reading.yogas.find((row) => row.name === 'Sun + Saturn')
    expect(yoga?.bearer).toBe('native')
    expect(yoga?.effect).toMatch(/Government income/)
    expect(reading.houses[7]?.activeRules.join(' ')).toMatch(/leave out/)
  })

  it('does not treat a lone planet or an aspect as a conjunction', () => {
    const alone = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [{ id: 'Sa', rashi: 1 }],
    })
    expect(alone.yogas).toEqual([])
    expect(alone.snapshots.map((row) => row.id)).not.toContain('ju-sa')

    const aspect = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [
        { id: 'Sa', rashi: 1 },
        { id: 'Ke', rashi: 7 },
      ],
    })
    expect(aspect.yogas.map((yoga) => yoga.name)).not.toContain('Saturn + Ketu')
  })

  it('reads the snapshot destructions, cancer aspect, divorce, spine, and a wealth window', () => {
    const aries = readNadiHouses({
      ascRashi: 3 as Rashi,
      grahas: [
        { id: 'Ju', rashi: 5, degree: 4 },
        { id: 'Sa', rashi: 5, degree: 9 },
      ],
      dashaLords: [],
    })
    expect(aries.snapshots.find((row) => row.id === 'ju-sa')?.reading).toMatch(/3rd/)
    expect(aries.snapshots.find((row) => row.id === 'ju-sa')?.reading).toMatch(/Younger|Arms|Courage/i)

    const water = readNadiHouses({
      ascRashi: 3 as Rashi,
      grahas: [{ id: 'Sa', rashi: 12 }],
    })
    const capricorn = water.snapshots.find((row) => row.id === 'sa-water-capricorn')
    expect(capricorn?.house).toBe(8)
    expect(capricorn?.reading).toMatch(/water sign/)

    const held = readNadiHouses({
      ascRashi: 3 as Rashi,
      grahas: [{ id: 'Sa', rashi: 4 }],
    })
    expect(held.snapshots.find((row) => row.id === 'sa-water-capricorn')?.reading).toMatch(/8th/)

    const shielded = readNadiHouses({
      ascRashi: 3 as Rashi,
      grahas: [
        { id: 'Ju', rashi: 1, degree: 2 },
        { id: 'Sa', rashi: 1, degree: 7 },
        { id: 'Ma', rashi: 4 },
        { id: 'Mo', rashi: 1 },
      ],
    })
    expect(shielded.parivartana).toEqual([{ a: 2, b: 11 }])
    expect(shielded.snapshots.find((row) => row.id === 'ju-sa')?.reading).toMatch(/hold the result back/)

    const cancer = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [
        { id: 'Su', rashi: 4, degree: 2 },
        { id: 'Me', rashi: 4, degree: 8 },
        { id: 'Ma', rashi: 1, degree: 3 },
      ],
    })
    expect(cancer.snapshots.map((row) => row.id)).toContain('su-me-water')

    const noAspect = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [
        { id: 'Su', rashi: 4, degree: 2 },
        { id: 'Me', rashi: 4, degree: 8 },
        { id: 'Sa', rashi: 1, degree: 3 },
      ],
    })
    expect(noAspect.snapshots.map((row) => row.id)).not.toContain('su-me-water')

    const parents = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [
        { id: 'Ma', rashi: 8, degree: 4 },
        { id: 'Me', rashi: 8, degree: 10 },
        { id: 'Sa', rashi: 2, degree: 1 },
      ],
    })
    expect(parents.snapshots.find((row) => row.id === 'scorpio-parents')?.reading).toMatch(/both parents/)

    const pisces = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [
        { id: 'Su', rashi: 6, degree: 5 },
        { id: 'Me', rashi: 6, degree: 12 },
      ],
    })
    expect(pisces.snapshots.find((row) => row.id === 'su-me-pisces')?.house).toBe(12)

    const divorce = readNadiHouses({
      ascRashi: 2 as Rashi,
      grahas: [
        { id: 'Ma', rashi: 10, degree: 3 },
        { id: 'Ju', rashi: 10, degree: 14 },
      ],
    })
    expect(divorce.snapshots.map((row) => row.id)).toContain('separation-capricorn')

    const waterDivorce = readNadiHouses({
      ascRashi: 4 as Rashi,
      grahas: [{ id: 'Ju', rashi: 6 }],
    })
    expect(waterDivorce.snapshots.find((row) => row.id === 'separation-water-jupiter')?.house).toBe(3)

    const mark = readNadiHouses({
      ascRashi: 7 as Rashi,
      grahas: [{ id: 'Ke', rashi: 9 }],
    })
    expect(mark.snapshots.find((row) => row.id === 'ketu-mark')?.reading).toMatch(/Arms/)

    const spine = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [
        { id: 'Sa', rashi: 9 },
        { id: 'Ju', rashi: 10, dignity: 'debilitated' },
        { id: 'Ma', rashi: 10 },
      ],
    })
    expect(spine.snapshots.find((row) => row.id === 'spine-9')?.reading).toMatch(/spine/)

    const money = readNadiHouses({
      ascRashi: 11 as Rashi,
      grahas: [{ id: 'Ve', rashi: 12, dignity: 'exalted' }],
      dashaLords: ['Ve', 'Ju'],
    })
    expect(money.wealthWindows.map((row) => row.lordName).sort()).toEqual(['Jupiter', 'Venus'])
  })

  it('reads marriage conjunctions on D1 and the Navamsha 1–7 axis, and ignores an opposition', () => {
    const severe = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [
        { id: 'Ve', rashi: 8, degree: 2 },
        { id: 'Ma', rashi: 8, degree: 6 },
        { id: 'Ra', rashi: 8, degree: 11 },
      ],
    })
    const names = severe.marriageYogas.map((yoga) => yoga.name)
    expect(names).toContain('Venus + Mars + Rahu')
    expect(names).not.toContain('Venus + Rahu')
    expect(severe.marriageYogas[0]?.reading).toMatch(/running away/)
    expect(severe.marriageNote).toMatch(/kidneys/)
    expect(severe.yogas.find((yoga) => yoga.id === 'D1-ma-ra')?.effect).toMatch(/8th/)

    const opposed = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [
        { id: 'Mo', rashi: 4 },
        { id: 'Ve', rashi: 10 },
      ],
    })
    expect(opposed.marriageYogas).toEqual([])

    const saturnVenus = readNadiHouses({
      ascRashi: 7 as Rashi,
      grahas: [
        { id: 'Sa', rashi: 1, dignity: 'debilitated', degree: 4 },
        { id: 'Ve', rashi: 1, degree: 9 },
        { id: 'Ju', rashi: 1, degree: 12 },
      ],
    })
    const pair = saturnVenus.marriageYogas.find((yoga) => yoga.name === 'Saturn + Venus')
    expect(pair?.reading).toMatch(/dignity does not change/)
    expect(pair?.reading).toMatch(/wealth/)
    expect(pair?.reading).toMatch(/soften/)

    const birth = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [
        { id: 'Su', rashi: 5, degree: 3 },
        { id: 'Ve', rashi: 5, degree: 8 },
      ],
      navamshaChart: {
        ascRashi: 4 as Rashi,
        grahas: [{ id: 'Ra', rashi: 4 }, { id: 'Ke', rashi: 10 }],
      },
    })
    expect(birth.marriageYogas.map((yoga) => yoga.name)).toContain('Sun + Venus')
    expect(birth.marriageYogas.map((yoga) => yoga.id)).toContain('D9-node-axis')
    expect(birth.marriageYogas.filter((yoga) => yoga.chart === 'D1').map((yoga) => yoga.id)).not.toContain('D9-node-axis')

    const eleventh = readNadiHouses({
      ascRashi: 12 as Rashi,
      grahas: [{ id: 'Ju', rashi: 10 }],
    })
    expect(eleventh.snapshots.find((row) => row.id === 'separation-water-jupiter')?.house).toBe(11)
  })

  it('reads career from an exchange first, then a crowd, a vargottama or exalted planet, then the 10th', () => {
    const exchange = readNadiHouses({
      ascRashi: 3 as Rashi,
      grahas: [
        { id: 'Mo', rashi: 1 },
        { id: 'Ma', rashi: 4 },
        { id: 'Su', rashi: 5 },
        { id: 'Me', rashi: 5 },
        { id: 'Ve', rashi: 5 },
      ],
    })
    expect(exchange.career.priority).toBe(1)
    expect(exchange.career.lines.join(' ')).toMatch(/2nd/)
    expect(exchange.career.lines.join(' ')).toMatch(/11th/)
    expect(exchange.career.lines.join(' ')).toMatch(/food|family business/)
    expect(exchange.career.wealth).toMatch(/large wealth/)
    expect(exchange.career.lines.join(' ')).not.toMatch(/sit together/)

    const lottery = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [
        { id: 'Su', rashi: 11 },
        { id: 'Sa', rashi: 5 },
        { id: 'Ma', rashi: 1 },
        { id: 'Mo', rashi: 4 },
        { id: 'Me', rashi: 3 },
        { id: 'Ve', rashi: 2 },
        { id: 'Ju', rashi: 9 },
      ],
    })
    expect(lottery.career.priority).toBe(1)
    expect(lottery.career.lines.join(' ')).toMatch(/lottery/)
    expect(lottery.career.wealth).toMatch(/large wealth/)

    const crowd = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [
        { id: 'Su', rashi: 2, degree: 20 },
        { id: 'Me', rashi: 2, degree: 22 },
        { id: 'Ve', rashi: 2, degree: 25 },
      ],
    })
    expect(crowd.career.priority).toBe(2)
    expect(crowd.career.lines.join(' ')).toMatch(/2nd/)
    expect(crowd.career.lines.join(' ')).toMatch(/food/)

    const vargottama = readNadiHouses({
      ascRashi: 2 as Rashi,
      grahas: [
        { id: 'Ma', rashi: 1 },
        { id: 'Su', rashi: 3 },
      ],
      navamsha: { Ma: 1, Su: 4 },
    })
    expect(vargottama.career.priority).toBe(5)
    expect(vargottama.career.lines.join(' ')).toMatch(/Mars is vargottama/)
    expect(vargottama.career.lines.join(' ')).toMatch(/defence/)
    expect(vargottama.career.lines.join(' ')).not.toMatch(/Sun/)

    const exalted = readNadiHouses({
      ascRashi: 2 as Rashi,
      grahas: [{ id: 'Ve', rashi: 12 }],
      navamsha: { Ve: 1 },
    })
    expect(exalted.career.priority).toBe(5)
    expect(exalted.career.lines.join(' ')).toMatch(/Venus is exalted/)

    const tenth = readNadiHouses({
      ascRashi: 2 as Rashi,
      grahas: [{ id: 'Mo', rashi: 3 }],
      navamsha: { Mo: 1 },
      ninthArudhaInLagna: true,
    })
    expect(tenth.career.priority).toBe(5)
    expect(tenth.career.lines.join(' ')).toMatch(/10th/)
    expect(tenth.career.lines.join(' ')).toMatch(/Saturn/)
    expect(tenth.career.lucky).toMatch(/little personal effort/)

    const downfall = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [
        { id: 'Su', rashi: 5 },
        { id: 'Ra', rashi: 5 },
        { id: 'Ke', rashi: 11 },
      ],
      navamshaChart: {
        ascRashi: 1 as Rashi,
        grahas: [
          { id: 'Su', rashi: 7 },
          { id: 'Ra', rashi: 7 },
          { id: 'Ke', rashi: 1 },
        ],
      },
    })
    const sunRahu = downfall.yogas.filter((yoga) => yoga.id.endsWith('-su-ra'))
    expect(sunRahu).toHaveLength(2)
    expect(sunRahu.every((yoga) => /scandal/.test(yoga.effect) && /severe/.test(yoga.effect))).toBe(true)

    const oneChart = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [
        { id: 'Su', rashi: 5 },
        { id: 'Ra', rashi: 5 },
        { id: 'Ke', rashi: 11 },
      ],
    })
    expect(oneChart.yogas.find((yoga) => yoga.id === 'D1-su-ra')?.effect).not.toMatch(/severe/)

    const violent = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [
        { id: 'Ma', rashi: 8, degree: 4 },
        { id: 'Sa', rashi: 8, degree: 10 },
      ],
    })
    expect(violent.yogas.find((yoga) => yoga.id === 'D1-ma-sa')?.effect).toMatch(/violent end/)

    const ketuSeventh = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [
        { id: 'Ke', rashi: 7 },
        { id: 'Ra', rashi: 1 },
      ],
    })
    expect(ketuSeventh.marriageYogas.find((yoga) => yoga.id === 'D1-ke-7')?.reading).toMatch(/not read as a separation/)

    const venusRahuSeventh = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [
        { id: 'Ve', rashi: 7, degree: 2 },
        { id: 'Ra', rashi: 7, degree: 8 },
        { id: 'Ke', rashi: 1 },
      ],
    })
    expect(venusRahuSeventh.marriageYogas.find((yoga) => yoga.id === 'D1-ve-ra')?.reading).toMatch(/three forms/)
  })

  it('reads Saturn’s conjunction ahead of a trine, and a trine ahead of an exalted planet', () => {
    const conjunct = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [
        { id: 'Sa', rashi: 2 },
        { id: 'Ra', rashi: 2 },
        { id: 'Ke', rashi: 8 },
        { id: 'Su', rashi: 1 },
      ],
    })
    expect(conjunct.career.priority).toBe(3)
    expect(conjunct.career.lines.join(' ')).toMatch(/conjunct Rahu/)
    expect(conjunct.career.lines.join(' ')).toMatch(/technology/)
    expect(conjunct.career.lines.join(' ')).not.toMatch(/exalted/)

    const trine = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [
        { id: 'Sa', rashi: 1 },
        { id: 'Ra', rashi: 5 },
        { id: 'Ke', rashi: 11 },
        { id: 'Ma', rashi: 5 },
      ],
    })
    expect(trine.career.priority).toBe(4)
    expect(trine.career.lines.join(' ')).toMatch(/5th or 9th/)
    expect(trine.career.lines.join(' ')).toMatch(/technology/)
    expect(trine.career.lines.join(' ')).toMatch(/Engineering/)

    const marsAlone = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [
        { id: 'Sa', rashi: 1 },
        { id: 'Ma', rashi: 5 },
      ],
    })
    expect(marsAlone.career.priority).toBe(5)
    expect(marsAlone.career.lines.join(' ')).not.toMatch(/Engineering/)

    const doctor = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [
        { id: 'Sa', rashi: 6 },
        { id: 'Ra', rashi: 6 },
        { id: 'Mo', rashi: 6 },
        { id: 'Ke', rashi: 12 },
      ],
    })
    expect(doctor.career.priority).toBe(2)
    expect(doctor.career.lines.join(' ')).toMatch(/doctor or a lawyer/)

    const cloth = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [
        { id: 'Ve', rashi: 10 },
        { id: 'Sa', rashi: 2 },
      ],
    })
    expect(cloth.career.priority).toBe(1)
    expect(cloth.career.lines.join(' ')).toMatch(/Saturn and Venus/)
    expect(cloth.career.lines.join(' ')).toMatch(/jewelry/)

    const abroad = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [
        { id: 'Sa', rashi: 12 },
        { id: 'Ju', rashi: 10 },
      ],
    })
    expect(abroad.career.lines.join(' ')).toMatch(/import-export/)

    const ketuSecond = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [
        { id: 'Ke', rashi: 2 },
        { id: 'Ra', rashi: 8 },
        { id: 'Sa', rashi: 2 },
      ],
    })
    expect(ketuSecond.links.map((link) => link.id)).toContain('sa-ke-2')

    const luxury = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [
        { id: 'Ma', rashi: 1, degree: 4 },
        { id: 'Ve', rashi: 1, degree: 9 },
      ],
      navamsha: { Ma: 4, Ve: 4 },
    })
    expect(luxury.career.notes.join(' ')).toMatch(/luxury/)
    expect(luxury.career.notes.join(' ')).toMatch(/Navamsha/)

    const exams = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [
        { id: 'Su', rashi: 7, dignity: 'debilitated' },
        { id: 'Ju', rashi: 10, dignity: 'debilitated' },
      ],
    })
    expect(exams.career.exams).toMatch(/competitive exam/)

    const ready = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [
        { id: 'Su', rashi: 1 },
        { id: 'Ju', rashi: 9 },
      ],
    })
    expect(ready.career.exams).toBeNull()

    const secondMarriage = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [{ id: 'Su', rashi: 1 }],
      navamshaChart: {
        ascRashi: 4 as Rashi,
        grahas: [
          { id: 'Ve', rashi: 8, degree: 3 },
          { id: 'Ke', rashi: 8, degree: 8 },
          { id: 'Ra', rashi: 2 },
          { id: 'Ma', rashi: 2, degree: 4 },
          { id: 'Sa', rashi: 2, degree: 6 },
        ],
      },
    })
    const navamshaMarriage = secondMarriage.marriageYogas.filter((yoga) => yoga.chart === 'D9').map((yoga) => yoga.reading).join(' ')
    expect(navamshaMarriage).toMatch(/second marriage/)
    expect(navamshaMarriage).toMatch(/7th lord of Navamsha/)

    const lighter = readNadiHouses({
      ascRashi: 3 as Rashi,
      grahas: [{ id: 'Sa', rashi: 12, isRetro: true }],
    })
    expect(lighter.saturnRetroNote).toMatch(/change of place/)
    expect(lighter.saturnRetroNote).not.toMatch(/more lightly/)
  })

  it('reads Saturn-Jupiter dignity as inherited wealth, and retrograde planets by their own result', () => {
    const inherited = readNadiHouses({
      ascRashi: 6 as Rashi,
      grahas: [
        { id: 'Ju', rashi: 9 },
        { id: 'Sa', rashi: 7 },
      ],
    })
    expect(inherited.career.notes.join(' ')).toMatch(/Saturn is exalted and Jupiter is in its own sign/)
    expect(inherited.career.notes.join(' ')).toMatch(/SUV/)

    const bothOwn = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [
        { id: 'Ju', rashi: 12 },
        { id: 'Sa', rashi: 10 },
      ],
    })
    expect(bothOwn.career.notes.join(' ')).toMatch(/exaltation or their own sign/)
    expect(bothOwn.career.notes.join(' ')).not.toMatch(/strong form/)

    const father = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [
        { id: 'Su', rashi: 5, degree: 4 },
        { id: 'Me', rashi: 5, degree: 8 },
        { id: 'Ve', rashi: 5, degree: 12 },
      ],
    })
    expect(father.career.notes.join(' ')).toMatch(/father is read as wealthy/)

    const weakSun = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [
        { id: 'Su', rashi: 7, degree: 4 },
        { id: 'Me', rashi: 7, degree: 8 },
        { id: 'Ve', rashi: 7, degree: 12 },
      ],
    })
    expect(weakSun.career.notes.join(' ')).toMatch(/not taken/)

    const moon = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [
        { id: 'Sa', rashi: 3 },
        { id: 'Mo', rashi: 3 },
      ],
    })
    expect(moon.career.priority).toBe(3)
    expect(moon.career.lines.join(' ')).toMatch(/Agriculture/)

    const venus = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [{ id: 'Ve', rashi: 12, isRetro: true }],
    })
    expect(venus.retrogradeNotes.join(' ')).toMatch(/marriage trouble/)
    expect(venus.retrogradeNotes.join(' ')).toMatch(/powerful/)

    const mercury = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [{ id: 'Me', rashi: 4, isRetro: true }],
    })
    expect(mercury.retrogradeNotes.join(' ')).toMatch(/face value/)

    const jupiter = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [{ id: 'Ju', rashi: 10, isRetro: true }],
    })
    expect(jupiter.retrogradeNotes.join(' ')).toMatch(/childbirth/)
    expect(jupiter.retrogradeNotes.join(' ')).toMatch(/heavy/)

    const mars = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [{ id: 'Ma', rashi: 2, isRetro: true }],
    })
    expect(mars.retrogradeNotes.join(' ')).toMatch(/property/)

    const stillHard = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [{ id: 'Sa', rashi: 7, isRetro: true }],
    })
    expect(stillHard.saturnRetroNote).toMatch(/career trouble is still read/)

    const rare = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [
        { id: 'Sa', rashi: 10, isRetro: true },
        { id: 'Ve', rashi: 2 },
      ],
    })
    expect(rare.saturnRetroNote).toMatch(/more lightly/)
    expect(rare.saturnRetroNote).toMatch(/still remain/)
  })

  it('reads the running year as one house, repeating every 12 years', () => {
    expect(bcpHouse(1)).toBe(1)
    expect(bcpHouse(12)).toBe(12)
    expect(bcpHouse(13)).toBe(1)
    expect(bcpHouse(25)).toBe(1)
    expect(bcpHouse(31)).toBe(7)
    expect(bcpHouse(40)).toBe(4)

    const married = readNadiHouses({
      ascRashi: 1 as Rashi,
      birthDate: '1993-06-01',
      asOf: new Date(2023, 6, 1),
      grahas: [{ id: 'Ve', rashi: 7 }],
    })
    expect(married.bcp?.runningYear).toBe(31)
    expect(married.bcp?.house).toBe(7)
    expect(married.bcp?.lines.join(' ')).toMatch(/Marriage/)

    const beforeBirthday = readNadiHouses({
      ascRashi: 1 as Rashi,
      birthDate: '2000-01-15',
      asOf: new Date(2024, 0, 14),
      grahas: [{ id: 'Ra', rashi: 12 }, { id: 'Ke', rashi: 6 }],
    })
    expect(beforeBirthday.bcp?.runningYear).toBe(24)
    expect(beforeBirthday.bcp?.house).toBe(12)

    const accident = readNadiHouses({
      ascRashi: 1 as Rashi,
      birthDate: '2014-01-01',
      asOf: new Date(2024, 5, 1),
      grahas: [
        { id: 'Sa', rashi: 6 },
        { id: 'Ke', rashi: 11 },
        { id: 'Ra', rashi: 5 },
      ],
    })
    expect(accident.bcp?.runningYear).toBe(11)
    expect(accident.bcp?.house).toBe(11)
    expect(accident.bcp?.lines.join(' ')).toMatch(/heavy loss/)
    expect(accident.bcp?.lines.join(' ')).toMatch(/surgery/)

    const scorpio = readNadiHouses({
      ascRashi: 1 as Rashi,
      birthDate: '2018-03-01',
      asOf: new Date(2025, 3, 1),
      grahas: [{ id: 'Ma', rashi: 1 }],
    })
    expect(scorpio.bcp?.house).toBe(8)
    expect(scorpio.bcp?.lines.join(' ')).toMatch(/Scorpio/)
    expect(scorpio.links.map((link) => link.id)).toContain('8-1-accident')

    expect(readNadiHouses({ ascRashi: 1 as Rashi, grahas: [] }).bcp).toBeNull()
  })

  it('reads Saturn as the ancestors, and Jupiter over planets that share a sign', () => {
    const strong = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [{ id: 'Sa', rashi: 7 }],
    })
    expect(strong.pitruNote).toMatch(/early comfort/)

    const weak = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [{ id: 'Sa', rashi: 1 }, { id: 'Ra', rashi: 7 }, { id: 'Ke', rashi: 1 }],
    })
    expect(weak.pitruNote).toMatch(/Ancestral debt/)

    const mixed = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [{ id: 'Sa', rashi: 7 }, { id: 'Ra', rashi: 7 }, { id: 'Ke', rashi: 1 }],
    })
    expect(mixed.pitruNote).toMatch(/ancestral strain/)

    const ordinary = readNadiHouses({
      ascRashi: 3 as Rashi,
      grahas: [{ id: 'Sa', rashi: 12 }],
    })
    expect(ordinary.pitruNote).toMatch(/ordinary/)

    const together = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [
        { id: 'Ma', rashi: 2 },
        { id: 'Ve', rashi: 2 },
      ],
    })
    expect(together.jupiterGroups.join(' ')).toMatch(/property/)
    expect(together.jupiterGroups.join(' ')).toMatch(/jewelry/)
    expect(together.jupiterTransit.map((row) => row.planet)).toEqual([
      'Saturn', 'Venus', 'Rahu', 'Ketu', 'Mars', 'Sun', 'Mercury', 'Moon',
    ])

    const weakened = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [
        { id: 'Su', rashi: 4, degree: 2 },
        { id: 'Me', rashi: 4, degree: 6 },
      ],
    })
    expect(weakened.career.notes.join(' ')).toMatch(/weakens the 4th/)

    const south = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [{ id: 'Ma', rashi: 1 }],
      dashaLords: ['Ma'],
    })
    expect(south.marsSouthNote).toMatch(/south/)
  })

  it('reads Saturn, Rahu, and Ketu by the natal planet, and exaltation in the 9th as wealth from birth', () => {
    const born = readNadiHouses({
      ascRashi: 11 as Rashi,
      grahas: [{ id: 'Sa', rashi: 7 }],
    })
    expect(born.slowTransitNotes.join(' ')).toMatch(/present from birth/)
    expect(born.saturnTransit.map((row) => row.planet)).toContain('Venus')
    expect(born.nodeTransit.map((row) => row.planet)).toContain('Rahu over Saturn')

    const comfort = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [{ id: 'Ma', rashi: 10 }],
    })
    expect(comfort.slowTransitNotes.join(' ')).toMatch(/reduce the push to work/)
    expect(comfort.slowTransitNotes.join(' ')).not.toMatch(/from birth/)

    const trading = readNadiHouses({
      ascRashi: 1 as Rashi,
      gender: 'male',
      grahas: [
        { id: 'Ve', rashi: 2, degree: 4 },
        { id: 'Me', rashi: 2, degree: 8 },
      ],
    })
    expect(trading.slowTransitNotes.join(' ')).toMatch(/stock trading/)
    expect(trading.slowTransitNotes.join(' ')).toMatch(/wife/)

    const cancelled = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [
        { id: 'Me', rashi: 12 },
        { id: 'Ju', rashi: 3 },
      ],
    })
    expect(cancelled.slowTransitNotes.join(' ')).toMatch(/cancelled/)

    const guarded = readNadiHouses({
      ascRashi: 1 as Rashi,
      arudhaLagna: 9 as Rashi,
      grahas: [{ id: 'Ju', rashi: 9 }],
    })
    expect(guarded.slowTransitNotes.join(' ')).toMatch(/longevity/)

    const grouped = readNadiHouses({
      ascRashi: 3 as Rashi,
      grahas: [
        { id: 'Su', rashi: 7 },
        { id: 'Me', rashi: 7 },
        { id: 'Ve', rashi: 7 },
        { id: 'Ma', rashi: 4 },
        { id: 'Ju', rashi: 4 },
      ],
    })
    const groups = grouped.saturnGroups.join(' ')
    expect(groups).toMatch(/Sun, Mercury, and Venus share Libra/)
    expect(groups).toMatch(/Mars and Jupiter share Cancer/)
  })

  it('times wealth from the 2nd, 9th, and 11th lords, and a Jupiter–Mercury exchange on a mutable lagna', () => {
    const sav = [30, 30, 18, 30, 30, 22, 26, 30, 40, 30, 30, 31]
    const timed = readNadiHouses({
      ascRashi: 11 as Rashi,
      grahas: [{ id: 'Ju', rashi: 2, degree: 8.4 }],
      navamsha: { Ju: 12 as Rashi, Ve: 2 as Rashi },
      sav,
      ninthArudha: 7 as Rashi,
    })
    const text = timed.wealthTiming.join(' ')
    expect(timed.wealthTimingNote).toMatch(/size of the gain is not read/)
    expect(text).toMatch(/Jupiter rules the 2nd and the 11th/)
    expect(text).toMatch(/8°/)
    expect(text).toMatch(/any sign/)
    expect(text).toMatch(/Navamsha of the 2nd lord and the 11th lord/)
    expect(text).toMatch(/Pisces/)
    expect(text).toMatch(/Navamsha of the 9th lord/)
    expect(text).toMatch(/age 26/)
    expect(text).toMatch(/11th holds the highest/)
    expect(text).toMatch(/5th holds the lowest/)
    expect(text).not.toMatch(/aspect/)

    const spouse = readNadiHouses({
      ascRashi: 1 as Rashi,
      arudhaLagna: 7 as Rashi,
      grahas: [],
    })
    expect(spouse.wealthTiming.join(' ')).toMatch(/spouse/)

    const repeated = readNadiHouses({
      ascRashi: 3 as Rashi,
      grahas: [
        { id: 'Me', rashi: 12 },
        { id: 'Ju', rashi: 3 },
      ],
    })
    expect(repeated.marriageYogas.map((yoga) => yoga.reading).join(' ')).toMatch(/Two or three marriages/)

    const otherLagna = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [
        { id: 'Me', rashi: 12 },
        { id: 'Ju', rashi: 3 },
      ],
    })
    expect(otherLagna.marriageYogas.map((yoga) => yoga.reading).join(' ')).not.toMatch(/Two or three/)
    expect(otherLagna.nodeTransit.map((row) => row.planet)).toContain('Mars over Rahu')
  })

  it('reads the 64th Navamsha and the 8th lord’s Navamsha as family strain, and a high 8th as inheritance', () => {
    const hard = readNadiHouses({
      ascRashi: 3 as Rashi,
      grahas: [
        { id: 'Su', rashi: 11, degree: 9.2 },
        { id: 'Ve', rashi: 11, degree: 12 },
        { id: 'Mo', rashi: 11, degree: 2 },
        { id: 'Sa', rashi: 12 },
      ],
      navamsha: { Sa: 9 as Rashi, Ve: 8 as Rashi },
      navamshaChart: {
        ascRashi: 10 as Rashi,
        grahas: [
          { id: 'Sa', rashi: 10 },
          { id: 'Ju', rashi: 2 },
          { id: 'Ve', rashi: 4 },
        ],
      },
    })
    const text = hard.hardTransitNotes.join(' ')
    expect(text).toMatch(/Saturn in Aquarius/)
    expect(text).toMatch(/9°/)
    expect(text).toMatch(/4th of Navamsha is Aries/)
    expect(text).toMatch(/8th lord Saturn/)
    expect(text).toMatch(/Sagittarius/)
    expect(text).toMatch(/Scorpio, Pisces, or Cancer/)
    expect(text).not.toMatch(/holds a malefic/)
    expect(hard.navamshaNotes.join(' ')).toMatch(/1st of Navamsha holds Saturn/)
    expect(hard.navamshaNotes.join(' ')).toMatch(/Marriage is read as delayed/)
    expect(hard.navamshaNotes.join(' ')).toMatch(/7th of Navamsha holds Venus/)
    expect(hard.navamshaNotes.join(' ')).toMatch(/good-looking/)
    expect(hard.navamshaNotes.join(' ')).toMatch(/Jupiter aspects the Navamsha lagna/)
    expect(hard.marriageNote ?? '').toMatch(/full year/)

    const occult = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [],
      sav: [20, 20, 20, 20, 20, 20, 20, 50, 20, 20, 20, 20],
    })
    expect(occult.wealthTiming.join(' ')).toMatch(/Occult study/)
    expect(occult.wealthTiming.join(' ')).not.toMatch(/difficult placement/)
  })

  it('wears the dispositor’s stone for a debilitated planet, and keeps a dusthana lord’s stone off', () => {
    const sun = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [
        { id: 'Su', rashi: 7 },
        { id: 'Ve', rashi: 2 },
      ],
    })
    const sunText = sun.gemNotes.join(' ')
    expect(sunText).toMatch(/Ruby is not the stone/)
    expect(sunText).toMatch(/Diamond, the stone of Venus/)
    expect(sunText).toMatch(/Diamond is read as usable/)
    expect(sun.gemReference.map((row) => row.line).join(' ')).toMatch(/white opal/)

    const blocked = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [
        { id: 'Su', rashi: 7 },
        { id: 'Ve', rashi: 6 },
      ],
    })
    expect(blocked.gemNotes.join(' ')).toMatch(/not strong enough to carry a substitute/)

    const fortune = readNadiHouses({
      ascRashi: 4 as Rashi,
      grahas: [{ id: 'Ju', rashi: 4 }],
    })
    expect(fortune.gemNotes.join(' ')).toMatch(/Yellow sapphire is read as usable/)
    expect(fortune.gemNotes.join(' ')).toMatch(/rules the 6th/)

    const eighth = readNadiHouses({
      ascRashi: 4 as Rashi,
      dashaLords: ['Sa'],
      grahas: [{ id: 'Sa', rashi: 7 }],
    })
    const eighthText = eighth.gemNotes.join(' ')
    expect(eighthText).toMatch(/Blue sapphire is not the stone/)
    expect(eighthText).toMatch(/not the time to begin/)

    const carried = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [
        { id: 'Me', rashi: 12 },
        { id: 'Ju', rashi: 9 },
      ],
    })
    expect(carried.gemNotes.join(' ')).toMatch(/Emerald is not the stone/)
    expect(carried.gemNotes.join(' ')).toMatch(/Yellow sapphire, the stone of Jupiter/)

    const exchanged = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [
        { id: 'Me', rashi: 12 },
        { id: 'Ju', rashi: 3 },
      ],
    })
    expect(exchanged.gemNotes.join(' ')).toMatch(/Emerald is not the stone/)
    expect(exchanged.gemNotes.join(' ')).toMatch(/Jupiter is not strong enough/)

    const node = readNadiHouses({
      ascRashi: 1 as Rashi,
      dashaLords: ['Ra'],
      grahas: [
        { id: 'Ra', rashi: 7 },
        { id: 'Ve', rashi: 7 },
        { id: 'Sa', rashi: 7 },
      ],
    })
    expect(node.gemNotes.join(' ')).toMatch(/Hessonite is not the stone/)
  })

  it('reads a hard running period as a poor time for a decision, and an exchange lord as support', () => {
    const hard = readNadiHouses({
      ascRashi: 1 as Rashi,
      dashaLords: ['Ra', 'Sa'],
      grahas: [{ id: 'Su', rashi: 1 }],
    })
    expect(hard.decisionNotes.join(' ')).toMatch(/poor time/)

    const sixth = readNadiHouses({
      ascRashi: 1 as Rashi,
      dashaLords: ['Me'],
      grahas: [{ id: 'Me', rashi: 3 }],
    })
    expect(sixth.decisionNotes.join(' ')).toMatch(/poor time/)

    const supported = readNadiHouses({
      ascRashi: 1 as Rashi,
      dashaLords: ['Ve'],
      grahas: [
        { id: 'Ve', rashi: 11 },
        { id: 'Sa', rashi: 2 },
      ],
    })
    const support = supported.decisionNotes.join(' ')
    expect(support).toMatch(/supported/)
    expect(support).not.toMatch(/poor time/)

    const child = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [
        { id: 'Ju', rashi: 4, degree: 10 },
        { id: 'Ke', rashi: 4, degree: 12 },
      ],
    })
    expect(child.yogas.map((yoga) => yoga.effect).join(' ')).toMatch(/unusually able/)

    const deal = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [
        { id: 'Ma', rashi: 5, degree: 4 },
        { id: 'Ke', rashi: 5, degree: 6 },
      ],
    })
    expect(deal.yogas.map((yoga) => yoga.effect).join(' ')).toMatch(/Trust in a dealing/)
  })

  it('reads a planet degree as a year of life and adds a conjunction', () => {
    expect(lomashYear(17.55)).toBe(18)
    expect(lomashYear(19.29)).toBe(19)
    expect(lomashYear(19.3)).toBe(20)
    expect(lomashYear(0)).toBe(0)
    expect(lomashYear(21.35)).toBe(22)

    const joined = readNadiHouses({
      ascRashi: 4 as Rashi,
      birthDate: '1990-01-01',
      grahas: [
        { id: 'Sa', rashi: 7, degree: 27 },
        { id: 'Ke', rashi: 7, degree: 21 },
      ],
    })
    const joinedText = joined.degreeNotes.join(' ')
    expect(joinedText).toMatch(/Ketu at 21° is read in the 21st year, around 2011/)
    expect(joinedText).toMatch(/Saturn at 27° is read in the 27th year, around 2017/)
    expect(joinedText).toMatch(/change of residence/)
    expect(joinedText).toMatch(/Fame, or a sudden problem/)
    expect(joinedText).toMatch(/Ketu and Saturn are together. The degrees sum to 48/)

    const gains = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [{ id: 'Ma', rashi: 11, degree: 11 }],
    })
    const gainsText = gains.degreeNotes.join(' ')
    expect(gainsText).toMatch(/11th year/)
    expect(gainsText).toMatch(/gains of every kind/)
    expect(gainsText).toMatch(/A problem is checked/)

    const wide = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [
        { id: 'Su', rashi: 1, degree: 0 },
        { id: 'Me', rashi: 1, degree: 19.3 },
        { id: 'Ve', rashi: 1, degree: 17.55 },
      ],
    })
    const wideText = wide.degreeNotes.join(' ')
    expect(wideText).toMatch(/Sun at 0° is read in the year of birth/)
    expect(wideText).toMatch(/Venus and Mercury are together. The degrees sum to 38/)
    expect(wideText).not.toMatch(/Sun, Mercury, and Venus are together/)

    const low = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [{ id: 'Ve', rashi: 2, degree: 1.2 }],
    })
    expect(low.degreeNotes.join(' ')).toMatch(/harder form/)

    const triple = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [
        { id: 'Sa', rashi: 9, degree: 15 },
        { id: 'Me', rashi: 9, degree: 16 },
        { id: 'Ju', rashi: 9, degree: 19 },
      ],
    })
    const tripleText = triple.degreeNotes.join(' ')
    expect(tripleText).toMatch(/Saturn and Jupiter are together. The degrees sum to 34/)
    expect(tripleText).toMatch(/Saturn, Mercury, and Jupiter are together. The degrees sum to 50/)
  })

  it('reads Navamsha 1 and 7, the antardasha of their lords, and a dusthana reversal', () => {
    const timed = readNadiHouses({
      ascRashi: 1 as Rashi,
      dashaLords: ['Ju', 'Ma'],
      grahas: [{ id: 'Ju', rashi: 7 }],
      navamshaChart: {
        ascRashi: 7 as Rashi,
        grahas: [{ id: 'Ke', rashi: 7 }],
      },
    })
    const timedText = timed.navamshaNotes.join(' ')
    expect(timedText).toMatch(/antardasha of Mars/)
    expect(timedText).toMatch(/rules the 7th of Navamsha/)
    expect(timedText).toMatch(/Navamsha reduces it/)
    expect(timedText).not.toMatch(/90%/)

    const mahaOnly = readNadiHouses({
      ascRashi: 1 as Rashi,
      dashaLords: ['Ma'],
      grahas: [],
      navamshaChart: { ascRashi: 7 as Rashi, grahas: [{ id: 'Ma', rashi: 1 }] },
    })
    expect(mahaOnly.navamshaNotes.join(' ')).not.toMatch(/antardasha/)

    const rescued = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [{ id: 'Ra', rashi: 7 }],
      navamshaChart: { ascRashi: 1 as Rashi, grahas: [{ id: 'Ve', rashi: 1 }] },
    })
    expect(rescued.navamshaNotes.join(' ')).toMatch(/Navamsha still supports it/)
    expect(rescued.navamshaNotes.join(' ')).toMatch(/good-looking/)

    const both = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [{ id: 'Me', rashi: 7 }],
      navamshaChart: { ascRashi: 1 as Rashi, grahas: [{ id: 'Me', rashi: 7 }, { id: 'Su', rashi: 1 }] },
    })
    const bothText = both.navamshaNotes.join(' ')
    expect(bothText).toMatch(/read as excellent/)
    expect(bothText).toMatch(/holds Mercury/)
    expect(bothText).toMatch(/influential, and proud/)
    expect(bothText).not.toMatch(/Mercury[\s\S]*good-looking/)

    const property = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [],
      navamshaChart: {
        ascRashi: 3 as Rashi,
        grahas: [
          { id: 'Me', rashi: 5, degree: 10 },
          { id: 'Ma', rashi: 5, degree: 12 },
        ],
      },
    })
    expect(property.navamshaNotes.join(' ')).toMatch(/4th lord and the 11th lord of Navamsha/)

    const wide = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [],
      navamshaChart: {
        ascRashi: 3 as Rashi,
        grahas: [
          { id: 'Me', rashi: 5, degree: 1 },
          { id: 'Ma', rashi: 5, degree: 20 },
        ],
      },
    })
    expect(wide.navamshaNotes.join(' ')).not.toMatch(/4th lord and the 11th lord/)

    const reversed = readNadiHouses({
      ascRashi: 11 as Rashi,
      grahas: [
        { id: 'Ma', rashi: 10 },
        { id: 'Sa', rashi: 1 },
        { id: 'Mo', rashi: 10 },
        { id: 'Ju', rashi: 10 },
        { id: 'Su', rashi: 1 },
      ],
    })
    const reversedText = reversed.dusthanaNotes.join(' ')
    expect(reversedText).toMatch(/Mars is exalted in the 12th/)
    expect(reversedText).toMatch(/read as debilitated/)
    expect(reversedText).toMatch(/The exchange still stands/)
    expect(reversedText).toMatch(/The conjunction still stands/)
    expect(reversedText).not.toMatch(/Sun is exalted/)
    expect(reversed.gemNotes.join(' ')).toMatch(/Red coral is read as usable/)

    const sun = readNadiHouses({
      ascRashi: 2 as Rashi,
      grahas: [{ id: 'Su', rashi: 7 }],
    })
    expect(sun.dusthanaNotes.join(' ')).toMatch(/Sun is debilitated in the 6th/)
    expect(sun.dusthanaNotes.join(' ')).toMatch(/read as exalted/)
    expect(sun.gemNotes.join(' ')).toMatch(/Ruby is not the stone/)

    const node = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [
        { id: 'Ra', rashi: 6 },
        { id: 'Me', rashi: 12 },
      ],
    })
    expect(node.dusthanaNotes.join(' ')).toMatch(/Rahu is read as exalted/)
  })

  it('reads Dashamsha from the lagna and the 10th, and the 3rd as the neighborhood', () => {
    const career = readNadiHouses({
      ascRashi: 1 as Rashi,
      dashaLords: ['Sa', 'Ke'],
      grahas: [{ id: 'Sa', rashi: 3 }, { id: 'Ra', rashi: 3 }],
      dashamshaChart: {
        ascRashi: 4 as Rashi,
        grahas: [
          { id: 'Ma', rashi: 4 },
          { id: 'Sa', rashi: 1 },
          { id: 'Ju', rashi: 10 },
          { id: 'Ke', rashi: 11 },
        ],
      },
    })
    const text = career.dashamshaNotes.join(' ')
    expect(text).toMatch(/Mars sits in the Dashamsha lagna/)
    expect(text).toMatch(/Uniformed work/)
    expect(text).toMatch(/Saturn sits in the 10th of Dashamsha/)
    expect(text).toMatch(/Law, or service/)
    expect(text).toMatch(/Jupiter aspects the Dashamsha lagna/)
    expect(text).toMatch(/mahadasha of Saturn is running/)
    expect(text).toMatch(/rules the 8th/)
    expect(text).toMatch(/antardasha of Ketu is running/)
    expect(text).toMatch(/a rise in the career is checked/)
    expect(text).toMatch(/a break is checked/)
    expect(text).not.toMatch(/birth time/)
    const street = career.neighborhoodNotes.join(' ')
    expect(street).toMatch(/Saturn in the 3rd/)
    expect(street).toMatch(/Iron work nearby/)
    expect(street).toMatch(/Wireless signal nearby/)
    expect(street).not.toMatch(/Muslim|Bihar|tenant/i)

    const exchange = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [],
      dashamshaChart: {
        ascRashi: 4 as Rashi,
        grahas: [
          { id: 'Mo', rashi: 2 },
          { id: 'Ve', rashi: 4 },
        ],
      },
    })
    const exchangeText = exchange.dashamshaNotes.join(' ')
    expect(exchangeText).toMatch(/exchange of the 1st and the 11th/)
    expect(exchangeText).toMatch(/ahead of the lagna and the 10th/)
    expect(exchangeText).toMatch(/Wealth, including from the father/)
    expect(exchangeText).toMatch(/Moon is in an exchange/)

    const teaching = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [],
      dashamshaChart: {
        ascRashi: 4 as Rashi,
        grahas: [
          { id: 'Ma', rashi: 12 },
          { id: 'Ju', rashi: 8 },
        ],
      },
    })
    expect(teaching.dashamshaNotes.join(' ')).toMatch(/Teaching and education/)

    const crowd = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [],
      dashamshaChart: {
        ascRashi: 4 as Rashi,
        grahas: [
          { id: 'Su', rashi: 5 },
          { id: 'Me', rashi: 5 },
          { id: 'Ve', rashi: 5 },
          { id: 'Ju', rashi: 5 },
        ],
      },
    })
    expect(crowd.dashamshaNotes.join(' ')).toMatch(/first career hint/)

    const cancelled = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [],
      dashamshaChart: {
        ascRashi: 1 as Rashi,
        grahas: [
          { id: 'Me', rashi: 12 },
          { id: 'Ju', rashi: 4 },
        ],
      },
    })
    expect(cancelled.dashamshaNotes.join(' ')).toMatch(/debilitated in Dashamsha/)
    expect(cancelled.dashamshaNotes.join(' ')).toMatch(/cancelled for the career/)

    const sameSign = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [],
      dashamshaChart: {
        ascRashi: 1 as Rashi,
        grahas: [
          { id: 'Ve', rashi: 6 },
          { id: 'Me', rashi: 6 },
        ],
      },
    })
    expect(sameSign.dashamshaNotes.join(' ')).not.toMatch(/cancelled for the career/)

    const trine = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [{ id: 'Sa', rashi: 9 }],
      dashamshaChart: {
        ascRashi: 1 as Rashi,
        grahas: [
          { id: 'Sa', rashi: 1 },
          { id: 'Ve', rashi: 5 },
        ],
      },
    })
    expect(trine.dashamshaNotes.join(' ')).toMatch(/5th or 9th from Saturn/)
    expect(trine.neighborhoodNotes.join(' ')).toMatch(/Saturn aspects the 3rd/)
    expect(trine.neighborhoodNotes.join(' ')).toMatch(/weaker form/)

    const marsOnly = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [],
      dashamshaChart: {
        ascRashi: 1 as Rashi,
        grahas: [
          { id: 'Sa', rashi: 1 },
          { id: 'Ma', rashi: 5 },
        ],
      },
    })
    expect(marsOnly.dashamshaNotes.join(' ')).not.toMatch(/5th or 9th from Saturn/)

    const pair = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [
        { id: 'Ju', rashi: 3 },
        { id: 'Ve', rashi: 3 },
      ],
      dashamshaChart: {
        ascRashi: 4 as Rashi,
        grahas: [
          { id: 'Su', rashi: 2, degree: 10 },
          { id: 'Me', rashi: 2, degree: 12 },
          { id: 'Ma', rashi: 10, degree: 4 },
          { id: 'Ra', rashi: 10, degree: 8 },
        ],
      },
    })
    const pairText = pair.dashamshaNotes.join(' ')
    expect(pairText).toMatch(/government link/)
    expect(pairText).toMatch(/Medicine is one option/)
    expect(pair.neighborhoodNotes.join(' ')).toMatch(/temple nearby/)

    const widePair = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [],
      dashamshaChart: {
        ascRashi: 4 as Rashi,
        grahas: [
          { id: 'Su', rashi: 2, degree: 1 },
          { id: 'Me', rashi: 2, degree: 20 },
        ],
      },
    })
    expect(widePair.dashamshaNotes.join(' ')).not.toMatch(/government link/)
    expect(readNadiHouses({
      ascRashi: 1 as Rashi,
      dashaLords: ['Ve', 'Ve'],
      grahas: [],
      dashamshaChart: { ascRashi: 7 as Rashi, grahas: [{ id: 'Ve', rashi: 7 }] },
    }).dashamshaNotes.join(' ')).toMatch(/mahadasha and antardasha of Venus/)
    expect(readNadiHouses({ ascRashi: 1 as Rashi, grahas: [] }).dashamshaNotes).toEqual([])
  })

  it('reads the sky that is open now against the natal planets', () => {
    const onTheMoon = readNadiLiveTransits({
      natal: [{ id: 'Mo', rashi: 4, degree: 14 }],
      sky: [{ id: 'Sa', rashi: 4, degree: 14.4, isRetro: true }],
    })
    expect(onTheMoon.headline).toMatch(/Saturn is in Cancer, over Moon/)
    expect(onTheMoon.hits[0]?.reading).toMatch(/mother/)
    expect(onTheMoon.hits[0]?.reading).toMatch(/peak/)
    expect(onTheMoon.hits[0]?.reading).toMatch(/retrograde/)
    expect(onTheMoon.places).toMatch(/Saturn in Cancer, retrograde/)

    const edge = readNadiLiveTransits({
      natal: [{ id: 'Mo', rashi: 4, degree: 29 }],
      sky: [{ id: 'Sa', rashi: 5, degree: 1 }],
    })
    expect(edge.hits[0]?.answer).toMatch(/edge of Leo/)
    expect(edge.hits[0]?.reading).toMatch(/neighbouring sign/)

    const jupiter = readNadiLiveTransits({
      natal: [{ id: 'Ve', rashi: 3, degree: 10 }],
      sky: [{ id: 'Ju', rashi: 3, degree: 20 }],
    })
    expect(jupiter.hits.map((hit) => hit.reading).join(' ')).toMatch(/Wealth/)
    expect(jupiter.hits[0]?.reading).not.toMatch(/peak/)

    const quiet = readNadiLiveTransits({
      natal: [{ id: 'Ve', rashi: 3 }],
      sky: [{ id: 'Ju', rashi: 1 }, { id: 'Sa', rashi: 2 }],
    })
    expect(quiet.hits).toEqual([])
    expect(quiet.headline).toMatch(/None of these windows/)

    const rahu = readNadiLiveTransits({
      natal: [{ id: 'Sa', rashi: 11 }],
      sky: [{ id: 'Ra', rashi: 11 }],
    })
    expect(rahu.hits.map((hit) => hit.title)).toContain('Rahu over Saturn')

    const family = readNadiLiveTransits({
      ascRashi: 3,
      natal: [{ id: 'Sa', rashi: 1 }],
      sky: [{ id: 'Sa', rashi: 1 }, { id: 'Ra', rashi: 1 }],
      navamshaLagna: 10,
      navamsha: { Sa: 1 },
    })
    const familyText = family.hits.map((hit) => `${hit.title} ${hit.answer}`).join(' ')
    expect(familyText).toMatch(/64th Navamsha/)
    expect(familyText).toMatch(/8th lord/)
    expect(familyText).not.toMatch(/Native/)
  })

  it('reads exact Mrityu Bhaga, Pushkar, and a first sound from the lagna', () => {
    const mrityu = specialDegreeNotes({
      ascRashi: 3,
      grahas: [{ id: 'Me', rashi: 3, degree: 25 }],
      navamsha: { Me: 1 },
      dashaLords: ['Me', 'Su'],
    })
    expect(mrityu.join(' ')).toMatch(/cancelling/)
    expect(mrityu.join(' ')).toMatch(/mahadasha of Mercury is running/)
    expect(mrityu.join(' ')).not.toMatch(/education is checked/i)

    const near = specialDegreeNotes({
      ascRashi: 3,
      grahas: [{ id: 'Me', rashi: 3, degree: 26.2 }],
    })
    expect(near.join(' ')).not.toMatch(/Mrityu Bhaga/)

    const strong = specialDegreeNotes({
      ascRashi: 1,
      grahas: [{ id: 'Ve', rashi: 1, degree: 21 }],
      navamsha: { Ve: 7 },
    })
    expect(strong.join(' ')).toMatch(/Pushkar Navamsha and at Pushkar Bhaga/)
    expect(strong.join(' ')).toMatch(/exceptionally strong/)

    const blocked = specialDegreeNotes({
      ascRashi: 1,
      grahas: [{ id: 'Ve', rashi: 1, degree: 21 }],
      navamsha: { Ve: 6 },
    })
    expect(blocked.join(' ')).toMatch(/benefit is read as cancelled/)
    expect(blocked.join(' ')).not.toMatch(/exceptionally strong/)

    const lagna = specialDegreeNotes({
      ascRashi: 1,
      ascDegree: 19,
      grahas: [{ id: 'Ma', rashi: 1, degree: 10 }],
    })
    expect(lagna.join(' ')).toMatch(/lagna degree is in Mrityu Bhaga/)
    expect(lagna.join(' ')).toMatch(/first sound is read from Mars/)

    const weak = specialDegreeNotes({
      ascRashi: 1,
      grahas: [
        { id: 'Ma', rashi: 1, degree: 10 },
        { id: 'Sa', rashi: 1, degree: 12 },
        { id: 'Ju', rashi: 6, degree: 10, dignity: 'exalted' },
      ],
    })
    expect(weak.join(' ')).toMatch(/Not used for a first sound: Mars/)
    expect(weak.join(' ')).toMatch(/Jupiter is the strong planet used instead/)
    expect(weak.join(' ')).not.toMatch(/first sound is read from Mars/)
  })

  it('reads Chaturthamsha property and Shodashamsha vehicles', () => {
    const property = propertyNotes({
      dashaLords: ['Ma', 'Mo'],
      chaturthamsha: {
        ascRashi: 1 as Rashi,
        grahas: [
          { id: 'Ma', rashi: 11 },
          { id: 'Mo', rashi: 11 },
          { id: 'Ju', rashi: 11 },
          { id: 'Ve', rashi: 11 },
          { id: 'Ra', rashi: 11 },
          { id: 'Su', rashi: 4 },
        ],
      },
    })
    const propertyText = property.join(' ')
    expect(propertyText).toMatch(/Moon, Mars, Jupiter, Venus, and Rahu sit in the 11th/)
    expect(propertyText).toMatch(/lagna lord and the 4th lord sit in the 11th/)
    expect(propertyText).toMatch(/Mars, the lagna lord of Chaturthamsha, connects with the 12th lord and is with Rahu/)
    expect(propertyText).toMatch(/Moon, the 4th lord of Chaturthamsha, connects with the 12th lord and is with Rahu/)
    expect(propertyText).toMatch(/Property away from home is checked/)
    expect(propertyText).toMatch(/Government quarters are checked/)
    expect(propertyText).toMatch(/mahadasha of Mars is running/)
    expect(propertyText).toMatch(/property is checked/)
    expect(propertyText).not.toMatch(/New York|Australia|apartment|bungalow/)

    const exchange = propertyNotes({
      chaturthamsha: {
        ascRashi: 1 as Rashi,
        grahas: [
          { id: 'Me', rashi: 10 },
          { id: 'Sa', rashi: 3 },
        ],
      },
    })
    expect(exchange.join(' ')).toMatch(/exchange of the 3rd and the 10th/)

    const reversed = propertyNotes({
      chaturthamsha: {
        ascRashi: 9 as Rashi,
        grahas: [
          { id: 'Ma', rashi: 4, dignity: 'debilitated' },
          { id: 'Ju', rashi: 2 },
        ],
      },
    })
    expect(reversed.join(' ')).toMatch(/Mars is debilitated in the 8th/)
    expect(reversed.join(' ')).toMatch(/read as exalted for property/)
    expect(reversed.join(' ')).toMatch(/Jupiter in the 6th of Chaturthamsha is read as strong/)

    const fortune = propertyNotes({
      chaturthamsha: {
        ascRashi: 8 as Rashi,
        grahas: [{ id: 'Ju', rashi: 4, dignity: 'exalted' }],
      },
    })
    expect(fortune.join(' ')).toMatch(/Jupiter is exalted in the 9th/)

    const vehicle = vehicleNotes({
      dashaLords: ['Ve'],
      shodashamsha: {
        ascRashi: 11 as Rashi,
        grahas: [
          { id: 'Mo', rashi: 2, dignity: 'exalted' },
          { id: 'Ve', rashi: 4 },
          { id: 'Ra', rashi: 11 },
          { id: 'Ke', rashi: 5 },
        ],
      },
    })
    const vehicleText = vehicle.join(' ')
    expect(vehicleText).toMatch(/exchange of the 4th and the 6th/)
    expect(vehicleText).toMatch(/Moon is the strongest/)
    expect(vehicleText).toMatch(/White is the color/)
    expect(vehicleText).toMatch(/An accident with a vehicle is checked/)
    expect(vehicleText).toMatch(/mahadasha of Venus is running/)
    expect(vehicleText).toMatch(/through the parents/)
    expect(vehicleText).not.toMatch(/Rolls|luxury|lal batti/)

    const black = vehicleNotes({
      shodashamsha: {
        ascRashi: 1 as Rashi,
        grahas: [{ id: 'Sa', rashi: 7, dignity: 'exalted' }],
      },
    })
    expect(black.join(' ')).toMatch(/Black is the color/)

    const official = vehicleNotes({
      shodashamsha: {
        ascRashi: 1 as Rashi,
        grahas: [
          { id: 'Su', rashi: 1 },
          { id: 'Ma', rashi: 4 },
        ],
      },
    })
    expect(official.join(' ')).toMatch(/government vehicle with a light or a flag is checked/)

    expect(nadiNodeNote('mean')).toMatch(/true nodes/)
    expect(nadiNodeNote('true')).toBeNull()
    const wired = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [{ id: 'Ma', rashi: 1 }],
      nodeMode: 'mean',
      chaturthamsha: { ascRashi: 1 as Rashi, grahas: [{ id: 'Ma', rashi: 1, dignity: 'own' }] },
    })
    expect(wired.propertyNotes.join(' ')).toMatch(/own sign/)
    expect(wired.nodeNote).toMatch(/mean nodes/)
  })

  it('reads Shashtiamsa with the birth-chart rules and keeps a retrograde 7th lord as a set', () => {
    const notes = shashtiamsaNotes({
      shashtiamsa: {
        ascRashi: 1 as Rashi,
        grahas: [
          { id: 'Sa', rashi: 5 },
          { id: 'Ju', rashi: 1 },
          { id: 'Me', rashi: 3 },
          { id: 'Su', rashi: 6 },
          { id: 'Ma', rashi: 8 },
          { id: 'Ke', rashi: 8 },
          { id: 'Ve', rashi: 11, isRetro: true },
        ],
      },
    })
    const text = notes.join(' ')
    expect(text).toMatch(/10th lord of Shashtiamsa sits in the 5th/)
    expect(text).toMatch(/Teaching is read as prominent/)
    expect(text).toMatch(/Jupiter sits in the Shashtiamsa lagna/)
    expect(text).toMatch(/Mercury sits in the 3rd/)
    expect(text).toMatch(/Writing is one option/)
    expect(text).toMatch(/Medicine or law, through education/)
    expect(text).toMatch(/Surgery, or a uniformed profession/)
    expect(text).toMatch(/2nd and the 11th of Shashtiamsa connect/)
    expect(text).toMatch(/lagna lord connects with the 8th/)
    expect(text).toMatch(/chronic illness is checked/)
    expect(text).toMatch(/read together/)
    expect(text).not.toMatch(/death|heart|stomach|Delhi/)
    expect(NADI_SHASHTIAMSA_NOTE).not.toMatch(/wrong|rectif/)

    const quiet = shashtiamsaNotes({ shashtiamsa: { ascRashi: 1 as Rashi, grahas: [] } })
    expect(quiet).toEqual([])

    const seventh = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [{ id: 'Ve', rashi: 7, isRetro: true }],
    })
    expect(seventh.retrogradeNotes.join(' ')).toMatch(/7th lord is retrograde/)
    expect(seventh.retrogradeNotes.join(' ')).toMatch(/Late marriage and a separation are read together/)
    expect(seventh.retrogradeNotes.join(' ')).not.toMatch(/death/)
  })

  it('reads the Bhrigu Bhava from the lagna sign on the birth chart', () => {
    const aquarius = bhriguBhavaNotes({
      ascRashi: 11 as Rashi,
      grahas: [
        { id: 'Me', rashi: 9 },
        { id: 'Ve', rashi: 9 },
        { id: 'Ra', rashi: 9 },
        { id: 'Ju', rashi: 7 },
        { id: 'Ke', rashi: 7 },
      ],
    })
    const text = aquarius.notes.join(' ')
    expect(aquarius.house).toBe(11)
    expect(text).toMatch(/Aquarius, so the Bhrigu Bhava is the 11th/)
    expect(text).toMatch(/Mercury, Venus, and Rahu sit in the Bhrigu Bhava/)
    expect(text).toMatch(/Rahu afflicts the Bhrigu Bhava/)
    expect(text).toMatch(/read as extreme/)
    expect(text).toMatch(/Jupiter with Ketu is not read as an affliction/)
    expect(text).toMatch(/lord sits in the 9th/)
    expect(text).toMatch(/Wealth is read from that/)
    expect(text).toMatch(/Mercury and Venus are together/)
    expect(text).not.toMatch(/cancer|suicide|Jackson|Rama/)

    const cancer = bhriguBhavaNotes({
      ascRashi: 4 as Rashi,
      grahas: [
        { id: 'Sa', rashi: 7, dignity: 'exalted' },
        { id: 'Ve', rashi: 12, dignity: 'exalted' },
      ],
    })
    const cancerText = cancer.notes.join(' ')
    expect(cancer.house).toBe(4)
    expect(cancerText).toMatch(/Saturn afflicts/)
    expect(cancerText).toMatch(/A blessing is read/)
    expect(cancerText).toMatch(/Healing work/)

    const arms = bhriguBhavaNotes({
      ascRashi: 3 as Rashi,
      grahas: [
        { id: 'Su', rashi: 7, dignity: 'debilitated' },
        { id: 'Ke', rashi: 7 },
      ],
    })
    const armsText = arms.notes.join(' ')
    expect(armsText).toMatch(/Durga combination/)
    expect(armsText).toMatch(/chronic illness, a surgery, or a serious accident is checked/)
    expect(armsText).toMatch(/arms/)
    expect(armsText).toMatch(/debilitated/)
    expect(armsText).not.toMatch(/amputation|cancer/)

    const leo = bhriguBhavaNotes({
      ascRashi: 5 as Rashi,
      grahas: [
        { id: 'Ra', rashi: 9 },
        { id: 'Ju', rashi: 4, dignity: 'exalted' },
      ],
    })
    expect(leo.notes.join(' ')).toMatch(/Delay in marriage and in childbirth is checked/)
    expect(leo.notes.join(' ')).toMatch(/Astrology, teaching, or consulting/)

    const post = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [
        { id: 'Su', rashi: 9 },
        { id: 'Ju', rashi: 5 },
      ],
    })
    expect(post.career.lines.join(' ')).toMatch(/high government post/)
    expect(post.bhriguHouse).toBe(1)
    expect(NADI_BHRIGU_NOTE).toMatch(/not the Bhrigu Bindu/)
    expect(NADI_BHRIGU_NOTE).not.toMatch(/rectif/)
  })

  it('reads the three marriage rules, the afflicted house, and the age activations', () => {
    const sav = Array.from({ length: 12 }, () => 30)
    sav[6] = 22
    const strong = readChartLectures({
      ascRashi: 1 as Rashi,
      upapada: 5 as Rashi,
      sav,
      grahas: [
        { id: 'Ma', rashi: 1 },
        { id: 'Sa', rashi: 1 },
        { id: 'Ke', rashi: 5 },
      ],
    })
    const strongText = strong.marriage.join(' ')
    expect(strongText).toMatch(/Mars and Saturn are together/)
    expect(strongText).toMatch(/Upapada/)
    expect(strongText).toMatch(/under 25/)
    expect(strongText).toMatch(/All three marriage rules are present/)
    expect(strongText).not.toMatch(/certain|confirmed/)

    const partial = readChartLectures({
      ascRashi: 1 as Rashi,
      sav,
      grahas: [{ id: 'Su', rashi: 5 }],
    })
    expect(partial.marriage.join(' ')).toMatch(/Not all three/)
    expect(partial.marriage.join(' ')).not.toMatch(/strong reading/)

    const adjacent = readChartLectures({
      ascRashi: 1 as Rashi,
      grahas: [
        { id: 'Ma', rashi: 1 },
        { id: 'Sa', rashi: 2 },
      ],
    })
    expect(adjacent.marriage.join(' ')).toMatch(/2nd and the 12th/)

    const mutual = readChartLectures({
      ascRashi: 1 as Rashi,
      grahas: [
        { id: 'Ma', rashi: 1 },
        { id: 'Sa', rashi: 4 },
      ],
    })
    expect(mutual.marriage.join(' ')).toMatch(/aspect each other/)

    const second = readChartLectures({
      ascRashi: 1 as Rashi,
      grahas: [
        { id: 'Su', rashi: 2 },
        { id: 'Sa', rashi: 2 },
        { id: 'Ma', rashi: 3 },
        { id: 'Ra', rashi: 3 },
      ],
    })
    expect(second.afflicted.join(' ')).toMatch(/2nd is the most afflicted/)
    expect(second.afflicted.join(' ')).not.toMatch(/3rd is the most afflicted/)

    const years = readChartLectures({
      ascRashi: 1 as Rashi,
      runningYear: 25,
      grahas: [
        { id: 'Su', rashi: 10 },
        { id: 'Mo', rashi: 1 },
        { id: 'Ma', rashi: 1 },
      ],
      sav: [28, 28, 28, 28, 28, 28, 28, 28, 28, 20, 40, 28],
    })
    expect(years.years.join(' ')).toMatch(/25th year/)
    expect(years.years.join(' ')).toMatch(/now running/)
    expect(years.years.join(' ')).toMatch(/10th year, and every 12 years/)
    expect(years.wealth.join(' ')).toMatch(/Wealth is read from that/)

    const water = readNadiHouses({
      ascRashi: 4 as Rashi,
      grahas: [{ id: 'Ju', rashi: 11 }],
    })
    expect(water.snapshots.find((row) => row.id === 'separation-water-jupiter')?.house).toBe(8)

    const venus = readNadiHouses({
      ascRashi: 7 as Rashi,
      grahas: [{ id: 'Ve', rashi: 6, dignity: 'debilitated' }],
    })
    expect(venus.dusthanaNotes.join(' ')).toMatch(/does not turn it into exaltation/)
    expect(venus.dusthanaNotes.join(' ')).not.toMatch(/read as exalted/)
    expect(NADI_MARRIAGE_RULE_NOTE).toMatch(/Moon chart is kept for dasha/)
  })

  it('opens a sign pair at its age, and reads the house when the sign is empty', () => {
    const running = rashiAgeNotes({
      ascRashi: 1 as Rashi,
      runningYear: 20,
      grahas: [{ id: 'Ma', rashi: 1 }],
    })
    const at20 = running.find((line) => line.includes('20th year')) ?? ''
    expect(at20).toMatch(/Aries and Pisces/)
    expect(at20).toMatch(/with Mars/)
    expect(at20).toMatch(/No planet sits there/)
    expect(at20).toMatch(/now running/)

    const exchanged = rashiAgeNotes({
      ascRashi: 1 as Rashi,
      grahas: [
        { id: 'Me', rashi: 10 },
        { id: 'Sa', rashi: 3 },
      ],
    })
    expect(exchanged.find((line) => line.includes('28th year'))).toMatch(/exchange includes this sign/)

    const sudden = rashiAgeNotes({
      ascRashi: 1 as Rashi,
      grahas: [
        { id: 'Mo', rashi: 12 },
        { id: 'Ra', rashi: 12 },
      ],
    })
    expect(sudden.find((line) => line.includes('20th year'))).toMatch(/unexpected event is checked, and it is read more strongly/)
    expect(sudden.join(' ')).not.toMatch(/amput|Lok Sabha|mode of death/i)

    const rank = rashiAgeNotes({
      ascRashi: 1 as Rashi,
      grahas: [{ id: 'Ma', rashi: 5, dignity: 'debilitated' }],
    })
    const ariesLord = rank.find((line) => line.includes('20th year')) ?? ''
    expect(ariesLord).toMatch(/lord sits in the 5th/)
    expect(ariesLord).toMatch(/struggle is checked/)

    const wealth = rashiAgeNotes({
      ascRashi: 2 as Rashi,
      grahas: [],
    })
    expect(wealth.find((line) => line.includes('20th year'))).toMatch(/large expense/)

    const same = rashiAgeNotes({
      ascRashi: 6 as Rashi,
      grahas: [],
    })
    expect(same.find((line) => line.includes('20th year'))).toMatch(/year-count house is the same one/)

    const together = rashiAgeNotes({
      ascRashi: 1 as Rashi,
      grahas: [{ id: 'Ma', rashi: 4 }],
    })
    expect(together.find((line) => line.includes('32nd year'))).toMatch(/Mars's year is also open/)

    const lighter = readChartLectures({
      ascRashi: 1 as Rashi,
      grahas: [
        { id: 'Ke', rashi: 7 },
        { id: 'Ju', rashi: 1 },
      ],
    })
    expect(lighter.marriage.join(' ')).toMatch(/read more lightly/)
    expect(NADI_RASHI_AGE_NOTE).toMatch(/empty sign is read from the house/)
    expect(NADI_RASHI_AGE_NOTE).not.toMatch(/Kaal/)
  })

  it('reads the career exchange, the study path, and the money periods', () => {
    const pressed = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [
        { id: 'Su', rashi: 10 },
        { id: 'Sa', rashi: 5 },
      ],
      dashaLords: ['Su'],
    })
    expect(pressed.career.lines.join(' ')).toMatch(/one exchange read as under pressure/)
    expect(pressed.career.notes.join(' ')).toMatch(/under pressure/)
    expect(pressed.wealthTiming.join(' ')).toMatch(/not read as a money period/)

    const away = readNadiHouses({
      ascRashi: 3 as Rashi,
      grahas: [
        { id: 'Ve', rashi: 1 },
        { id: 'Ma', rashi: 2 },
      ],
    })
    expect(away.career.lines.join(' ')).toMatch(/away from home/)

    const house = readNadiHouses({
      ascRashi: 4 as Rashi,
      grahas: [
        { id: 'Ve', rashi: 4 },
        { id: 'Mo', rashi: 7 },
        { id: 'Ju', rashi: 4, dignity: 'exalted' },
      ],
    })
    expect(house.career.lines.join(' ')).toMatch(/Property and a vehicle are read as supported/)

    const crowd = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [
        { id: 'Su', rashi: 6 },
        { id: 'Me', rashi: 6 },
        { id: 'Ve', rashi: 6 },
        { id: 'Ma', rashi: 7 },
        { id: 'Ju', rashi: 7 },
        { id: 'Sa', rashi: 7 },
      ],
    })
    expect(crowd.career.lines.join(' ')).toMatch(/Dashamsha is used to choose/)

    const body = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [
        { id: 'Su', rashi: 1 },
        { id: 'Me', rashi: 1 },
        { id: 'Ve', rashi: 1 },
      ],
    })
    expect(body.career.notes.join(' ')).toMatch(/does not name one profession/)
    expect(body.career.lines.join(' ')).not.toMatch(/sit together/)

    const practical = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [{ id: 'Ke', rashi: 5 }],
    })
    expect(practical.career.notes.join(' ')).toMatch(/practical trade/)

    const money = readNadiHouses({
      ascRashi: 11 as Rashi,
      grahas: [{ id: 'Ve', rashi: 12, dignity: 'exalted' }],
      navamsha: { Ve: 12 as Rashi },
      dashaLords: ['Ve'],
      bhriguBindu: 15,
      moonNakshatra: 0,
      nakshatras: { Ve: 1 },
    })
    const moneyText = money.wealthTiming.join(' ')
    expect(moneyText).toMatch(/strong money period/)
    expect(moneyText).toMatch(/money, luck, and travel/)
    expect(moneyText).toMatch(/Bhrigu Bindu falls in Aries/)
    expect(moneyText).toMatch(/Bharani/)
    expect(moneyText).not.toMatch(/crore|101%|90%/)

    const live = readNadiLiveTransits({
      natal: [],
      sky: [{ id: 'Ju', rashi: 1 }],
      binduSign: 1 as Rashi,
    })
    expect(live.hits.map((hit) => hit.reading).join(' ')).toMatch(/on the Bhrigu Bindu/)
  })

  it('stacks the coming years and the Vimshottari periods still ahead', () => {
    const ahead = readNadiHouses({
      ascRashi: 1 as Rashi,
      birthDate: '1993-06-01',
      asOf: new Date(2023, 6, 1),
      grahas: [
        { id: 'Ju', rashi: 5 },
        { id: 'Su', rashi: 10 },
        { id: 'Sa', rashi: 5 },
      ],
      navamshaChart: { ascRashi: 4 as Rashi, grahas: [] },
      dashaNodes: [{
        lord: 'Sa',
        start: '2020-01-01T00:00:00.000Z',
        end: '2039-01-01T00:00:00.000Z',
        children: [
          { lord: 'Sa', start: '2023-01-01T00:00:00.000Z', end: '2025-06-01T00:00:00.000Z' },
          { lord: 'Mo', start: '2025-06-01T00:00:00.000Z', end: '2027-01-01T00:00:00.000Z' },
        ],
      }],
    })
    expect(ahead.future.runningYear).toBe(31)
    expect(ahead.future.years[0]?.year).toBe(31)
    expect(ahead.future.years[0]?.now).toBe(true)
    expect(ahead.future.years[0]?.calendar).toBe(2024)
    expect(ahead.future.years.some((year) => year.year < 31)).toBe(false)
    expect(ahead.future.years.find((year) => year.year === 32)?.techniques).toContain('sign')
    expect(ahead.future.years.find((year) => year.year === 37)?.techniques).toContain('planet')
    expect(ahead.future.years.map((year) => year.lines.join(' ')).join(' ')).not.toMatch(/divorce/i)

    const open = ahead.future.periods.find((period) => period.now)
    expect(open?.title).toMatch(/Saturn/)
    expect(open?.lines.join(' ')).toMatch(/under pressure/)
    expect(open?.lines.join(' ')).toMatch(/not read as a money period/)
    expect(ahead.future.periods.find((period) => period.title.includes('Moon'))?.lines.join(' ')).toMatch(/marriage or for meeting the partner/)

    const life = readNadiHouses({
      ascRashi: 1 as Rashi,
      grahas: [{ id: 'Su', rashi: 1 }],
    })
    expect(life.future.runningYear).toBeNull()
    expect(life.future.periods).toEqual([])
    expect(life.future.years.find((year) => year.year === 20)?.techniques).toContain('sign')
    expect(life.future.years.find((year) => year.year === 25)?.techniques).toContain('planet')
  })
})
