// ─────────────────────────────────────────────────────────────
//  src/lib/engine/dasha/chara.ts
//  Chara Dasha — Jaimini's sign-based dasha system
//  Reference: K.N. Rao's "Jaimini's Chara Dasha"
// ─────────────────────────────────────────────────────────────

import type { GrahaData, LagnaData, DashaNode } from '@/types/astrology'

const SIGN_LORD: Record<number, string> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

const EXALT_SIGN: Record<string, number> = {
  Su: 1, Mo: 2, Ma: 10, Me: 6, Ju: 4, Ve: 12, Sa: 7, Ra: 3, Ke: 9,
}

const DEBIL_SIGN: Record<string, number> = {
  Su: 7, Mo: 8, Ma: 4, Me: 12, Ju: 10, Ve: 6, Sa: 1, Ra: 9, Ke: 3,
}

function getRashi(g: GrahaData): number {
  return Math.floor(((g.totalDegree % 360) + 360) % 360 / 30) + 1
}

/**
 * K.N. Rao Method: Determine sign sequence based on Lagna classification
 * Savya (Direct): Aries (1), Leo (5), Virgo (6), Libra (7), Aquarius (11), Pisces (12)
 * Apasavya (Indirect): Taurus (2), Gemini (3), Cancer (4), Scorpio (8), Sagittarius (9), Capricorn (10)
 */
function getMahaSequence(lagna: number): number[] {
  const isSavya = [1, 5, 6, 7, 11, 12].includes(lagna)
  const seq: number[] = []
  if (isSavya) {
    for (let i = 0; i < 12; i++) seq.push(((lagna + i - 1) % 12) + 1)
  } else {
    for (let i = 0; i < 12; i++) seq.push(((lagna - i - 1 + 12) % 12) + 1)
  }
  return seq
}

/**
 * Counting Direction for Duration (K.N. Rao Savya/Apasavya Signs)
 * Forward (Savya): 1, 2, 3, 7, 8, 9 (Ar, Ta, Ge, Li, Sc, Sg)
 * Backward (Apasavya): 4, 5, 6, 10, 11, 12 (Ca, Le, Vi, Cp, Aq, Pi)
 */
function isForward(sign: number): boolean {
  return [1, 2, 3, 7, 8, 9].includes(sign)
}

function calculateDistance(from: number, to: number, forward: boolean): number {
  if (forward) {
    return ((to - from + 12) % 12) + 1
  } else {
    return ((from - to + 12) % 12) + 1
  }
}

/**
 * Chara Dasha Duration Calculation
 * Rule: Count to lord, subtract 1. If 0, then 12.
 */
function getDuration(sign: number, grahas: GrahaData[]): number {
  const forward = isForward(sign)
  
  // Dual Lord Logic (Sc/Aq)
  let lordId = SIGN_LORD[sign]
  if (sign === 8 || sign === 11) {
    const mainLordId = SIGN_LORD[sign]
    const extraLordId = sign === 8 ? 'Ke' : 'Ra'
    const mainLord = grahas.find(g => g.id === mainLordId)
    const extraLord = grahas.find(g => g.id === extraLordId)
    
    if (mainLord && extraLord) {
      const rM = getRashi(mainLord)
      const rE = getRashi(extraLord)
      
      // If one in sign and other not, use other
      if (rM === sign && rE !== sign) lordId = extraLordId
      else if (rE === sign && rM !== sign) lordId = mainLordId
      // If both in sign, 12 years (handled later)
      else if (rM === sign && rE === sign) lordId = mainLordId 
      else {
        // Strength comparison (Count planets in lord's sign)
        const nMain = grahas.filter(g => getRashi(g) === rM && g.id !== mainLordId).length
        const nExtra = grahas.filter(g => getRashi(g) === rE && g.id !== extraLordId).length
        if (nMain > nExtra) lordId = mainLordId
        else if (nExtra > nMain) lordId = extraLordId
        else {
          const degM = (mainLord.totalDegree % 30)
          const degE = (extraLord.totalDegree % 30)
          lordId = degM >= degE ? mainLordId : extraLordId
        }
      }
    }
  }

  const lord = grahas.find(g => g.id === lordId)
  if (!lord) return 7

  const lordRashi = getRashi(lord)
  
  // Own sign check
  if (lordRashi === sign) {
    // K.N. Rao rule: If dual lords, and one in sign, we check the other. 
    // If both in sign, or single lord in sign, it's 12.
    return 12
  }

  const dist = calculateDistance(sign, lordRashi, forward)
  let years = dist - 1
  if (years === 0) years = 12 // Lord in 12th from sign in direction? dist would be 12.
  
  return years
}

