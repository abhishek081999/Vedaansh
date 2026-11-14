// ─────────────────────────────────────────────────────────────
//  src/lib/engine/nakshatramshaAnalysis.ts
//  Nakshatramsha / Bhamsha (D27) — bandwidth, deep desire, ask themes
//  Class heuristics: D3×9 refinement; soft capacity (not clinical risk)
// ─────────────────────────────────────────────────────────────

import type {
  ChartOutput,
  Dignity,
  GrahaData,
  GrahaId,
  Rashi,
} from '@/types/astrology'
import {
  RASHI_SANSKRIT,
} from '@/types/astrology'
import { dignityText, fill, gName, pick, rName, type EngineLang } from '@/lib/engine/divisionalLang'
import {
  D27_ASK_THEME_HI,
  D27_HOUSE_THEMES_HI,
  D27_LAGNA_PLANET_HI,
  D27_LAGNA_SIGN_FLAVOR_HI,
  D27_PURPOSE_HI,
  D27_TEXT_HI,
} from '@/lib/engine/locale/nakshatramsha.hi'

export type D27Tone = 'supportive' | 'challenging' | 'mixed' | 'neutral'

export interface NakshatramshaInsight {
  kind: 'strength' | 'caution' | 'highlight' | 'info'
  title: string
  text: string
}

export interface NakshatramshaPlanetRow {
  id: GrahaId
  name: string
  rashi: Rashi
  rashiName: string
  house: number
  dignity: Dignity
  isRetro: boolean
  theme: string
  interpretation: string
  tone: D27Tone
}

export interface NakshatramshaHouseRow {
  house: number
  rashi: Rashi
  rashiName: string
  lordId: GrahaId
  lordName: string
  occupants: { id: GrahaId; name: string; isRetro: boolean }[]
  theme: string
  reading: string
  tone: D27Tone
  vitalityScore: number
}

export interface NakshatramshaBandwidth {
  score: number
  band: 'high' | 'steady' | 'strained'
  label: string
  reading: string
  tone: D27Tone
}

export interface NakshatramshaAskTheme {
  house: number
  theme: string
  vitalityScore: number
  reading: string
  tone: D27Tone
}

export interface NakshatramshaLagnaFocus {
  lagna: Rashi
  lagnaName: string
  lagnaSanskrit: string
  lagnaEmpty: boolean
  occupants: { id: GrahaId; name: string; isRetro: boolean; reading: string }[]
  lagnaLord: {
    id: GrahaId
    name: string
    house: number
    rashi: Rashi
    rashiName: string
    dignity: Dignity
    isRetro: boolean
    conjunctNames: string[]
    reading: string
  }
  signFlavor: string
  primarySignal: { label: string; detail: string }
  consultationHint: string
}

export interface NakshatramshaLayerLink {
  d3LagnaName: string | null
  d3OverlapNote: string | null
  reading: string
}

export interface NakshatramshaAnalysis {
  d27Lagna: Rashi
  d27LagnaName: string
  d27LagnaSanskrit: string
  summary: string
  purpose: string
  focus: NakshatramshaLagnaFocus
  bandwidth: NakshatramshaBandwidth
  askThemes: NakshatramshaAskTheme[]
  layerLink: NakshatramshaLayerLink
  planets: NakshatramshaPlanetRow[]
  houses: NakshatramshaHouseRow[]
  focusedHouses: NakshatramshaHouseRow[]
  insights: NakshatramshaInsight[]
}

const CLASSICAL_ORDER: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']

const SIGN_LORDS: Record<Rashi, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

const STRONG_DIGNITY: Dignity[] = ['exalted', 'moolatrikona', 'own']
const WEAK_DIGNITY: Dignity[] = ['debilitated', 'great_enemy', 'enemy']
const MALEFICS: GrahaId[] = ['Ma', 'Sa', 'Ra', 'Ke']
const KENDRAS = [1, 4, 7, 10] as const
const TRIKONA = [1, 5, 9] as const
const FOCUS_HOUSES = [1, 4, 5, 7, 8, 11, 12] as const

