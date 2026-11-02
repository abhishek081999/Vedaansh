import type { DashaNode, GrahaData, LagnaData, Rashi } from '@/types/astrology'
import { calculateJaiminiBala } from '../jaimini/bala'
import type { JaiminiMethod } from '../jaimini/method'
import { calculateJaiminiTrinity } from '../jaimini/trinity'

const RASHI_SHORT: Record<number, string> = {
  1: 'Ar', 2: 'Ta', 3: 'Ge', 4: 'Cn', 5: 'Le', 6: 'Vi',
  7: 'Li', 8: 'Sc', 9: 'Sg', 10: 'Cp', 11: 'Aq', 12: 'Pi',
}

const RASHI_NAME: Record<number, string> = {
  1: 'Aries', 2: 'Taurus', 3: 'Gemini', 4: 'Cancer', 5: 'Leo', 6: 'Virgo',
  7: 'Libra', 8: 'Scorpio', 9: 'Sagittarius', 10: 'Capricorn', 11: 'Aquarius', 12: 'Pisces',
}

const YEAR_MS = 365.2425 * 24 * 60 * 60 * 1000

const SIGN_LORD: Record<number, string> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

function buildCycle(start: number, offsetStep: number): number[] {
  const seen = new Set<number>()
  const sequence: number[] = []
  let sign = start
  for (let i = 0; i < 12; i++) {
    if (seen.has(sign)) break
    seen.add(sign)
    sequence.push(sign)
    sign = ((sign - 1 + offsetStep) % 12) + 1
  }
  return sequence
}

function buildMandookSequence(start: number, forward: boolean): number[] {
  const kendraStep = forward ? 3 : 9
  const panapharaStart = ((start + (forward ? 1 : 11) - 1) % 12) + 1
  const apoklimaStart = ((start + (forward ? 2 : 10) - 1) % 12) + 1
  return [
    ...buildCycle(start, kendraStep),
    ...buildCycle(panapharaStart, kendraStep),
    ...buildCycle(apoklimaStart, kendraStep),
  ]
}

function buildLinearSequence(start: number, forward: boolean): number[] {
  const seq: number[] = []
  for (let i = 0; i < 12; i++) {
    seq.push(forward ? ((start + i - 1) % 12) + 1 : ((start - i - 1 + 12) % 12) + 1)
  }
  return seq
}

function sthirYears(sign: number): number {
  if ([1, 4, 7, 10].includes(sign)) return 7
  if ([2, 5, 8, 11].includes(sign)) return 8
  return 9
}

function resolveSignLord(sign: number, grahas: GrahaData[]): string {
  const mainLordId = SIGN_LORD[sign]
  if (sign !== 8 && sign !== 11) return mainLordId

  const altLordId = sign === 8 ? 'Ke' : 'Ra'
  const mainLord = grahas.find((g) => g.id === mainLordId)
  const altLord = grahas.find((g) => g.id === altLordId)
  if (!mainLord) return altLordId
  if (!altLord) return mainLordId

  const mainInOwn = mainLord.rashi === sign
  const altInOwn = altLord.rashi === sign
  if (mainInOwn && !altInOwn) return altLordId
  if (altInOwn && !mainInOwn) return mainLordId

  const mainSupport = grahas.filter((g) => g.rashi === mainLord.rashi && g.id !== mainLordId).length
  const altSupport = grahas.filter((g) => g.rashi === altLord.rashi && g.id !== altLordId).length
  if (mainSupport !== altSupport) return mainSupport > altSupport ? mainLordId : altLordId
  return (mainLord.degree >= altLord.degree) ? mainLordId : altLordId
}

function countDistance(from: number, to: number, forward: boolean): number {
  if (forward) return ((to - from + 12) % 12) + 1
  return ((from - to + 12) % 12) + 1
}

function mandookYears(sign: number, grahas: GrahaData[], method: JaiminiMethod): number {
  // Practical method: Scorpio is Mars only and Aquarius is Saturn only.
  const lordId = method === 'practical' ? SIGN_LORD[sign] : resolveSignLord(sign, grahas)
  const lord = grahas.find((g) => g.id === lordId)
  if (!lord) return sthirYears(sign)

  // Mandooka uses direct counting for odd signs and reverse for even signs; no "-1".
  const forward = sign % 2 === 1
  const dist = countDistance(sign, lord.rashi, forward)

  if (lord.rashi === sign || lord.rashi === ((sign + 10) % 12) + 1) return 12 // own sign or 12th
  if (lord.rashi === ((sign + 5) % 12) + 1) return 10 // in 7th
  return dist
}

/** Sthira Dasha starts from the sign occupied by Brahma. */
function getBrahmaSign(grahas: GrahaData[], lagnas: LagnaData, asc: number): number {
  const { brahma } = calculateJaiminiTrinity({ grahas, lagnas })
  return grahas.find((g) => g.id === brahma.id)?.rashi ?? asc
}

