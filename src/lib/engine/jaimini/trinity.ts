// ─────────────────────────────────────────────────────────────
//  src/lib/engine/jaimini/trinity.ts
//  Jaimini Brahma · Maheshwara · Rudra
//  Strength comparisons use Jaimini Bala totals (graha and rashi).
//  Only the seven planets qualify; Rahu and Ketu are never candidates.
// ─────────────────────────────────────────────────────────────

import type { GrahaId, Rashi, ChartOutput, GrahaData } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'
import { calcCharaKarakas } from '../karakas'
import { EXALTATION_SIGN } from '../dignity'
import { getRashiDrishti } from './aspects'
import { calculateJaiminiBala, type JaiminiBalaResult } from './bala'

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
    /** Weaker of the 2nd/8th lords when it receives a malefic's rashi drishti. */
    aprani: GrahaId | null
  }
}

const CLASSICAL: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']
const MALEFICS: GrahaId[] = ['Ma', 'Sa', 'Ra', 'Ke']

const SIGN_LORD: Record<Rashi, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

function houseFrom(seed: Rashi, house: number): Rashi {
  return ((((seed - 1) + (house - 1)) % 12) + 1) as Rashi
}

/** Scorpio / Aquarius: compare main vs co-lord (Ke / Ra) by placement support. */
export function resolveSignLord(
  sign: Rashi,
  grahas: Array<{ id: GrahaId; rashi: Rashi; degree: number }>,
): GrahaId {
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

function strongerSign(a: Rashi, b: Rashi, bala: JaiminiBalaResult): Rashi {
  return bala.rashis[a].total >= bala.rashis[b].total ? a : b
}

function strongerPlanet(a: GrahaId, b: GrahaId, grahas: GrahaData[], bala: JaiminiBalaResult): GrahaId {
  const pa = grahas.find(g => g.id === a)
  const pb = grahas.find(g => g.id === b)
  if (!pa) return b
  if (!pb) return a
  const sa = bala.planets[a].total
  const sb = bala.planets[b].total
  if (sa !== sb) return sa > sb ? a : b
  // Tie-break: higher degree in sign (Jaimini convention)
  return pa.degree >= pb.degree ? a : b
}

function strongestAmong(ids: GrahaId[], grahas: GrahaData[], bala: JaiminiBalaResult): GrahaId | null {
  let best: GrahaId | null = null
  for (const id of new Set(ids)) {
    if (!grahas.some(g => g.id === id)) continue
    best = best ? strongerPlanet(best, id, grahas, bala) : id
  }
  return best
}

function hasMaleficDrishti(target: GrahaData, grahas: GrahaData[]): boolean {
  return grahas.some(g =>
    MALEFICS.includes(g.id) && g.id !== target.id && getRashiDrishti(g.rashi).includes(target.rashi),
  )
}

/**
 * Brahma: 8th lord from AK when it occupies the 8th from AK (never Saturn);
 *   else the strongest of the 6th/8th/12th lords from the stronger of Lagna
 *   and 7th, skipping Saturn.
 * Maheshwara: 8th lord from AK, unless an exalted planet occupies the 12th
 *   from AK, which then takes the role.
 * Rudra: stronger of the 2nd and 8th lords from Lagna.
 */
export function calculateJaiminiTrinity(chart: Partial<ChartOutput>): JaiminiTrinity {
  const grahas = (chart.grahas || []).filter(g => CLASSICAL.includes(g.id))
  const lagnas = chart.lagnas || { ascRashi: 1 as Rashi }
  const lagnaRashi = lagnas.ascRashi as Rashi
  const bala = calculateJaiminiBala({ grahas, lagnas: chart.lagnas })

  const karakas = calcCharaKarakas(
    grahas.map(g => ({ id: g.id, lonSidereal: g.lonSidereal, degree: g.degree })),
    7,
  )

  const akPlanet = grahas.find(g => g.id === karakas.AK) ?? null

  // ── Brahma ─────────────────────────────────────────────────
  let brahma: GrahaId | null = null
  let brahmaReason = ''

  if (akPlanet) {
    const eighthFromAK = houseFrom(akPlanet.rashi, 8)
    const eighthLordFromAK = SIGN_LORD[eighthFromAK]
    const eighthLordPlanet = grahas.find(g => g.id === eighthLordFromAK)
    if (eighthLordPlanet && eighthLordPlanet.rashi === eighthFromAK && eighthLordFromAK !== 'Sa') {
      brahma = eighthLordFromAK
      brahmaReason =
        `8th lord from AK (${GRAHA_NAMES[eighthLordFromAK]}) occupies the 8th from AK (${RASHI_NAMES[eighthFromAK]})`
    }
  }

  if (!brahma) {
    const seventh = houseFrom(lagnaRashi, 7)
    const seed = strongerSign(lagnaRashi, seventh, bala)
    const seedLabel = seed === lagnaRashi ? 'Lagna' : '7th house'
    const candidates = [6, 8, 12]
      .map(h => SIGN_LORD[houseFrom(seed, h)])
      .filter(id => id !== 'Sa')

    brahma = strongestAmong(candidates, grahas, bala)
    brahmaReason = brahma
      ? `Strongest of 6th/8th/12th lords from stronger of Lagna vs 7th (${seedLabel} / ${RASHI_NAMES[seed]}), Saturn skipped → ${GRAHA_NAMES[brahma]}`
      : 'No eligible Brahma candidate (Saturn skipped)'
  }

  // ── Maheshwara ─────────────────────────────────────────────
  let maheshwara: GrahaId | null = null
  let maheshwaraReason = ''

  if (akPlanet) {
    const eighthFromAK = houseFrom(akPlanet.rashi, 8)
    const twelfthFromAK = houseFrom(akPlanet.rashi, 12)
    const exaltedInTwelfth = grahas
      .filter(g => g.id !== 'Ra' && g.id !== 'Ke' && g.rashi === twelfthFromAK && EXALTATION_SIGN[g.id] === g.rashi)
      .map(g => g.id)

    maheshwara = strongestAmong(exaltedInTwelfth, grahas, bala)
    if (maheshwara) {
      maheshwaraReason =
        `Exalted ${GRAHA_NAMES[maheshwara]} occupies the 12th from AK (${RASHI_NAMES[twelfthFromAK]})`
    } else {
      maheshwara = SIGN_LORD[eighthFromAK]
      maheshwaraReason =
        `8th lord from AK (${GRAHA_NAMES[maheshwara]}, 8th = ${RASHI_NAMES[eighthFromAK]})`
    }
  } else {
    maheshwaraReason = 'Atmakaraka not found — Maheshwara unavailable'
  }

  // ── Rudra ──────────────────────────────────────────────────
  const secondLord = SIGN_LORD[houseFrom(lagnaRashi, 2)]
  const eighthLord = SIGN_LORD[houseFrom(lagnaRashi, 8)]

  let rudra: GrahaId | null = null
  let rudraReason = ''
  let aprani: GrahaId | null = null

  if (secondLord === eighthLord) {
    rudra = secondLord
    rudraReason = `2nd and 8th lords from Lagna are the same (${GRAHA_NAMES[secondLord]})`
  } else {
    rudra = strongerPlanet(secondLord, eighthLord, grahas, bala)
    rudraReason =
      `Stronger of 2nd lord (${GRAHA_NAMES[secondLord]}) and 8th lord (${GRAHA_NAMES[eighthLord]}) from Lagna → ${GRAHA_NAMES[rudra]}`

    const weaker: GrahaId = rudra === secondLord ? eighthLord : secondLord
    const weakerGraha = grahas.find(g => g.id === weaker)
    if (weakerGraha && hasMaleficDrishti(weakerGraha, grahas)) {
      aprani = weaker
      rudraReason += `. Aprani Rudra: weaker lord ${GRAHA_NAMES[weaker]} receives a malefic's drishti`
    }
  }

  return {
    brahma: { id: brahma, reason: brahmaReason },
    maheshwara: { id: maheshwara, reason: maheshwaraReason },
    rudra: { id: rudra, reason: rudraReason, aprani },
  }
}