const D27_PURPOSE =
  'Nakshatramsha (D27 / Bhamsha) is a finer division of D3 — it shows the greatest inner bandwidth under pressure, the deepest tone of desire, and often the exact theme a client will raise in consultation. This is a gentle reading of capacity only — not fortune-telling or a clinical diagnosis.'

const LAGNA_SIGN_FLAVOR: Record<Rashi, string> = {
  1: 'Aries D27 — raw willpower and a capacity for pioneering under pressure.',
  2: 'Taurus D27 — endurance through values and the security of resources.',
  3: 'Gemini D27 — mental bandwidth; needs clear information when under stress.',
  4: 'Cancer D27 — emotional stamina; a sense of safety must stay intact in order to endure.',
  5: 'Leo D27 — pride and recognition fuel the will to carry on.',
  6: 'Virgo D27 — coping through detail; service under strain.',
  7: 'Libra D27 — relationships are the axis of both consultation and capacity.',
  8: 'Scorpio D27 — the pressure of transformation; feels “stuck” until release (Ketu-like) arrives.',
  9: 'Sagittarius D27 — faith and meaning sustain bandwidth.',
  10: 'Capricorn D27 — the grit of duty; keeps climbing under load.',
  11: 'Aquarius D27 — bandwidth through networks and intuition; unconventional ways of coping.',
  12: 'Pisces D27 — surrender and retreat restore capacity.',
}

const HOUSE_THEMES: Record<number, string> = {
  1: 'Self-clarity and will-to-continue',
  2: 'Speech, family resource anxiety',
  3: 'Courage and effort under pressure',
  4: 'Emotional foundation and bandwidth at home',
  5: 'Creativity, romance and fear scripts',
  6: 'Conflict, friction with health, strain from service',
  7: 'Partnership — a classic consultation theme',
  8: 'Depth of crisis and the load of hidden fears',
  9: 'Faith, the guru and the stamina of dharma',
  10: 'Career pressure capacity',
  11: 'Fulfilment of desires and support from networks',
  12: 'The capacity for release, sleep and withdrawal',
}

const ASK_THEME_LABEL: Record<number, string> = {
  1: 'self-confusion / identity',
  2: 'family / money speech',
  3: 'courage / siblings / effort',
  4: 'home / mother / peace',
  5: 'romance / children / creativity',
  6: 'conflict / health / service',
  7: 'marriage / partnership',
  8: 'fear / crisis / hidden issues',
  9: 'faith / father / guidance',
  10: 'career / status',
  11: 'gains / friends / desires',
  12: 'loss / sleep / retreat',
}

const LAGNA_PLANET_READINGS: Partial<Record<GrahaId, string>> = {
  Su: 'The Sun on the D27 lagna — dignity and recognition are central to willpower.',
  Mo: 'The Moon on the D27 lagna — emotional weather sets the upper limit of bandwidth.',
  Ma: 'Mars on the D27 lagna — a capacity to fight; can become irritable under load.',
  Me: 'Mercury on the D27 lagna — coping through the mind; with Ketu it leans philosophical (a sāṅkhya flavour).',
  Ju: 'Jupiter on the D27 lagna — meaning and guidance restore capacity.',
  Ve: 'Venus on the D27 lagna — relationships and comfort act as pressure valves.',
  Sa: 'Saturn on the D27 lagna — endurance through duty; slow-burning stamina.',
  Ra: 'Rahu on the D27 lagna — an amplified hunger; capacity stretched toward the unusual.',
  Ke: 'Ketu on the D27 lagna — release and detachment as the way of coping.',
}

function houseOf(planetRashi: Rashi, ascRashi: Rashi): number {
  return ((planetRashi - ascRashi + 12) % 12) + 1
}

function wholeSignHouseSign(ascRashi: Rashi, house: number): Rashi {
  return (((ascRashi - 1 + house - 1) % 12) + 1) as Rashi
}

function dignityPoints(d: Dignity): number {
  if (d === 'exalted' || d === 'moolatrikona') return 3
  if (d === 'own') return 2
  if (d === 'friend' || d === 'neutral') return 1
  if (d === 'enemy' || d === 'great_enemy') return 0
  if (d === 'debilitated') return -2
  return 1
}

