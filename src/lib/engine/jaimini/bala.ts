import type { GrahaId, Rashi, ChartOutput, GrahaData } from '@/types/astrology'
import { NATURAL_FRIENDS, NATURAL_ENEMIES, OWN_SIGNS, MOOLATRIKONA_SIGN, MOOLATRIKONA_RANGE, EXALTATION_SIGN, DEBILITATION_SIGN } from '../dignity'
import { calcCharaKarakas } from '../karakas'
import { getRashiDrishti } from './aspects'

export interface JaiminiPlanetBala {
  id: GrahaId
  placementBala: number
  placementDetails: string
  karakaBala: number
  karakaRole: string
  kartariBala: number
  /** Kendra 60 / Panaphara 30 / Apoklima 15, counted from the Atmakaraka. */
  kendraBala: number
  total: number
}

export interface JaiminiRashiBala {
  rashi: Rashi
  typeBala: number // Dual (60), Fixed (30), Movable (15)
  karakaBala: number // 1: 60, 2: 75, 3: 90, 4: 105, 5: 120...
  aspectBala: number // 60 for each: Ju, Me, or Rashi Lord
  /** Jaimini Sutra 2.3.17 — odd sign whose lord is joined or aspected by a malefic. */
  chaturthaBala: number
  /** Total strength of the sign's lord. */
  lordBala: number
  total: number
}

export interface JaiminiBalaResult {
  version: number
  planets: Record<GrahaId, JaiminiPlanetBala>
  rashis: Record<Rashi, JaiminiRashiBala>
  houses: Record<number, number> // House 1-12 -> 60/30/15
}

const JAIMINI_GRAHAS: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']
const CHATURTHA_MALEFICS: GrahaId[] = ['Ma', 'Sa', 'Ra', 'Ke']
const ODD_SIGN_LORDS: GrahaId[] = ['Su', 'Ma', 'Me', 'Ju', 'Ve', 'Sa']
const KENDRA_BALA = [60, 30, 15]

/**
 * Calculate Jaimini Planetary Strength (Bala)
 */
