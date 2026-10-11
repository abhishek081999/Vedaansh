// ─────────────────────────────────────────────────────────────
//  src/lib/engine/jaimini/trinity.ts
//  Jaimini Brahma · Maheshwara · Rudra (Rath / Upadesa Sutras school)
//  Used for longevity significators and Intel panel display
// ─────────────────────────────────────────────────────────────

import type { GrahaId, Rashi, ChartOutput, GrahaData } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'
import { calcCharaKarakas } from '../karakas'
import { OWN_SIGNS } from '../dignity'
import { getRashiDrishti } from './aspects'

export interface JaiminiTrinity {
  brahma: {
    id: GrahaId | null
    reason: string
  }
  maheshwara: {
    id: GrahaId | null
    reason: string
  }
  rudra: {
    id: GrahaId | null
    reason: string
  }
}

const CLASSICAL: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']
const EXCLUDED_FROM_BRAHMA: GrahaId[] = ['Sa', 'Ra', 'Ke']
const MALEFICS: GrahaId[] = ['Ma', 'Sa', 'Ra', 'Ke', 'Su']

const SIGN_LORD: Record<Rashi, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

function houseFrom(seed: Rashi, house: number): Rashi {
  return ((((seed - 1) + (house - 1)) % 12) + 1) as Rashi
}

function dignityWeight(dignity?: string): number {
  switch (dignity) {
    case 'exalted': return 9
    case 'moolatrikona': return 8
    case 'own': return 7
    case 'great_friend': return 6
    case 'friend': return 5
    case 'neutral': return 4
    case 'enemy': return 3
    case 'great_enemy': return 2
    case 'debilitated': return 1
    default: return 0
  }
}

function signNatureWeight(sign: Rashi): number {
  if ([3, 6, 9, 12].includes(sign)) return 3
  if ([2, 5, 8, 11].includes(sign)) return 2
  return 1
}

/** Scorpio / Aquarius: compare main vs co-lord (Ke / Ra) by placement support. */
export function resolveSignLord(sign: Rashi, grahas: GrahaData[]): GrahaId {
  const mainLordId = SIGN_LORD[sign]
  if (sign !== 8 && sign !== 11) return mainLordId

  const altLordId: GrahaId = sign === 8 ? 'Ke' : 'Ra'
  const mainLord = grahas.find(g => g.id === mainLordId)
  const altLord = grahas.find(g => g.id === altLordId)
  if (!mainLord) return altLordId
  if (!altLord) return mainLordId

  const mainInOwn = mainLord.rashi === sign
  const altInOwn = altLord.rashi === sign
  if (mainInOwn && !altInOwn) return altLordId
  if (altInOwn && !mainInOwn) return mainLordId

  const mainSupport = grahas.filter(g => g.rashi === mainLord.rashi && g.id !== mainLordId).length
  const altSupport = grahas.filter(g => g.rashi === altLord.rashi && g.id !== altLordId).length
  if (mainSupport !== altSupport) return mainSupport > altSupport ? mainLordId : altLordId
  return mainLord.degree >= altLord.degree ? mainLordId : altLordId
}

function planetStrengthScore(g: GrahaData, grahas: GrahaData[]): number {
  const dignity = dignityWeight(g.dignity) * 100
  const ownSign = resolveSignLord(g.rashi, grahas) === g.id ? 20 : 0
  return dignity + ownSign + g.degree
}

function signStrength(sign: Rashi, grahas: GrahaData[]): number {
  const occupants = grahas.filter(g => g.rashi === sign && g.id !== 'Ra' && g.id !== 'Ke')
  const occupied = occupants.length > 0 ? 100 : 0
  const occupantWeight = occupants.length * 15
  const bestDegree = occupants.length ? Math.max(...occupants.map(g => g.degree)) : 0
  const nature = signNatureWeight(sign) * 5
  const lordId = resolveSignLord(sign, grahas)
  const lord = grahas.find(g => g.id === lordId)
  const lordWeight = lord ? dignityWeight(lord.dignity) * 8 + lord.degree : 0
  return occupied + occupantWeight + bestDegree + nature + lordWeight
}

function strongerSign(a: Rashi, b: Rashi, grahas: GrahaData[]): Rashi {
  return signStrength(a, grahas) >= signStrength(b, grahas) ? a : b
}

