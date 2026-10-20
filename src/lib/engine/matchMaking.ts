// src/lib/engine/matchMaking.ts
// Match-making sequence:
// Mars → Venus → Sun → Moon → Navamsha → Dasha → D1 overlap → D4,
// then the other divisional overlays.
// Overlap is house-first: planets in the same whole-sign house "fall on" each other.
// Pure engine — no React/DB.

import type { ChartOutput, Dignity, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'
import { getDashaPathAt } from '@/lib/engine/dasha/current'
import { lagnaElementNote, lagnaMatch } from '@/lib/engine/lagnaMatch'
import { moonEmotionalPair } from '@/lib/engine/milanMarriedLife'
import { wholeSignHouse, wholeSignHouseSign, type LifeTone } from '@/lib/engine/marriedLifeAnalysis'
import { seventhAxisMatch } from '@/lib/engine/seventhAxis'

export interface MatchHit {
  id: string
  house: number
  title: string
  detail: string
  tone: LifeTone
  weight: number
}

export interface VargaOverlay {
  code: string
  name: string
  purpose: string
  score: number | null
  tone: LifeTone
  summary: string
  hits: MatchHit[]
}

export interface MatchStep {
  order: number
  id: string
  title: string
  mark: string
  tone: LifeTone
  detail: string
}

export interface MatchMakingResult {
  headline: string
  summary: string
  steps: MatchStep[]
  lagna: ReturnType<typeof lagnaMatch>
  elementNote: string | null
  fourthHouse: string
  vargas: VargaOverlay[]
  pillars: { id: string; title: string; mark: string; tone: LifeTone; detail: string }[]
}

const CLASSICAL: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']

const STRONG: Dignity[] = ['exalted', 'moolatrikona', 'own', 'great_friend']
const FRIEND: Dignity[] = ['friend']
const ENEMY: Dignity[] = ['enemy', 'great_enemy']

interface PairEffect {
  title: string
  detail: string
  tone: LifeTone
  weight: number
}

/** Sorted GrahaId pair → what it means when they share a house. */
const OVERLAY: Record<string, PairEffect> = {
  'Mo-Sa': {
    title: 'Saturn over Moon',
    detail: 'The Moon is drained. One person corrects, judges, or cools the other’s feeling until emotional energy thins.',
    tone: 'caution',
    weight: 2,
  },
  'Me-Ra': {
    title: 'Rahu over Mercury',
    detail: 'Speech picks up illusion. Allegations, paperwork trouble, and too much talk are the classical result, especially early in a marriage.',
    tone: 'caution',
    weight: 2,
  },
  'Ke-Ma': {
    title: 'Ketu over Mars',
    detail: 'Mars, the body and the blood, is dried out. Vitality and desire drop. The person can feel lifeless in the place this house rules.',
    tone: 'caution',
    weight: 2,
  },
  'Ra-Su': {
    title: 'Rahu over Sun',
    detail: 'Ego against ego. Status, pride, and “who is right” become the argument.',
    tone: 'caution',
    weight: 1.5,
  },
  'Me-Sa': {
    title: 'Saturn over Mercury',
    detail: 'Play leaves. The bond gets serious too fast and humor, which used to repair a fight, stops working.',
    tone: 'caution',
    weight: 1.5,
  },
  'Sa-Su': {
    title: 'Saturn over Sun',
    detail: 'The Sun’s life-force is pressed down. Confidence, health, and authority in that house are the first to tire.',
    tone: 'caution',
    weight: 2,
  },
  'Me-Mo': {
    title: 'Mercury over Moon',
    detail: 'Too many data points. One speaks, the other hears a different sentence, and the same complaint is repeated.',
    tone: 'caution',
    weight: 1.5,
  },
  'Ke-Su': {
    title: 'Ketu over Sun',
    detail: 'Confidence drops in the person whose Sun is covered. They stop taking a stand.',
    tone: 'caution',
    weight: 1.5,
  },
  'Ju-Sa': {
    title: 'Saturn over Jupiter',
    detail: 'Jupiter’s luck is handed to Saturn, and Saturn’s hardship is handed back. This is the “since marriage my fortune turned” overlap, especially if it touches the 9th.',
    tone: 'caution',
    weight: 2,
  },
  'Su-Ve': {
    title: 'Sun over Venus',
    detail: 'Ego sits on pleasure. Appreciation of the partner’s beauty and grace gets blocked, and one person dominates the tone.',
    tone: 'caution',
    weight: 1.5,
  },
  'Sa-Ve': {
    title: 'Saturn over Venus',
    detail: 'Grace thins after the wedding. Charm and romance age quickly unless they are practiced on purpose.',
    tone: 'caution',
    weight: 1.5,
  },
  'Ma-Mo': {
    title: 'Mars over Moon',
    detail: 'Irritation. One partner’s speech keeps poking the other’s mood.',
    tone: 'caution',
    weight: 1.5,
  },
  'Ke-Mo': {
    title: 'Ketu over Moon',
    detail: 'Feeling detaches. The partner is physically present and emotionally elsewhere.',
    tone: 'caution',
    weight: 1.5,
  },
  'Ke-Me': {
    title: 'Ketu over Mercury',
    detail: 'Communication breaks. Words do not land, and the gap widens over time.',
    tone: 'caution',
    weight: 1.5,
  },
  'Ke-Ve': {
    title: 'Ketu over Venus',
    detail: 'Desire detaches. Attraction can start the bond and then leave the bedroom or the affection empty.',
    tone: 'caution',
    weight: 1.5,
  },
  'Me-Su': {
    title: 'Mercury over Sun',
    detail: 'A helpful overlap. Intelligence supports authority instead of attacking it. Humor can put a fight down.',
    tone: 'supportive',
    weight: -1,
  },
  'Ma-Su': {
    title: 'Mars over Sun',
    detail: 'Sun and Mars work as one heat. Courage and direction line up. In the Navamsha lagna this is a complementary physical pair.',
    tone: 'supportive',
    weight: -1,
  },
  'Ju-Me': {
    title: 'Jupiter over Mercury',
    detail: 'A wealth-and-counsel overlap. Advice lands, and money has a wiser route.',
    tone: 'supportive',
    weight: -1,
  },
  'Ju-Su': {
    title: 'Jupiter over Sun',
    detail: 'A very complementary pair when the element allows it. Wisdom backs vitality instead of shrinking it.',
    tone: 'supportive',
    weight: -1,
  },
  'Ma-Ve': {
    title: 'Mars over Venus',
    detail: 'Mars and Venus do not like to be parted. Shared house means physical pull, whatever the rest of the biography says.',
    tone: 'supportive',
    weight: -1,
  },
  'Mo-Ve': {
    title: 'Moon over Venus',
    detail: 'Feeling and affection meet. This is one of the combinations experienced counselors weigh most for a marriage that can be lived in.',
    tone: 'supportive',
    weight: -1,
  },
  'Ju-Mo': {
    title: 'Jupiter over Moon',
    detail: 'Support. One mind experiences the other as on their side. Thought-match of this kind can hold a marriage when other charts are rough.',
    tone: 'supportive',
    weight: -1.5,
  },
  'Mo-Ra': {
    title: 'Rahu over Moon',
    detail: 'Attraction runs on illusion and intensity. It can start a marriage. Check Navamsha before calling it stable.',
    tone: 'mixed',
    weight: 0.5,
  },
  'Ra-Ve': {
    title: 'Rahu over Venus',
    detail: 'Desire is amplified and a little unreal. The bond can form easily and then demand a reality check.',
    tone: 'mixed',
    weight: 0.5,
  },
  'Ju-Ra': {
    title: 'Rahu over Jupiter',
    detail: 'Belief gets inflated. One follows a rule, the other follows a feeling. Faith can still hold them if it is named.',
    tone: 'mixed',
    weight: 0.5,
  },
  'Ra-Sa': {
    title: 'Saturn over Rahu',
    detail: 'A binding obsession. They can become each other’s habit, which is loyalty or addiction depending on the rest of the chart.',
    tone: 'mixed',
    weight: 0.5,
  },
  'Ma-Me': {
    title: 'Mars over Mercury',
    detail: 'Anger is often turned into a joke. Useful in a fight, sharp on the skin and the nerves if it never rests.',
    tone: 'mixed',
    weight: 0,
  },
}

const VARGA_META: { code: string; name: string; purpose: string }[] = [
  { code: 'D1', name: 'D1 Rashi', purpose: 'Overall energy and whether one chart drains the other' },
  { code: 'D9', name: 'D9 Navamsha', purpose: 'Marriage fruit and physical bond. If this fails, stop and say so' },
  { code: 'D3', name: 'D3 Drekkana', purpose: 'Thought. If thinking matches, a marriage can survive other cracks' },
  { code: 'D4', name: 'D4 Chaturthamsha', purpose: 'Home. Couples live in a house, not in a job title' },
  { code: 'D2', name: 'D2 Hora', purpose: 'Money between them' },
  { code: 'D7', name: 'D7 Saptamsha', purpose: 'Children, and third-party pressure around the family' },
  { code: 'D10', name: 'D10 Dashamsha', purpose: 'Career. Separate charts here often mean both can work' },
  { code: 'D16', name: 'D16 Shodashamsha', purpose: 'Vehicles and comforts' },
  { code: 'D27', name: 'D27 Bhamsha', purpose: 'Hidden strength, weakness, and scandal-prone overlap' },
]

const COMPLEMENT: Record<string, { tone: LifeTone; note: string }> = {
  'Ma-Ve': { tone: 'supportive', note: 'Venus and Mars complement. Desire and affection can feed each other.' },
  'Mo-Ve': { tone: 'supportive', note: 'Venus and Moon complement. Feeling and charm share a rhythm.' },
  'Mo-Ra': { tone: 'supportive', note: 'Moon and Rahu complement. Emotion and hunger can move together. Keep the illusion honest.' },
  'Ju-Su': { tone: 'supportive', note: 'Jupiter and Sun are very complementary. Vitality and wisdom point the same way.' },
  'Ju-Sa': { tone: 'caution', note: 'Jupiter and Saturn do not complement. One expands, the other contracts. Living inside both dashas at once is a strain, not a balance.' },
}

function pairKey(a: GrahaId, b: GrahaId): string {
  return a < b ? `${a}-${b}` : `${b}-${a}`
}

function classical(chartGrahas: GrahaData[]): GrahaData[] {
  return chartGrahas.filter(g => CLASSICAL.includes(g.id))
}

function markOf(g: GrahaData | undefined): number {
  if (!g) return 0
  let score = 3
  if (g.dignity && STRONG.includes(g.dignity)) score = 5
  else if (g.dignity && FRIEND.includes(g.dignity)) score = 4
  else if (g.dignity === 'debilitated') score = 1
  else if (g.dignity && ENEMY.includes(g.dignity)) score = 2
  if (g.isCombust) score = Math.max(1, score - 1)
  return score
}

function toneFromScore(score: number): LifeTone {
  if (score >= 7) return 'supportive'
  if (score <= 4) return 'caution'
  return 'mixed'
}

function find(grahas: GrahaData[], id: GrahaId): GrahaData | undefined {
  return grahas.find(g => g.id === id)
}

function byHouse(grahas: GrahaData[], lagna: number): Map<number, GrahaData[]> {
  const map = new Map<number, GrahaData[]>()
  for (const g of classical(grahas)) {
    const h = wholeSignHouse(g.rashi, lagna)
    const list = map.get(h) ?? []
    list.push(g)
    map.set(h, list)
  }
  return map
}

function houseExtra(code: string, house: number, a: GrahaId, b: GrahaId): string {
  const key = pairKey(a, b)
  if (code === 'D9' && house === 3 && key === 'Ke-Ve') return 'A sister interferes in the marriage.'
  if (code === 'D4' && key === 'Ke-Su') return 'One person wants the other to leave the house.'
  if (code === 'D4' && key === 'Mo-Sa') return 'The home drains the Moon. Changing residence eases it. A separate kitchen eases a mother-in-law fight.'
  if (code === 'D7' && key === 'Ke-Ve') return 'Love can exist. A child from this bond does not.'
  if (code === 'D2' && key === 'Ra-Su') return 'The wedding itself costs heavily.'
  if (code === 'D9' && key === 'Ju-Ve') return 'The problem gets solved by spending money.'
  if (house === 8 && (a === 'Ju' || b === 'Ju') && (code === 'D2' || code === 'D9' || code === 'D4')) {
    return 'Health wears in this house.'
  }
  return ''
}

export function overlayCharts(
  grahasA: GrahaData[],
  lagnaA: number,
  grahasB: GrahaData[],
  lagnaB: number,
  nameA: string,
  nameB: string,
  code = 'D1',
): MatchHit[] {
  const ha = byHouse(grahasA, lagnaA)
  const hb = byHouse(grahasB, lagnaB)
  const hits: MatchHit[] = []
  for (let house = 1; house <= 12; house++) {
    const left = ha.get(house) ?? []
    const right = hb.get(house) ?? []
    if (!left.length || !right.length) continue
    for (const a of left) {
      for (const b of right) {
        if (a.id === b.id) {
          hits.push({
            id: `same-${a.id}-h${house}`,
            house,
            title: `${GRAHA_NAMES[a.id]} on ${GRAHA_NAMES[a.id]} · house ${house}`,
            detail: `Both charts place ${GRAHA_NAMES[a.id]} in house ${house}. That theme is steady between them, without adding a second quality.`,
            tone: 'supportive',
            weight: -0.5,
          })
          continue
        }
        const effect = OVERLAY[pairKey(a.id, b.id)]
        const title = effect?.title ?? `${GRAHA_NAMES[a.id]} on ${GRAHA_NAMES[b.id]}`
        const extra = houseExtra(code, house, a.id, b.id)
        const ketuPanic = !effect && (a.id === 'Ke' || b.id === 'Ke')
          ? `Panic sits on ${GRAHA_NAMES[a.id === 'Ke' ? b.id : a.id]}.`
          : ''
        hits.push({
          id: `${pairKey(a.id, b.id)}-h${house}-${code}`,
          house,
          title: `${title} · house ${house}`,
          detail: [
            `${nameA}’s ${GRAHA_NAMES[a.id]} falls on ${nameB}’s ${GRAHA_NAMES[b.id]} in house ${house}.`,
            effect?.detail ?? '',
            ketuPanic,
            extra,
            effect && effect.tone === 'caution' ? `${nameB}’s ${GRAHA_NAMES[b.id]} is the one that tires.` : '',
          ].filter(Boolean).join(' '),
          tone: effect?.tone ?? 'mixed',
          weight: effect?.weight ?? 0.25,
        })
      }
    }
  }
  const rank = { caution: 0, mixed: 1, supportive: 2 }
  hits.sort((x, y) => rank[x.tone] - rank[y.tone] || y.weight - x.weight)
  return hits
}

function scoreHits(hits: MatchHit[]): number {
  let score = 7
  for (const h of hits) score -= h.weight
  return Math.max(0, Math.min(10, Math.round(score * 10) / 10))
}

function vargaBundle(chart: ChartOutput, code: string): { grahas: GrahaData[]; lagna: number } | null {
  if (code === 'D1') {
    const lagna = chart.lagnas?.ascRashi
    if (!lagna || !chart.grahas?.length) return null
    return { grahas: chart.grahas, lagna }
  }
  const grahas = chart.vargas?.[code]
  const lagna = chart.vargaLagnas?.[code]
  if (!grahas?.length || !lagna) return null
  return { grahas, lagna }
}

export function dashaComplement(lordA: string, lordB: string): { tone: LifeTone; note: string } {
  const key = pairKey(lordA as GrahaId, lordB as GrahaId)
  if (lordA === lordB) {
    return {
      tone: 'mixed',
      note: `Both are in ${GRAHA_NAMES[lordA as GrahaId] ?? lordA} dasha. The periods match. The bond is comfortable, and it does not gain a second quality from the timing.`,
    }
  }
  return COMPLEMENT[key] ?? {
    tone: 'mixed',
    note: `${GRAHA_NAMES[lordA as GrahaId] ?? lordA} with ${GRAHA_NAMES[lordB as GrahaId] ?? lordB}. This pair has no stored complement and no stored clash.`,
  }
}

function currentMaha(chart: ChartOutput): string | null {
  const nodes = chart.dashas?.vimshottari
  if (!nodes?.length) return null
  return getDashaPathAt(nodes)[0]?.lord ?? null
}

function planetLine(id: GrahaId, chart: ChartOutput, name: string): string {
  const g = find(chart.grahas, id)
  if (!g || !chart.lagnas?.ascRashi) return `${name}: ${GRAHA_NAMES[id]} missing`
  const house = wholeSignHouse(g.rashi, chart.lagnas.ascRashi)
  return `${name}: ${GRAHA_NAMES[id]} in ${RASHI_NAMES[g.rashi as Rashi]} · house ${house} · ${markOf(g)}/5`
}

export function analyzeMatchMaking(chartA: ChartOutput, chartB: ChartOutput): MatchMakingResult | null {
  const ascA = chartLagnasSafe(chartA)
  const ascB = chartLagnasSafe(chartB)
  if (!ascA || !ascB) return null
  const nameA = chartA.meta?.name || 'Person 1'
  const nameB = chartB.meta?.name || 'Person 2'

  const lagna = lagnaMatch(ascA, ascB)
  const elementNote = lagnaElementNote(ascA, ascB)
  const fourthA = wholeSignHouseSign(ascA, 4)
  const fourthB = wholeSignHouseSign(ascB, 4)
  const fourthPair = lagnaMatch(fourthA, fourthB)
  const fourthHouse = `4th-house signs are ${RASHI_NAMES[fourthA]} and ${RASHI_NAMES[fourthB]} (${fourthPair.level}). ${fourthPair.reason}`

  const marsA = markOf(find(chartA.grahas, 'Ma'))
  const marsB = markOf(find(chartB.grahas, 'Ma'))
  const marsGap = Math.abs(marsA - marsB)
  const marsTone: LifeTone = marsGap >= 3 ? 'caution' : marsGap === 0 ? 'mixed' : 'supportive'
  const marsDetail = [
    planetLine('Ma', chartA, nameA) + '. ' + planetLine('Ma', chartB, nameB) + '.',
    marsGap >= 3
      ? `Body energy splits (${marsA}/5 against ${marsB}/5). Desire is not shared at the same pitch, so satisfaction is the first place this match strains.`
      : marsGap === 0
        ? `Both Mars marks are ${marsA}/5. The heat matches. Neither chart is adding a different physical tempo.`
        : `Mars marks are ${marsA}/5 and ${marsB}/5. Close enough to live in the same body-rhythm.`,
  ].join(' ')

  const venusA = markOf(find(chartA.grahas, 'Ve'))
  const venusB = markOf(find(chartB.grahas, 'Ve'))
  const sunA = markOf(find(chartA.grahas, 'Su'))
  const sunB = markOf(find(chartB.grahas, 'Su'))

  const moonA = find(chartA.grahas, 'Mo')
  const moonB = find(chartB.grahas, 'Mo')
  const moon = moonEmotionalPair(
    moonA?.rashi ?? 1,
    moonB?.rashi ?? 1,
    !!(moonA && find(chartA.grahas, 'Sa') && moonA.rashi === find(chartA.grahas, 'Sa')!.rashi) ||
      !!(moonB && find(chartB.grahas, 'Sa') && moonB.rashi === find(chartB.grahas, 'Sa')!.rashi),
  )

  const d9 = buildVarga(chartA, chartB, 'D9', nameA, nameB)
  const d9LagnaNote = d9
    ? lagnaMatch(
        chartA.vargaLagnas?.D9 ?? ascA,
        chartB.vargaLagnas?.D9 ?? ascB,
      )
    : null
  const marsVenusSeventh = d9SeventhSpark(chartA, chartB, nameA, nameB)

  const mahaA = currentMaha(chartA)
  const mahaB = currentMaha(chartB)
  const dasha = mahaA && mahaB
    ? dashaComplement(mahaA, mahaB)
    : { tone: 'mixed' as LifeTone, note: 'Vimshottari is not on both charts, so the current periods cannot be compared yet.' }

  const vargas: VargaOverlay[] = VARGA_META.map(meta => {
    const built = buildVarga(chartA, chartB, meta.code, nameA, nameB)
    if (!built) {
      return {
        ...meta,
        score: null,
        tone: 'mixed' as LifeTone,
        summary: `${meta.name} is not on both charts.`,
        hits: [],
      }
    }
    const score = scoreHits(built)
    return {
      ...meta,
      score,
      tone: toneFromScore(score),
      summary: built.length
        ? `${built.length} house overlap${built.length === 1 ? '' : 's'}. Score ${score}/10.`
        : meta.code === 'D10'
          ? `No planet falls on a planet in D10. Score ${score}/10. Both can keep a career.`
          : `No planet falls on a planet by house in ${meta.name}. Score ${score}/10.`,
      hits: built.slice(0, 8),
    }
  })

  const d9Score = vargas.find(v => v.code === 'D9')?.score
  const d4Score = vargas.find(v => v.code === 'D4')?.score

  const steps: MatchStep[] = [
    { order: 1, id: 'mars', title: 'Mars — body and energy', mark: `${marsA}/5 · ${marsB}/5`, tone: marsTone, detail: marsDetail },
    {
      order: 2,
      id: 'venus',
      title: 'Venus — affection',
      mark: `${venusA}/5 · ${venusB}/5`,
      tone: Math.abs(venusA - venusB) >= 3 ? 'caution' : 'mixed',
      detail: `${planetLine('Ve', chartA, nameA)}. ${planetLine('Ve', chartB, nameB)}. ${Math.abs(venusA - venusB) >= 3 ? `Affection is uneven (${venusA}/5 against ${venusB}/5). One person is living a richer Venus.` : `Affection marks are ${venusA}/5 and ${venusB}/5.`}`,
    },
    {
      order: 3,
      id: 'sun',
      title: 'Sun — vitality and ego',
      mark: `${sunA}/5 · ${sunB}/5`,
      tone: Math.abs(sunA - sunB) >= 3 ? 'caution' : 'mixed',
      detail: `${planetLine('Su', chartA, nameA)}. ${planetLine('Su', chartB, nameB)}. ${Math.abs(sunA - sunB) >= 3 ? `Vitality splits (${sunA}/5 against ${sunB}/5). Ego and life-force are not at the same strength.` : `Sun marks are ${sunA}/5 and ${sunB}/5.`}`,
    },
    {
      order: 4,
      id: 'moon',
      title: 'Moon — thought and feeling',
      mark: moon.title,
      tone: moon.tone,
      detail: `${moon.signA} and ${moon.signB}. ${moon.detail}`,
    },
    {
      order: 5,
      id: 'navamsha',
      title: 'Navamsha — physical fruit',
      mark: d9Score == null ? 'D9 missing' : `${d9Score}/10`,
      tone: d9Score == null ? 'mixed' : toneFromScore(d9Score),
      detail: [
        d9LagnaNote ? `D9 lagnas ${d9LagnaNote.nameA} and ${d9LagnaNote.nameB}: ${d9LagnaNote.level}. ${d9LagnaNote.reason}` : 'D9 lagnas are not both available.',
        marsVenusSeventh,
        d9Score != null && d9Score <= 4 ? `Navamsha scores ${d9Score}/10. Physical fruit does not carry this match.` : '',
      ].filter(Boolean).join(' '),
    },
    {
      order: 6,
      id: 'dasha',
      title: 'Dasha — complementary periods',
      mark: mahaA && mahaB ? `${GRAHA_NAMES[mahaA as GrahaId] ?? mahaA} × ${GRAHA_NAMES[mahaB as GrahaId] ?? mahaB}` : '—',
      tone: dasha.tone,
      detail: dasha.note,
    },
    {
      order: 7,
      id: 'd1',
      title: 'Rashi overlap — house first',
      mark: vargas[0]?.score == null ? '—' : `${vargas[0].score}/10`,
      tone: vargas[0]?.tone ?? 'mixed',
      detail: `${lagna.nameA} lagna with ${lagna.nameB} lagna is ${lagna.level}. ${lagna.reason}${elementNote ? ` ${elementNote}` : ''}`,
    },
    {
      order: 8,
      id: 'd4',
      title: 'D4 — the house they actually live in',
      mark: d4Score == null ? 'D4 missing' : `${d4Score}/10`,
      tone: d4Score == null ? 'mixed' : toneFromScore(d4Score),
      detail: fourthHouse,
    },
  ]

  const axis = seventhAxisMatch(chartA, chartB)
  if (axis) {
    steps.push({
      order: 9,
      id: 'axis',
      title: 'Aries–Libra — the relationship debt',
      mark: axis.mark,
      tone: axis.tone,
      detail: axis.detail,
    })
  }

  const pillars = [
    pillar('bed', 'Physical bond', vargas.find(v => v.code === 'D9')),
    pillar('mind', 'Understanding', vargas.find(v => v.code === 'D3')),
    pillar('money', 'Money', vargas.find(v => v.code === 'D2')),
    pillar('others', 'Other people', vargas.find(v => v.code === 'D7')),
  ]

  const weak = vargas.filter(v => v.score != null && v.score <= 4).map(v => v.code)
  const headline = weak.includes('D9')
    ? 'Navamsha does not carry this match'
    : lagna.tone === 'caution' && marsTone === 'caution'
      ? 'Lagna and Mars both ask for a stop'
      : lagna.tone === 'supportive' && (d9Score == null || d9Score >= 6)
        ? 'This pair can support a match'
        : 'This pair is mixed'

  const summary = [
    `${nameA} and ${nameB}: ${lagna.nameA} lagna with ${lagna.nameB} lagna is ${lagna.level}.`,
    marsGap >= 3 ? `Mars splits ${marsA}/5 against ${marsB}/5. Body energy is the first fracture.` : `Mars marks are ${marsA}/5 and ${marsB}/5.`,
    weak.length ? `Weak divisions: ${weak.join(', ')}.` : 'No division is in the refusal band.',
  ].join(' ')

  return {
    headline,
    summary,
    steps,
    lagna,
    elementNote,
    fourthHouse,
    vargas,
    pillars,
  }
}

function pillar(
  id: string,
  title: string,
  varga: VargaOverlay | undefined,
): { id: string; title: string; mark: string; tone: LifeTone; detail: string } {
  if (!varga || varga.score == null) {
    return { id, title, mark: '—', tone: 'mixed', detail: `${title} cannot be scored. ${varga?.name ?? 'That division'} is missing on one chart.` }
  }
  const named = varga.hits.slice(0, 2).map(h => h.title).join('; ')
  return {
    id,
    title,
    mark: `${varga.score}/10`,
    tone: varga.tone,
    detail: named
      ? `${title} scores ${varga.score}/10. ${named}.`
      : `${title} scores ${varga.score}/10. No planet falls on a planet in this division.`,
  }
}

function chartLagnasSafe(chart: ChartOutput): number | null {
  return chart.lagnas?.ascRashi ?? null
}

function buildVarga(
  chartA: ChartOutput,
  chartB: ChartOutput,
  code: string,
  nameA: string,
  nameB: string,
): MatchHit[] | null {
  const a = vargaBundle(chartA, code)
  const b = vargaBundle(chartB, code)
  if (!a || !b) return null
  return overlayCharts(a.grahas, a.lagna, b.grahas, b.lagna, nameA, nameB, code)
}

function d9SeventhSpark(chartA: ChartOutput, chartB: ChartOutput, nameA: string, nameB: string): string {
  const a = vargaBundle(chartA, 'D9')
  const b = vargaBundle(chartB, 'D9')
  if (!a || !b) return 'D9 planets are not both available, so the 7th-house Mars–Venus spark cannot be checked.'
  const marsIn7 = (bundle: { grahas: GrahaData[]; lagna: number }) =>
    classical(bundle.grahas).some(g => g.id === 'Ma' && wholeSignHouse(g.rashi, bundle.lagna) === 7)
  const venusIn7 = (bundle: { grahas: GrahaData[]; lagna: number }) =>
    classical(bundle.grahas).some(g => g.id === 'Ve' && wholeSignHouse(g.rashi, bundle.lagna) === 7)
  const sunIn1 = (bundle: { grahas: GrahaData[]; lagna: number }) =>
    classical(bundle.grahas).some(g => g.id === 'Su' && wholeSignHouse(g.rashi, bundle.lagna) === 1)
  const marsIn1 = (bundle: { grahas: GrahaData[]; lagna: number }) =>
    classical(bundle.grahas).some(g => g.id === 'Ma' && wholeSignHouse(g.rashi, bundle.lagna) === 1)
  const bits: string[] = []
  if ((marsIn7(a) && venusIn7(b)) || (marsIn7(b) && venusIn7(a))) {
    bits.push(`Mars in one Navamsha 7th and Venus in the other: ${nameA} and ${nameB} have the inseparable physical pair. Outside status from the Rashi chart will not cancel that pull.`)
  }
  if ((sunIn1(a) && marsIn1(b)) || (sunIn1(b) && marsIn1(a))) {
    bits.push('Sun in one Navamsha lagna and Mars in the other is a complementary heat.')
  }
  if (!bits.length) bits.push('No Sun–Mars lagna pair or Mars–Venus 7th pair is sitting on the Navamsha. Physical pull has to come from the other overlaps.')
  return bits.join(' ')
}
