// src/lib/engine/milanMarriedLife.ts
// Kundali Milan layer beyond the 36 gunas:
// Moon-sign emotion, 4th-house home, bride's 10th (career and mother-in-law),
// and the flavor / passion / longevity reading of both charts.
// Pure engine — no React/DB.

import type { ChartOutput, Rashi } from '@/types/astrology'
import { RASHI_NAMES } from '@/types/astrology'
import {
  analyzeMarriedLife,
  marriageHouseSnapshot,
  type HouseSnapshot,
  type LifeTone,
  type MarriedLifeAnalysis,
  type MarriedLifeNote,
} from '@/lib/engine/marriedLifeAnalysis'
import { analyzeIntimateLife, dusthanaLinks } from '@/lib/engine/intimateLife'

export interface MoonPairReading {
  signA: string
  signB: string
  tone: LifeTone
  title: string
  detail: string
}

export interface DimensionCompare {
  id: string
  label: string
  scoreA: number
  scoreB: number
  note: string
  tone: LifeTone
}

export interface MilanMarriedLifeResult {
  personA: MarriedLifeAnalysis
  personB: MarriedLifeAnalysis
  nameA: string
  nameB: string
  moon: MoonPairReading
  home: { a: HouseSnapshot; b: HouseSnapshot; reading: string; tone: LifeTone }
  tenth: { a: HouseSnapshot; b: HouseSnapshot; reading: string; tone: LifeTone }
  dimensions: DimensionCompare[]
  findings: MarriedLifeNote[]
  summary: string
}

const MARS_SIGNS = new Set<number>([1, 8])

function signRel(a: number, b: number): number {
  return ((b - a + 12) % 12) + 1
}

function moonHasSaturn(chart: ChartOutput): boolean {
  const moon = chart.grahas.find(g => g.id === 'Mo')
  const saturn = chart.grahas.find(g => g.id === 'Sa')
  return !!moon && !!saturn && moon.rashi === saturn.rashi
}

/**
 * Emotional compatibility from the two Moon signs.
 * Includes the Capricorn–Scorpio, Gemini–Taurus, Gemini–Pisces,
 * and Gemini vs Mars-sign notes from relationship matching.
 */
