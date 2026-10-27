// ─────────────────────────────────────────────────────────────
//  src/lib/engine/nadi/snapshots.ts
//  D1 snapshot rules. Conjunction is same-sign only.
//  Aspect is used where a rule names it, and it is not yuti.
//  Teaching associations, not a diagnosis.
// ─────────────────────────────────────────────────────────────

import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'
import type { Rashi } from '@/types/astrology'
import { getDignity } from '@/lib/engine/dignity'
import {
  RASHI_LORDS,
  wholeSignHouseFromLagna,
  type ClassicalGrahaId,
  type HouseNumber,
} from '@/lib/engine/houseInterpretations'
import { rashiForHouseFromLagna } from '@/lib/engine/rashiInterpretations'
import { NADI_HOUSES, NADI_PAPA_GRAHAS } from '@/lib/engine/nadi/houses'
import { nadiConjunct, type NadiYogaPlacement } from '@/lib/engine/nadi/yogas'
import { houseCountedFrom } from '@/lib/engine/nadi/rotation'

const WATER: readonly Rashi[] = [4, 8, 12]
const PAPA = new Set<string>(NADI_PAPA_GRAHAS)

/** Special aspects counted from the planet’s sign. Every other graha aspects the 7th. */
const ASPECT_STEPS: Partial<Record<ClassicalGrahaId, readonly number[]>> = {
  Ma: [4, 7, 8],
  Ju: [5, 7, 9],
  Sa: [3, 7, 10],
}

export interface NadiSnapshot {
  id: string
  house: HouseNumber | null
  reading: string
}

export interface NadiWealthWindow {
  id: string
  lordName: string
  reason: string
}

export interface NadiSnapshotInput {
  ascRashi: Rashi
  grahas: readonly NadiYogaPlacement[]
  parivartana: readonly { a: HouseNumber; b: HouseNumber }[]
  dashaLords?: readonly ClassicalGrahaId[]
}

export function nadiAspectsSign(from: Rashi, id: ClassicalGrahaId, target: Rashi): boolean {
  const steps = ASPECT_STEPS[id] ?? [7]
  return steps.some((step) => houseCountedFrom(from, step) === target)
}

export function findNadiSnapshots(input: NadiSnapshotInput): NadiSnapshot[] {
  const { ascRashi: asc, grahas } = input
  const hits: NadiSnapshot[] = []
  const houseOfSign = (sign: Rashi) => wholeSignHouseFromLagna(asc, sign)

  const saturn = grahas.find((g) => g.id === 'Sa')
  const mars = grahas.find((g) => g.id === 'Ma')
  const maleficOn = (sign: Rashi) => (
    (!!saturn && (saturn.rashi === sign || nadiAspectsSign(saturn.rashi, 'Sa', sign)))
    || (!!mars && (mars.rashi === sign || nadiAspectsSign(mars.rashi, 'Ma', sign)))
  )
  const saturnOn = (sign: Rashi) => (
    !!saturn && (saturn.rashi === sign || nadiAspectsSign(saturn.rashi, 'Sa', sign))
  )

  const sunMercury = nadiConjunct(grahas, ['Su', 'Me'])
  if (sunMercury && WATER.includes(sunMercury[0].rashi) && maleficOn(sunMercury[0].rashi)) {
    const parental = sunMercury[0].rashi === 8 && (
      nadiConjunct(grahas, ['Ma', 'Su']) || nadiConjunct(grahas, ['Ma', 'Me'])
    ) && saturnOn(8)
    if (!parental) {
      hits.push({
        id: 'su-me-water',
        house: houseOfSign(sunMercury[0].rashi),
        reading: 'Sun and Mercury are together in a water sign, and Saturn or Mars sits with them or aspects them. Cancer is the form checked for the native or an immediate relative.',
      })
    }
  }

  const marsSun = nadiConjunct(grahas, ['Ma', 'Su'])
  const marsMercury = nadiConjunct(grahas, ['Ma', 'Me'])
  const marsPairInScorpio = (marsSun?.[0].rashi === 8) || (marsMercury?.[0].rashi === 8)
  if (marsPairInScorpio && saturnOn(8)) {
    hits.push({
      id: 'scorpio-parents',
      house: houseOfSign(8),
      reading: 'Mars is with the Sun or Mercury in Scorpio, and Saturn sits with them or aspects them. Cancer is the form checked for both parents.',
    })
  }

  const jupiterSaturn = nadiConjunct(grahas, ['Ju', 'Sa'])
  if (jupiterSaturn) {
    hits.push(destroyed(input, 'ju-sa', 'Jupiter and Saturn are together. The house they occupy is read as destroyed.', jupiterSaturn[0].rashi))
  }

  if (saturn && WATER.includes(saturn.rashi)) {
    const hit = destroyed(
      input,
      'sa-water-capricorn',
      'Saturn is in a water sign, so the houses it rules do not deliver their good results. The house of Capricorn is read as destroyed.',
      10,
    )
    hits.push(hit)
  }

  if (sunMercury && (sunMercury[0].rashi === 12 || sunMercury[0].rashi === 6)) {
    hits.push(destroyed(
      input,
      'su-me-pisces',
      'Sun and Mercury are together in Pisces or Virgo. The house of Pisces is read as destroyed.',
      12,
    ))
  }

  const ninth = spineReading(input)
  if (ninth) hits.push(ninth)

  if ((asc === 2 || asc === 7) && nadiConjunct(grahas, ['Ma', 'Ju'])?.[0].rashi === 10) {
    hits.push({
      id: 'separation-capricorn',
      house: houseOfSign(10),
      reading: 'Taurus or Libra lagna with Mars and Jupiter together in Capricorn. This combination is read as a separation.',
    })
  }

  const jupiter = grahas.find((g) => g.id === 'Ju')
  if (jupiter && (asc === 4 || asc === 8 || asc === 12)) {
    const jupiterHouse = houseOfSign(jupiter.rashi)
    if (jupiterHouse === 3 || jupiterHouse === 6 || jupiterHouse === 8 || jupiterHouse === 11) {
      hits.push({
        id: 'separation-water-jupiter',
        house: jupiterHouse,
        reading: `A water-sign lagna with Jupiter in the ${ordinal(jupiterHouse)}. Married life is read as under strain, with a separation and a possible later marriage. Jupiter aspecting the 7th does not cancel this.`,
      })
    }
  }

  const ketu = grahas.find((g) => g.id === 'Ke')
  if (ketu) {
    const house = houseOfSign(ketu.rashi)
    const parts = NADI_HOUSES[house].bodyParts.slice(0, 3).join(', ')
    hits.push({
      id: 'ketu-mark',
      house,
      reading: `Ketu in the ${ordinal(house)}: a mark, cut, or scar is checked on ${parts}.`,
    })
  }

  return hits
}

