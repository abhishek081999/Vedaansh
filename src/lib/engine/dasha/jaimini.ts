import type { DashaNode, GrahaData, LagnaData } from '@/types/astrology'

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

function signNatureWeight(sign: number): number {
  if ([3, 6, 9, 12].includes(sign)) return 3 // dual
  if ([2, 5, 8, 11].includes(sign)) return 2 // fixed
  return 1 // movable
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

function planetStrengthScore(g: GrahaData, grahas: GrahaData[]): number {
  const dignity = dignityWeight(g.dignity) * 100
  const ownSign = resolveSignLord(g.rashi, grahas) === g.id ? 20 : 0
  const degree = g.degree
  return dignity + ownSign + degree
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

function mandookYears(sign: number, grahas: GrahaData[]): number {
  const lordId = resolveSignLord(sign, grahas)
  const lord = grahas.find((g) => g.id === lordId)
  if (!lord) return sthirYears(sign)

  // Mandooka uses direct counting for odd signs and reverse for even signs; no "-1".
  const forward = sign % 2 === 1
  const dist = countDistance(sign, lord.rashi, forward)

  if (lord.rashi === sign || lord.rashi === ((sign + 10) % 12) + 1) return 12 // own sign or 12th
  if (lord.rashi === ((sign + 5) % 12) + 1) return 10 // in 7th
  return dist
}

function signStrength(sign: number, grahas: GrahaData[]): number {
  const occupants = grahas.filter((g) => g.rashi === sign && g.id !== 'Ra' && g.id !== 'Ke')
  const occupied = occupants.length > 0 ? 100 : 0
  const occupantWeight = occupants.length * 15
  const bestDegree = occupants.length ? Math.max(...occupants.map((g) => g.degree)) : 0
  const nature = signNatureWeight(sign) * 5
  const lordId = resolveSignLord(sign, grahas)
  const lord = grahas.find((g) => g.id === lordId)
  const lordWeight = lord ? (dignityWeight(lord.dignity) * 8 + lord.degree) : 0
  return occupied + occupantWeight + bestDegree + nature + lordWeight
}

function strongerOf(signA: number, signB: number, grahas: GrahaData[]): number {
  const a = signStrength(signA, grahas)
  const b = signStrength(signB, grahas)
  return a >= b ? signA : signB
}

function getBrahmaSign(grahas: GrahaData[], asc: number): number {
  // Jaimini workflow used for Sthira: stronger of Lagna/7th,
  // then strongest among lords of 6th/8th/12th from that seed sign.
  const seed = strongerOf(asc, ((asc + 5) % 12) + 1, grahas)
  const h6 = ((seed + 4) % 12) + 1
  const h8 = ((seed + 6) % 12) + 1
  const h12 = ((seed + 10) % 12) + 1

  const candidateIds = Array.from(new Set([h6, h8, h12].map((h) => resolveSignLord(h, grahas))))
  const candidates = candidateIds
    .filter((id) => id !== 'Ra' && id !== 'Ke')
    .map((id) => grahas.find((g) => g.id === id))
    .filter((g): g is GrahaData => Boolean(g))
  if (!candidates.length) return seed

  candidates.sort((a, b) => {
    const pDiff = planetStrengthScore(b, grahas) - planetStrengthScore(a, grahas)
    if (pDiff !== 0) return pDiff
    const sDiff = signStrength(b.rashi, grahas) - signStrength(a.rashi, grahas)
    if (sDiff !== 0) return sDiff
    return b.degree - a.degree
  })
  return candidates[0].rashi
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
      children: level < maxDepth && isCurrent
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
): DashaNode[] {
  // K.N. Rao Mandooka: odd Lagna -> start from Lagna (direct),
  // even Lagna -> start from 7th (reverse), with frog-jump sequence.
  const asc = lagnas.ascRashi || 1
  const start = asc % 2 === 1 ? asc : ((asc + 5) % 12) + 1
  const forward = asc % 2 === 1
  const sequence = buildMandookSequence(start, forward)
  return buildRashiDasha(sequence, (sign) => mandookYears(sign, grahas), birthDate, depth, forward)
}

export function calcSthirDasha(
  grahas: GrahaData[],
  lagnas: LagnaData,
  birthDate: Date,
  depth: number = 3,
): DashaNode[] {
  const asc = lagnas.ascRashi || 1
  const start = getBrahmaSign(grahas, asc)
  const forward = true
  const sequence = buildLinearSequence(start, true)
  return buildRashiDasha(sequence, sthirYears, birthDate, depth, forward)
}

