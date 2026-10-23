// ─────────────────────────────────────────────────────────────
//  __tests__/engine/jaiminiReadings.test.ts
//  Family karakas, rajayogas, Karakamsha, argala, Chaturtha bala,
//  Navamsha dasha, and Brahma dasha.
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import type { GrahaData, GrahaId, LagnaData, Rashi } from '@/types/astrology'
import { chaturthaBalaForRashi } from '@/lib/engine/jaimini/bala'
import { evaluateArgala } from '@/lib/engine/jaimini/argala'
import { calculateFamilyKarakas } from '@/lib/engine/jaimini/family'
import { readKarakamsha } from '@/lib/engine/jaimini/karakamsha'
import { detectJaiminiRajayogas } from '@/lib/engine/jaimini/yogas'
import { readJaiminiDasha } from '@/lib/engine/jaimini/dashaReading'
import {
  nakshatraOf,
  readKarakaLife,
  readSoulKarakas,
  recommendMandook,
  sagittariusBand,
  sagittariusMarriageLine,
} from '@/lib/engine/jaimini/judgment'
import { calcBrahmaDasha, calcNavamshaDasha } from '@/lib/engine/dasha/jaimini'

function graha(id: GrahaId, rashi: Rashi, degree: number, dignity: GrahaData['dignity'] = 'neutral'): GrahaData {
  return { id, rashi, degree, dignity, lonSidereal: (rashi - 1) * 30 + degree } as GrahaData
}

describe('chaturthaBalaForRashi', () => {
  it('gives 60 to an odd sign whose lord is with a malefic', () => {
    const grahas = [graha('Ma', 1, 10), graha('Sa', 1, 18)]
    expect(chaturthaBalaForRashi(1, grahas)).toBe(60)
  })

  it('gives nothing to an even sign', () => {
    const grahas = [graha('Ve', 2, 10), graha('Sa', 2, 18)]
    expect(chaturthaBalaForRashi(2, grahas)).toBe(0)
  })
})

describe('evaluateArgala', () => {
  it('blocks only when the obstructing planet is in the opposite quarter', () => {
    const open = evaluateArgala(1, [
      { id: 'Ju', rashi: 2, degree: 1 },
      { id: 'Sa', rashi: 12, degree: 2 },
    ])
    expect(open.find(s => s.id === '2nd')?.isArgalaActive).toBe(true)

    const blocked = evaluateArgala(1, [
      { id: 'Ju', rashi: 2, degree: 1 },
      { id: 'Sa', rashi: 12, degree: 23 },
    ])
    expect(blocked.find(s => s.id === '2nd')?.isArgalaActive).toBe(false)
    expect(blocked.find(s => s.id === '2nd')?.occupants[0].isBlocked).toBe(true)
  })
})

describe('calculateFamilyKarakas', () => {
  it('picks the stronger of Sun and Venus for the father', () => {
    const rows = calculateFamilyKarakas([
      graha('Su', 1, 10, 'exalted'),
      graha('Ve', 6, 4, 'debilitated'),
      graha('Mo', 4, 12, 'own'),
    ])
    expect(rows.find(r => r.relation === 'Father')?.planet).toBe('Su')
    expect(rows.find(r => r.relation === 'Mother')?.planet).toBe('Mo')
    expect(rows.find(r => r.relation === 'Children')?.planet).toBe('Sa')
    expect(rows.find(r => r.relation === 'Mother')?.note).toBeNull()
  })

  it('notes Mars as mother when Moon and Venus are both weak', () => {
    const rows = calculateFamilyKarakas([
      graha('Mo', 8, 3, 'debilitated'),
      graha('Ve', 6, 4, 'debilitated'),
    ])
    expect(rows.find(r => r.relation === 'Mother')?.note).toMatch(/Mars/)
  })
})

