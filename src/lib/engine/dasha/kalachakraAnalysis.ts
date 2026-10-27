// ─────────────────────────────────────────────────────────────
//  src/lib/engine/dasha/kalachakraAnalysis.ts
//  Kalachakra reading for the running row.
//  Deha is the first sign of the Moon's pada, Jeeva the last (BPHS).
//  Gati is the jump from the previous sign: 6th/8th Markati,
//  4th/7th Manduki, 5th/9th/12th Simhavalokana.
// ─────────────────────────────────────────────────────────────

import type { Dignity, DashaNode, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES, RASHI_SHORT } from '@/types/astrology'
import { getDashaPathAt } from '@/lib/engine/dasha/current'
import { describeKalachakra, type KalachakraSeed } from '@/lib/engine/dasha/kalachakra'

const SIGN_LORD: Record<Rashi, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

const SHORT_TO_RASHI: Record<string, Rashi> = {
  Ar: 1, Ta: 2, Ge: 3, Cn: 4, Le: 5, Vi: 6,
  Li: 7, Sc: 8, Sg: 9, Cp: 10, Aq: 11, Pi: 12,
}

const CLASSICAL = new Set<GrahaId>(['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke'])
const SUPPORT = new Set<GrahaId>(['Ju', 'Ve'])
const CAUTION = new Set<GrahaId>(['Ma', 'Sa', 'Ra', 'Ke'])

const HOUSE_THEME: Record<number, string> = {
  1: 'the body, vitality, and a fresh start',
  2: 'money, family, and speech',
  3: 'courage, siblings, and skill',
  4: 'home, the mother, and property',
  5: 'children, study, and recognition',
  6: 'workload, illness, and disputes',
  7: 'marriage, partners, and agreements',
  8: 'shared resources, sudden change, and the life reserve',
  9: 'teachers, fortune, and long travel',
  10: 'career, duty, and public standing',
  11: 'gains, friends, and income',
  12: 'expenses, foreign places, and retreat',
}

export type KalachakraTone = 'supportive' | 'mixed' | 'caution'
export type KalachakraGatiName = 'Direct' | 'Manduki' | 'Markati' | 'Simhavalokana'

export interface KalachakraGraha {
  id: GrahaId
  rashi: Rashi
  dignity?: Dignity
}

export interface KalachakraGati {
  name: KalachakraGatiName
  house: number
  note: string
}

export interface KalachakraArea {
  id: 'body' | 'work' | 'people' | 'shift'
  title: string
  text: string
}

export interface KalachakraPeriodView {
  key: string
  sign: Rashi
  signName: string
  short: string
  level: number
  startMs: number
  endMs: number
  durationMs: number
  houseFromLagna: number
  tone: KalachakraTone
  gati: KalachakraGati | null
  isDeha: boolean
  isJeeva: boolean
  occupants: string[]
  headline: string
  prediction: string
  areas: KalachakraArea[]
  isCurrent: boolean
}

export interface KalachakraSignFocus {
  sign: Rashi
  signName: string
  occupants: string[]
  text: string
}

export interface KalachakraAnalysis {
  seed: KalachakraSeed
  deha: KalachakraSignFocus
  jeeva: KalachakraSignFocus
  summary: string
  mahadashas: KalachakraPeriodView[]
  currentMahaKey: string | null
  currentAntarKey: string | null
}

export function kalachakraGati(from: Rashi, to: Rashi): KalachakraGati {
  const house = ((to - from + 12) % 12) + 1
  if (house === 6 || house === 8) {
    return {
      name: 'Markati',
      house,
      note: 'Markati gati. The sequence jumps like a monkey, so effort scatters and results arrive unevenly.',
    }
  }
  if (house === 4 || house === 7) {
    return {
      name: 'Manduki',
      house,
      note: 'Manduki gati. A frog jump. Place, status, or the daily base can change suddenly.',
    }
  }
  if (house === 5 || house === 9 || house === 12) {
    return {
      name: 'Simhavalokana',
      house,
      note: 'Simhavalokana. The period looks back, and an earlier matter returns to be finished.',
    }
  }
  if (house === 1) {
    return {
      name: 'Direct',
      house,
      note: 'This sign repeats in the row, so the same theme continues.',
    }
  }
  return {
    name: 'Direct',
    house,
    note: 'The sequence walks without a named jump. The change of theme is gradual.',
  }
}