export function findWealthWindows(input: NadiSnapshotInput): NadiWealthWindow[] {
  const secondSign = rashiForHouseFromLagna(input.ascRashi, 2)
  const secondLord = RASHI_LORDS.find((row) => row.number === secondSign)?.lord
  const seen = new Set<ClassicalGrahaId>()
  const windows: NadiWealthWindow[] = []
  for (const id of input.dashaLords ?? []) {
    if (seen.has(id)) continue
    seen.add(id)
    const placed = input.grahas.find((g) => g.id === id)
    const reasons: string[] = []
    if (id === secondLord) reasons.push('the lord of the 2nd')
    if (placed && wholeSignHouseFromLagna(input.ascRashi, placed.rashi) === 2 && placedDignity(placed) === 'exalted') {
      reasons.push('exalted in the 2nd')
    }
    if (reasons.length === 0) continue
    windows.push({
      id: `wealth-${id}`,
      lordName: GRAHA_NAMES[id],
      reason: reasons.join(', and '),
    })
  }
  return windows
}

function destroyed(
  input: NadiSnapshotInput,
  id: string,
  lead: string,
  sign: Rashi,
): NadiSnapshot {
  const house = wholeSignHouseFromLagna(input.ascRashi, sign)
  const profile = NADI_HOUSES[house]
  const living = [profile.relatives.slice(0, 3).join(', '), profile.bodyParts.slice(0, 2).join(', ')]
    .filter((part) => part.length > 0)
    .join('; ')
  let reading = `${lead} That is the ${ordinal(house)} (${RASHI_NAMES[sign]}). Living significations under pressure: ${living}.`
  if (house === 9 || house === 10) {
    reading += ' Father is read from both the 9th and the 10th.'
  }
  if (input.parivartana.some((pair) => pair.a === house || pair.b === house)) {
    reading += ' An exchange of the lord of this house may hold the result back.'
  }
  return { id, house, reading }
}

function spineReading(input: NadiSnapshotInput): NadiSnapshot | null {
  const sign = rashiForHouseFromLagna(input.ascRashi, 9)
  const lord = RASHI_LORDS.find((row) => row.number === sign)?.lord
  if (!lord) return null
  const placed = input.grahas.find((g) => g.id === lord)
  if (!placed || placedDignity(placed) !== 'debilitated') return null
  const housePapa = input.grahas.some((g) => PAPA.has(g.id) && wholeSignHouseFromLagna(input.ascRashi, g.rashi) === 9)
  const lordPapa = input.grahas.some((g) => g.id !== lord && PAPA.has(g.id) && nadiConjunct(input.grahas, [lord, g.id]))
  if (!housePapa || !lordPapa) return null
  return {
    id: 'spine-9',
    house: 9,
    reading: 'The 9th is afflicted and its lord is debilitated and afflicted. Back and spine trouble is checked, and it rises with the affliction.',
  }
}

function placedDignity(g: NadiYogaPlacement): string {
  if (g.dignity) return g.dignity
  return getDignity(g.id, g.rashi, g.degree ?? 15)
}

function ordinal(n: number): string {
  const mod = n % 10
  if (mod === 1 && n !== 11) return `${n}st`
  if (mod === 2 && n !== 12) return `${n}nd`
  if (mod === 3 && n !== 13) return `${n}rd`
  return `${n}th`
}
