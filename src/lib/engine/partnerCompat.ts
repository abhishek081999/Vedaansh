// ─────────────────────────────────────────────────────────────
//  src/lib/engine/partnerCompat.ts
//  Compatibility for relationships other than marriage: business
//  partners and friends. Shared base (Moon-sign relation, tara both
//  ways, friendship of the Moon-sign lords, Lagna harmony) plus
//  mode-specific factors:
//  • business   — Mercury (communication, trade) and benefics in each
//                 other's wealth houses (2, 10, 11).
//  • friendship — gana (temperament), the Moon in each other's 3rd /
//                 11th (companions, friends), Jupiter / Venus warmth.
//  Both modes subtract for Saturn or Mars sitting on the other's Moon
//  or Lagna sign. Scores add to a 0–100 total. Pure.
// ─────────────────────────────────────────────────────────────

import type { ChartOutput, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'
import { GRAHA_HI, RASHI_HI, termHi } from '@/i18n/jyotish'
import { naturalRelationship } from '@/lib/engine/dignity'
import { getGanaName } from '@/lib/engine/ashtakoot'
import { fill, type EngineLang } from '@/lib/engine/lang'
import { PARTNER_COMPAT_HI as HI } from '@/lib/engine/locale/partnerCompat.hi'
import { ORDINAL_OBLIQUE_HI } from '@/lib/engine/locale/eclipseImpact.hi'

export type PartnerMode = 'business' | 'friendship'
export type PartnerFactorId =
  | 'moon' | 'tara' | 'maitri' | 'lagna'
  | 'mercury' | 'gains' | 'gana' | 'friends' | 'warmth' | 'friction'

export interface PartnerFactor {
  id: PartnerFactorId
  label: string
  /** Points earned (friction is ≤ 0). */
  points: number
  /** Most points the factor can give (0 for friction). */
  max: number
  level: 'good' | 'neutral' | 'bad'
  reason: string
}

export interface PartnerCompatResult {
  mode: PartnerMode
  /** 0–100 */
  score: number
  band: 'strong' | 'workable' | 'care'
  verdict: string
  summary: string
  factors: PartnerFactor[]
}

const SIGN_LORD: Record<number, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me', 7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

const LABEL_EN: Record<PartnerFactorId, string> = {
  moon: 'Moon sign relation',
  tara: 'Tara (nakshatra) strength',
  maitri: 'Friendship of the sign lords',
  lagna: 'Lagna harmony',
  mercury: 'Mercury: communication and trade sense',
  gains: 'Links to wealth and gain houses',
  gana: 'Gana (temperament)',
  friends: 'Links to the houses of friends (3 and 11)',
  warmth: 'Warmth from Jupiter and Venus',
  friction: 'Pressure from Saturn and Mars',
}

const VERDICT_EN = { strong: 'Strong fit', workable: 'Workable fit', care: 'Needs care' }
const VERDICT_SUB_EN: Record<PartnerMode, Record<'strong' | 'workable' | 'care', string>> = {
  business: {
    strong: 'The charts support a partnership well. Still set out roles and shares in writing.',
    workable: 'The partnership can work. Clear roles and regular accounts will make it stronger.',
    care: 'The natural fit is low. Start with a small project before putting in serious money, and keep everything in writing.',
  },
  friendship: {
    strong: 'Signs of an easy, lasting friendship.',
    workable: 'A good friendship is possible, and shared interests will deepen it.',
    care: 'Your temperaments differ. Patience and open talk can still keep the friendship going.',
  },
}

const signDiff = (a: number, b: number) => ((b - a + 12) % 12) + 1
const find = (c: ChartOutput, id: GrahaId): GrahaData | undefined => c.grahas.find((g) => g.id === id)

function rashi(n: number, hi: boolean) {
  return hi ? RASHI_HI[n as Rashi] ?? '—' : RASHI_NAMES[n as Rashi] ?? '—'
}
function graha(id: GrahaId, hi: boolean) {
  return hi ? GRAHA_HI[id] ?? id : GRAHA_NAMES[id] ?? id
}

/** Tara count from one nakshatra (0-based) to another, 1–9. */
function taraNumber(from: number, to: number): number {
  return ((((to - from + 27) % 27) + 1 - 1) % 9) + 1
}
const TARA_EN = ['', 'Janma', 'Sampat', 'Vipat', 'Kshema', 'Pratyari', 'Sadhaka', 'Vadha', 'Mitra', 'Ati-Mitra']
const TARA_GOOD = new Set([2, 4, 6, 8, 9])
const TARA_BAD = new Set([3, 5, 7])

function taraLabel(n: number, hi: boolean): string {
  return hi ? termHi(TARA_EN[n]) : TARA_EN[n]
}

export function partnerCompatibility(
  a: ChartOutput,
  b: ChartOutput,
  mode: PartnerMode,
  lang: EngineLang = 'en',
): PartnerCompatResult {
  const hi = lang === 'hi'
  const label = (id: PartnerFactorId) => (hi ? HI.factor[id] : LABEL_EN[id])
  const who = (i: 0 | 1) => (hi ? (i === 0 ? HI.person1 : HI.person2) : i === 0 ? 'Person 1' : 'Person 2')
  const factors: PartnerFactor[] = []
  const aMo = find(a, 'Mo')
  const bMo = find(b, 'Mo')

  // ── Moon sign relation ──
  if (aMo && bMo) {
    const d = signDiff(aMo.rashi, bMo.rashi)
    const r = signDiff(bMo.rashi, aMo.rashi)
    const good = [1, 3, 5, 7, 9, 11].includes(d)
    const hard = [2, 6, 8, 12].includes(d)
    const points = good ? 5 : hard ? 1 : 3
    const rel = hi
      ? fill(HI.relation, { a: rashi(aMo.rashi, hi), b: rashi(bMo.rashi, hi), d, r })
      : `${rashi(aMo.rashi, hi)} and ${rashi(bMo.rashi, hi)}: a ${d}/${r} relation.`
    const note = hi
      ? good ? HI.moonGood : hard ? fill(HI.moonHard, { d, r }) : HI.moonMixed
      : good
        ? 'A natural fit; each finds the other’s rhythm easy to read.'
        : hard
          ? `The ${d}/${r} relation takes more effort: keep duties and expectations clear.`
          : 'A mixed relation: it works, but the fit has to be built.'
    factors.push({ id: 'moon', label: label('moon'), points, max: 5, level: good ? 'good' : hard ? 'bad' : 'neutral', reason: `${rel} ${note}` })

    // ── Tara both ways ──
    const ab = taraNumber(aMo.nakshatraIndex, bMo.nakshatraIndex)
    const ba = taraNumber(bMo.nakshatraIndex, aMo.nakshatraIndex)
    const tp = (n: number) => (TARA_GOOD.has(n) ? 2 : TARA_BAD.has(n) ? 0 : 1)
    const tPoints = tp(ab) + tp(ba)
    factors.push({
      id: 'tara',
      label: label('tara'),
      points: tPoints,
      max: 4,
      level: tPoints >= 3 ? 'good' : tPoints <= 1 ? 'bad' : 'neutral',
      reason: hi
        ? fill(HI.tara, { ab: taraLabel(ab, hi), ba: taraLabel(ba, hi) })
        : `From Person 1: ${taraLabel(ab, hi)}; from Person 2: ${taraLabel(ba, hi)}.`,
    })

    // ── Friendship of the Moon-sign lords ──
    const la = SIGN_LORD[aMo.rashi]
    const lb = SIGN_LORD[bMo.rashi]
    const r1 = la === lb ? 'friend' : naturalRelationship(la, lb)
    const r2 = la === lb ? 'friend' : naturalRelationship(lb, la)
    const mp = (x: string) => (x === 'friend' ? 2 : x === 'neutral' ? 1 : 0)
    const mPoints = mp(r1) + mp(r2)
    const relWord = (x: 'friend' | 'neutral' | 'enemy') => (hi ? HI.rel[x] : x)
    factors.push({
      id: 'maitri',
      label: label('maitri'),
      points: mPoints,
      max: 4,
      level: mPoints >= 3 ? 'good' : mPoints <= 1 ? 'bad' : 'neutral',
      reason: hi
        ? fill(HI.maitri, { a: graha(la, hi), b: graha(lb, hi), rel: `${relWord(r1)} / ${relWord(r2)}` })
        : la === lb
          ? `Both Moon signs are ruled by ${graha(la, hi)}.`
          : `${graha(la, hi)} sees ${graha(lb, hi)} as ${r1}; ${graha(lb, hi)} sees ${graha(la, hi)} as ${r2}.`,
    })
  }

  // ── Lagna harmony ──
  {
    const d = signDiff(a.lagnas.ascRashi, b.lagnas.ascRashi)
    const good = [1, 3, 5, 7, 9, 11].includes(d)
    const hard = [6, 8].includes(d)
    factors.push({
      id: 'lagna',
      label: label('lagna'),
      points: good ? 3 : hard ? 0 : 1,
      max: 3,
      level: good ? 'good' : hard ? 'bad' : 'neutral',
      reason: `${rashi(a.lagnas.ascRashi, hi)} ↔ ${rashi(b.lagnas.ascRashi, hi)} (${d}/${signDiff(b.lagnas.ascRashi, a.lagnas.ascRashi)})`,
    })
  }

  const charts: [ChartOutput, ChartOutput][] = [[a, b], [b, a]]

  if (mode === 'business') {
    // ── Mercury ──
    const aMe = find(a, 'Me')
    const bMe = find(b, 'Me')
    if (aMe && bMe) {
      let p = 0
      if ([1, 3, 5, 7, 9, 11].includes(signDiff(aMe.rashi, bMe.rashi))) p += 1
      for (const [x, y] of charts) {
        const me = find(x, 'Me')!
        const moon = find(y, 'Mo')
        if ([1, 5, 9].includes(signDiff(me.rashi, y.lagnas.ascRashi)) || (moon && [1, 5, 9].includes(signDiff(me.rashi, moon.rashi)))) p += 1
      }
      factors.push({
        id: 'mercury',
        label: label('mercury'),
        points: p,
        max: 3,
        level: p >= 2 ? 'good' : p === 0 ? 'bad' : 'neutral',
        reason: p >= 2
          ? hi ? HI.mercuryGood : 'Both Mercuries sit well with each other: talks, accounts and deals tend to line up.'
          : hi ? HI.mercuryOk : 'The Mercury link is ordinary: written agreements and regular check-ins will help.',
      })
    }

    // ── Benefics in each other's wealth houses ──
    const notes: string[] = []
    let p = 0
    charts.forEach(([x, y], i) => {
      for (const id of ['Ju', 'Ve', 'Mo'] as GrahaId[]) {
        const g = find(x, id)
        if (!g) continue
        const house = signDiff(y.lagnas.ascRashi, g.rashi)
        if ([2, 10, 11].includes(house)) {
          p += 1
          notes.push(hi
            ? fill(HI.gainsOne, { who: who(i as 0 | 1), planet: graha(id, hi), house: ORDINAL_OBLIQUE_HI[house] })
            : `${who(i as 0 | 1)}'s ${graha(id, hi)} falls in the other's ${house}${house === 2 ? 'nd' : 'th'} house: a sign of money and openings growing together.`)
          break
        }
      }
    })
    factors.push({
      id: 'gains',
      label: label('gains'),
      points: p * 2,
      max: 4,
      level: p === 2 ? 'good' : p === 1 ? 'neutral' : 'bad',
      reason: notes.length ? notes.join(' ') : hi ? HI.gainsNone : 'No benefic falls directly in the other’s wealth houses (2, 10, 11).',
    })
  } else {
    // ── Gana ──
    if (aMo && bMo) {
      const ga = getGanaName(aMo.nakshatraIndex + 1)
      const gb = getGanaName(bMo.nakshatraIndex + 1)
      const same = ga === gb
      const rak = (ga === 'Rakshasa') !== (gb === 'Rakshasa')
      const points = same ? 3 : rak ? 0 : 2
      const names = hi ? [termHi(ga), termHi(gb)] : [ga, gb]
      factors.push({
        id: 'gana',
        label: label('gana'),
        points,
        max: 3,
        level: points === 3 ? 'good' : points === 0 ? 'bad' : 'neutral',
        reason: hi
          ? `${fill(HI.gana, { a: names[0], b: names[1] })} ${points === 0 ? HI.ganaHard : HI.ganaGood}`
          : `${names[0]} and ${names[1]}. ${points === 0 ? 'Reactions and temperament differ; patience helps.' : 'Temperaments suit each other.'}`,
      })
    }

    // ── Moon in each other's 3rd / 11th ──
    const notes: string[] = []
    let p = 0
    charts.forEach(([x, y], i) => {
      const moon = find(x, 'Mo')
      const yMoon = find(y, 'Mo')
      if (!moon) return
      const fromLagna = signDiff(y.lagnas.ascRashi, moon.rashi)
      const fromMoon = yMoon ? signDiff(yMoon.rashi, moon.rashi) : 0
      const house = [3, 11].includes(fromLagna) ? fromLagna : [3, 11].includes(fromMoon) ? fromMoon : 0
      if (house) {
        p += 2
        notes.push(hi
          ? fill(HI.friendsLink, { who: who(i as 0 | 1), house: ORDINAL_OBLIQUE_HI[house] })
          : `${who(i as 0 | 1)}'s Moon falls in the other's ${house}${house === 3 ? 'rd' : 'th'} house: easy companionship.`)
      }
    })
    factors.push({
      id: 'friends',
      label: label('friends'),
      points: p,
      max: 4,
      level: p >= 4 ? 'good' : p === 2 ? 'neutral' : 'bad',
      reason: notes.length ? notes.join(' ') : hi ? HI.friendsNone : 'No direct Moon link to the houses of friends; shared interests build this friendship.',
    })

    // ── Jupiter / Venus warmth to the other's Moon ──
    const wNotes: string[] = []
    let w = 0
    charts.forEach(([x, y], i) => {
      const yMoon = find(y, 'Mo')
      if (!yMoon) return
      for (const id of ['Ju', 'Ve'] as GrahaId[]) {
        const g = find(x, id)
        if (g && [1, 5, 9].includes(signDiff(g.rashi, yMoon.rashi))) {
          w += 1
          wNotes.push(hi
            ? fill(HI.warmth, { who: who(i as 0 | 1), planet: graha(id, hi) })
            : `${who(i as 0 | 1)}'s ${graha(id, hi)} is in trine to the other's Moon: affection and trust.`)
        }
      }
    })
    const wPoints = Math.min(3, w)
    factors.push({
      id: 'warmth',
      label: label('warmth'),
      points: wPoints,
      max: 3,
      level: wPoints >= 2 ? 'good' : wPoints === 1 ? 'neutral' : 'bad',
      reason: wNotes.length ? wNotes.join(' ') : hi ? HI.warmthNone : 'No direct link from Jupiter or Venus.',
    })
  }

  // ── Saturn / Mars on the other's Moon or Lagna sign ──
  {
    const notes: string[] = []
    let f = 0
    charts.forEach(([x, y], i) => {
      const yMoon = find(y, 'Mo')
      for (const id of ['Sa', 'Ma'] as GrahaId[]) {
        const g = find(x, id)
        if (!g) continue
        const point = yMoon && g.rashi === yMoon.rashi ? 'moon' : g.rashi === y.lagnas.ascRashi ? 'lagna' : null
        if (!point) continue
        f -= 1
        const pName = hi ? (point === 'moon' ? HI.moonPoint : HI.lagnaPoint) : point === 'moon' ? 'Moon' : 'Lagna'
        notes.push(hi
          ? fill(HI.friction, { who: who(i as 0 | 1), planet: graha(id, hi), point: pName })
          : `${who(i as 0 | 1)}'s ${graha(id, hi)} sits in the other's ${pName} sign: expect pressure or clashes at times.`)
      }
    })
    const points = Math.max(-3, f)
    factors.push({
      id: 'friction',
      label: label('friction'),
      points,
      max: 0,
      level: points === 0 ? 'good' : points <= -2 ? 'bad' : 'neutral',
      reason: notes.length ? notes.join(' ') : hi ? HI.frictionNone : 'No direct pressure from Saturn or Mars.',
    })
  }

  const max = factors.reduce((s, x) => s + x.max, 0)
  const got = factors.reduce((s, x) => s + x.points, 0)
  const score = Math.max(0, Math.min(100, Math.round((got / max) * 100)))
  const band = score >= 70 ? 'strong' : score >= 50 ? 'workable' : 'care'

  return {
    mode,
    score,
    band,
    verdict: hi ? HI.verdict[band] : VERDICT_EN[band],
    summary: hi ? HI.verdictSub[mode][band] : VERDICT_SUB_EN[mode][band],
    factors,
  }
}

