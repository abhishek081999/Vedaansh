import type { GrahaId, Rashi, ChartOutput, GrahaData } from '@/types/astrology'
import { NATURAL_FRIENDS, NATURAL_ENEMIES, OWN_SIGNS, MOOLATRIKONA_SIGN, MOOLATRIKONA_RANGE, EXALTATION_SIGN, DEBILITATION_SIGN } from '../dignity'
import { calcCharaKarakas } from '../karakas'

export interface JaiminiPlanetBala {
  id: GrahaId
  placementBala: number
  placementDetails: string
  karakaBala: number
  karakaRole: string
  kartariBala: number
  total: number
}

export interface JaiminiRashiBala {
  rashi: Rashi
  typeBala: number // Dual (60), Fixed (30), Movable (15)
  karakaBala: number // 1: 60, 2: 75, 3: 90, 4: 105, 5: 120...
  aspectBala: number // 60 for each: Ju, Me, or Rashi Lord
  total: number
}

export interface JaiminiBalaResult {
  version: number
  planets: Record<GrahaId, JaiminiPlanetBala>
  rashis: Record<Rashi, JaiminiRashiBala>
  houses: Record<number, number> // House 1-12 -> 60/30/15
}

/**
 * Calculate Jaimini Planetary Strength (Bala)
 */
export function calculateJaiminiBala(chart: Partial<ChartOutput>): JaiminiBalaResult {
  const grahas = chart.grahas || []
  const lagnas = chart.lagnas || { ascRashi: 1 }

  // Force 7-karaka scheme for Jaimini Intelligence calculations
  const karakas = calcCharaKarakas(
    grahas.map((g) => ({ id: g.id, lonSidereal: g.lonSidereal, degree: g.degree })),
    7
  )

  const planetBala: Record<string, JaiminiPlanetBala> = {}
  const rashiBala: Record<number, JaiminiRashiBala> = {}
  const houseBala: Record<number, number> = {}

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

    // Adhipati Strength for Odd Signs
    const isLordOfOddSign = [1, 3, 5, 7, 9, 11].includes(g.rashi) && getRashiLord(g.rashi) === g.id
    if (isLordOfOddSign) {
        const malefics = ['Ma', 'Sa', 'Ra', 'Ke']
        const hasMaleficConnection = grahas.some(pg => 
            (pg.rashi === g.rashi && malefics.includes(pg.id) && pg.id !== g.id) || 
            (getRashiDrishti(pg.rashi).includes(g.rashi) && malefics.includes(pg.id))
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

    planetBala[g.id] = {
      id: g.id,
      placementBala: strength,
      placementDetails: pDetail,
      karakaBala: kStrength,
      karakaRole: kRole,
      kartariBala: kartariBala,
      total: strength + kStrength + kartariBala
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

    rashiBala[r] = {
      rashi,
      typeBala,
      karakaBala: rKarakaBala,
      aspectBala,
      total: typeBala + rKarakaBala + aspectBala
    }
  }

  return { 
    version: 2, 
    planets: planetBala as any, 
    rashis: rashiBala as any, 
    houses: houseBala 
  }
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

function getSignType(r: Rashi): 'Movable' | 'Fixed' | 'Dual' {
  if ([1, 4, 7, 10].includes(r)) return 'Movable'
  if ([2, 5, 8, 11].includes(r)) return 'Fixed'
  return 'Dual'
}

function getRashiDrishti(r: Rashi): Rashi[] {
  const type = getSignType(r)
  const all: Rashi[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  if (type === 'Movable') {
    // Movable aspects all Fixed except the adjacent one
    const fixed: Rashi[] = [2, 5, 8, 11]
    const adjacent = (r === 1) ? 2 : (r === 4) ? 5 : (r === 7) ? 8 : 11
    return fixed.filter(f => f !== adjacent) as Rashi[]
  }
  if (type === 'Fixed') {
    // Fixed aspects all Movable except the adjacent one
    const movable: Rashi[] = [1, 4, 7, 10]
    const adjacent = (r === 2) ? 1 : (r === 5) ? 4 : (r === 8) ? 7 : 10
    return movable.filter(m => m !== adjacent) as Rashi[]
  }
  // Dual aspects all other Dual signs
  const dual: Rashi[] = [3, 6, 9, 12]
  return dual.filter(d => d !== r) as Rashi[]
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