export function moonEmotionalPair(signA: number, signB: number, saturnOnMoon = false): MoonPairReading {
  const nameA = RASHI_NAMES[signA as Rashi] ?? `R${signA}`
  const nameB = RASHI_NAMES[signB as Rashi] ?? `R${signB}`
  const key = signA < signB ? `${signA}-${signB}` : `${signB}-${signA}`

  let title = 'Moon-sign emotion'
  let detail = ''
  let tone: LifeTone = 'mixed'

  if (key === '8-10') {
    title = 'Capricorn and Scorpio'
    tone = 'mixed'
    detail = 'Capricorn tends to speak directly, while Scorpio often keeps feelings inside and may not put a need into words. The mix can feel sweet and sour, with some worry and overthinking, until the Capricorn Moon learns what has gone unsaid.'
  } else if (key === '2-3') {
    title = 'Taurus and Gemini'
    tone = 'supportive'
    detail = 'Gemini and Taurus are friends by rulership (Mercury and Venus). Emotional ease comes naturally through conversation, taste and small pleasures. Taurus often provides the resources; Gemini enjoys the outing and the small treat.'
  } else if (key === '3-12') {
    title = 'Gemini and Pisces'
    tone = 'supportive'
    detail = 'Gemini and Pisces match in the Jaimini sense: both can get lost in thought and in writing. The emotional bond is more imaginative and mental than blunt.'
  } else if (key === '2-4') {
    title = 'Taurus and Cancer'
    tone = 'supportive'
    detail = 'The Moon is exalted in Taurus, so Cancer feels at home there. Taurus offers the security Cancer looks for. Taurus still values affection that is freely given, and Cancer values appreciation said out loud.'
  } else if (key === '4-5') {
    title = 'Cancer and Leo'
    tone = 'supportive'
    detail = 'Both carry a quiet dignity. Leo takes pride in the partner and can offer the steady backing Cancer needs. When they agree, the pair is hard to move.'
  } else if (key === '9-11') {
    title = 'Sagittarius and Aquarius'
    tone = 'supportive'
    detail = 'Aquarius brings practical means and an interest in deeper meaning. Sagittarius brings values and direction. One often drives while the other keeps the shared purpose in view.'
  } else if ((signA === 3 && signB === 1) || (signB === 3 && signA === 1)) {
    title = 'Gemini and Aries'
    tone = 'caution'
    detail = 'Aries tends to settle heated feelings by talking them out directly. Gemini lives in imagination and may resist a strict routine. Mars and Mercury do not always share a rhythm, and the Gemini Moon may feel the strain more. Patience and clear agreements help.'
  } else if ((signA === 3 && MARS_SIGNS.has(signB)) || (signB === 3 && MARS_SIGNS.has(signA))) {
    title = 'Gemini and a Mars sign'
    tone = 'caution'
    detail = 'Jaimini matching is cautious about Gemini with Mars-ruled signs (Aries or Scorpio). Quick, talkative style can rub against heat and privacy. The feelings are not hostile, but they may not translate easily between you.'
  } else {
    const rel = signRel(signA, signB)
    if (rel === 1) {
      title = 'Same Moon sign'
      tone = 'mixed'
      detail = `${nameA} with ${nameA} feels familiar straight away. The mirror is comforting, though over time it can lack contrast.`
    } else if (rel === 5 || rel === 9) {
      title = 'Trine Moons'
      tone = 'supportive'
      detail = `${nameA} and ${nameB} are in trine. Moods and feelings tend to agree without much explaining.`
    } else if (rel === 7) {
      title = 'Opposite Moons'
      tone = 'mixed'
      detail = `${nameA} opposite ${nameB} is attraction with polarity. Each supplies what the other lacks, and each may sometimes feel the other is “too much.”`
    } else if (rel === 3 || rel === 11) {
      title = 'Friendly Moons'
      tone = 'supportive'
      detail = `${nameA} and ${nameB} sit in a 3rd/11th relationship, a friendly one. Friendship inside the marriage tends to come easily.`
    } else if (rel === 6 || rel === 8) {
      title = '6th/8th Moon friction'
      tone = 'caution'
      detail = `${nameA} and ${nameB} are in a 6th/8th link, which can feel like constant friction. Worry, mismatched timing and difficult topics may come up, and openness about them helps.`
    } else if (rel === 4 || rel === 10) {
      title = 'Square Moons'
      tone = 'caution'
      detail = `${nameA} and ${nameB} are in a square (4th/10th) relationship. Both have real needs, and they are best met by saying them aloud rather than hoping the other will “just know.”`
    } else {
      title = 'Adjacent Moons'
      tone = 'mixed'
      detail = `${nameA} and ${nameB} are in adjacent signs. One nurtures, the other reaches. It works well when the giving is acknowledged.`
    }
  }

  if (saturnOnMoon) {
    detail += ' Saturn on a Moon can replay old arguments. The past settles more easily when both agree to stop reopening it.'
    if (key === '2-3') {
      detail += ' With Saturn on the Gemini Moon, the wish is still to go out and enjoy small pleasures; Taurus can meet that, as long as it does not become the only way love is shown.'
    }
  }

  return { signA: nameA, signB: nameB, tone, title, detail }
}

function toneRank(t: LifeTone): number {
  if (t === 'supportive') return 2
  if (t === 'mixed') return 1
  return 0
}

function combineTone(a: LifeTone, b: LifeTone): LifeTone {
  const r = Math.min(toneRank(a), toneRank(b))
  if (r === 2) return 'supportive'
  if (r === 0) return 'caution'
  return 'mixed'
}

function tenthMilLine(chart: ChartOutput, snap: HouseSnapshot, name: string): string | null {
  const female = chart.meta?.gender === 'female'
  if (!female && snap.malefics.length === 0) return null
  if (snap.malefics.length === 0) {
    return female
      ? `${name}'s 10th house is clear of difficult planets, so career pressure and the bond with the mother-in-law are not a sharp point in this chart.`
      : null
  }
  const who = snap.malefics.join(', ')
  if (female) {
    return `${name}'s 10th house holds ${who}. Classically, for the bride this points to some career strain and a relationship with the mother-in-law that may need patience and goodwill.`
  }
  return `${name}'s 10th house holds ${who}. Read this as public and career pressure. The mother-in-law is read more cleanly from the bride's 10th house.`
}

export interface MilanMarriedLifeOptions {
  /** Which chart is the bride when gender is absent. */
  bride?: 'a' | 'b'
}