function buildSubDashas(
  parentSign: number,
  parentStart: Date,
  parentMs: number,
  level: number,
  maxDepth: number,
  forward: boolean,
  now: number,
): DashaNode[] {
  const seq = buildLinearSequence(parentSign, forward)
  const childMs = parentMs / 12
  const nodes: DashaNode[] = []
  let cursor = parentStart.getTime()
  for (const sign of seq) {
    const s = new Date(cursor)
    const e = new Date(cursor + childMs)
    const isCurrent = now >= s.getTime() && now < e.getTime()
    nodes.push({
      lord: RASHI_SHORT[sign],
      label: RASHI_NAME[sign],
      start: s,
      end: e,
      durationMs: childMs,
      level,
      isCurrent,
      // Expand every branch to maxDepth (callers cap at 3). Current-only prune
      // left previous/future Mandook/Sthir periods without Pratyantar children.
      children: level < maxDepth
        ? buildSubDashas(sign, s, childMs, level + 1, maxDepth, forward, now)
        : [],
    })
    cursor += childMs
  }
  return nodes
}

function buildRashiDasha(
  sequence: number[],
  getYears: (sign: number) => number,
  birthDate: Date,
  depth: number,
  subForward: boolean,
): DashaNode[] {
  const now = Date.now()
  const nodes: DashaNode[] = []
  let cursor = birthDate.getTime()
  for (const sign of sequence) {
    const years = getYears(sign)
    const durationMs = years * YEAR_MS
    const start = new Date(cursor)
    const end = new Date(cursor + durationMs)
    const isCurrent = now >= start.getTime() && now < end.getTime()
    nodes.push({
      lord: RASHI_SHORT[sign],
      label: `${RASHI_NAME[sign]} (${years}y)`,
      start,
      end,
      durationMs,
      level: 1,
      isCurrent,
      children: depth > 1
        ? buildSubDashas(sign, start, durationMs, 2, depth, subForward, now)
        : [],
    })
    cursor = end.getTime()
  }
  return nodes
}

export function calcMandookDasha(
  grahas: GrahaData[],
  lagnas: LagnaData,
  birthDate: Date,
  depth: number = 3,
  method: JaiminiMethod = 'classical',
): DashaNode[] {
  // K.N. Rao Mandooka: odd Lagna -> start from Lagna (direct),
  // even Lagna -> start from 7th (reverse), with frog-jump sequence.
  const asc = lagnas.ascRashi || 1
  const start = asc % 2 === 1 ? asc : ((asc + 5) % 12) + 1
  const forward = asc % 2 === 1
  const sequence = buildMandookSequence(start, forward)
  return buildRashiDasha(sequence, (sign) => mandookYears(sign, grahas, method), birthDate, depth, forward)
}

export function calcSthirDasha(
  grahas: GrahaData[],
  lagnas: LagnaData,
  birthDate: Date,
  depth: number = 3,
  method: JaiminiMethod = 'classical',
): DashaNode[] {
  const asc = lagnas.ascRashi || 1
  if (method === 'practical') {
    // Practical method: stronger of Lagna and 7th; odd sign runs direct, even runs reverse.
    const bala = calculateJaiminiBala({ grahas, lagnas })
    const seventh = ((asc + 5) % 12) + 1
    const seed = bala.rashis[asc as Rashi].total >= bala.rashis[seventh as Rashi].total ? asc : seventh
    const direct = seed % 2 === 1
    return buildRashiDasha(buildLinearSequence(seed, direct), sthirYears, birthDate, depth, direct)
  }
  const start = getBrahmaSign(grahas, lagnas, asc)
  const forward = true
  const sequence = buildLinearSequence(start, true)
  return buildRashiDasha(sequence, sthirYears, birthDate, depth, forward)
}

/**
 * Navamsha Dasha — S.C. Mishra reading of Jaimini Sutra 2.3.1–2.
 * Always starts from Lagna. Odd lagna runs forward, even lagna runs
 * backward. Every sign lasts 9 years.
 */
export function calcNavamshaDasha(
  _grahas: GrahaData[],
  lagnas: LagnaData,
  birthDate: Date,
  depth: number = 3,
): DashaNode[] {
  const asc = lagnas.ascRashi || 1
  const forward = asc % 2 === 1
  return buildRashiDasha(buildLinearSequence(asc, forward), () => 9, birthDate, depth, forward)
}

/** Inclusive zodiacal count from `from` to `to` (1–12). */
function countZodiacal(from: number, to: number): number {
  return ((to - from + 12) % 12) + 1
}

/**
 * Years of a Brahma-dasha sign: count from the sign to the rashi
 * occupied by the lord of the 6th from it (Upadesha 2.3.26).
 */
function brahmaYears(sign: number, grahas: GrahaData[]): number {
  const sixth = ((sign + 4) % 12) + 1
  const lordId = resolveSignLord(sixth, grahas)
  const lord = grahas.find(g => g.id === lordId)
  if (!lord) return 7
  return countZodiacal(sign, lord.rashi)
}

/**
 * Brahma Dasha — Upadesha Sutras 2.3.26–27.
 * Odd sign of Brahma: start there and run forward.
 * Even sign of Brahma: start from the 7th and run backward.
 */
export function calcBrahmaDasha(
  grahas: GrahaData[],
  lagnas: LagnaData,
  birthDate: Date,
  depth: number = 3,
): DashaNode[] {
  const trinity = calculateJaiminiTrinity({ grahas, lagnas })
  if (!trinity.brahma.id) return []
  const brahma = grahas.find(g => g.id === trinity.brahma.id)
  if (!brahma) return []
  const odd = brahma.rashi % 2 === 1
  const start = odd ? brahma.rashi : ((brahma.rashi + 5) % 12) + 1
  return buildRashiDasha(
    buildLinearSequence(start, odd),
    (sign) => brahmaYears(sign, grahas),
    birthDate,
    depth,
    odd,
  )
}