function houseFrom(lagna: Rashi, sign: Rashi): number {
  return ((sign - lagna + 12) % 12) + 1
}

function ordinal(n: number): string {
  if (n === 1) return '1st'
  if (n === 2) return '2nd'
  if (n === 3) return '3rd'
  return `${n}th`
}

function asMs(value: Date | string | number): number {
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'number') return value
  return new Date(value).getTime()
}

function names(ids: GrahaId[]): string {
  return ids.map((id) => GRAHA_NAMES[id]).join(', ')
}

function toneFrom(score: number): KalachakraTone {
  if (score >= 2) return 'supportive'
  if (score <= -2) return 'caution'
  return 'mixed'
}

function dignityDelta(dignity?: Dignity): number {
  if (dignity === 'exalted' || dignity === 'moolatrikona' || dignity === 'own') return 1
  if (dignity === 'debilitated') return -1
  return 0
}

function grahaDelta(id: GrahaId): number {
  if (SUPPORT.has(id)) return 2
  if (CAUTION.has(id)) return -2
  return 0
}

function focusText(role: 'Deha' | 'Jeeva', signName: string, occupants: KalachakraGraha[]): string {
  const support = occupants.filter((g) => SUPPORT.has(g.id)).map((g) => g.id)
  const caution = occupants.filter((g) => CAUTION.has(g.id)).map((g) => g.id)
  const subject = role === 'Deha' ? 'the body of this Kalachakra row' : 'the life-sign of this row'
  const empty = role === 'Deha'
    ? 'No classical planet sits in the body sign, so physical results wait on its lord and on the dasha of that sign.'
    : 'No classical planet sits in the life sign, so vitality follows its lord and the dasha of that sign.'
  if (!occupants.length) return `${role} is ${signName}, ${subject}. ${empty}`
  const who = names(occupants.map((g) => g.id))
  if (caution.length && !support.length) {
    const cautionLine = caution.length === 1 ? `${who} there is` : `${who} there are`
    return role === 'Deha'
      ? `${role} is ${signName}, ${subject}. ${cautionLine} the classical bodily warning: strain, slow recovery, or a body that tires under load.`
      : `${role} is ${signName}, ${subject}. ${cautionLine} a thinner reserve. Anxiety and a heavier life-load belong to this row.`
  }
  if (support.length && !caution.length) {
    const supportLine = support.length === 1 ? `${who} there supports` : `${who} there support`
    return role === 'Deha'
      ? `${role} is ${signName}, ${subject}. ${supportLine} strength and recovery while this row runs.`
      : `${role} is ${signName}, ${subject}. ${supportLine} vitality and ${support.length === 1 ? 'keeps' : 'keep'} the will adaptable.`
  }
  if (caution.length && support.length) {
    return `${role} is ${signName}, ${subject}. ${who} share it, so comfort and strain take turns.`
  }
  const sits = occupants.length === 1 ? 'sits' : 'sit'
  return `${role} is ${signName}, ${subject}. ${who} ${sits} there, and the result follows that planet's condition.`
}