function planetById(grahas: GrahaData[], id: GrahaId): GrahaData | undefined {
  return grahas.find((g) => g.id === id)
}

function conjunctIds(grahas: GrahaData[], target: GrahaData): GrahaId[] {
  return grahas.filter((g) => g.id !== target.id && g.rashi === target.rashi).map((g) => g.id)
}

function vitalityOfHouse(grahas: GrahaData[], asc: Rashi, house: number): number {
  const occ = grahas.filter((g) => houseOf(g.rashi, asc) === house)
  let score = 4 // empty baseline (neutral quiet)
  if (occ.length) {
    score = occ.reduce((sum, g) => {
      let s = 2 + dignityPoints(g.dignity)
      if (MALEFICS.includes(g.id) && !STRONG_DIGNITY.includes(g.dignity)) s -= 1
      if (g.id === 'Ju' || g.id === 'Ve') s += 1
      return sum + s
    }, 0)
  }
  const rashi = wholeSignHouseSign(asc, house)
  const lord = planetById(grahas, SIGN_LORDS[rashi])
  if (lord) {
    const lh = houseOf(lord.rashi, asc)
    score += dignityPoints(lord.dignity)
    if ([6, 8, 12].includes(lh)) score -= 2
    if (TRIKONA.includes(lh as 1 | 5 | 9) || KENDRAS.includes(lh as 1 | 4 | 7 | 10)) score += 1
  }
  return score
}

function toneFromVitality(score: number, house: number): D27Tone {
  if (score <= 1 || [6, 8].includes(house)) return score <= 1 ? 'challenging' : 'mixed'
  if (score >= 6) return 'supportive'
  return 'mixed'
}

const D27_TEXT_EN: Record<keyof typeof D27_TEXT_HI, string> = {
  planetColors: '{planet} colors D27 willpower.',
  hintBase: 'The D27 lagna sets the flavour of what feels “stuck” enough to be raised in consultation.',
  hintScorpio: 'Scorpio D27 lagna: feels stuck in transformation — often looks for release or answers (Ketu-like detachment helps).',
  hintRelating: ' Relationship themes are likely to come up in questions.',
  hintLord12: ' Lagna lord in the 12th: private relationship issues or withdrawal may prompt repeated questions.',
  occupiedLabel: 'Lagna occupied by {names}',
  emptyLabel: 'Empty lagna — follow {lord} in house {house}',
  emptyDetail: 'The placement of {lord} is the address of D27 willpower.',
  lordIn: '{lord} in {rashi} (H{house}, {dignity}).',
  lordMissing: '{lord} unavailable.',
  withNames: 'With {names}.',
  quiet: 'Quiet — the lord of {rashi} carries the load.',
  occupiedBy: 'Occupied by {names}.',
  juKe7: 'Jupiter–Ketu here: satisfaction with or liking for the partner can feel incomplete.',
  malefic5: 'A heavy load of difficult planets in the 5th: fear scripts (including anxiety about health) can repeat — keep the language gentle.',
  maRa4: 'Mars–Rahu in the 4th: strong intuition and an unconventional inner method.',
  houseFallback: 'House {house}',
  labelSteady: 'Steady bandwidth',
  labelHigh: 'High pressure capacity',
  labelStrained: 'Strained bandwidth',
  readHigh: 'The D27 kendras (angular houses: 1, 4, 7, 10) and lagna carry good vitality — under stress, the will to continue usually holds. Rest is still needed; high capacity is not unlimited.',
  readStrained: 'D27 vitality looks strained — the ability to endure struggle is limited right now. Lighten the load, seek support and avoid piling one crisis on another. This describes capacity, not a medical or risk diagnosis.',
  readSteady: 'Moderate D27 bandwidth — can handle pressure in waves. Protect sleep and meaning (Jupiter / 9th-house themes) when the load increases.',
  askReading: 'Weak or troubled energy in house {house} ({theme}): whatever cannot flow cleanly in D27 is often exactly what the client asks about. {reading}',
  overlapVenus: 'Venus in the 7th repeats from D3 into D27 — the specific question is likely about marriage or partnership (not just “relationships in general”).',
  overlapMercury: 'Mercury’s house repeats (H{house}) across D3 and D27 — that mental theme is “stuck at its peak” enough to be voiced.',
  layerWithD3: 'D1 (outer) → D3 {d3} (mind) → D27 {d27} (finer bandwidth). {note}',
  layerCompare: 'Compare the house themes that repeat between D3 and D27 to see what will be said out loud.',
  layerNoD3: 'D27 {d27} is the fine layer. Add D3 when available to tell silent mental loops apart from themes voiced in consultation.',
  planetInterp: '{planet} in {rashi} (H{house}, {dignity}). {theme}.',
  houseShort: 'H{house}',
  hintTitle: 'Consultation hint',
  askTitle: 'Likely ask · H{house}',
  repeatTitle: 'D3 ↔ D27 repeat',
  layerTitle: 'Layering',
  sumOpen: 'D27 begins in {rashi} — {label} (score {score}/20).',
  sumAsk: 'Likely voiced theme: {theme}.',
  sumRepeat: 'A repeat across D3 and D27 strengthens the question.',
  houseThemeEnd: '{theme}.',
}