/**
 * Antardasha Sequence: Same direction as Maha but start sign is moved to the end.
 */
function buildAntarSequence(mahaSign: number): number[] {
  const isSavya = [1, 5, 6, 7, 11, 12].includes(mahaSign)
  const seq: number[] = []
  if (isSavya) {
    // 1 -> 2,3,4...12,1
    for (let i = 1; i < 12; i++) seq.push(((mahaSign + i - 1) % 12) + 1)
    seq.push(mahaSign)
  } else {
    // 2 -> 1,12,11...3,2
    for (let i = 1; i < 12; i++) seq.push(((mahaSign - i - 1 + 12) % 12) + 1)
    seq.push(mahaSign)
  }
  return seq
}

const RASHI_SHORT: Record<number, string> = {
  1:'Ar', 2:'Ta', 3:'Ge', 4:'Cn', 5:'Le', 6:'Vi',
  7:'Li', 8:'Sc', 9:'Sg', 10:'Cp', 11:'Aq', 12:'Pi',
}

const RASHI_NAMES: Record<number, string> = {
  1:'Aries', 2:'Taurus', 3:'Gemini', 4:'Cancer', 5:'Leo', 6:'Virgo',
  7:'Libra', 8:'Scorpio', 9:'Sagittarius', 10:'Capricorn', 11:'Aquarius', 12:'Pisces',
}

function buildSubDashas(
  mahaSign: number,
  parentStart: Date,
  parentMs: number,
  level: number,
  maxDepth: number,
  grahas: GrahaData[],
  now: number,
): DashaNode[] {
  const sequence = buildAntarSequence(mahaSign)
  const durationMsPerSign = parentMs / 12
  const nodes: DashaNode[] = []
  let cursor = parentStart.getTime()

  for (const sign of sequence) {
    const s = new Date(cursor)
    const e = new Date(cursor + durationMsPerSign)
    const isCurrent = now >= s.getTime() && now < e.getTime()

    nodes.push({
      lord: RASHI_SHORT[sign] || 'Ar',
      label: `${RASHI_NAMES[sign]}`,
      start: s,
      end: e,
      durationMs: durationMsPerSign,
      level,
      isCurrent,
      children: (level < maxDepth && isCurrent) 
        ? buildSubDashas(sign, s, durationMsPerSign, level + 1, maxDepth, grahas, now)
        : []
    })
    cursor += durationMsPerSign
  }
  return nodes
}

export function calcCharaDasha(
  grahas: GrahaData[],
  lagnas: LagnaData,
  birthDate: Date,
  depth: number = 2,
): DashaNode[] {
  const ascRashi = lagnas.ascRashi || 1
  const sequence = getMahaSequence(ascRashi)
  const now = Date.now()
  const nodes: DashaNode[] = []
  let cursor = new Date(birthDate)

  for (const sign of sequence) {
    const years = getDuration(sign, grahas)
    const ms = years * 365.2425 * 24 * 60 * 60 * 1000
    const start = new Date(cursor)
    const end = new Date(cursor.getTime() + ms)
    const isCurrent = now >= start.getTime() && now < end.getTime()

    nodes.push({
      lord: RASHI_SHORT[sign] || 'Ar',
      label: `${RASHI_NAMES[sign]} (${years}y)`,
      start,
      end,
      durationMs: ms,
      level: 1,
      isCurrent,
      children: depth > 1 ? buildSubDashas(sign, start, ms, 2, depth, grahas, now) : []
    })
    cursor = end
  }

  return nodes
}