function buildPeriod(
  node: DashaNode,
  previous: Rashi | null,
  lagna: Rashi,
  grahas: KalachakraGraha[],
  seed: KalachakraSeed,
  currentKey: string | null,
): KalachakraPeriodView | null {
  const sign = SHORT_TO_RASHI[node.lord]
  if (!sign) return null
  const startMs = asMs(node.start)
  const endMs = asMs(node.end)
  const house = houseFrom(lagna, sign)
  const occupants = grahas.filter((g) => g.rashi === sign)
  const lord = SIGN_LORD[sign]
  const lordGraha = grahas.find((g) => g.id === lord)
  const lordInSign = occupants.some((g) => g.id === lord)
  const gati = previous ? kalachakraGati(previous, sign) : null
  const isDeha = sign === seed.deha
  const isJeeva = sign === seed.jeeva

  let score = 0
  for (const g of occupants) {
    score += grahaDelta(g.id)
    score += dignityDelta(g.dignity)
  }
  if (lordGraha && !lordInSign) score += dignityDelta(lordGraha.dignity)
  if (lordGraha) {
    const lordHouse = houseFrom(lagna, lordGraha.rashi)
    if ([1, 4, 5, 7, 9, 10].includes(lordHouse)) score += 1
    if ([6, 8, 12].includes(lordHouse)) score -= 1
  }
  if ([1, 5, 9, 10, 11].includes(house)) score += 1
  if ([6, 8, 12].includes(house)) score -= 1
  if (gati?.name === 'Manduki' || gati?.name === 'Markati') score -= 1
  if (isDeha && occupants.some((g) => CAUTION.has(g.id))) score -= 1
  if (isJeeva && occupants.some((g) => SUPPORT.has(g.id))) score += 1

  const tone = toneFrom(score)
  const occupantText = occupants.length
    ? `${names(occupants.map((g) => g.id))} ${occupants.length === 1 ? 'occupies' : 'occupy'} ${RASHI_NAMES[sign]}.`
    : `${RASHI_NAMES[sign]} holds no classical planet.`
  const lordText = lordGraha
    ? `${GRAHA_NAMES[lord]} rules it from ${RASHI_NAMES[lordGraha.rashi]}, the ${ordinal(houseFrom(lagna, lordGraha.rashi))} house.`
    : `${GRAHA_NAMES[lord]} rules ${RASHI_NAMES[sign]}.`
  const roleBit = [
    isDeha ? 'This sign is Deha, so the body is directly in the period.' : '',
    isJeeva ? 'This sign is Jeeva, so vitality and will are directly in the period.' : '',
  ].filter(Boolean).join(' ')
  const levelName = node.level === 1 ? 'mahadasha' : node.level === 2 ? 'antardasha' : 'period'
  const prediction = [
    `${RASHI_NAMES[sign]} ${levelName} is the ${ordinal(house)} from Lagna, so it times ${HOUSE_THEME[house]}.`,
    occupantText,
    lordText,
    gati?.note ?? '',
    roleBit,
  ].filter(Boolean).join(' ')

  const areas: KalachakraArea[] = [
    {
      id: 'body',
      title: 'Body',
      text: isDeha
        ? `Deha is running. ${occupantText}`
        : house === 1 || house === 6 || house === 8
          ? `From Lagna this is the ${ordinal(house)}, a body and load house. ${occupantText}`
          : `The body stays with Deha (${seed.dehaName}). This period itself times ${HOUSE_THEME[house]}.`,
    },
    {
      id: 'work',
      title: 'Work',
      text: [2, 6, 10, 11].includes(house)
        ? `Livelihood is in front: ${HOUSE_THEME[house]}. ${lordText}`
        : `Career pressure is indirect. The ${ordinal(house)} brings ${HOUSE_THEME[house]}.`,
    },
    {
      id: 'people',
      title: 'People',
      text: [4, 5, 7].includes(house)
        ? `Other people are in the period: ${HOUSE_THEME[house]}.`
        : `Home and partnership are not the main house. Watch them when the antardasha reaches the 4th or 7th.`,
    },
    {
      id: 'shift',
      title: 'Shift',
      text: gati?.note ?? 'This opens the row. There is no jump from an earlier Kalachakra sign.',
    },
  ]

  const headline = `${RASHI_NAMES[sign]} · ${ordinal(house)} house · ${tone}`
  const key = `${node.level}:${node.lord}:${startMs}`
  return {
    key,
    sign,
    signName: RASHI_NAMES[sign],
    short: RASHI_SHORT[sign],
    level: node.level,
    startMs,
    endMs,
    durationMs: Math.max(0, endMs - startMs),
    houseFromLagna: house,
    tone,
    gati,
    isDeha,
    isJeeva,
    occupants: occupants.map((g) => GRAHA_NAMES[g.id]),
    headline,
    prediction,
    areas,
    isCurrent: key === currentKey,
  }
}