describe('detectJaiminiRajayogas', () => {
  it('finds AK with AmK, DK, and the 5th lord', () => {
    const grahas = [
      graha('Ma', 1, 28),
      graha('Su', 1, 20),
      graha('Ju', 5, 15),
      graha('Me', 3, 4),
    ]
    const hits = detectJaiminiRajayogas(grahas, 1, { AK: 'Ma', AmK: 'Su', PK: 'Ju', DK: 'Ju' })
    expect(hits.map(h => h.id)).toEqual(expect.arrayContaining(['ak-amk', 'ak-dk', 'ak-fifth-lord', 'ak-amk-pk', 'amk-dk']))
  })

  it('marks a link that is also in navamsha, and reads Moon with Venus', () => {
    const d1 = [graha('Ma', 1, 20), graha('Su', 1, 10), graha('Mo', 2, 8), graha('Ve', 2, 4)]
    const d9 = [graha('Ma', 5, 3), graha('Su', 5, 2), graha('Mo', 4, 1), graha('Ve', 7, 1)]
    const hits = detectJaiminiRajayogas(d1, 1, { AK: 'Ma', AmK: 'Su', PK: 'Mo', DK: 'Ve' }, undefined, { d9, d9Lagna: 1 })
    expect(hits.find(h => h.id === 'ak-amk')?.desc).toMatch(/navamsha/)
    expect(hits.find(h => h.id === 'ak-amk')?.strength).toBe('Exceptional')
    expect(hits.find(h => h.id === 'moon-venus')).toBeTruthy()
  })
})

describe('readKarakamsha', () => {
  it('reads the Atmakaraka navamsha in D1 and D9', () => {
    const reading = readKarakamsha({
      d1: [graha('Ju', 5, 12), graha('Ve', 8, 6)],
      d9: [graha('Ju', 5, 2), graha('Ve', 11, 9)],
      lagna: 1,
      arudhaLagna: 5,
      ak: 'Ju',
      amk: 'Su',
      dk: 'Ve',
    })
    expect(reading.karakamsha).toBe(5)
    expect(reading.swamsha).toBe(5)
    expect(reading.alignment).toMatch(/Karakamsha and Arudha Lagna share Leo/)
    expect(reading.houses[0].d1).toContain('Ju')
    expect(reading.themes.find(t => t.id === 'spouse')?.text).toMatch(/Aquarius/)
    expect(reading.themes.find(t => t.id === 'career')?.text).toMatch(/real profession/)
    expect(reading.usage).toMatch(/only Swamsha/)
  })

  it('places a navamsha planet in the house counted from Karakamsha', () => {
    const reading = readKarakamsha({
      d1: [graha('Ma', 4, 10)],
      d9: [graha('Ma', 3, 4), graha('Ve', 4, 2)],
      lagna: 1,
      arudhaLagna: 1,
      ak: 'Ma',
      amk: 'Su',
      dk: 'Ve',
    })
    expect(reading.karakamsha).toBe(3)
    expect(reading.houses[1].d9).toContain('Ve')
    expect(reading.direction).toMatch(/engineering/)
    expect(reading.themes.find(t => t.id === 'struggles')?.text).toMatch(/6th/)
  })

  it('names the 10th lord and the Atmakaraka sitting in the Karakamsha sign', () => {
    const reading = readKarakamsha({
      d1: [graha('Ju', 5, 12), graha('Ma', 5, 4)],
      d9: [graha('Ju', 5, 2), graha('Sa', 5, 8)],
      lagna: 1,
      arudhaLagna: 2,
      ak: 'Ju',
      amk: 'Ma',
      dk: 'Ve',
    })
    const career = reading.themes.find(t => t.id === 'career')?.text ?? ''
    expect(career).toMatch(/lord of that 10th is Venus/)
    expect(career).toMatch(/rarely idle/)
    expect(career).toMatch(/Saturn sits with the Atmakaraka/)
    expect(reading.themes.find(t => t.id === 'creation')?.text).toMatch(/5th/)
  })
})