/**
 * Analyze Nakshatramsha / Bhamsha (D27) from chart vargas.
 * `lang` switches display text only; ids, scores and tones are identical.
 */
export function analyzeNakshatramsha(chart: ChartOutput, lang: EngineLang = 'en'): NakshatramshaAnalysis | null {
  const asc = chart.vargaLagnas?.D27 as Rashi | undefined
  const grahas = chart.vargas?.D27
  if (!asc || !grahas?.length) return null

  const T = pick(D27_TEXT_EN, D27_TEXT_HI as Record<keyof typeof D27_TEXT_HI, string>, lang)
  const HT = pick(HOUSE_THEMES, D27_HOUSE_THEMES_HI, lang)
  const ASK = pick(ASK_THEME_LABEL, D27_ASK_THEME_HI, lang)
  const LPR = pick(LAGNA_PLANET_READINGS, D27_LAGNA_PLANET_HI as Partial<Record<GrahaId, string>>, lang)
  const g = (id: GrahaId) => gName(id, lang)
  const r = (x: Rashi) => rName(x, lang)
  const dig = (d: Dignity) => dignityText(d, lang)
  const list = (names: string[]) => names.join(', ')

  const lagnaOcc = grahas.filter((x) => houseOf(x.rashi, asc) === 1)
  const lagnaEmpty = lagnaOcc.length === 0
  const lagnaLordId = SIGN_LORDS[asc]
  const lordG = planetById(grahas, lagnaLordId)
  const lordHouse = lordG ? houseOf(lordG.rashi, asc) : 1
  const lordConjuncts = lordG ? conjunctIds(grahas, lordG) : []

  const occupants = lagnaOcc.map((x) => ({
    id: x.id,
    name: g(x.id),
    isRetro: Boolean(x.isRetro),
    reading: LPR[x.id] ?? fill(T.planetColors, { planet: g(x.id) }),
  }))

  let consultationHint = T.hintBase
  if (asc === 8) {
    consultationHint = T.hintScorpio
  }
  if (lordHouse === 7 || lagnaOcc.some((x) => x.id === 'Ve' || x.id === 'Ra')) {
    consultationHint += T.hintRelating
  }
  if (lordHouse === 12) {
    consultationHint += T.hintLord12
  }

  const primarySignal = occupants.length
    ? {
        label: fill(T.occupiedLabel, { names: list(occupants.map((o) => o.name)) }),
        detail: occupants.map((o) => o.reading).join(' '),
      }
    : {
        label: fill(T.emptyLabel, { lord: g(lagnaLordId), house: lordHouse }),
        detail: fill(T.emptyDetail, { lord: g(lagnaLordId) }),
      }

  const focus: NakshatramshaLagnaFocus = {
    lagna: asc,
    lagnaName: r(asc),
    lagnaSanskrit: lang === 'hi' ? r(asc) : RASHI_SANSKRIT[asc],
    lagnaEmpty,
    occupants,
    lagnaLord: {
      id: lagnaLordId,
      name: g(lagnaLordId),
      house: lordHouse,
      rashi: lordG?.rashi ?? asc,
      rashiName: r(lordG?.rashi ?? asc),
      dignity: lordG?.dignity ?? 'neutral',
      isRetro: Boolean(lordG?.isRetro),
      conjunctNames: lordConjuncts.map((id) => g(id)),
      reading: [
        lordG
          ? fill(T.lordIn, { lord: g(lagnaLordId), rashi: r(lordG.rashi), house: lordHouse, dignity: dig(lordG.dignity) })
          : fill(T.lordMissing, { lord: g(lagnaLordId) }),
        lordConjuncts.length
          ? fill(T.withNames, { names: list(lordConjuncts.map((id) => g(id))) })
          : null,
      ]
        .filter(Boolean)
        .join(' '),
    },
    signFlavor: pick(LAGNA_SIGN_FLAVOR, D27_LAGNA_SIGN_FLAVOR_HI as Record<Rashi, string>, lang)[asc],
    primarySignal,
    consultationHint,
  }

  const houses: NakshatramshaHouseRow[] = []
  for (let h = 1; h <= 12; h++) {
    const rashi = wholeSignHouseSign(asc, h)
    const occ = grahas.filter((x) => houseOf(x.rashi, asc) === h)
    const vitalityScore = vitalityOfHouse(grahas, asc, h)
    const names = list(occ.map((x) => g(x.id)))
    const bits = [fill(T.houseThemeEnd, { theme: HT[h] })]
    if (!occ.length) bits.push(fill(T.quiet, { rashi: r(rashi) }))
    else bits.push(fill(T.occupiedBy, { names }))
    if (h === 7 && occ.some((x) => x.id === 'Ju') && occ.some((x) => x.id === 'Ke')) {
      bits.push(T.juKe7)
    }
    if (h === 5 && occ.filter((x) => MALEFICS.includes(x.id)).length >= 2) {
      bits.push(T.malefic5)
    }
    if (h === 4 && occ.some((x) => x.id === 'Ma') && occ.some((x) => x.id === 'Ra')) {
      bits.push(T.maRa4)
    }
    houses.push({
      house: h,
      rashi,
      rashiName: r(rashi),
      lordId: SIGN_LORDS[rashi],
      lordName: g(SIGN_LORDS[rashi]),
      occupants: occ.map((x) => ({ id: x.id, name: g(x.id), isRetro: Boolean(x.isRetro) })),
      theme: HT[h] ?? fill(T.houseFallback, { house: h }),
      reading: bits.join(' '),
      tone: toneFromVitality(vitalityScore, h),
      vitalityScore,
    })
  }

  // Bandwidth: average kendra + lagna vitality + lagna lord dignity
  const kendraScores = KENDRAS.map((h) => vitalityOfHouse(grahas, asc, h))
  const avgKendra = kendraScores.reduce((a, b) => a + b, 0) / kendraScores.length
  const lordBoost = lordG ? dignityPoints(lordG.dignity) : 0
  const raw = avgKendra * 2 + lordBoost + vitalityOfHouse(grahas, asc, 1)
  const score = Math.round(Math.max(0, Math.min(20, raw)))
  let band: NakshatramshaBandwidth['band'] = 'steady'
  let label = T.labelSteady
  let tone: D27Tone = 'mixed'
  let reading: string
  if (score >= 14) {
    band = 'high'
    label = T.labelHigh
    tone = 'supportive'
    reading = T.readHigh
  } else if (score <= 7) {
    band = 'strained'
    label = T.labelStrained
    tone = 'challenging'
    reading = T.readStrained
  } else {
    reading = T.readSteady
  }
  const bandwidth: NakshatramshaBandwidth = { score, band, label, reading, tone }

  // Ask themes: weakest houses among 1,4,5,7,8,10,11 (consultation-relevant)
  const askCandidates = [1, 4, 5, 7, 8, 10, 11]
    .map((h) => houses.find((row) => row.house === h)!)
    .sort((a, b) => a.vitalityScore - b.vitalityScore)
  const askThemes: NakshatramshaAskTheme[] = askCandidates.slice(0, 3).map((row) => ({
    house: row.house,
    theme: ASK[row.house] ?? row.theme,
    vitalityScore: row.vitalityScore,
    reading: fill(T.askReading, { house: row.house, theme: ASK[row.house], reading: row.reading }),
    tone: row.tone,
  }))

  // Layer link with D3
  const d3Asc = chart.vargaLagnas?.D3 as Rashi | undefined
  const d3Grahas = chart.vargas?.D3
  let d3OverlapNote: string | null = null
  if (d3Asc && d3Grahas?.length) {
    const d3Ve = planetById(d3Grahas, 'Ve')
    const d27Ve = planetById(grahas, 'Ve')
    const d3Me = planetById(d3Grahas, 'Me')
    const d27Me = planetById(grahas, 'Me')
    if (
      d3Ve && d27Ve &&
      houseOf(d3Ve.rashi, d3Asc) === 7 &&
      houseOf(d27Ve.rashi, asc) === 7
    ) {
      d3OverlapNote = T.overlapVenus
    } else if (
      d3Me && d27Me &&
      houseOf(d3Me.rashi, d3Asc) === houseOf(d27Me.rashi, asc)
    ) {
      d3OverlapNote = fill(T.overlapMercury, { house: houseOf(d3Me.rashi, d3Asc) })
    }
  }

  const layerLink: NakshatramshaLayerLink = {
    d3LagnaName: d3Asc ? r(d3Asc) : null,
    d3OverlapNote,
    reading: d3Asc
      ? fill(T.layerWithD3, { d3: r(d3Asc), d27: r(asc), note: d3OverlapNote ?? T.layerCompare })
      : fill(T.layerNoD3, { d27: r(asc) }),
  }

  const planets = CLASSICAL_ORDER
    .map((id) => planetById(grahas, id))
    .filter((x): x is GrahaData => Boolean(x))
    .map((x) => {
      const house = houseOf(x.rashi, asc)
      const tone: D27Tone =
        STRONG_DIGNITY.includes(x.dignity) ? 'supportive'
          : WEAK_DIGNITY.includes(x.dignity) ? 'challenging'
            : 'mixed'
      return {
        id: x.id,
        name: g(x.id),
        rashi: x.rashi,
        rashiName: r(x.rashi),
        house,
        dignity: x.dignity,
        isRetro: Boolean(x.isRetro),
        theme: HT[house] ?? fill(T.houseShort, { house }),
        interpretation: fill(T.planetInterp, { planet: g(x.id), rashi: r(x.rashi), house, dignity: dig(x.dignity), theme: HT[house] }),
        tone,
      }
    })

  const insights: NakshatramshaInsight[] = [
    { kind: 'highlight', title: focus.primarySignal.label, text: focus.primarySignal.detail },
    {
      kind: bandwidth.tone === 'challenging' ? 'caution' : bandwidth.tone === 'supportive' ? 'strength' : 'info',
      title: bandwidth.label,
      text: bandwidth.reading,
    },
    { kind: 'info', title: T.hintTitle, text: focus.consultationHint },
  ]
  for (const ask of askThemes.slice(0, 2)) {
    insights.push({ kind: 'caution', title: fill(T.askTitle, { house: ask.house }), text: ask.reading })
  }
  if (d3OverlapNote) {
    insights.push({ kind: 'highlight', title: T.repeatTitle, text: d3OverlapNote })
  }
  insights.push({
    kind: 'info',
    title: T.layerTitle,
    text: layerLink.reading,
  })

  const summary = [
    fill(T.sumOpen, { rashi: r(asc), label: bandwidth.label.toLowerCase(), score }),
    askThemes[0] ? fill(T.sumAsk, { theme: askThemes[0].theme }) : null,
    d3OverlapNote ? T.sumRepeat : null,
  ]
    .filter(Boolean)
    .join(' ')

  return {
    d27Lagna: asc,
    d27LagnaName: r(asc),
    d27LagnaSanskrit: lang === 'hi' ? r(asc) : RASHI_SANSKRIT[asc],
    summary,
    purpose: pick(D27_PURPOSE, D27_PURPOSE_HI, lang),
    focus,
    bandwidth,
    askThemes,
    layerLink,
    planets,
    houses,
    focusedHouses: houses.filter((h) => (FOCUS_HOUSES as readonly number[]).includes(h.house)),
    insights,
  }
}
