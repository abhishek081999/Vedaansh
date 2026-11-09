// ─────────────────────────────────────────────────────────────
//  src/lib/engine/jaimini/dashaBoard.ts
//  One view of every dasha system for a date, and matching of
//  real life events against those dashas.
// ─────────────────────────────────────────────────────────────

import type { DashaNode, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { RASHI_SHORT } from '@/types/astrology'
import { jG, jOrd, jR, jLang, jStar, say, type EngineLang } from '@/lib/engine/locale/jaiminiLang'
import { getDashaPathAt } from '../dasha/current'
import { getRashiDrishti } from './aspects'
import type { JaiminiMethod } from './method'
import { resolveSignLord } from './trinity'

export interface BoardSystem {
  id: string
  name: string
  kind: 'sign' | 'graha'
  nodes: DashaNode[]
}

export interface BoardPeriod {
  label: string
  /** Karaka and house notes for this period. */
  detail: string
  start: Date
  end: Date
}

export interface BoardRow {
  id: string
  name: string
  periods: BoardPeriod[]
  areas: BoardArea[]
}

export type BoardArea =
  | 'self' | 'wealth' | 'courage' | 'home' | 'children' | 'conflict'
  | 'marriage' | 'crisis' | 'fortune' | 'career' | 'gains' | 'loss'

export const BOARD_AREA_NAMES: Record<BoardArea, string> = {
  self: 'Self and body',
  wealth: 'Money and family',
  courage: 'Effort and siblings',
  home: 'Home and mother',
  children: 'Children and creation',
  conflict: 'Debt, rivals, and health',
  marriage: 'Marriage and partners',
  crisis: 'Sudden change',
  fortune: 'Fortune and long travel',
  career: 'Career',
  gains: 'Income and network',
  loss: 'Expense and foreign places',
}

const BOARD_AREA_NAMES_HI: Record<BoardArea, string> = {
  self: 'स्व और शरीर',
  wealth: 'धन और परिवार',
  courage: 'प्रयास और भाई-बहन',
  home: 'घर और माता',
  children: 'संतान और रचना',
  conflict: 'ऋण, प्रतिद्वंद्वी और स्वास्थ्य',
  marriage: 'विवाह और साथी',
  crisis: 'अचानक परिवर्तन',
  fortune: 'भाग्य और लंबी यात्रा',
  career: 'करियर',
  gains: 'आय और दायरा',
  loss: 'व्यय और विदेश',
}

const AREA_BY_HOUSE: BoardArea[] = [
  'self', 'self', 'wealth', 'courage', 'home', 'children', 'conflict',
  'marriage', 'crisis', 'fortune', 'career', 'gains', 'loss',
]

const AREA_BY_ROLE: Partial<Record<string, BoardArea>> = {
  AK: 'self',
  AmK: 'career',
  BK: 'courage',
  MK: 'home',
  PK: 'children',
  GK: 'conflict',
  DK: 'marriage',
}

const OWNED_SIGNS: Partial<Record<GrahaId, Rashi[]>> = {
  Su: [5], Mo: [4], Ma: [1, 8], Me: [3, 6], Ju: [9, 12], Ve: [2, 7], Sa: [10, 11],
}

export interface BoardAgreement {
  area: BoardArea
  name: string
  systems: string[]
  strong: boolean
}

export interface DashaBoard {
  asOf: Date
  rows: BoardRow[]
  agreements: BoardAgreement[]
}

interface BoardInput {
  grahas: GrahaData[]
  lagna: Rashi
  roleOf: Partial<Record<GrahaId, string | null>>
  method: JaiminiMethod
  lang?: EngineLang
}

function distance(from: Rashi, to: Rashi): number {
  return ((to - from + 12) % 12) + 1
}

const ROLE_HI: Record<string, string> = {
  AK: 'आत्मकारक', AmK: 'अमात्यकारक', BK: 'भ्रातृकारक', MK: 'मातृकारक',
  PK: 'पंचम कारक', GK: 'ज्ञातिकारक', DK: 'दारकारक',
}

/** Karaka code for display. Hindi spells out the karaka name. */
function roleText(role: string | null | undefined, lang: EngineLang): string {
  if (!role) return ''
  return lang === 'hi' ? (ROLE_HI[role] ?? role) : role
}

function houseText(n: number, lang: EngineLang): string {
  return lang === 'hi' ? `${jOrd(n, lang)} भाव` : `${jOrd(n, lang)} house`
}

function rashiOfShort(short: string): Rashi | null {
  const hit = (Object.entries(RASHI_SHORT) as Array<[string, string]>).find(([, v]) => v === short)
  return hit ? (Number(hit[0]) as Rashi) : null
}

function placedOf(grahas: GrahaData[]) {
  return grahas.map(g => ({ id: g.id, rashi: g.rashi, degree: g.degree }))
}

function signPeriod(node: DashaNode, sign: Rashi, input: BoardInput): { detail: string; areas: BoardArea[] } {
  const placed = placedOf(input.grahas)
  const house = distance(input.lagna, sign)
  const lord = resolveSignLord(sign, placed)
  const lordRole = input.roleOf[lord]
  const occupants = input.grahas.filter(g => g.rashi === sign && input.roleOf[g.id])
  const roles = [...occupants.map(g => input.roleOf[g.id] as string), ...(lordRole ? [lordRole] : [])]
  const areas: BoardArea[] = [AREA_BY_HOUSE[house]]
  if (input.method === 'practical') {
    for (const role of roles) {
      const area = AREA_BY_ROLE[role]
      if (area) areas.push(area)
    }
  }
  const lang = jLang(input.lang)
  const held = occupants.map(g => roleText(input.roleOf[g.id], lang)).join(', ')
  const karakaText = occupants.length
    ? say(lang, ` · holds ${held}`, ` · इसमें ${held}`)
    : ''
  const lordText = `${jG(lord, lang)}${lordRole ? ` (${roleText(lordRole, lang)})` : ''}`
  return {
    detail: say(lang,
      `${houseText(house, lang)} · lord ${lordText}${karakaText}`,
      `${houseText(house, lang)} · स्वामी ${lordText}${karakaText}`),
    areas,
  }
}

function grahaPeriod(id: GrahaId, input: BoardInput): { detail: string; areas: BoardArea[] } {
  const graha = input.grahas.find(g => g.id === id)
  const role = input.roleOf[id]
  const areas: BoardArea[] = []
  if (graha) areas.push(AREA_BY_HOUSE[distance(input.lagna, graha.rashi)])
  const owned = OWNED_SIGNS[id] ?? []
  for (const sign of owned) areas.push(AREA_BY_HOUSE[distance(input.lagna, sign)])
  if (input.method === 'practical' && role && AREA_BY_ROLE[role]) areas.push(AREA_BY_ROLE[role] as BoardArea)
  const lang = jLang(input.lang)
  const house = graha ? houseText(distance(input.lagna, graha.rashi), lang) : say(lang, 'not placed', 'स्थित नहीं')
  const ruled = owned.map(s => jOrd(distance(input.lagna, s), lang)).join(', ')
  const lordships = owned.length
    ? say(lang, ` · rules ${ruled}`, ` · ${ruled} भाव का स्वामी`)
    : ''
  return {
    detail: `${house}${role ? ` · ${roleText(role, lang)}` : ''}${lordships}`,
    areas,
  }
}

export function buildDashaBoard(systems: BoardSystem[], input: BoardInput, asOf: Date = new Date()): DashaBoard {
  const now = asOf.getTime()
  const lang = jLang(input.lang)
  const rows: BoardRow[] = []
  for (const system of systems) {
    if (!system.nodes?.length) continue
    const path = getDashaPathAt(system.nodes, now).slice(0, 3)
    const areaSet = new Set<BoardArea>()
    const periods: BoardPeriod[] = path.map((node, index) => {
      const info = system.kind === 'sign'
        ? (() => {
            const sign = rashiOfShort(node.lord)
            return sign ? signPeriod(node, sign, input) : { detail: '', areas: [] as BoardArea[] }
          })()
        : grahaPeriod(node.lord as GrahaId, input)
      if (index < 2) info.areas.forEach(a => areaSet.add(a))
      const name = system.kind === 'sign'
        ? (jR(rashiOfShort(node.lord) ?? 1, lang) ?? node.lord)
        : (node.label ? jStar(node.label, lang) : jG(node.lord as GrahaId, lang) || node.lord)
      return { label: name, detail: info.detail, start: new Date(node.start), end: new Date(node.end) }
    })
    rows.push({ id: system.id, name: system.name, periods, areas: [...areaSet] })
  }

  const byArea = new Map<BoardArea, string[]>()
  for (const row of rows) {
    for (const area of row.areas) {
      byArea.set(area, [...(byArea.get(area) ?? []), row.name])
    }
  }
  const agreements = [...byArea.entries()]
    .filter(([, names]) => names.length >= 2)
    .map(([area, names]) => ({ area, name: lang === 'hi' ? BOARD_AREA_NAMES_HI[area] : BOARD_AREA_NAMES[area], systems: names, strong: names.length >= 3 }))
    .sort((a, b) => b.systems.length - a.systems.length)

  return { asOf, rows, agreements }
}

// ── Life event matching ──────────────────────────────────────

export type LifeEventType =
  | 'marriage' | 'career' | 'home' | 'child' | 'education' | 'travel' | 'money' | 'crisis'

export const LIFE_EVENT_TYPES: Array<{ id: LifeEventType; name: string }> = [
  { id: 'marriage', name: 'Marriage or partnership' },
  { id: 'career', name: 'Job or career change' },
  { id: 'home', name: 'Home or property' },
  { id: 'child', name: 'Birth of a child' },
  { id: 'education', name: 'Education' },
  { id: 'travel', name: 'Foreign travel or move' },
  { id: 'money', name: 'Big gain or loss of money' },
  { id: 'crisis', name: 'Health or life crisis' },
]

export interface LifeEvent {
  id: string
  type: LifeEventType
  /** YYYY-MM-DD */
  date: string
  note?: string
}

export interface EventSystemMatch {
  id: string
  name: string
  score: number
  periods: string
  reasons: string[]
}

export interface EventMatch {
  event: LifeEvent
  systems: EventSystemMatch[]
  /** Share of the twelve signs that count as a target. A score near this means little. */
  baseline: number
}

export interface MatchAnchors {
  karakamsha?: Rashi
  upapada?: Rashi
  A2?: Rashi
  A4?: Rashi
  A5?: Rashi
  A7?: Rashi
  A10?: Rashi
  karakas: { AK: GrahaId; AmK: GrahaId; BK: GrahaId; MK: GrahaId; PK: GrahaId; GK: GrahaId; DK: GrahaId }
}

function signAt(sign: Rashi, house: number): Rashi {
  return ((((sign + house - 2) % 12) + 12) % 12 + 1) as Rashi
}

function eventTargets(type: LifeEventType, input: BoardInput, anchors: MatchAnchors): Rashi[] {
  const h = (house: number) => signAt(input.lagna, house)
  const of = (id: GrahaId) => input.grahas.find(g => g.id === id)?.rashi
  const k = anchors.karakas
  const dk = of(k.DK)
  const list: Array<Rashi | undefined> = (() => {
    switch (type) {
      case 'marriage': return [dk, dk ? signAt(dk, 7) : undefined, anchors.upapada, anchors.upapada ? signAt(anchors.upapada, 7) : undefined, h(7), anchors.A7]
      case 'career': return [of(k.AmK), h(10), anchors.karakamsha ? signAt(anchors.karakamsha, 10) : undefined, anchors.A10, h(11)]
      case 'home': return [h(4), of(k.MK), anchors.A4]
      case 'child': return [h(5), of(k.PK), anchors.A5, h(9)]
      case 'education': return [h(4), h(5), h(9), h(2)]
      case 'travel': return [h(9), h(12), h(3)]
      case 'money': return [h(2), h(11), anchors.A2, h(8)]
      case 'crisis': return [h(6), h(8), h(12), of(k.GK), 9 as Rashi, 8 as Rashi]
    }
  })()
  return [...new Set(list.filter(Boolean) as Rashi[])]
}

/**
 * Score one dated event against each system's maha and antar periods.
 * A sign counts by being a target; M2 also counts rashi drishti onto a target.
 * A planet counts by occupying or ruling a target sign.
 */
export function matchLifeEvent(
  event: LifeEvent,
  systems: BoardSystem[],
  input: BoardInput,
  anchors: MatchAnchors,
): EventMatch | null {
  const at = new Date(`${event.date}T12:00:00Z`).getTime()
  if (!Number.isFinite(at)) return null
  const targets = eventTargets(event.type, input, anchors)
  const targetSet = new Set(targets)
  const lang = jLang(input.lang)
  const R = (r: Rashi) => jR(r, lang)
  const names = targets.map(R).join(', ')

  const results: EventSystemMatch[] = []
  for (const system of systems) {
    if (!system.nodes?.length) continue
    const path = getDashaPathAt(system.nodes, at).slice(0, 2)
    if (!path.length) continue
    let score = 0
    const reasons: string[] = []
    path.forEach((node, index) => {
      const weight = index === 0 ? 3 : 2
      const levelName = index === 0 ? say(lang, 'Mahadasha', 'महादशा') : say(lang, 'Antardasha', 'अंतर्दशा')
      if (system.kind === 'sign') {
        const sign = rashiOfShort(node.lord)
        if (!sign) return
        if (targetSet.has(sign)) {
          score += weight
          reasons.push(say(lang, `${levelName} ${R(sign)} is a target sign.`, `${levelName} ${R(sign)} लक्ष्य राशि है।`))
        } else if (input.method === 'practical') {
          const seen = getRashiDrishti(sign).filter(s => targetSet.has(s))
          if (seen.length) {
            score += 1
            reasons.push(say(lang, `${levelName} ${R(sign)} aspects ${seen.map(R).join(', ')}.`, `${levelName} ${R(sign)} की ${seen.map(R).join(', ')} पर दृष्टि है।`))
          }
        }
      } else {
        const id = node.lord as GrahaId
        const placedSign = input.grahas.find(g => g.id === id)?.rashi
        const owned = OWNED_SIGNS[id] ?? []
        if (placedSign && targetSet.has(placedSign)) {
          score += weight
          reasons.push(say(lang, `${levelName} ${jG(id, lang)} occupies ${R(placedSign)}.`, `${levelName} ${jG(id, lang)} ${R(placedSign)} में बैठा है।`))
        } else {
          const ruled = owned.filter(s => targetSet.has(s))
          if (ruled.length) {
            score += weight
            reasons.push(say(lang, `${levelName} ${jG(id, lang)} rules ${ruled.map(R).join(', ')}.`, `${levelName} ${jG(id, lang)} ${ruled.map(R).join(', ')} का स्वामी है।`))
          }
        }
      }
    })
    results.push({
      id: system.id,
      name: system.name,
      score: Math.min(100, Math.round((score / 5) * 100)),
      periods: path.map(n => (system.kind === 'sign'
        ? R(rashiOfShort(n.lord) ?? 1)
        : (jG(n.lord as GrahaId, lang) ?? n.lord))).join(' / '),
      reasons: reasons.length ? reasons : [say(lang, `No link to the target signs (${names}).`, `लक्ष्य राशियों (${names}) से कोई संबंध नहीं।`)],
    })
  }
  return { event, systems: results, baseline: Math.round((targets.length / 12) * 100) }
}

/** Average score per system over all events, best first. */
export function rankSystems(matches: EventMatch[]): Array<{ id: string; name: string; average: number; events: number }> {
  const tally = new Map<string, { name: string; total: number; events: number }>()
  for (const match of matches) {
    for (const row of match.systems) {
      const entry = tally.get(row.id) ?? { name: row.name, total: 0, events: 0 }
      entry.total += row.score
      entry.events += 1
      tally.set(row.id, entry)
    }
  }
  return [...tally.entries()]
    .map(([id, t]) => ({ id, name: t.name, average: Math.round(t.total / t.events), events: t.events }))
    .sort((a, b) => b.average - a.average)
}
