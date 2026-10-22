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
  GRAHA_NAMES,
  RASHI_NAMES,
  RASHI_SANSKRIT,
} from '@/types/astrology'

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
  'Nakshatramsha (D27 / Bhamsha) is a finer cut of D3 — maximum inner bandwidth under pressure, deepest desire tone, and often the exact theme a client will voice in consultation. Soft capacity reading only — not fortune-telling or clinical diagnosis.'

const LAGNA_SIGN_FLAVOR: Record<Rashi, string> = {
  1: 'Aries D27 — raw will and pioneering pressure capacity.',
  2: 'Taurus D27 — endurance through values and resource security.',
  3: 'Gemini D27 — mental bandwidth; needs clear information under stress.',
  4: 'Cancer D27 — emotional stamina; safety must stay intact to endure.',
  5: 'Leo D27 — pride and recognition fuel the will to continue.',
  6: 'Virgo D27 — detailed coping; service under strain.',
  7: 'Libra D27 — relating is the consultation and capacity axis.',
  8: 'Scorpio D27 — transformation pressure; feels “stuck” until release (Ketu-like) arrives.',
  9: 'Sagittarius D27 — faith and meaning sustain bandwidth.',
  10: 'Capricorn D27 — duty grit; climbs under load.',
  11: 'Aquarius D27 — network/intuition bandwidth; unconventional coping.',
  12: 'Pisces D27 — surrender and retreat restore capacity.',
}

const HOUSE_THEMES: Record<number, string> = {
  1: 'Self-clarity and will-to-continue',
  2: 'Speech, family resource anxiety',
  3: 'Courage and effort under pressure',
  4: 'Emotional foundation / home bandwidth',
  5: 'Creativity, romance, and fear scripts',
  6: 'Conflict, health friction, service strain',
  7: 'Partnership — classic consultation theme',
  8: 'Crisis depth and hidden fear load',
  9: 'Faith, guru, and dharma stamina',
  10: 'Career pressure capacity',
  11: 'Desire fulfillment and network support',
  12: 'Release, sleep, and withdrawal capacity',
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
  Su: 'Sun on D27 lagna — dignity and recognition are core to willpower.',
  Mo: 'Moon on D27 lagna — emotional weather sets the bandwidth ceiling.',
  Ma: 'Mars on D27 lagna — fight capacity; can turn irritable under load.',
  Me: 'Mercury on D27 lagna — mental coping; with Ketu leans philosophical (sāṅkhya flavor).',
  Ju: 'Jupiter on D27 lagna — meaning and guidance restore capacity.',
  Ve: 'Venus on D27 lagna — relating and comfort are the pressure valves.',
  Sa: 'Saturn on D27 lagna — endurance through duty; slow burn stamina.',
  Ra: 'Rahu on D27 lagna — amplified hunger; capacity stretched toward the unusual.',
  Ke: 'Ketu on D27 lagna — release and detachment as the coping path.',
}

function houseOf(planetRashi: Rashi, ascRashi: Rashi): number {
  return ((planetRashi - ascRashi + 12) % 12) + 1
}

function wholeSignHouseSign(ascRashi: Rashi, house: number): Rashi {
  return (((ascRashi - 1 + house - 1) % 12) + 1) as Rashi
}

