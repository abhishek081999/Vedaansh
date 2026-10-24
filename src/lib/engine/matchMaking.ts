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
    detail: 'The Moon feels weighed down. One person may correct, judge or cool the other’s feeling until emotional energy thins.',
    tone: 'caution',
    weight: 2,
  },
  'Me-Ra': {
    title: 'Rahu over Mercury',
    detail: 'Speech can pick up confusion. Misunderstandings, paperwork trouble and too much talk are the classical result, especially early in a marriage.',
    tone: 'caution',
    weight: 2,
  },
  'Ke-Ma': {
    title: 'Ketu over Mars',
    detail: 'Mars, the body and drive, can feel dried out. Vitality and desire may dip, and a person can feel flat in the area this house rules.',
    tone: 'caution',
    weight: 2,
  },
  'Ra-Su': {
    title: 'Rahu over Sun',
    detail: 'Ego against ego. Status, pride and “who is right” can become the argument.',
    tone: 'caution',
    weight: 1.5,
  },
  'Me-Sa': {
    title: 'Saturn over Mercury',
    detail: 'Playfulness fades. The bond can become serious too fast, and humor, which used to repair a quarrel, may stop working.',
    tone: 'caution',
    weight: 1.5,
  },
  'Sa-Su': {
    title: 'Saturn over Sun',
    detail: 'The Sun’s life-force feels pressed down. Confidence, health and authority in that house may tire first.',
    tone: 'caution',
    weight: 2,
  },
  'Me-Mo': {
    title: 'Mercury over Moon',
    detail: 'Too many data points. One partner speaks and the other hears something different, so the same complaint can be repeated.',
    tone: 'caution',
    weight: 1.5,
  },
  'Ke-Su': {
    title: 'Ketu over Sun',
    detail: 'Confidence may dip in the person whose Sun is covered, and they may stop taking a stand.',
    tone: 'caution',
    weight: 1.5,
  },
  'Ju-Sa': {
    title: 'Saturn over Jupiter',
    detail: 'Jupiter’s luck and Saturn’s hardship meet. Some people feel their fortune slowed after marriage under this overlap, especially if it touches the 9th house; patience and steady effort help.',
    tone: 'caution',
    weight: 2,
  },
  'Su-Ve': {
    title: 'Sun over Venus',
    detail: 'Ego sits on pleasure. Appreciation of the partner’s beauty and grace can be blocked, and one person may set the tone.',
    tone: 'caution',
    weight: 1.5,
  },
  'Sa-Ve': {
    title: 'Saturn over Venus',
    detail: 'Grace can thin after the wedding. Charm and romance fade sooner unless they are practiced on purpose.',
    tone: 'caution',
    weight: 1.5,
  },
  'Ma-Mo': {
    title: 'Mars over Moon',
    detail: 'Irritation. One partner’s words can keep poking at the other’s mood.',
    tone: 'caution',
    weight: 1.5,
  },
  'Ke-Mo': {
    title: 'Ketu over Moon',
    detail: 'Feeling detaches. One partner can seem physically present and emotionally elsewhere.',
    tone: 'caution',
    weight: 1.5,
  },
  'Ke-Me': {
    title: 'Ketu over Mercury',
    detail: 'Communication can break down. Words may not land, and the gap can widen over time unless it is talked about.',
    tone: 'caution',
    weight: 1.5,
  },
  'Ke-Ve': {
    title: 'Ketu over Venus',
    detail: 'Desire detaches. Attraction can start the bond and then leave affection feeling empty unless it is nurtured.',
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
    detail: 'Mars and Venus do not like to be parted. A shared house means physical pull, whatever the rest of the picture says.',
    tone: 'supportive',
    weight: -1,
  },
  'Mo-Ve': {
    title: 'Moon over Venus',
    detail: 'Feeling and affection meet. Classical texts rank this among the combinations that most favor a comfortable, livable marriage.',
    tone: 'supportive',
    weight: -1,
  },
  'Ju-Mo': {
    title: 'Jupiter over Moon',
    detail: 'Support. Each mind experiences the other as on their side. A thought-match like this can hold a marriage steady when other areas are rough.',
    tone: 'supportive',
    weight: -1.5,
  },
  'Mo-Ra': {
    title: 'Rahu over Moon',
    detail: 'Attraction runs on intensity and imagination. It can start a marriage, and whether it becomes steady depends on the Navamsha.',
    tone: 'mixed',
    weight: 0.5,
  },
  'Ra-Ve': {
    title: 'Rahu over Venus',
    detail: 'Desire is amplified and a little idealized. The bond can form easily and may later ask for a reality check.',
    tone: 'mixed',
    weight: 0.5,
  },
  'Ju-Ra': {
    title: 'Rahu over Jupiter',
    detail: 'Belief can get inflated. One follows a rule, the other follows a feeling. Shared faith can still hold things together if it is talked about.',
    tone: 'mixed',
    weight: 0.5,
  },
  'Ra-Sa': {
    title: 'Saturn over Rahu',
    detail: 'A strong bond of habit. They can become each other’s routine, which can mean loyalty or over-dependence depending on the rest of the chart.',
    tone: 'mixed',
    weight: 0.5,
  },
  'Ma-Me': {
    title: 'Mars over Mercury',
    detail: 'Anger often comes out as a joke. It can ease a quarrel, but it can feel sharp if it never rests.',
    tone: 'mixed',
    weight: 0,
  },
}