export function calculateJaiminiBala(chart: Partial<ChartOutput>): JaiminiBalaResult {
  const grahas = (chart.grahas || []).filter(g => JAIMINI_GRAHAS.includes(g.id))

  // Force 7-karaka scheme for Jaimini Intelligence calculations
  const karakas = calcCharaKarakas(
    grahas.map((g) => ({ id: g.id, lonSidereal: g.lonSidereal, degree: g.degree })),
    7
  )

  const planetBala: Record<string, JaiminiPlanetBala> = {}
  const rashiBala: Record<number, JaiminiRashiBala> = {}
  const houseBala: Record<number, number> = {}
  const akRashi = grahas.find(g => g.id === karakas.AK)?.rashi

  // 1. Planet Placement Bala
  grahas.forEach(g => {
    let strength = 15 // Default Neutral
    let pDetail = 'Neutral'
    
    if (EXALTATION_SIGN[g.id] === g.rashi) {
      strength = 60
      pDetail = 'Exalted'
    } else if (DEBILITATION_SIGN[g.id] === g.rashi) {
      strength = 3.75
      pDetail = 'Debilitated'
    } else {
      const mtrSign = MOOLATRIKONA_SIGN[g.id]
      const mtrRange = MOOLATRIKONA_RANGE[g.id]
      if (mtrSign === g.rashi && mtrRange && g.degree >= mtrRange[0] && g.degree <= mtrRange[1]) {
        strength = 45
        pDetail = 'Moolatrikona'
      } else if (OWN_SIGNS[g.id]?.includes(g.rashi)) {
        strength = 30
        pDetail = 'Own Sign'
      } else if (NATURAL_FRIENDS[g.id]?.includes(getRashiLord(g.rashi))) {
        strength = 22.5
        pDetail = 'Friend Sign'
      } else if (NATURAL_ENEMIES[g.id]?.includes(getRashiLord(g.rashi))) {
        strength = 7.5
        pDetail = 'Enemy Sign'
      }
    }

    // Adhipati Strength: lord of an odd sign, wherever it sits, linked to a malefic
    if (ODD_SIGN_LORDS.includes(g.id)) {
        const hasMaleficConnection = grahas.some(pg =>
            CHATURTHA_MALEFICS.includes(pg.id) && pg.id !== g.id &&
            (pg.rashi === g.rashi || getRashiDrishti(pg.rashi).includes(g.rashi))
        )
        if (hasMaleficConnection) {
            strength += 60
            pDetail += ' + Adhipati (+60)'
        }
    }

    // Karaka Bala (based on role)
    let kStrength = 0
    let kRole = 'None'
    if (karakas.AK === g.id) { kStrength = 60; kRole = 'AK'; }
    else if (karakas.AmK === g.id) { kStrength = 45; kRole = 'AmK'; }
    else if (karakas.BK === g.id) { kStrength = 30; kRole = 'BK'; }
    else if (karakas.MK === g.id) { kStrength = 22.5; kRole = 'MK'; }
    else if (karakas.PK === g.id) { kStrength = 15; kRole = 'PK'; }
    else if (karakas.GK === g.id) { kStrength = 7.5; kRole = 'GK'; }
    else if (karakas.DK === g.id) { kStrength = 3.75; kRole = 'DK'; }

    // Safety: Rahu and Ketu are never Chara Karakas in the 7-karaka scheme
    if (g.id === 'Ra' || g.id === 'Ke') {
      kStrength = 0
      kRole = 'None'
    }

    // Kartari Bala
    const kartariBala = calculateKartariBala(g, grahas)

    const houseFromAk = akRashi ? ((g.rashi - akRashi + 12) % 12) + 1 : null
    const kendraBala = houseFromAk === null ? 0 : KENDRA_BALA[(houseFromAk - 1) % 3]

    planetBala[g.id] = {
      id: g.id,
      placementBala: strength,
      placementDetails: pDetail,
      karakaBala: kStrength,
      karakaRole: kRole,
      kartariBala: kartariBala,
      kendraBala,
      total: strength + kStrength + kartariBala + kendraBala
    }
  })

  // 2. House Bala (Kendra/Panaphara/Apoklima)
  for (let h = 1; h <= 12; h++) {
    if ([1, 4, 7, 10].includes(h)) houseBala[h] = 60
    else if ([2, 5, 8, 11].includes(h)) houseBala[h] = 30
    else houseBala[h] = 15
  }

  // 3. Rashi Bala
  for (let r = 1; r <= 12; r++) {
    const rashi = r as Rashi
    let typeBala = 15 // Movable
    if ([1, 4, 7, 10].includes(r)) typeBala = 15
    else if ([2, 5, 8, 11].includes(r)) typeBala = 30
    else typeBala = 60 // Dual

    // Karaka Bala in Rashi
    const occupants = grahas.filter(g => g.rashi === rashi)
    const karakaCount = occupants.filter(g => Object.values(karakas).includes(g.id)).length
    let rKarakaBala = 0
    if (karakaCount > 0) {
        rKarakaBala = 60 + (karakaCount - 1) * 15
    }

    // Aspect Bala
    let aspectBala = 0
    const aspectingPlanets = grahas.filter(g => {
        const aspects = getRashiDrishti(g.rashi)
        return (aspects.includes(rashi) || g.rashi === rashi) // Jaimini aspects are sign-based
    })
    
    const hasJuAspect = aspectingPlanets.some(g => g.id === 'Ju')
    const hasMeAspect = aspectingPlanets.some(g => g.id === 'Me')
    const hasLordAspect = aspectingPlanets.some(g => g.id === getRashiLord(rashi))

    if (hasJuAspect) aspectBala += 60
    if (hasMeAspect) aspectBala += 60
    if (hasLordAspect) aspectBala += 60

    const chaturthaBala = chaturthaBalaForRashi(rashi, grahas)
    const lordBala = planetBala[getRashiLord(rashi)]?.total ?? 0

    rashiBala[r] = {
      rashi,
      typeBala,
      karakaBala: rKarakaBala,
      aspectBala,
      chaturthaBala,
      lordBala,
      total: typeBala + rKarakaBala + aspectBala + chaturthaBala + lordBala
    }
  }

  return { 
    version: 4, 
    planets: planetBala as any, 
    rashis: rashiBala as any, 
    houses: houseBala 
  }
}

/**
 * Fourth source of sign strength (Jaimini Sutra 2.3.17, chaturthah purushe).
 * An odd sign gains 60 units when its lord is conjunct a malefic or receives
 * that malefic's rashi drishti. Even signs do not take this source.
 */
export function chaturthaBalaForRashi(rashi: Rashi, grahas: GrahaData[]): number {
  if (rashi % 2 === 0) return 0
  const lordId = getRashiLord(rashi)
  const lord = grahas.find(g => g.id === lordId)
  if (!lord) return 0
  const linked = grahas.some(pg => {
    if (pg.id === lord.id || !CHATURTHA_MALEFICS.includes(pg.id)) return false
    if (pg.rashi === lord.rashi) return true
    return getRashiDrishti(pg.rashi).includes(lord.rashi)
  })
  return linked ? 60 : 0
}

function getRashiLord(r: Rashi): GrahaId {
  if (r === 1 || r === 8) return 'Ma'
  if (r === 2 || r === 7) return 'Ve'
  if (r === 3 || r === 6) return 'Me'
  if (r === 4) return 'Mo'
  if (r === 5) return 'Su'
  if (r === 9 || r === 12) return 'Ju'
  if (r === 10 || r === 11) return 'Sa'
  return 'Su'
}

function calculateKartariBala(g: GrahaData, allGrahas: GrahaData[]): number {
  // Odd Signs: 1, 3, 5, 7, 9, 11
  const isOddSign = g.rashi % 2 !== 0
  if (!isOddSign) return 0

  const prevSign = (((g.rashi - 2 + 12) % 12) + 1) as Rashi
  const nextSign = ((g.rashi % 12) + 1) as Rashi

  const hasPrevOccupant = allGrahas.some(pg => pg.rashi === prevSign)
  const hasNextOccupant = allGrahas.some(ng => ng.rashi === nextSign)

  if (hasPrevOccupant && hasNextOccupant) {
    return 60
  }
  return 0
}