function strongerPlanet(
  a: GrahaId,
  b: GrahaId,
  grahas: GrahaData[],
): GrahaId {
  const pa = grahas.find(g => g.id === a)
  const pb = grahas.find(g => g.id === b)
  if (!pa) return b
  if (!pb) return a
  const sa = planetStrengthScore(pa, grahas)
  const sb = planetStrengthScore(pb, grahas)
  if (sa !== sb) return sa >= sb ? a : b
  // Tie-break: higher degree in sign (Jaimini convention)
  return pa.degree >= pb.degree ? a : b
}

function strongestAmong(ids: GrahaId[], grahas: GrahaData[]): GrahaId | null {
  const unique = Array.from(new Set(ids))
  let best: GrahaId | null = null
  for (const id of unique) {
    if (!grahas.some(g => g.id === id)) continue
    best = best ? strongerPlanet(best, id, grahas) : id
  }
  return best
}

function isOwnOrExalted(g: GrahaData): boolean {
  if (g.dignity === 'exalted' || g.dignity === 'own' || g.dignity === 'moolatrikona') return true
  return OWN_SIGNS[g.id]?.includes(g.rashi) ?? false
}

function maleficLinkCount(target: GrahaData, grahas: GrahaData[]): number {
  return grahas.filter(g => {
    if (!MALEFICS.includes(g.id) || g.id === target.id) return false
    if (g.rashi === target.rashi) return true
    return getRashiDrishti(g.rashi).includes(target.rashi)
  }).length
}

/**
 * Calculate Jaimini Trinity: Brahma, Maheshwara, Rudra
 * School: Sanjay Rath / common Upadesa Sutras application for Sthira longevity.
 */