const VARGA_META: { code: string; name: string; purpose: string }[] = [
  { code: 'D1', name: 'D1 Rashi', purpose: 'Overall energy and whether one chart weighs on the other' },
  { code: 'D9', name: 'D9 Navamsha', purpose: 'The long-term fruit of the marriage and the physical bond' },
  { code: 'D3', name: 'D3 Drekkana', purpose: 'Shared thinking. When minds match, a marriage can weather other difficulties' },
  { code: 'D4', name: 'D4 Chaturthamsha', purpose: 'Home life: the house a couple actually lives in' },
  { code: 'D2', name: 'D2 Hora', purpose: 'Money between you' },
  { code: 'D7', name: 'D7 Saptamsha', purpose: 'Children, and outside influence around the family' },
  { code: 'D10', name: 'D10 Dashamsha', purpose: 'Career. Separate patterns here often mean both partners can work' },
  { code: 'D16', name: 'D16 Shodashamsha', purpose: 'Vehicles and comforts' },
  { code: 'D27', name: 'D27 Bhamsha', purpose: 'Hidden strengths and weaknesses' },
]

const COMPLEMENT: Record<string, { tone: LifeTone; note: string }> = {
  'Ma-Ve': { tone: 'supportive', note: 'Venus and Mars complement. Desire and affection can feed each other.' },
  'Mo-Ve': { tone: 'supportive', note: 'Venus and Moon complement. Feeling and charm share a rhythm.' },
  'Mo-Ra': { tone: 'supportive', note: 'Moon and Rahu complement. Emotion and drive can move together. Staying honest about illusion keeps it healthy.' },
  'Ju-Su': { tone: 'supportive', note: 'Jupiter and Sun are very complementary. Vitality and wisdom point the same way.' },
  'Ju-Sa': { tone: 'caution', note: 'Jupiter and Saturn do not complement. One expands, the other contracts. Living through both periods at once can feel like a strain rather than a balance.' },
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
  if (code === 'D9' && house === 3 && key === 'Ke-Ve') return 'A sibling’s influence may be felt in the marriage.'
  if (code === 'D4' && key === 'Ke-Su') return 'One person may wish for a separate living arrangement.'
  if (code === 'D4' && key === 'Mo-Sa') return 'The home can weigh on the Moon. A change of residence, or more separate space such as a separate kitchen, can ease family friction.'
  if (code === 'D7' && key === 'Ke-Ve') return 'The bond can be loving, though matters around children may need patience and care. Modern medical guidance can help alongside tradition.'
  if (code === 'D2' && key === 'Ra-Su') return 'The wedding itself may be costly, so planning the budget together helps.'
  if (code === 'D9' && key === 'Ju-Ve') return 'Difficulties tend to be eased through resources, so a shared budget helps.'
  if (house === 8 && (a === 'Ju' || b === 'Ju') && (code === 'D2' || code === 'D9' || code === 'D4')) {
    return 'Health in this area may need extra care.'
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
          ? `Ketu’s unsettling influence falls on ${GRAHA_NAMES[a.id === 'Ke' ? b.id : a.id]}.`
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
            effect && effect.tone === 'caution' ? `${nameB}’s ${GRAHA_NAMES[b.id]} may feel the strain.` : '',
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
      note: `Both are in ${GRAHA_NAMES[lordA as GrahaId] ?? lordA} dasha. The periods match, which feels comfortable and familiar; the timing adds no second quality.`,
    }
  }
  return COMPLEMENT[key] ?? {
    tone: 'mixed',
    note: `${GRAHA_NAMES[lordA as GrahaId] ?? lordA} with ${GRAHA_NAMES[lordB as GrahaId] ?? lordB}. This pairing has no particular classical complement or clash.`,
  }
}

function currentMaha(chart: ChartOutput): string | null {
  const nodes = chart.dashas?.vimshottari
  if (!nodes?.length) return null
  return getDashaPathAt(nodes)[0]?.lord ?? null
}

