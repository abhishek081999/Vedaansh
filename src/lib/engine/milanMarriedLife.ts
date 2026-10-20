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
    detail = 'Capricorn confronts directly. Scorpio mutters, holds the grudge, and does not say the need in words. The result is sweet-and-sour: anxiety and overthinking, until the Capricorn Moon slowly learns what was never spoken.'
  } else if (key === '2-3') {
    title = 'Taurus and Gemini'
    tone = 'supportive'
    detail = 'Gemini and Taurus are friends by rulership (Mercury and Venus). Emotional compatibility is natural: talk, taste, and small pleasures. Taurus usually has the resources; Gemini wants the outing and the small treat.'
  } else if (key === '3-12') {
    title = 'Gemini and Pisces'
    tone = 'supportive'
    detail = 'Gemini and Pisces match in the Jaimini sense: both get lost in thought and in writing. The emotional bond is mental and imaginal rather than blunt.'
  } else if (key === '2-4') {
    title = 'Taurus and Cancer'
    tone = 'supportive'
    detail = 'The Moon is exalted in Taurus, so Cancer is comfortable there. Taurus supplies the resources Cancer keeps needing. Taurus still needs affection that is not a price tag, and Cancer needs the credit said out loud.'
  } else if (key === '4-5') {
    title = 'Cancer and Leo'
    tone = 'supportive'
    detail = 'Both are royal. Leo treats the spouse as a matter of pride and can take the stand Cancer needs. When they agree, the pair is hard to move.'
  } else if (key === '9-11') {
    title = 'Sagittarius and Aquarius'
    tone = 'supportive'
    detail = 'Aquarius brings the material means and looks toward a spiritual lead. Sagittarius brings the ethic and the direction. One drives. The other knows which door is the temple.'
  } else if ((signA === 3 && signB === 1) || (signB === 3 && signA === 1)) {
    title = 'Gemini and Aries'
    tone = 'caution'
    detail = 'Aries needs conflict to settle its heat. Gemini lives in imagination and will not keep a strict routine. Mars and Mercury do not share a frequency. The harder strain sits on the Gemini Moon.'
  } else if ((signA === 3 && MARS_SIGNS.has(signB)) || (signB === 3 && MARS_SIGNS.has(signA))) {
    title = 'Gemini and a Mars sign'
    tone = 'caution'
    detail = 'Jaimini matching is wary of Gemini with Mars-ruled signs (Aries or Scorpio). Speech and strategy rub against heat and secrecy. Feelings are not automatically hostile, but they do not translate cleanly.'
  } else {
    const rel = signRel(signA, signB)
    if (rel === 1) {
      title = 'Same Moon sign'
      tone = 'mixed'
      detail = `${nameA} with ${nameA} feels familiar immediately. The mirror is comforting and, over time, short on contrast.`
    } else if (rel === 5 || rel === 9) {
      title = 'Trine Moons'
      tone = 'supportive'
      detail = `${nameA} and ${nameB} are in trine. Emotional weather agrees without a long translation.`
    } else if (rel === 7) {
      title = 'Opposite Moons'
      tone = 'mixed'
      detail = `${nameA} opposite ${nameB} is attraction with polarity. Each supplies what the other lacks, and each can feel the other is “too much.”`
    } else if (rel === 3 || rel === 11) {
      title = 'Friendly Moons'
      tone = 'supportive'
      detail = `${nameA} and ${nameB} sit in a 3/11 relationship. Friendship inside the marriage is easier than drama.`
    } else if (rel === 6 || rel === 8) {
      title = '6/8 Moon friction'
      tone = 'caution'
      detail = `${nameA} and ${nameB} are in a 6th/8th link. Anxiety, mismatch of timing, and health-or-crisis topics enter the emotional field.`
    } else if (rel === 4 || rel === 10) {
      title = 'Square Moons'
      tone = 'caution'
      detail = `${nameA} and ${nameB} square each other. Needs are real on both sides and are not met by assuming the other “should just know.”`
    } else {
      title = 'Adjacent Moons'
      tone = 'mixed'
      detail = `${nameA} and ${nameB} are adjacent. One nurtures, the other reaches. It works when the giving is named.`
    }
  }

  if (saturnOnMoon) {
    detail += ' Saturn on a Moon replays old arguments. The past is not left in the past unless someone agrees to stop reopening it.'
    if (key === '2-3') {
      detail += ' With Saturn on the Gemini Moon, the wish is still to go out and be fed small pleasures; Taurus can meet that if it does not become the only love language.'
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
      ? `${name}'s 10th is clear of malefics — career pressure and the mother-in-law story are not the sharp problem in this chart.`
      : null
  }
  const who = snap.malefics.join(', ')
  if (female) {
    return `${name}'s 10th holds ${who}. For a bride this is career strain and the classical mark of a difficult mother-in-law.`
  }
  return `${name}'s 10th holds ${who}. Read this as public and career pressure. The mother-in-law is judged more cleanly from the bride's 10th.`
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
    homeReading = 'Both 4th houses are relatively clear. Domestic peace is available if speech stays kind.'
  } else if (homeA.tone === 'caution' && homeB.tone === 'caution') {
    homeReading = 'Both 4th houses are under stress. The home itself is the argument — matching only the 7th will miss this.'
  } else if (homeA.tone === 'caution') {
    homeReading = `${nameA} carries more domestic friction into the marriage than ${nameB}. The quieter chart cannot “fix” a wounded 4th by affection alone.`
  } else if (homeB.tone === 'caution') {
    homeReading = `${nameB} carries more domestic friction into the marriage than ${nameA}. Look at the 4th before calling the match easy.`
  } else {
    homeReading = 'The 4th houses are mixed. Home harmony will take deliberate care from both people.'
  }

  const brideA = opts.bride === 'a' || chartA.meta?.gender === 'female'
  const brideB = opts.bride === 'b' || chartB.meta?.gender === 'female'
  const milBits = [
    tenthMilLine(brideA ? { ...chartA, meta: { ...chartA.meta, gender: 'female' } } : chartA, tenthA, nameA),
    tenthMilLine(brideB ? { ...chartB, meta: { ...chartB.meta, gender: 'female' } } : chartB, tenthB, nameB),
  ].filter((s): s is string => !!s)

  if (!brideA && !brideB) {
    milBits.push('Mark which chart is the bride: her 10th house is the mother-in-law, and malefics there are the warning.')
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
      note += ` The gap is wide — one person feels this theme much more strongly.`
      tone = 'caution'
    } else if (d.score >= 7 && other.score >= 7) {
      note += ' Both charts support this theme.'
      tone = 'supportive'
    } else if (d.score <= 3 && other.score <= 3) {
      note += ' Both charts are thin here.'
      tone = 'caution'
    } else {
      note += ' Close enough to work if it is discussed.'
    }
    if (d.id === 'passion' && gap >= 4) {
      note += ' Mismatched desire is the practical risk: one presses, the other goes quiet.'
    }
    if (d.id === 'longevity' && d.score >= 6 && other.score >= 6) {
      note += ' Continuity is available from both 7th lords.'
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
    title: '4th house — the heart of the home',
    detail: homeReading,
    tone: homeTone,
  })
  findings.push({
    id: 'tenth',
    title: '10th house — career and mother-in-law',
    detail: milBits.join(' ') || 'Neither 10th is shouting. Still read the bride’s 10th for the mother-in-law and both careers before the wedding.',
    tone: tenthTone,
  })

  const passion = dimensions.find(d => d.id === 'passion')
  if (passion && passion.tone === 'caution') {
    findings.push({
      id: 'passion-gap',
      title: 'Passion is uneven',
      detail: passion.note,
      tone: 'caution',
    })
  }

  findings.push({
    id: 'proposal-a',
    title: `${nameA} — who brings the proposal`,
    detail: personA.proposal.detail,
    tone: 'mixed',
  })
  findings.push({
    id: 'proposal-b',
    title: `${nameB} — who brings the proposal`,
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
      title: 'Navamsha lagnas — the fruit',
      detail: `${nameA}'s D9 lagna is ${RASHI_NAMES[d9A]} and ${nameB}'s is ${RASHI_NAMES[d9B]} (${rel === 1 ? 'same sign' : `${rel}th relation`}). Guna scores do not replace this. The fruit of living together is read here; remedies still belong on each D1.`,
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
        title: `${link.helper} helps ${link.native} in crisis`,
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
      title: `${who} — intimate pressure`,
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
        ? 'At least one Venus–Mars pair falls in conjunction, trine, or opposition. Romance and heat can find each other. Gunas do not measure this.'
        : 'Venus and Mars across the two charts do not form a 1/5/7/9 link. Attraction may need time, ritual, and honesty rather than instant chemistry.',
      tone: spark ? 'supportive' : 'caution',
    })
  }

  const support = findings.filter(f => f.tone === 'supportive').length
  const caution = findings.filter(f => f.tone === 'caution').length
  const summary = [
    `Beyond the 36 gunas: ${nameA} and ${nameB} are read for flavor (Venus), passion (Mars), longevity (7th lord), blessing (Jupiter), and fruit (D9 lagna).`,
    moon.detail,
    homeReading,
    caution > support
      ? 'More cautions than supports — do not let a high guna total talk over the 4th, the 10th, and the 7th lord.'
      : support > caution
        ? 'The relationship layer is broadly supportive. Still name the cautions before a yes.'
        : 'The relationship layer is mixed. A conscious exchange can carry it; an unexamined match will repeat the chart.',
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
      reading: milBits.join(' ') || 'Read the bride’s 10th for the mother-in-law.',
      tone: tenthTone,
    },
    dimensions,
    findings,
    summary,
  }
}
