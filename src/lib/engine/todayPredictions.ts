// ─────────────────────────────────────────────────────────────
//  src/lib/engine/todayPredictions.ts
//  House-by-house "what to expect today" built from the full natal
//  chart, not just the Moon:
//    natal promise   — Ashtakavarga (SAV), Shadbala of the house lord,
//                      Bhava Bala, lord dignity
//    live activation — transit planets in the house (BAV bindus of the
//                      transit sign + gochar from Moon), Parashari drishti
//                      onto the house, the house lord's own transit,
//                      the Moon as the day's trigger
//    dasha link      — houses ruled / occupied by the running dasha lords
//  Pure engine: no ephemeris, DB or React. Output is a ranked list of
//  tendencies with the reasons behind each, not fixed events.
// ─────────────────────────────────────────────────────────────

import type { GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'
import { hasParasharaAspect } from '@/lib/engine/aspects'
import { RASHI_LORDS } from '@/lib/engine/houseInterpretations'
import { houseFrom } from '@/lib/engine/gocharRules'
import type { DashaDay, GocharRow, MoonDay, TodayTransitGraha } from '@/lib/engine/todayReading'

// ── Input contracts ──────────────────────────────────────────

/** The slice of a calculated chart this engine reads. `ChartOutput` satisfies it. */
export interface PredictionNatalInput {
  grahas: GrahaData[]
  lagnas: { ascRashi: Rashi }
  shadbala?: { planets: Record<string, { ratio: number }> }
  /** BAV / SAV arrays are indexed by sign: index 0 = Aries. */
  ashtakavarga?: { bav: Record<string, { bindus: number[] }>; sav: number[] }
  bhavaBala?: { houses: Record<number, { isStrong: boolean }> }
  yogas?: Array<{ name: string; category: string; strength: string; planets: string[]; effect: string }>
}

export interface BuildPredictionsInput {
  natal: PredictionNatalInput
  transit: TodayTransitGraha[]
  /** Pieces of the day's reading this engine builds on (so rules are not recomputed). */
  reading: { moon: MoonDay; gochar: GocharRow[]; dasha: DashaDay[] }
  now?: Date
}

// ── Output contracts ─────────────────────────────────────────

export type Tone = 'favourable' | 'mixed' | 'challenging'
export type Confidence = 'high' | 'moderate' | 'low'
export type Promise3 = 'strong' | 'average' | 'weak'

export interface HouseInfluence {
  /** Short label such as "Jupiter occupies" or "Saturn aspects". */
  kind: 'occupies' | 'aspects' | 'lord' | 'moon' | 'dasha'
  planet: GrahaId
  /** Signed contribution to the house's day score. */
  delta: number
  /** Plain-language reason, already formatted for display. */
  text: string
}

export interface HouseActivation {
  house: number
  rashi: Rashi
  rashiName: string
  areaTitle: string
  lord: GrahaId
  lordHouse: number
  promise: Promise3
  promiseNote: string
  /** 5–95, 50 = neutral. */
  score: number
  net: number
  activity: number
  tone: Tone
  verdict: 'Favourable' | 'Mixed' | 'Challenging' | 'Quiet'
  influences: HouseInfluence[]
  dashaLinks: Array<{ lord: GrahaId; levelLabel: string; relation: 'rules' | 'sits in' }>
}

export interface DayPrediction {
  house: number
  title: string
  tone: Tone
  confidence: Confidence
  text: string
  because: string[]
  score: number
}

export interface MoonPhase {
  label: string
  untilIso: string | null
  rashiName: string
  house: number
  areaTitle: string
  tone: Tone
  text: string
}

export interface TodayPredictions {
  predictions: DayPrediction[]
  houses: HouseActivation[]
  phases: MoonPhase[]
  yogaNotes: string[]
}

// ── Static reference ─────────────────────────────────────────

const CORE: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']
const BAV_PLANETS = new Set<GrahaId>(['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa'])
const BENEFIC = new Set<GrahaId>(['Ju', 'Ve', 'Me', 'Mo'])

/** How strongly each transiting planet can move a house (slow planets matter most). */
const TRANSIT_WEIGHT: Record<string, number> = {
  Sa: 3, Ju: 3, Ma: 2, Ra: 2, Ke: 1.5, Su: 1.5, Ve: 2, Me: 1.5, Mo: 2.5,
}

const SAV_STRONG = 30
const SAV_WEAK = 24
const LEVEL_WEIGHT: Record<number, number> = { 1: 1, 2: 1.5, 3: 1.2, 4: 0.6 }

interface AreaPhrase { title: string; good: string; bad: string; busy: string }

const AREA: Record<number, AreaPhrase> = {
  1: { title: 'Self, health & vitality', good: 'confidence and energy run higher; a good day to take initiative on personal matters', bad: 'energy and confidence are tested; avoid overexertion and impulsive moves', busy: 'a lot of attention falls on you personally' },
  2: { title: 'Money, family & speech', good: 'money flow is steady and family conversations go smoothly', bad: 'watch spending and sharp words at home', busy: 'money and family matters are in play' },
  3: { title: 'Effort, communication & short trips', good: 'effort pays off; messages, negotiations and short trips go well', bad: 'scattered effort and mixed messages; re-read before you send', busy: 'communication and self-effort are in focus' },
  4: { title: 'Home, mother & peace of mind', good: 'domestic peace, comfort and support from family', bad: 'restlessness at home; postpone property and vehicle decisions', busy: 'home and inner peace are in focus' },
  5: { title: 'Creativity, study, children & romance', good: 'good for study, creative work, children and romance', bad: 'a distracted mind and stress around children or speculation; avoid gambling', busy: 'creativity, learning and the heart are in focus' },
  6: { title: 'Work routine, health & rivals', good: 'rivals lose steam, pending tasks clear and recovery is easier', bad: 'friction at work, minor health or debt worries; keep to routine', busy: 'daily work and obligations are in focus' },
  7: { title: 'Partnership, spouse & contracts', good: 'harmony with partner and clients; good for meetings and agreements', bad: 'friction with a partner or client; avoid signing hasty contracts', busy: 'partners and public dealings are in focus' },
  8: { title: 'Sudden change, research & shared money', good: 'insight and help from unexpected sources; good for research and deep work', bad: 'surprises and delays; avoid risk and protect your health', busy: 'hidden or unexpected matters surface' },
  9: { title: 'Luck, mentors & long journeys', good: 'luck and guidance from elders or teachers; good for learning and long-range plans', bad: 'luck feels slow; do not over-promise to mentors or elders', busy: 'fortune, belief and guidance are in focus' },
  10: { title: 'Career & public standing', good: 'recognition and progress at work; a good day for important professional steps', bad: 'pressure or delays at work; avoid confrontation with seniors', busy: 'career and reputation are in focus' },
  11: { title: 'Gains, income & networks', good: 'income, gains and help from friends and your network', bad: 'expected gains slow down; friendships need some care', busy: 'income and networks are in focus' },
  12: { title: 'Expenses, rest & retreat', good: 'productive solitude, spiritual practice and well-spent expenses', bad: 'unplanned expenses and a tired mind; protect your sleep', busy: 'rest, losses and withdrawal themes are in focus' },
}

// ── Small helpers ────────────────────────────────────────────

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))
const round1 = (n: number) => Math.round(n * 10) / 10

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`
}

const lordOf = (rashi: number): GrahaId => RASHI_LORDS[(rashi - 1 + 12) % 12].lord

function binduWord(b: number): string {
  if (b >= 6) return 'excellent'
  if (b === 5) return 'good'
  if (b === 4) return 'borderline'
  return 'weak'
}

// ── Main builder ─────────────────────────────────────────────

export function buildTodayPredictions(input: BuildPredictionsInput): TodayPredictions | null {
  const { natal, transit, reading } = input
  const nowMs = (input.now ?? new Date()).getTime()
  const lagna = natal.lagnas.ascRashi
  if (!lagna || transit.length === 0) return null

  const natalBy = (id: GrahaId) => natal.grahas.find(g => g.id === id)
  const transitBy = (id: GrahaId) => transit.find(g => g.id === id)
  const gocharOf = (id: GrahaId) => reading.gochar.find(r => r.planet === id)
  const sav = natal.ashtakavarga?.sav
  const bavOf = (p: GrahaId, rashi: number): number | null => {
    if (!BAV_PLANETS.has(p)) return null
    const v = natal.ashtakavarga?.bav?.[p]?.bindus?.[rashi - 1]
    return typeof v === 'number' ? v : null
  }

  const chandraSign =
    reading.moon.chandraQuality === 'good' ? 1 : reading.moon.chandraQuality === 'bad' ? -1 : 0.2

  /** +1 favourable … −1 testing, from the classical gochar table (counted from natal Moon). */
  const gocharSign = (p: GrahaId): number => {
    if (p === 'Mo') return chandraSign
    const row = gocharOf(p)
    if (!row) return 0
    return row.status === 'favourable' ? 1 : row.status === 'vedha' ? -0.3 : -1
  }

  // Dasha lords (Maha → Pratyantar) and the houses they tie to.
  const dashaLords = reading.dasha.filter(d => d.level <= 3).map(d => {
    const g = natalBy(d.lord)
    const ruled = RASHI_LORDS.filter(r => r.lord === d.lord).map(r => houseFrom(r.number, lagna))
    const sits = g ? houseFrom(g.rashi, lagna) : null
    return { ...d, ruled, sits }
  })

  const houses: HouseActivation[] = []

  for (let h = 1; h <= 12; h++) {
    const rashi = (((lagna - 1 + h - 1) % 12) + 1) as Rashi
    const lord = lordOf(rashi)
    const lordNatal = natalBy(lord)
    const lordHouse = lordNatal ? houseFrom(lordNatal.rashi, lagna) : h

    // ── Natal promise: how well this area is built into the chart ──
    let promiseScore = 0
    const promiseBits: string[] = []
    const houseSav = sav?.[rashi - 1]
    if (typeof houseSav === 'number') {
      if (houseSav >= SAV_STRONG) { promiseScore += 1; promiseBits.push(`${houseSav} Ashtakavarga bindus`) }
      else if (houseSav <= SAV_WEAK) { promiseScore -= 1; promiseBits.push(`only ${houseSav} Ashtakavarga bindus`) }
    }
    const ratio = natal.shadbala?.planets?.[lord]?.ratio
    if (typeof ratio === 'number') {
      if (ratio >= 1.15) { promiseScore += 1; promiseBits.push(`strong ${GRAHA_NAMES[lord]} (Shadbala ${ratio.toFixed(2)}x)`) }
      else if (ratio < 0.85) { promiseScore -= 1; promiseBits.push(`weak ${GRAHA_NAMES[lord]} (Shadbala ${ratio.toFixed(2)}x)`) }
    }
    const bb = natal.bhavaBala?.houses?.[h]
    if (bb) promiseScore += bb.isStrong ? 0.5 : -0.5
    if (lordNatal?.dignity === 'exalted' || lordNatal?.dignity === 'own' || lordNatal?.dignity === 'moolatrikona') promiseScore += 0.5
    if (lordNatal?.dignity === 'debilitated') promiseScore -= 0.5
    const promise: Promise3 = promiseScore >= 1.5 ? 'strong' : promiseScore <= -1 ? 'weak' : 'average'
    const promiseNote = promiseBits.length
      ? `${promise === 'strong' ? 'Well supported' : promise === 'weak' ? 'Less supported' : 'Average support'} in your chart (${promiseBits.join(', ')}).`
      : `${promise === 'strong' ? 'Well supported' : promise === 'weak' ? 'Less supported' : 'Average support'} in your chart.`

    const influences: HouseInfluence[] = []

    // ── Live activation: transit planets in / aspecting the house ──
    for (const t of transit) {
      if (!CORE.includes(t.id)) continue
      const w = TRANSIT_WEIGHT[t.id] ?? 1
      const benefic = t.id === 'Mo' ? chandraSign >= 0 : BENEFIC.has(t.id)
      const name = GRAHA_NAMES[t.id]
      const retro = t.isRetro && t.id !== 'Ra' && t.id !== 'Ke' ? ' (retrograde)' : ''

      if (t.rashi === rashi) {
        const bindus = bavOf(t.id, rashi)
        const bSign = bindus === null ? null : bindus >= 4 ? 1 : -1
        const gSign = gocharSign(t.id)
        // BAV of the transit sign is the primary test; gochar-from-Moon is the cross-check.
        const eff = bSign === null ? gSign : 0.6 * bSign + 0.4 * gSign
        const nature = eff >= 0 ? (benefic ? 1.2 : 0.8) : (benefic ? 0.6 : 1.2)
        const delta = round1(eff * w * nature)
        const bits: string[] = []
        if (bindus !== null) bits.push(`${bindus} bindus in ${RASHI_NAMES[rashi]} (${binduWord(bindus)})`)
        const row = gocharOf(t.id)
        if (t.id === 'Mo') bits.push(`Chandra Bala ${reading.moon.chandraQuality === 'bad' ? 'strained' : reading.moon.chandraQuality === 'good' ? 'supportive' : 'neutral'}`)
        else if (row) bits.push(`${ordinal(row.fromMoon)} from your Moon, ${row.status}`)
        influences.push({
          kind: t.id === 'Mo' ? 'moon' : 'occupies',
          planet: t.id,
          delta,
          text: `${name}${retro} sits here: ${bits.join('; ')}.`,
        })
      } else if (t.id !== 'Ra' && t.id !== 'Ke' && hasParasharaAspect(t.rashi, t.id, rashi)) {
        const bindus = bavOf(t.id, rashi)
        const goodBindus = bindus === null ? true : bindus >= 4
        const mag = benefic ? (goodBindus ? 1 : 0.6) : (goodBindus ? 0.4 : 1)
        const delta = round1((benefic ? 1 : -1) * mag * w * 0.5)
        const house = houseFrom(t.rashi, lagna)
        influences.push({
          kind: 'aspects',
          planet: t.id,
          delta,
          text: `${name}${retro} aspects this house from your ${ordinal(house)} (${benefic ? 'benefic' : 'malefic'} drishti${bindus !== null ? `, ${bindus} bindus here` : ''}).`,
        })
      }
    }

    // ── House lord today: its own transit and dignity ──
    const tLord = transitBy(lord)
    if (tLord && lord !== 'Mo') {
      const dig = tLord.dignity === 'exalted' || tLord.dignity === 'own' || tLord.dignity === 'moolatrikona' ? 1
        : tLord.dignity === 'debilitated' ? -1 : 0
      const gs = gocharSign(lord)
      const eff = (dig + gs) / 2
      if (Math.abs(eff) >= 0.25) {
        influences.push({
          kind: 'lord',
          planet: lord,
          delta: round1(eff * 1.4),
          text: `House lord ${GRAHA_NAMES[lord]} is ${eff > 0 ? 'well' : 'poorly'} placed today${dig !== 0 ? ` (${tLord.dignity.replace('_', ' ')})` : ''}${gocharOf(lord) ? `, ${ordinal(gocharOf(lord)!.fromMoon)} from your Moon` : ''}.`,
        })
      }
    }

    // ── Dasha link: rules or houses the running dasha lords sit in ──
    const dashaLinks: HouseActivation['dashaLinks'] = []
    for (const d of dashaLords) {
      const ruledHere = d.ruled.includes(h)
      const sitsHere = d.sits === h
      if (!ruledHere && !sitsHere) continue
      dashaLinks.push({ lord: d.lord, levelLabel: d.levelLabel, relation: ruledHere ? 'rules' : 'sits in' })
      const lw = LEVEL_WEIGHT[d.level] ?? 1
      const sign = d.tone === 'supportive' ? 1 : d.tone === 'challenging' ? -1 : 0
      if (sign !== 0) {
        influences.push({
          kind: 'dasha',
          planet: d.lord,
          delta: round1(sign * lw),
          text: `${d.levelLabel} lord ${d.lordName} ${ruledHere ? 'rules' : 'sits in'} this house and is ${d.tone === 'supportive' ? 'well placed' : 'under strain'}, so this area is "live" in your current period.`,
        })
      }
    }

    // ── Combine: the natal promise amplifies good news or softens bad ──
    let net = 0
    let activity = 0
    for (const inf of influences) {
      const amp =
        inf.delta > 0 ? (promise === 'strong' ? 1.25 : promise === 'weak' ? 0.75 : 1)
          : (promise === 'weak' ? 1.25 : promise === 'strong' ? 0.8 : 1)
      const d = inf.delta * amp
      net += d
      activity += Math.abs(d)
    }
    net = round1(net)
    activity = round1(activity + dashaLinks.length * 0.5)
    const score = Math.round(clamp(50 + net * 5, 5, 95))
    const tone: Tone = net >= 1.5 ? 'favourable' : net <= -1.5 ? 'challenging' : 'mixed'
    const verdict: HouseActivation['verdict'] =
      activity < 1.5 ? 'Quiet' : tone === 'favourable' ? 'Favourable' : tone === 'challenging' ? 'Challenging' : 'Mixed'

    houses.push({
      house: h,
      rashi,
      rashiName: RASHI_NAMES[rashi],
      areaTitle: AREA[h].title,
      lord,
      lordHouse,
      promise,
      promiseNote,
      score,
      net,
      activity,
      tone,
      verdict,
      influences: influences.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)),
      dashaLinks,
    })
  }

  // ── Ranked predictions: the houses with the most going on ──
  const prominence = (x: HouseActivation) => Math.abs(x.net) + x.activity * 0.4 + x.dashaLinks.length * 0.6
  const ranked = [...houses].filter(x => x.verdict !== 'Quiet').sort((a, b) => prominence(b) - prominence(a)).slice(0, 5)

  const predictions: DayPrediction[] = ranked.map(x => {
    const phrase = AREA[x.house]
    const sameDirection = x.influences.filter(i => (x.net >= 0 ? i.delta > 0 : i.delta < 0))
    const sources = new Set(sameDirection.map(i => (i.kind === 'dasha' ? 'dasha' : i.kind === 'moon' ? 'moon' : `${i.kind}-${i.planet}`)))
    const slowOrDasha = sameDirection.some(i => i.kind === 'dasha' || ['Sa', 'Ju', 'Ra', 'Ke', 'Ma'].includes(i.planet))
    const confidence: Confidence =
      sources.size >= 3 && slowOrDasha ? 'high' : sources.size >= 2 ? 'moderate' : 'low'

    const body =
      x.tone === 'favourable' ? `${phrase.good[0].toUpperCase()}${phrase.good.slice(1)}.`
        : x.tone === 'challenging' ? `${phrase.bad[0].toUpperCase()}${phrase.bad.slice(1)}.`
          : `Mixed signals: ${phrase.busy}. Upside: ${phrase.good}. Watch for: ${phrase.bad}.`
    const parts = [body]
    if (x.dashaLinks.length) {
      const d = x.dashaLinks[0]
      parts.push(`This matters more than usual because your ${d.levelLabel} lord ${GRAHA_NAMES[d.lord]} ${d.relation} this house.`)
    }
    if (x.promise === 'strong') parts.push('Your chart naturally backs this area, so good results come easily and setbacks are short-lived.')
    if (x.promise === 'weak') parts.push('This area is less supported in your chart, so expect to put in more effort for the same result.')

    const because = [
      ...x.influences.slice(0, 3).map(i => i.text),
      x.promiseNote,
    ].filter(Boolean)

    return {
      house: x.house,
      title: `${ordinal(x.house)} house · ${phrase.title}`,
      tone: x.tone,
      confidence,
      text: parts.join(' '),
      because,
      score: x.score,
    }
  })

  // ── Moon phases: the day changes tone when the Moon changes sign ──
  const phases: MoonPhase[] = []
  // A second phase only matters if the Moon actually changes sign within the next 24 hours.
  const shiftsSoon = reading.moon.signChange
    ? Date.parse(reading.moon.signChange.atIso) - nowMs <= 24 * 3_600_000
    : false
  const moonHouse = reading.moon.lagnaHouse
  const phaseTone = (q: 'good' | 'bad' | 'avg'): Tone => (q === 'good' ? 'favourable' : q === 'bad' ? 'challenging' : 'mixed')
  const phaseText = (house: number, q: 'good' | 'bad' | 'avg') => {
    const p = AREA[house]
    const hv = houses[house - 1]
    const lead = q === 'good' ? p.good : q === 'bad' ? p.bad : `${p.busy}`
    const chandra = q === 'good' ? 'Chandra Bala supports you' : q === 'bad' ? 'Chandra Bala is demanding' : 'Chandra Bala is neutral'
    return `${chandra}; ${lead}. The wider chart rates this house ${hv.verdict.toLowerCase()} today (${hv.score}).`
  }
  phases.push({
    label: shiftsSoon ? 'Now' : 'All day',
    untilIso: shiftsSoon ? reading.moon.signChange?.atIso ?? null : null,
    rashiName: reading.moon.rashiName,
    house: moonHouse,
    areaTitle: AREA[moonHouse].title,
    tone: phaseTone(reading.moon.chandraQuality),
    text: phaseText(moonHouse, reading.moon.chandraQuality),
  })
  if (reading.moon.signChange && shiftsSoon) {
    const nextHouse = (moonHouse % 12) + 1
    phases.push({
      label: 'After the Moon shifts',
      untilIso: null,
      rashiName: reading.moon.signChange.toRashiName,
      house: nextHouse,
      areaTitle: AREA[nextHouse].title,
      tone: phaseTone(reading.moon.signChange.toChandraQuality),
      text: phaseText(nextHouse, reading.moon.signChange.toChandraQuality),
    })
  }

  // ── Yoga activation: Moon or Jupiter touching a yoga planet's sign ──
  const yogaNotes: string[] = []
  const tMoon = transitBy('Mo')
  const tJup = transitBy('Ju')
  for (const y of natal.yogas ?? []) {
    if (!['raja', 'dhana', 'mahapurusha'].includes(y.category) || y.strength === 'weak') continue
    const signs = y.planets.map(p => natalBy(p as GrahaId)?.rashi).filter((r): r is Rashi => typeof r === 'number')
    const hitBy: string[] = []
    if (tMoon && signs.includes(tMoon.rashi)) hitBy.push('the Moon')
    if (tJup && signs.some(s => s === tJup.rashi || hasParasharaAspect(tJup.rashi, 'Ju', s))) hitBy.push('Jupiter')
    if (!hitBy.length) continue
    // A chart can hold several yogas with the same name (e.g. multiple Raja Yogas),
    // so the planets involved are part of the note and exact duplicates are dropped.
    const involved = y.planets.map(p => GRAHA_NAMES[p as GrahaId] ?? p).join(' + ')
    const note = `${y.name} (${involved}): ${hitBy.join(' and ')} touches the planets of this yoga today, which can bring its promise forward.`
    if (!yogaNotes.includes(note)) yogaNotes.push(note)
  }

  return { predictions, houses, phases, yogaNotes: yogaNotes.slice(0, 3) }
}
