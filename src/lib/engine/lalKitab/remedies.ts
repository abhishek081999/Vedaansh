// ─────────────────────────────────────────────────────────────
//  src/lib/engine/lalKitab/remedies.ts
//  Builds the remedy plan for a chart, following Lal Kitab's rules:
//    • only planets reading hard or mixed, or behind a dosha, get
//      remedies; a planet already giving good results is left alone
//    • one remedy per planet at a time
//    • a hard planet first gets remedies that release it (giving,
//      flowing away, feeding); a mixed one gets remedies that
//      strengthen it
//    • conflict check: a remedy is blocked when strengthening its
//      planet would add to the harm that planet does to another hard
//      planet, or when it gives away the things of the planet of
//      destiny
//  Sleeping houses get the waking planet's strengthening remedy when
//  that is safe. The problem finder maps an everyday problem to the
//  chart's planets and their remedies.
// ─────────────────────────────────────────────────────────────

import type { EngineLang } from '@/lib/engine/lang'
import { LK_PARHEZ_HI, LK_UPAY_HI } from '@/lib/engine/locale/lalKitabUpay.hi'
import { LK_PARHEZ, LK_PROBLEMS, LK_UPAY, type LkProblemId, type LkUpay } from './catalogue/upay'
import type { LkFacts } from './facts'
import { lkRelation } from './friendship'
import type { LkAreaReading, LkPhalReading, LkPhalSide } from './phal'
import { LK_GRAHAS, type LkGraha, type LkHouse } from './types'

export type LkConflictReason = 'strengthensHarmer' | 'releasesKismat'

export interface LkRemedyChoice {
  upay: LkUpay
  planet: LkGraha
  blocked?: { reason: LkConflictReason; victim?: LkGraha }
}

export interface LkPlanetRemedies {
  planet: LkGraha
  house: LkHouse
  side: LkPhalSide
  priority: number
  doshas: string[]
  remedies: LkRemedyChoice[]
  parhez: { id: string; text: string }[]
}

export interface LkRemedyPlan {
  planets: LkPlanetRemedies[]
  /** The first allowed remedy of the highest-priority planets, one per planet. */
  top: LkRemedyChoice[]
  waking: { house: LkHouse; waker: LkGraha; remedy?: LkRemedyChoice }[]
  /** Planets left alone because they already give good results. */
  notNeeded: LkGraha[]
}

const TOP = 5

/** Which planets each dosha asks to treat. */
const DOSHA_PLANETS: Record<string, readonly LkGraha[]> = {
  'dosha.grahanSu': ['Su', 'Ra', 'Ke'],
  'dosha.grahanMo': ['Mo', 'Ra', 'Ke'],
  'dosha.mangalBad': ['Ma'],
  'dosha.manglik': ['Ma'],
  'dosha.guruChandal': ['Ju', 'Ra'],
}

function localise(u: LkUpay, lang: EngineLang): LkUpay {
  return lang === 'hi' ? { ...u, text: LK_UPAY_HI[u.id] ?? u.text } : u
}

/** Text of a catalogue remedy by id, or undefined for an unknown id. */
export function lkUpayText(id: string, lang: EngineLang = 'en'): string | undefined {
  const u = LK_UPAY.find((x) => x.id === id)
  return u ? localise(u, lang).text : undefined
}

export function lkUpayFor(planet: LkGraha, house: LkHouse, lang: EngineLang = 'en'): LkUpay[] {
  return LK_UPAY.filter((u) => u.planet === planet && (u.houses === 'all' || u.houses.includes(house))).map((u) => localise(u, lang))
}

export function lkParhezFor(planet: LkGraha, house: LkHouse, lang: EngineLang = 'en'): { id: string; text: string }[] {
  return LK_PARHEZ
    .filter((p) => p.planet === planet && (p.houses === 'all' || p.houses.includes(house)))
    .map((p) => ({ id: p.id, text: lang === 'hi' ? LK_PARHEZ_HI[p.id] ?? p.text : p.text }))
}

/** Hard planets that `planet` harms as an enemy (sitting with, aspecting or striking them). */
function victimsOf(planet: LkGraha, f: LkFacts, hard: Set<LkGraha>): LkGraha[] {
  const out = new Set<LkGraha>()
  const h = f.teva.house[planet]
  for (const o of f.teva.occupants[h] ?? []) if (o !== planet && hard.has(o) && lkRelation(planet, o) === 'enemy') out.add(o)
  for (const a of f.aspects) if (a.from === planet && a.relation === 'enemy' && hard.has(a.to)) out.add(a.to)
  for (const t of f.takkars) if (t.from === planet && t.relation === 'enemy' && hard.has(t.to)) out.add(t.to)
  return [...out]
}