function viewsFor(
  nodes: DashaNode[],
  lagna: Rashi,
  grahas: KalachakraGraha[],
  seed: KalachakraSeed,
  currentKey: string | null,
): KalachakraPeriodView[] {
  const views: KalachakraPeriodView[] = []
  let previous: Rashi | null = null
  for (const node of nodes) {
    const view = buildPeriod(node, previous, lagna, grahas, seed, currentKey)
    if (!view) continue
    views.push(view)
    previous = view.sign
  }
  return views
}

export function analyzeKalachakra(input: {
  moonLonSidereal: number
  nodes: DashaNode[]
  grahas: KalachakraGraha[]
  ascRashi: Rashi
  now?: number
}): KalachakraAnalysis {
  const seed = describeKalachakra(input.moonLonSidereal)
  const grahas = input.grahas.filter((g) => CLASSICAL.has(g.id))
  const path = getDashaPathAt(input.nodes, input.now)
  const currentMaha = path.find((n) => n.level === 1)
  const currentAntar = path.find((n) => n.level === 2)
  const currentMahaKey = currentMaha ? `${currentMaha.level}:${currentMaha.lord}:${asMs(currentMaha.start)}` : null
  const currentAntarKey = currentAntar ? `${currentAntar.level}:${currentAntar.lord}:${asMs(currentAntar.start)}` : null

  const dehaOcc = grahas.filter((g) => g.rashi === seed.deha)
  const jeevaOcc = grahas.filter((g) => g.rashi === seed.jeeva)
  const mahadashas = viewsFor(input.nodes, input.ascRashi, grahas, seed, currentMahaKey)
  const running = mahadashas.find((p) => p.isCurrent)
  const summary = running
    ? `${seed.nakshatraName} pada ${seed.pada} runs ${seed.gati} Kalachakra, paramayu ${seed.paramayu} years. ${running.signName} is the live mahadasha, the ${ordinal(running.houseFromLagna)} from Lagna.`
    : `${seed.nakshatraName} pada ${seed.pada} runs ${seed.gati} Kalachakra, paramayu ${seed.paramayu} years. The nine-sign row is outside the selected date.`

  return {
    seed,
    deha: {
      sign: seed.deha,
      signName: seed.dehaName,
      occupants: dehaOcc.map((g) => GRAHA_NAMES[g.id]),
      text: focusText('Deha', seed.dehaName, dehaOcc),
    },
    jeeva: {
      sign: seed.jeeva,
      signName: seed.jeevaName,
      occupants: jeevaOcc.map((g) => GRAHA_NAMES[g.id]),
      text: focusText('Jeeva', seed.jeevaName, jeevaOcc),
    },
    summary,
    mahadashas,
    currentMahaKey,
    currentAntarKey,
  }
}

export function kalachakraAntars(
  maha: DashaNode | undefined,
  lagna: Rashi,
  grahas: KalachakraGraha[],
  moonLonSidereal: number,
  currentAntarKey: string | null,
): KalachakraPeriodView[] {
  if (!maha?.children?.length) return []
  return viewsFor(
    maha.children,
    lagna,
    grahas.filter((g) => CLASSICAL.has(g.id)),
    describeKalachakra(moonLonSidereal),
    currentAntarKey,
  )
}