describe('readJaiminiDasha', () => {
  it('names the sign, its lord, and open argala', () => {
    const reading = readJaiminiDasha({
      sign: 1,
      grahas: [
        { id: 'Ma', rashi: 5, degree: 10 },
        { id: 'Ju', rashi: 2, degree: 8 },
      ],
      roleOf: { Ma: 'AK', Ju: 'AmK' },
    })
    expect(reading.lord).toBe('Ma')
    expect(reading.steps[0].text).toMatch(/Aries/)
    expect(reading.steps[3].text).toMatch(/Wealth/)
    expect(reading.steps.find(step => step.title === 'Rashi drishti')?.text).toMatch(/Mars/)
    expect(reading.steps.find(step => step.title === 'Houses from the dasha sign')?.text).toMatch(/Cancer/)
    expect(reading.pada).toBeGreaterThanOrEqual(1)
  })

  it('reads natal house, Sagittarius theme, and an indirect sequence', () => {
    const reading = readJaiminiDasha({
      sign: 9,
      lagna: 1,
      sequenceForward: false,
      grahas: [{ id: 'Ju', rashi: 9, degree: 12 }],
      roleOf: { Ju: 'GK' },
      vimshottariLord: 'Jupiter',
    })
    expect(reading.steps[0].text).toMatch(/9th house/)
    expect(reading.steps[0].text).toMatch(/direction of life/)
    expect(reading.steps.find(step => step.title === 'Indirect sequence')).toBeTruthy()
    expect(reading.steps.find(step => step.title === 'Gnatikaraka')?.text).toMatch(/karmic debt/)
    expect(reading.steps.find(step => step.title === 'Cross-check')?.text).toMatch(/Jupiter/)
    expect(reading.steps.find(step => step.title === 'Kind of fall')?.text).toMatch(/external fall/)
  })

  it('flags a public fall when Sagittarius is the 8th from Atmakaraka and Rahu sits there', () => {
    const reading = readJaiminiDasha({
      sign: 9,
      lagna: 1,
      grahas: [
        { id: 'Mo', rashi: 2, degree: 8 },
        { id: 'Ju', rashi: 10, degree: 5 },
        { id: 'Ra', rashi: 9, degree: 14 },
        { id: 'Ve', rashi: 9, degree: 3 },
      ],
      roleOf: { Mo: 'AK', Ju: 'AmK' },
      upapada: 9,
    })
    const text = reading.steps.find(step => step.title === 'Sagittarius')?.text ?? ''
    expect(text).toMatch(/8th from the Atmakaraka/)
    expect(text).toMatch(/Rahu is conjunct Sagittarius/)
    expect(text).toMatch(/high-risk/)
    expect(text).toMatch(/Upapada/)
    expect(text).toMatch(/Mula/)
    expect(text).toMatch(/maraka/)
  })

  it('reads a Scorpio antardasha as a compressed internal fall', () => {
    const reading = readJaiminiDasha({
      sign: 1,
      antarSign: 8,
      grahas: [
        { id: 'Ma', rashi: 1, degree: 10 },
        { id: 'Su', rashi: 1, degree: 4 },
      ],
      roleOf: { Ma: 'AK', Su: 'AmK' },
      lagna: 1,
    })
    expect(reading.steps.find(step => step.title === 'Kind of fall')?.text).toMatch(/internal fall/)
    expect(reading.steps.find(step => step.title === 'Antardasha')?.text).toMatch(/months/)
    expect(reading.steps.find(step => step.title === 'Atmakaraka and Amatyakaraka')?.text).toMatch(/shortcut/)
    expect(reading.steps.find(step => step.title === 'Atmakaraka')?.text).toMatch(/pain zone/)
  })
})