function dignityLabel(d: Dignity): string {
  return d.replace(/_/g, ' ')
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

/**
 * Analyze Nakshatramsha / Bhamsha (D27) from chart vargas.
 */
export function analyzeNakshatramsha(chart: ChartOutput): NakshatramshaAnalysis | null {
  const asc = chart.vargaLagnas?.D27 as Rashi | undefined
  const grahas = chart.vargas?.D27
  if (!asc || !grahas?.length) return null

  const lagnaOcc = grahas.filter((g) => houseOf(g.rashi, asc) === 1)
  const lagnaEmpty = lagnaOcc.length === 0
  const lagnaLordId = SIGN_LORDS[asc]
  const lordG = planetById(grahas, lagnaLordId)
  const lordHouse = lordG ? houseOf(lordG.rashi, asc) : 1
  const lordConjuncts = lordG ? conjunctIds(grahas, lordG) : []

  const occupants = lagnaOcc.map((g) => ({
    id: g.id,
    name: GRAHA_NAMES[g.id],
    isRetro: Boolean(g.isRetro),
    reading: LAGNA_PLANET_READINGS[g.id] ?? `${GRAHA_NAMES[g.id]} colors D27 willpower.`,
  }))

  let consultationHint =
    'D27 lagna sets the flavor of what feels “stuck” enough to voice in consultation.'
  if (asc === 8) {
    consultationHint =
      'Scorpio D27 lagna: feels stuck in transformation — often seeks release/answers (Ketu-like detachment helps).'
  }
  if (lordHouse === 7 || lagnaOcc.some((g) => g.id === 'Ve' || g.id === 'Ra')) {
    consultationHint += ' Relating themes are likely to surface in questions.'
  }
  if (lordHouse === 12) {
    consultationHint += ' Lagna lord in 12th: private relating or withdrawal issues may drive repeat questions.'
  }

  const primarySignal = occupants.length
    ? {
        label: `Lagna occupied by ${occupants.map((o) => o.name).join(', ')}`,
        detail: occupants.map((o) => o.reading).join(' '),
      }
    : {
        label: `Empty lagna — follow ${GRAHA_NAMES[lagnaLordId]} in H${lordHouse}`,
        detail: `${GRAHA_NAMES[lagnaLordId]} placement is the D27 willpower address.`,
      }

  const focus: NakshatramshaLagnaFocus = {
    lagna: asc,
    lagnaName: RASHI_NAMES[asc],
    lagnaSanskrit: RASHI_SANSKRIT[asc],
    lagnaEmpty,
    occupants,
    lagnaLord: {
      id: lagnaLordId,
      name: GRAHA_NAMES[lagnaLordId],
      house: lordHouse,
      rashi: lordG?.rashi ?? asc,
      rashiName: RASHI_NAMES[lordG?.rashi ?? asc],
      dignity: lordG?.dignity ?? 'neutral',
      isRetro: Boolean(lordG?.isRetro),
      conjunctNames: lordConjuncts.map((id) => GRAHA_NAMES[id]),
      reading: [
        lordG
          ? `${GRAHA_NAMES[lagnaLordId]} in ${RASHI_NAMES[lordG.rashi]} (H${lordHouse}, ${dignityLabel(lordG.dignity)}).`
          : `${GRAHA_NAMES[lagnaLordId]} unavailable.`,
        lordConjuncts.length
          ? `With ${lordConjuncts.map((id) => GRAHA_NAMES[id]).join(', ')}.`
          : null,
      ]
        .filter(Boolean)
        .join(' '),
    },
    signFlavor: LAGNA_SIGN_FLAVOR[asc],
    primarySignal,
    consultationHint,
  }

  const houses: NakshatramshaHouseRow[] = []
  for (let h = 1; h <= 12; h++) {
    const rashi = wholeSignHouseSign(asc, h)
    const occ = grahas.filter((g) => houseOf(g.rashi, asc) === h)
    const vitalityScore = vitalityOfHouse(grahas, asc, h)
    const names = occ.map((g) => GRAHA_NAMES[g.id]).join(', ')
    const bits = [`${HOUSE_THEMES[h]}.`]
    if (!occ.length) bits.push(`Quiet — lord of ${RASHI_NAMES[rashi]} carries the load.`)
    else bits.push(`Occupied by ${names}.`)
    if (h === 7 && occ.some((g) => g.id === 'Ju') && occ.some((g) => g.id === 'Ke')) {
      bits.push('Jupiter–Ketu here: partner satisfaction / liking can feel incomplete.')
    }
    if (h === 5 && occ.filter((g) => MALEFICS.includes(g.id)).length >= 2) {
      bits.push('Heavy malefic load in 5th: fear scripts (including medical anxiety) can loop — keep language gentle.')
    }
    if (h === 4 && occ.some((g) => g.id === 'Ma') && occ.some((g) => g.id === 'Ra')) {
      bits.push('Mars–Rahu in 4th: strong intuition / unconventional inner method.')
    }
    houses.push({
      house: h,
      rashi,
      rashiName: RASHI_NAMES[rashi],
      lordId: SIGN_LORDS[rashi],
      lordName: GRAHA_NAMES[SIGN_LORDS[rashi]],
      occupants: occ.map((g) => ({ id: g.id, name: GRAHA_NAMES[g.id], isRetro: Boolean(g.isRetro) })),
      theme: HOUSE_THEMES[h] ?? `House ${h}`,
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
  let label = 'Steady bandwidth'
  let tone: D27Tone = 'mixed'
  let reading: string
  if (score >= 14) {
    band = 'high'
    label = 'High pressure capacity'
    tone = 'supportive'
    reading =
      'D27 kendras and lagna hold decent vitality — under stress, the will to continue tends to hold. Still rest; high capacity is not infinite.'
  } else if (score <= 7) {
    band = 'strained'
    label = 'Strained bandwidth'
    tone = 'challenging'
    reading =
      'D27 vitality looks strained — struggle endurance is limited right now. Soften load, seek support, and avoid stacking crises. This is capacity language, not a medical or risk diagnosis.'
  } else {
    reading =
      'Moderate D27 bandwidth — can handle pressure in waves. Protect sleep and meaning (Jupiter/9th themes) when load rises.'
  }
  const bandwidth: NakshatramshaBandwidth = { score, band, label, reading, tone }

  // Ask themes: weakest houses among 1,4,5,7,8,10,11 (consultation-relevant)
  const askCandidates = [1, 4, 5, 7, 8, 10, 11]
    .map((h) => houses.find((row) => row.house === h)!)
    .sort((a, b) => a.vitalityScore - b.vitalityScore)
  const askThemes: NakshatramshaAskTheme[] = askCandidates.slice(0, 3).map((row) => ({
    house: row.house,
    theme: ASK_THEME_LABEL[row.house] ?? row.theme,
    vitalityScore: row.vitalityScore,
    reading: `Weak/afflicted energy in H${row.house} (${ASK_THEME_LABEL[row.house]}): class rule — what cannot generate cleanly in D27 is often exactly what the client asks about. ${row.reading}`,
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
      d3OverlapNote =
        'Venus in 7th repeats from D3 into D27 — marriage/partnership is likely the specific ask (not only “relationships in general”).'
    } else if (
      d3Me && d27Me &&
      houseOf(d3Me.rashi, d3Asc) === houseOf(d27Me.rashi, asc)
    ) {
      d3OverlapNote = `Mercury house repeats (H${houseOf(d3Me.rashi, d3Asc)}) across D3 and D27 — that mental theme is “stuck at peak” enough to voice.`
    }
  }

  const layerLink: NakshatramshaLayerLink = {
    d3LagnaName: d3Asc ? RASHI_NAMES[d3Asc] : null,
    d3OverlapNote,
    reading: d3Asc
      ? `D1 (outer) → D3 ${RASHI_NAMES[d3Asc]} (mind) → D27 ${RASHI_NAMES[asc]} (finer bandwidth). ${d3OverlapNote ?? 'Compare repeating house themes between D3 and D27 for what will be said aloud.'}`
      : `D27 ${RASHI_NAMES[asc]} is the fine layer. Add D3 when available to separate silent mind-loops from voiced consultation themes.`,
  }

  const planets = CLASSICAL_ORDER
    .map((id) => planetById(grahas, id))
    .filter((g): g is GrahaData => Boolean(g))
    .map((g) => {
      const house = houseOf(g.rashi, asc)
      const tone: D27Tone =
        STRONG_DIGNITY.includes(g.dignity) ? 'supportive'
          : WEAK_DIGNITY.includes(g.dignity) ? 'challenging'
            : 'mixed'
      return {
        id: g.id,
        name: GRAHA_NAMES[g.id],
        rashi: g.rashi,
        rashiName: RASHI_NAMES[g.rashi],
        house,
        dignity: g.dignity,
        isRetro: Boolean(g.isRetro),
        theme: HOUSE_THEMES[house] ?? `H${house}`,
        interpretation: `${GRAHA_NAMES[g.id]} in ${RASHI_NAMES[g.rashi]} (H${house}, ${dignityLabel(g.dignity)}). ${HOUSE_THEMES[house]}.`,
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
    { kind: 'info', title: 'Consultation hint', text: focus.consultationHint },
  ]
  for (const ask of askThemes.slice(0, 2)) {
    insights.push({ kind: 'caution', title: `Likely ask · H${ask.house}`, text: ask.reading })
  }
  if (d3OverlapNote) {
    insights.push({ kind: 'highlight', title: 'D3 ↔ D27 repeat', text: d3OverlapNote })
  }
  insights.push({
    kind: 'info',
    title: 'Layering',
    text: layerLink.reading,
  })

  const summary = [
    `D27 opens in ${RASHI_NAMES[asc]} — ${bandwidth.label.toLowerCase()} (score ${score}/20).`,
    askThemes[0] ? `Likely voiced theme: ${askThemes[0].theme}.` : null,
    d3OverlapNote ? 'D3/D27 repeat strengthens the ask.' : null,
  ]
    .filter(Boolean)
    .join(' ')

  return {
    d27Lagna: asc,
    d27LagnaName: RASHI_NAMES[asc],
    d27LagnaSanskrit: RASHI_SANSKRIT[asc],
    summary,
    purpose: D27_PURPOSE,
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