export function analyzeMilanMarriedLife(
  chartA: ChartOutput,
  chartB: ChartOutput,
  opts: MilanMarriedLifeOptions = {},
): MilanMarriedLifeResult | null {
  const personA = analyzeMarriedLife(chartA)
  const personB = analyzeMarriedLife(chartB)
  if (!personA || !personB) return null

  const nameA = chartA.meta?.name || 'Person 1'
  const nameB = chartB.meta?.name || 'Person 2'
  const moonA = chartA.grahas.find(g => g.id === 'Mo')
  const moonB = chartB.grahas.find(g => g.id === 'Mo')
  const signA = moonA?.rashi ?? 1
  const signB = moonB?.rashi ?? 1
  const moon = moonEmotionalPair(signA, signB, moonHasSaturn(chartA) || moonHasSaturn(chartB))

  const homeA = marriageHouseSnapshot(chartA, 4, `${nameA} — home`)
  const homeB = marriageHouseSnapshot(chartB, 4, `${nameB} — home`)
  const tenthA = marriageHouseSnapshot(chartA, 10, `${nameA} — 10th`)
  const tenthB = marriageHouseSnapshot(chartB, 10, `${nameB} — 10th`)

  let homeReading: string
  const homeTone = combineTone(homeA.tone, homeB.tone)
  if (homeA.tone === 'supportive' && homeB.tone === 'supportive') {
    homeReading = 'Both 4th houses are relatively clear. Domestic peace comes more easily when speech stays kind.'
  } else if (homeA.tone === 'caution' && homeB.tone === 'caution') {
    homeReading = 'Both 4th houses are under some stress, so home life itself may need care. Looking only at the 7th house would miss this.'
  } else if (homeA.tone === 'caution') {
    homeReading = `${nameA} may bring more domestic strain into the marriage than ${nameB}. Affection helps, and so do shared routines and patience at home.`
  } else if (homeB.tone === 'caution') {
    homeReading = `${nameB} may bring more domestic strain into the marriage than ${nameA}, so the 4th house deserves attention.`
  } else {
    homeReading = 'The 4th houses are mixed. Home harmony will take deliberate care from both of you.'
  }

  const brideA = opts.bride === 'a' || chartA.meta?.gender === 'female'
  const brideB = opts.bride === 'b' || chartB.meta?.gender === 'female'
  const milBits = [
    tenthMilLine(brideA ? { ...chartA, meta: { ...chartA.meta, gender: 'female' } } : chartA, tenthA, nameA),
    tenthMilLine(brideB ? { ...chartB, meta: { ...chartB.meta, gender: 'female' } } : chartB, tenthB, nameB),
  ].filter((s): s is string => !!s)

  if (!brideA && !brideB) {
    milBits.push('Choose which chart is the bride: her 10th house is traditionally read for the mother-in-law, and difficult planets there suggest taking extra care.')
  }

  const tenthTone: LifeTone =
    (brideA && tenthA.malefics.length) || (brideB && tenthB.malefics.length)
      ? 'caution'
      : combineTone(tenthA.tone, tenthB.tone)

  const dimensions: DimensionCompare[] = personA.dimensions.map((d, i) => {
    const other = personB.dimensions[i]
    const gap = Math.abs(d.score - other.score)
    let note = `${nameA} ${d.score}/10 · ${nameB} ${other.score}/10.`
    let tone: LifeTone = 'mixed'
    if (gap >= 4) {
      note += ' The gap is wide, so one of you may feel this theme much more strongly.'
      tone = 'caution'
    } else if (d.score >= 7 && other.score >= 7) {
      note += ' Both charts support this theme.'
      tone = 'supportive'
    } else if (d.score <= 3 && other.score <= 3) {
      note += ' Both charts are quiet on this theme, so it may need more conscious attention.'
      tone = 'caution'
    } else {
      note += ' Close enough to work well if it is talked about.'
    }
    if (d.id === 'passion' && gap >= 4) {
      note += ' Differing desire is the practical challenge: one may press while the other withdraws, so gentle talk helps.'
    }
    if (d.id === 'longevity' && d.score >= 6 && other.score >= 6) {
      note += ' Both 7th lords support lasting continuity.'
      tone = tone === 'caution' ? 'mixed' : 'supportive'
    }
    return { id: d.id, label: d.label, scoreA: d.score, scoreB: other.score, note, tone }
  })

  const findings: MarriedLifeNote[] = []
  findings.push({
    id: 'moon',
    title: moon.title,
    detail: `${moon.signA} Moon (${nameA}) with ${moon.signB} Moon (${nameB}). ${moon.detail}`,
    tone: moon.tone,
  })
  findings.push({
    id: 'home',
    title: '4th house: the heart of the home',
    detail: homeReading,
    tone: homeTone,
  })
  findings.push({
    id: 'tenth',
    title: '10th house: career and mother-in-law',
    detail: milBits.join(' ') || 'Neither 10th house stands out. The bride’s 10th house is still worth reading for the mother-in-law, along with both careers.',
    tone: tenthTone,
  })

  const passion = dimensions.find(d => d.id === 'passion')
  if (passion && passion.tone === 'caution') {
    findings.push({
      id: 'passion-gap',
      title: 'Passion levels differ',
      detail: passion.note,
      tone: 'caution',
    })
  }

  findings.push({
    id: 'proposal-a',
    title: `${nameA}: who brings the proposal`,
    detail: personA.proposal.detail,
    tone: 'mixed',
  })
  findings.push({
    id: 'proposal-b',
    title: `${nameB}: who brings the proposal`,
    detail: personB.proposal.detail,
    tone: 'mixed',
  })

  const d9A = chartA.vargaLagnas?.D9
  const d9B = chartB.vargaLagnas?.D9
  if (d9A && d9B) {
    const rel = signRel(d9A, d9B)
    const fruitTone: LifeTone = [1, 5, 7, 9].includes(rel) ? 'supportive' : [6, 8].includes(rel) ? 'caution' : 'mixed'
    findings.push({
      id: 'd9-fruit',
      title: 'Navamsha lagnas: the fruit of the marriage',
      detail: `${nameA}'s D9 lagna is ${RASHI_NAMES[d9A]} and ${nameB}'s is ${RASHI_NAMES[d9B]} (${rel === 1 ? 'same sign' : `${rel}th relation`}). Guna scores do not replace this. The Navamsha shows how living together tends to unfold, while any remedies are guided by each D1 chart.`,
      tone: fruitTone,
    })
  }

  // Cross Venus–Mars spark already lives in Deep Milan; add a one-line bridge.
  const veA = chartA.grahas.find(g => g.id === 'Ve')
  const maB = chartB.grahas.find(g => g.id === 'Ma')
  const veB = chartB.grahas.find(g => g.id === 'Ve')
  const maA = chartA.grahas.find(g => g.id === 'Ma')
  const ascA = chartA.lagnas?.ascRashi
  const ascB = chartB.lagnas?.ascRashi
  if (ascA && ascB) {
    for (const link of dusthanaLinks(nameA, ascA, nameB, ascB)) {
      findings.push({
        id: `dusthana-${link.native}`,
        title: `${link.helper} can support ${link.native} in hard times`,
        detail: link.detail,
        tone: 'mixed',
      })
    }
  }

  for (const [who, ch] of [[nameA, chartA], [nameB, chartB]] as const) {
    const intimate = analyzeIntimateLife(ch)
    if (!intimate) continue
    const sharp = intimate.notes.filter(n => n.tone === 'caution').slice(0, 2)
    if (!sharp.length) continue
    findings.push({
      id: `intimate-${who}`,
      title: `${who}: areas of intimate pressure`,
      detail: `${intimate.headline} ${sharp.map(n => n.title).join('. ')}.`,
      tone: 'caution',
    })
  }

  if (veA && maB && veB && maA) {
    const rel1 = signRel(veA.rashi, maB.rashi)
    const rel2 = signRel(veB.rashi, maA.rashi)
    const spark = [rel1, rel2].some(r => [1, 5, 7, 9].includes(r))
    findings.push({
      id: 'spark',
      title: 'Venus–Mars spark across the charts',
      detail: spark
        ? 'At least one Venus–Mars pair falls in conjunction, trine or opposition, so romance and warmth can find each other. Gunas do not measure this.'
        : 'Venus and Mars across the two charts do not form a 1st, 5th, 7th or 9th link. Attraction may grow through time, shared rituals and honesty rather than instant chemistry.',
      tone: spark ? 'supportive' : 'caution',
    })
  }

  const support = findings.filter(f => f.tone === 'supportive').length
  const caution = findings.filter(f => f.tone === 'caution').length
  const summary = [
    `Beyond the 36 gunas: ${nameA} and ${nameB} are read for flavor (Venus), passion (Mars), lasting continuity (7th lord), blessing (Jupiter) and the fruit of the marriage (D9 lagna).`,
    moon.detail,
    homeReading,
    caution > support
      ? 'There are more points to handle with care than points of support, so a high guna total is best read alongside the 4th house, the 10th house and the 7th lord.'
      : support > caution
        ? 'This layer of the match looks broadly supportive. It is still worth talking through the points of caution together.'
        : 'This layer of the match is mixed. Open, conscious communication can carry it well.',
  ].join(' ')

  return {
    personA,
    personB,
    nameA,
    nameB,
    moon,
    home: { a: homeA, b: homeB, reading: homeReading, tone: homeTone },
    tenth: {
      a: tenthA,
      b: tenthB,
      reading: milBits.join(' ') || 'The bride’s 10th house is traditionally read for the mother-in-law.',
      tone: tenthTone,
    },
    dimensions,
    findings,
    summary,
  }
}