describe('Sagittarius and karaka judgment', () => {
  it('splits Sagittarius into Mula, Purva Ashadha, and Uttara Ashadha', () => {
    expect(sagittariusBand(0).name).toBe('Mula')
    expect(sagittariusBand(13 + 20 / 60).name).toBe('Purva Ashadha')
    expect(sagittariusBand(27).name).toBe('Uttara Ashadha')
  })

  it('reads Bharani pada 3 as speech guilt and an 8th-house Amatyakaraka as a sudden fall', () => {
    expect(nakshatraOf(1, 21)).toMatchObject({ name: 'Bharani', pada: 3 })
    const reading = readSoulKarakas({
      grahas: [
        graha('Su', 1, 21),
        graha('Sa', 8, 12),
        graha('Ra', 8, 18),
      ],
      lagna: 1,
      ak: 'Su',
      amk: 'Sa',
    })
    expect(reading.akLines.join(' ')).toMatch(/harsh speech that is not taken back/)
    expect(reading.akLines.join(' ')).toMatch(/fire sign/)
    expect(reading.amkLines.join(' ')).toMatch(/sudden fall/)
    expect(reading.amkLines.join(' ')).toMatch(/ambitions that do not stay satisfied/)
  })

  it('recommends Mandook when four planets occupy kendras and still leaves the choice open', () => {
    const hit = recommendMandook([
      { id: 'Su', rashi: 1 },
      { id: 'Mo', rashi: 4 },
      { id: 'Ma', rashi: 7 },
      { id: 'Me', rashi: 10 },
      { id: 'Ra', rashi: 1 },
    ], 1)
    expect(hit?.count).toBe(4)
    expect(hit?.text).toMatch(/Chara stays available/)
    expect(recommendMandook([
      { id: 'Su', rashi: 1 },
      { id: 'Mo', rashi: 4 },
      { id: 'Ma', rashi: 7 },
    ], 1)).toBeNull()
  })

  it('reads the karaka loop, a 12th-house enemy, and linked rivals', () => {
    const reading = readKarakaLife({
      grahas: [
        graha('Su', 1, 20),
        graha('Me', 1, 10),
        graha('Ju', 1, 4),
        graha('Ma', 12, 8),
        graha('Sa', 12, 6),
        graha('Mo', 8, 3, 'debilitated'),
        graha('Ve', 6, 4, 'debilitated'),
      ],
      lagna: 1,
      ak: 'Su',
      amk: 'Me',
      bk: 'Ma',
      mk: 'Mo',
      pk: 'Ju',
      gk: 'Sa',
      dk: 'Ve',
      ageYears: 15,
    })
    const text = reading.rows.flatMap(row => row.lines).join(' ')
    expect(text).toMatch(/Age 15 is inside the Bhratrukaraka years/)
    expect(text).toMatch(/own enemy/)
    expect(text).toMatch(/competitor can become an enemy/)
    expect(text).toMatch(/extreme pain/)
    expect(text).toMatch(/Pitrukaraka/)
    expect(text).toMatch(/life purpose/)
    expect(reading.loop).toMatch(/different people/)
  })

  it('times marriage from a Sagittarius Upapada', () => {
    expect(sagittariusMarriageLine(9, 9)).toMatch(/Upapada/)
    expect(sagittariusMarriageLine(3, 9)).toMatch(/7th/)
    expect(sagittariusMarriageLine(1, 9)).toBeNull()
  })
})

describe('Jaimini sign dashas', () => {
  const birth = new Date('1990-01-01T00:00:00Z')

  it('runs Navamsha dasha forward from an odd lagna for 9 years', () => {
    const nodes = calcNavamshaDasha([], { ascRashi: 1 } as LagnaData, birth, 1)
    expect(nodes[0].lord).toBe('Ar')
    expect(nodes[0].label).toContain('(9y)')
    expect(nodes[1].lord).toBe('Ta')
  })

  it('runs Navamsha dasha backward from an even lagna', () => {
    const nodes = calcNavamshaDasha([], { ascRashi: 2 } as LagnaData, birth, 1)
    expect(nodes[0].lord).toBe('Ta')
    expect(nodes[1].lord).toBe('Ar')
  })

  it('starts Brahma dasha from Mars when Mars occupies the 8th from the Atmakaraka', () => {
    const grahas = [
      graha('Su', 5, 5),
      graha('Mo', 4, 4),
      graha('Ma', 1, 10),
      graha('Me', 6, 25),
      graha('Ju', 9, 8),
      graha('Ve', 2, 3),
      graha('Sa', 10, 2),
    ]
    const nodes = calcBrahmaDasha(grahas, { ascRashi: 1 } as LagnaData, birth, 1)
    expect(nodes[0].lord).toBe('Ar')
    expect(nodes[0].label).toContain('(6y)')
    expect(nodes[1].lord).toBe('Ta')
  })
})