function planetLine(id: GrahaId, chart: ChartOutput, name: string): string {
  const g = find(chart.grahas, id)
  if (!g || !chart.lagnas?.ascRashi) return `${name}: ${GRAHA_NAMES[id]} not available`
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
      ? `Body energy differs (${marsA}/5 against ${marsB}/5). Desire may not be at the same pitch, so physical rhythm is one area where patience and open talk help.`
      : marsGap === 0
        ? `Both Mars marks are ${marsA}/5. The heat matches, and neither chart adds a different physical tempo.`
        : `Mars marks are ${marsA}/5 and ${marsB}/5. Close enough to share a similar body-rhythm.`,
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
    : { tone: 'mixed' as LifeTone, note: 'The Vimshottari dasha timeline is not available for both charts, so the current periods cannot be compared yet.' }

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
          ? `No planet falls on a planet in D10. Score ${score}/10. Both partners can keep their careers.`
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
      detail: `${planetLine('Ve', chartA, nameA)}. ${planetLine('Ve', chartB, nameB)}. ${Math.abs(venusA - venusB) >= 3 ? `Affection strength differs (${venusA}/5 against ${venusB}/5). One partner may express Venus more easily.` : `Affection marks are ${venusA}/5 and ${venusB}/5.`}`,
    },
    {
      order: 3,
      id: 'sun',
      title: 'Sun — vitality and ego',
      mark: `${sunA}/5 · ${sunB}/5`,
      tone: Math.abs(sunA - sunB) >= 3 ? 'caution' : 'mixed',
      detail: `${planetLine('Su', chartA, nameA)}. ${planetLine('Su', chartB, nameB)}. ${Math.abs(sunA - sunB) >= 3 ? `Vitality differs (${sunA}/5 against ${sunB}/5). Confidence and life-force are not at the same strength.` : `Sun marks are ${sunA}/5 and ${sunB}/5.`}`,
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
      title: 'Navamsha — fruit of the marriage',
      mark: d9Score == null ? 'D9 unavailable' : `${d9Score}/10`,
      tone: d9Score == null ? 'mixed' : toneFromScore(d9Score),
      detail: [
        d9LagnaNote ? `D9 lagnas ${d9LagnaNote.nameA} and ${d9LagnaNote.nameB}: ${d9LagnaNote.level}. ${d9LagnaNote.reason}` : 'D9 lagnas are not both available.',
        marsVenusSeventh,
        d9Score != null && d9Score <= 4 ? `Navamsha scores ${d9Score}/10, a lower reading for the long-term fruit of the marriage. The other layers add context.` : '',
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
      title: 'D4 — the home you live in',
      mark: d4Score == null ? 'D4 unavailable' : `${d4Score}/10`,
      tone: d4Score == null ? 'mixed' : toneFromScore(d4Score),
      detail: fourthHouse,
    },
  ]

  const axis = seventhAxisMatch(chartA, chartB)
  if (axis) {
    steps.push({
      order: 9,
      id: 'axis',
      title: 'Aries–Libra — the partnership axis',
      mark: axis.mark,
      tone: axis.tone,
      detail: axis.detail,
    })
  }

  const pillars = [
    pillar('bed', 'Physical bond', vargas.find(v => v.code === 'D9')),
    pillar('mind', 'Understanding', vargas.find(v => v.code === 'D3')),
    pillar('money', 'Money', vargas.find(v => v.code === 'D2')),
    pillar('others', 'Family and outside influence', vargas.find(v => v.code === 'D7')),
  ]

  const weak = vargas.filter(v => v.score != null && v.score <= 4).map(v => v.code)
  const headline = weak.includes('D9')
    ? 'The Navamsha reading is on the lighter side'
    : lagna.tone === 'caution' && marsTone === 'caution'
      ? 'Lagna and Mars both suggest taking extra care'
      : lagna.tone === 'supportive' && (d9Score == null || d9Score >= 6)
        ? 'This pair shows supportive signs'
        : 'This pair shows a mixed picture'

  const summary = [
    `${nameA} and ${nameB}: ${lagna.nameA} lagna with ${lagna.nameB} lagna is ${lagna.level}.`,
    marsGap >= 3 ? `Mars strength differs (${marsA}/5 against ${marsB}/5), so body energy is one area to talk through.` : `Mars marks are ${marsA}/5 and ${marsB}/5.`,
    weak.length ? `Lighter readings in these divisions: ${weak.join(', ')}.` : 'No division shows a notably low reading.',
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
    return { id, title, mark: '—', tone: 'mixed', detail: `${title} cannot be scored. ${varga?.name ?? 'That division'} is not available for one of the charts.` }
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
    bits.push(`Mars in one Navamsha 7th house and Venus in the other: ${nameA} and ${nameB} share a strong physical pull, one that tends to hold regardless of the Rashi chart.`)
  }
  if ((sunIn1(a) && marsIn1(b)) || (sunIn1(b) && marsIn1(a))) {
    bits.push('Sun in one Navamsha lagna and Mars in the other is a complementary heat.')
  }
  if (!bits.length) bits.push('No Sun–Mars lagna pair or Mars–Venus 7th-house pair appears in the Navamsha, so physical pull comes from the other overlaps.')
  return bits.join(' ')
}