export function calculateJaiminiTrinity(chart: Partial<ChartOutput>): JaiminiTrinity {
  const grahas = (chart.grahas || []).filter(g => CLASSICAL.includes(g.id))
  const lagnas = chart.lagnas || { ascRashi: 1 as Rashi }
  const lagnaRashi = lagnas.ascRashi as Rashi

  const karakas = calcCharaKarakas(
    grahas.map(g => ({ id: g.id, lonSidereal: g.lonSidereal, degree: g.degree })),
    7,
  )

  const akPlanet = grahas.find(g => g.id === karakas.AK) ?? null

  // ── Brahma ─────────────────────────────────────────────────
  // 1) Special claim: 8th lord from AK occupying the 8th from AK (not Sa/Ra/Ke)
  // 2) Else: stronger of Lagna vs 7th → strongest of 6th/8th/12th lords (Sa/Ra/Ke out)
  let brahma: GrahaId | null = null
  let brahmaReason = ''

  if (akPlanet) {
    const eighthFromAK = houseFrom(akPlanet.rashi, 8)
    const eighthLordFromAK = resolveSignLord(eighthFromAK, grahas)
    const eighthLordPlanet = grahas.find(g => g.id === eighthLordFromAK)
    if (
      eighthLordPlanet
      && eighthLordPlanet.rashi === eighthFromAK
      && !EXCLUDED_FROM_BRAHMA.includes(eighthLordFromAK)
    ) {
      brahma = eighthLordFromAK
      brahmaReason =
        `8th lord from AK (${GRAHA_NAMES[eighthLordFromAK]}) occupies the 8th from AK (${RASHI_NAMES[eighthFromAK]})`
    }
  }

  if (!brahma) {
    const seventh = houseFrom(lagnaRashi, 7)
    const seed = strongerSign(lagnaRashi, seventh, grahas)
    const seedLabel = seed === lagnaRashi ? 'Lagna' : '7th house'
    const candidates = [
      resolveSignLord(houseFrom(seed, 6), grahas),
      resolveSignLord(houseFrom(seed, 8), grahas),
      resolveSignLord(houseFrom(seed, 12), grahas),
    ].filter(id => !EXCLUDED_FROM_BRAHMA.includes(id))

    brahma = strongestAmong(candidates, grahas)
    brahmaReason = brahma
      ? `Strongest of 6th/8th/12th lords from stronger of Lagna vs 7th (${seedLabel} / ${RASHI_NAMES[seed]}) → ${GRAHA_NAMES[brahma]}`
      : 'No eligible Brahma candidate (Saturn/Rahu/Ketu excluded)'
  }

  // ── Maheshwara ─────────────────────────────────────────────
  // Base: 8th lord from AK
  // If that lord is exalted/own: stronger of 8th & 12th lords from its placement
  // If Rahu/Ketu with AK or in 8th from AK: 6th lord from Sun
  let maheshwara: GrahaId | null = null
  let maheshwaraReason = ''

  if (akPlanet) {
    const eighthFromAK = houseFrom(akPlanet.rashi, 8)
    const nodesOnAk = grahas.some(
      g => (g.id === 'Ra' || g.id === 'Ke') && g.rashi === akPlanet.rashi,
    )
    const nodesInEighth = grahas.some(
      g => (g.id === 'Ra' || g.id === 'Ke') && g.rashi === eighthFromAK,
    )

    if (nodesOnAk || nodesInEighth) {
      const sun = grahas.find(g => g.id === 'Su')
      if (sun) {
        const sixthFromSun = houseFrom(sun.rashi, 6)
        maheshwara = resolveSignLord(sixthFromSun, grahas)
        maheshwaraReason =
          `Rahu/Ketu with AK or in 8th from AK → 6th lord from Sun (${GRAHA_NAMES[maheshwara]} from ${RASHI_NAMES[sun.rashi]})`
      }
    }

    if (!maheshwara) {
      const eighthLordId = resolveSignLord(eighthFromAK, grahas)
      const eighthLord = grahas.find(g => g.id === eighthLordId)

      if (eighthLord && isOwnOrExalted(eighthLord)) {
        const fromPlacement8 = resolveSignLord(houseFrom(eighthLord.rashi, 8), grahas)
        const fromPlacement12 = resolveSignLord(houseFrom(eighthLord.rashi, 12), grahas)
        maheshwara = strongerPlanet(fromPlacement8, fromPlacement12, grahas)
        maheshwaraReason =
          `8th lord from AK (${GRAHA_NAMES[eighthLordId]}) is ${eighthLord.dignity} in ${RASHI_NAMES[eighthLord.rashi]} → stronger of 8th/12th lords from its placement → ${GRAHA_NAMES[maheshwara]}`
      } else {
        maheshwara = eighthLordId
        maheshwaraReason =
          `8th lord from AK (${GRAHA_NAMES[eighthLordId]}, 8th = ${RASHI_NAMES[eighthFromAK]})`
      }
    }
  } else {
    maheshwaraReason = 'Atmakaraka not found — Maheshwara unavailable'
  }

  // ── Rudra ──────────────────────────────────────────────────
  // Stronger of 2nd and 8th lords from Lagna.
  // Aprani exception: if the weaker is hit by 2+ malefic links, it can become Rudra.
  const secondLord = resolveSignLord(houseFrom(lagnaRashi, 2), grahas)
  const eighthLord = resolveSignLord(houseFrom(lagnaRashi, 8), grahas)

  let rudra: GrahaId | null = null
  let rudraReason = ''

  if (secondLord === eighthLord) {
    rudra = secondLord
    rudraReason = `2nd and 8th lords from Lagna are the same (${GRAHA_NAMES[secondLord]})`
  } else {
    const primary = strongerPlanet(secondLord, eighthLord, grahas)
    const weaker: GrahaId = primary === secondLord ? eighthLord : secondLord
    const weakerGraha = grahas.find(g => g.id === weaker)

    if (weakerGraha && maleficLinkCount(weakerGraha, grahas) >= 2) {
      rudra = weaker
      rudraReason =
        `Aprani Rudra: weaker lord ${GRAHA_NAMES[weaker]} is heavily afflicted (≥2 malefic links); overrides stronger ${GRAHA_NAMES[primary]}`
    } else {
      rudra = primary
      rudraReason =
        `Stronger of 2nd lord (${GRAHA_NAMES[secondLord]}) and 8th lord (${GRAHA_NAMES[eighthLord]}) from Lagna → ${GRAHA_NAMES[primary]}`
    }
  }

  return {
    brahma: { id: brahma, reason: brahmaReason },
    maheshwara: { id: maheshwara, reason: maheshwaraReason },
    rudra: { id: rudra, reason: rudraReason },
  }
}