function check(u: LkUpay, f: LkFacts, hard: Set<LkGraha>): LkRemedyChoice['blocked'] {
  for (const s of u.strengthens) {
    const [victim] = victimsOf(s, f, hard)
    if (victim) return { reason: 'strengthensHarmer', victim }
  }
  if (f.states.kismat && u.releases.includes(f.states.kismat.planet)) return { reason: 'releasesKismat' }
  return undefined
}

function order(list: LkUpay[], side: LkPhalSide): LkUpay[] {
  const releaseFirst = side === 'hard'
  const rank = (u: LkUpay) => (u.houses === 'all' ? 2 : 0) + ((u.releases.length > 0) === releaseFirst ? 0 : 1)
  return [...list].sort((a, b) => rank(a) - rank(b))
}

export function lkRemedyPlan(f: LkFacts, phal: readonly LkPhalReading[], doshaIds: readonly string[], lang: EngineLang = 'en'): LkRemedyPlan {
  const hard = new Set(phal.filter((r) => r.side === 'hard').map((r) => r.planet))
  const doshaFor = new Map<LkGraha, string[]>()
  for (const id of doshaIds) for (const p of DOSHA_PLANETS[id] ?? []) doshaFor.set(p, [...(doshaFor.get(p) ?? []), id])

  const planets: LkPlanetRemedies[] = []
  const notNeeded: LkGraha[] = []
  for (const r of phal) {
    const doshas = doshaFor.get(r.planet) ?? []
    if (r.side === 'good' && doshas.length === 0) { notNeeded.push(r.planet); continue }
    const priority = (r.side === 'hard' ? 3 : r.side === 'mixed' ? 2 : 1) + (doshas.length ? 1 : 0)
    const remedies = order(lkUpayFor(r.planet, r.house, lang), r.side === 'good' ? 'mixed' : r.side)
      .map((upay) => ({ upay, planet: r.planet, blocked: check(upay, f, hard) }))
    planets.push({ planet: r.planet, house: r.house, side: r.side, priority, doshas, remedies, parhez: lkParhezFor(r.planet, r.house, lang) })
  }
  planets.sort((a, b) => b.priority - a.priority || LK_GRAHAS.indexOf(a.planet) - LK_GRAHAS.indexOf(b.planet))

  const top = planets.flatMap((p) => p.remedies.find((c) => !c.blocked) ?? []).slice(0, TOP)

  const sides = new Map(phal.map((r) => [r.planet, r.side]))
  const waking = f.states.sleepingHouses.map(({ house, waker }) => {
    const wHouse = f.teva.house[waker]
    if (!wHouse || sides.get(waker) === 'hard') return { house, waker }
    const remedy = lkUpayFor(waker, wHouse, lang)
      .filter((u) => u.strengthens.includes(waker))
      .map((upay) => ({ upay, planet: waker, blocked: check(upay, f, hard) }))
      .find((c) => !c.blocked)
    return { house, waker, remedy }
  })

  return { planets, top, waking, notNeeded }
}

// ── Problem finder ────────────────────────────────────────────

export interface LkProblemResult {
  problem: LkProblemId
  /** Planets behind the problem in this chart, hardest first. */
  planets: LkGraha[]
  remedies: LkRemedyChoice[]
  /** True when the chart supports this area and no remedy is needed. */
  supported: boolean
}

export function lkFindRemedies(problem: LkProblemId, plan: LkRemedyPlan, areas: readonly LkAreaReading[]): LkProblemResult {
  const def = LK_PROBLEMS[problem]
  const voiced = areas.filter((a) => def.areas.includes(a.area)).flatMap((a) => a.voices.map((v) => v.planet))
  const candidates = new Set<LkGraha>([...voiced, ...def.planets])
  const treated = plan.planets.filter((p) => candidates.has(p.planet))
  const remedies = treated.flatMap((p) => p.remedies.find((c) => !c.blocked) ?? [])
  return { problem, planets: treated.map((p) => p.planet), remedies, supported: treated.length === 0 }
}
