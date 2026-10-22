// ─────────────────────────────────────────────────────────────
//  src/lib/engine/dwadashamshaAnalysis.ts
//  Dwadashamsha (D12) — isolation / dream tone, thirst, release
//  Class heuristics: past-life residue without graphic death narratives
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

export type D12Tone = 'supportive' | 'challenging' | 'mixed' | 'neutral'

export type D12SignalStrength = 'occupation' | 'lord' | 'sign'

export interface DwadashamshaInsight {
  kind: 'strength' | 'caution' | 'highlight' | 'info'
  title: string
  text: string
}

export interface DwadashamshaPlanetRow {
  id: GrahaId
  name: string
  rashi: Rashi
  rashiName: string
  house: number
  dignity: Dignity
  isRetro: boolean
  theme: string
  interpretation: string
  tone: D12Tone
}

export interface DwadashamshaHouseRow {
  house: number
  rashi: Rashi
  rashiName: string
  lordId: GrahaId
  lordName: string
  occupants: { id: GrahaId; name: string; isRetro: boolean }[]
  theme: string
  reading: string
  tone: D12Tone
}

export interface DwadashamshaLagnaOccupant {
  id: GrahaId
  name: string
  isRetro: boolean
  reading: string
}

export interface DwadashamshaIsolation {
  lagna: Rashi
  lagnaName: string
  lagnaSanskrit: string
  lagnaEmpty: boolean
  occupants: DwadashamshaLagnaOccupant[]
  lagnaLord: {
    id: GrahaId
    name: string
    house: number
    rashi: Rashi
    rashiName: string
    dignity: Dignity
    isRetro: boolean
    conjunctIds: GrahaId[]
    conjunctNames: string[]
    reading: string
  }
  signFlavor: string
  aloneInDreams: boolean
  emptyKendras: number[]
  primarySignal: {
    strength: D12SignalStrength
    label: string
    detail: string
  }
}

export interface DwadashamshaThirst {
  id: GrahaId
  name: string
  rashi: Rashi
  rashiName: string
  house: number
  dignity: Dignity
  tone: D12Tone
  reading: string
  overcompensateHint: string
}

export interface DwadashamshaKetuRelease {
  present: boolean
  house: number | null
  rashiName: string | null
  dignity: Dignity | null
  tone: D12Tone
  reading: string
}

export interface DwadashamshaContrast {
  id: 'd4' | 'd8' | 'd12'
  label: string
  nature: string
  summary: string
  chartNote: string | null
}

export interface DwadashamshaCrossNote {
  id: string
  title: string
  text: string
  tone: D12Tone
}

export interface DwadashamshaAnalysis {
  d12Lagna: Rashi
  d12LagnaName: string
  d12LagnaSanskrit: string
  summary: string
  purpose: string
  isolation: DwadashamshaIsolation
  thirst: DwadashamshaThirst | null
  thirstCandidates: DwadashamshaThirst[]
  ketuRelease: DwadashamshaKetuRelease
  contrasts: DwadashamshaContrast[]
  crossNotes: DwadashamshaCrossNote[]
  planets: DwadashamshaPlanetRow[]
  houses: DwadashamshaHouseRow[]
  focusedHouses: DwadashamshaHouseRow[]
  insights: DwadashamshaInsight[]
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
const FOCUS_HOUSES = [1, 4, 7, 8, 12] as const

const D12_PURPOSE =
  'Dwadashamsha shows what stays unfinished beneath the surface: isolation and dream tone, quiet thirsts carried forward, and how easily you can release rather than hoard. Read it as yesterday’s residue meeting today’s chart — not as a quick material consult.'

const LAGNA_SIGN_FLAVOR: Record<Rashi, string> = {
  1: 'Aries lagna in isolation — restless drive; alone time pushes action or inner battle.',
  2: 'Taurus lagna in isolation — survival and resource security color solitude and dreams.',
  3: 'Gemini lagna in isolation — mental chatter; wants to distribute ideas even when alone.',
  4: 'Cancer lagna in isolation — emotional tides; home and mother-memory surface in dreams.',
  5: 'Leo lagna in isolation — builds an inner kingdom; pride and creativity run the dream stage.',
  6: 'Virgo lagna in isolation — problem-solving and service scripts continue in sleep.',
  7: 'Libra lagna in isolation — unfinished relating; fairness and partnership themes haunt quiet hours.',
  8: 'Scorpio lagna in isolation — bottled emotion, restlessness, “not being heard” when alone.',
  9: 'Sagittarius lagna in isolation — moral questions, teachers, and journeys in the dream field.',
  10: 'Capricorn lagna in isolation — duty and status scripts; solitude feels like unfinished work.',
  11: 'Aquarius lagna in isolation — networked dreams, group causes, and distant belonging.',
  12: 'Pisces lagna in isolation — peace-seeking retreat (ashram / shore / quiet place) in the inner world.',
}

const HOUSE_THEMES: Record<number, string> = {
  1: 'How you show up when alone — the dream-self’s face',
  2: 'Past resources and speech held back; what you still “owe” or hoard',
  3: 'Courage, messaging, and distribution impulse in isolation',
  4: 'Emotional root in solitude; distance from home even in dreams',
  5: 'Creative / fear scripts that replay when the mind is quiet',
  6: 'Service debts and correction themes carried into quiet hours',
  7: 'Unfinished relating; who appears when you are alone',
  8: 'Deep residue, sudden inner upheaval, and soul-thirst pressure',
  9: 'Guru / dharma memory; faith patterns in the dream field',
  10: 'Public role or discourse that continues even in sleep',
  11: 'Desire fulfillment and gains imagined in isolation',
  12: 'Letting go, sleep, dreams, and what haunts when fully alone',
}

const THIRST_READINGS: Partial<Record<GrahaId, { lack: string; chase: string }>> = {
  Su: {
    lack: 'Recognition, warmth, or a dignified closing from a father / authority figure was missing.',
    chase: 'May over-seek validation, position, or appreciation in this life.',
  },
  Mo: {
    lack: 'Emotional nourishment, safety, or mothering softness felt incomplete.',
    chase: 'May over-seek care, comfort food, or emotional reassurance.',
  },
  Ma: {
    lack: 'Courage, fair fight, or physical security felt unfinished.',
    chase: 'May overtrain, overdefend, or stay on edge about vulnerability.',
  },
  Me: {
    lack: 'Being heard, learning completed, or clear communication was missing.',
    chase: 'May overtalk, overstudy, or chase unfinished exams / messages in dreams.',
  },
  Ju: {
    lack: 'Sweetness, appreciation, or warm closure (“no nectar at the end”) was missing.',
    chase: 'May never feel satisfied with endings, praise, or spiritual closure.',
  },
  Ve: {
    lack: 'Beauty, affection, or luxury felt locked away or unfinished in relating.',
    chase: 'May over-possess partners or chase premium comforts and gifts.',
  },
  Sa: {
    lack: 'Security, food, or lasting support felt scarce (survival imprint).',
    chase: 'May over-save, over-work, or fear scarcity even when resources exist.',
  },
  Ra: {
    lack: 'The “best” or costliest experience felt out of reach.',
    chase: 'May obsess over premium status, shopping peaks, or foreign/edge desires.',
  },
  Ke: {
    lack: 'Release itself was incomplete — detachment arrived as loss rather than freedom.',
    chase: 'May swing between abrupt renunciation and clinging; practice soft letting-go.',
  },
}

const LAGNA_PLANET_READINGS: Partial<Record<GrahaId, string>> = {
  Su: 'Sun on D12 lagna — identity scripts run even in solitude; may resist “taking position” while still helping.',
  Mo: 'Moon on D12 lagna — solitude seeks peace / moksha flavor; emotional weather colors dreams strongly.',
  Ma: 'Mars on D12 lagna — inner conflict or muttered battle continues when alone; heat in the dream body.',
  Me: 'Mercury on D12 lagna — coding, problem-solving, or mental loops keep running in isolation and sleep.',
  Ju: 'Jupiter on D12 lagna — teaching, counsel, or dharma discourse can continue even in dreams.',
  Ve: 'Venus on D12 lagna — unfinished affection and aesthetic longing color alone-time.',
  Sa: 'Saturn on D12 lagna — survival fear and fighter energy around resources show up when alone.',
  Ra: 'Rahu on D12 lagna — amplified thirst and restlessness in isolation; wants more than the quiet can give.',
  Ke: 'Ketu on D12 lagna — supports release and lightening; solitude can feel like flowing away from burden.',
}

function wholeSignHouseSign(ascRashi: Rashi, house: number): Rashi {
  return (((ascRashi - 1 + house - 1) % 12) + 1) as Rashi
}

function houseOf(planetRashi: Rashi, ascRashi: Rashi): number {
  return ((planetRashi - ascRashi + 12) % 12) + 1
}

function dignityLabel(d: Dignity): string {
  return d.replace(/_/g, ' ')
}

function toneFromDignity(d: Dignity, house: number): D12Tone {
  if (STRONG_DIGNITY.includes(d) && ![6, 8, 12].includes(house)) return 'supportive'
  if (WEAK_DIGNITY.includes(d) || [6, 8, 12].includes(house)) return 'challenging'
  if ([1, 4, 5, 7, 9, 10].includes(house)) return 'mixed'
  return 'neutral'
}

function planetById(grahas: GrahaData[], id: GrahaId): GrahaData | undefined {
  return grahas.find((g) => g.id === id)
}

function conjunctIds(grahas: GrahaData[], target: GrahaData): GrahaId[] {
  return grahas.filter((g) => g.id !== target.id && g.rashi === target.rashi).map((g) => g.id)
}

function buildThirst(g: GrahaData, asc: Rashi): DwadashamshaThirst {
  const house = houseOf(g.rashi, asc)
  const pack = THIRST_READINGS[g.id]
  return {
    id: g.id,
    name: GRAHA_NAMES[g.id],
    rashi: g.rashi,
    rashiName: RASHI_NAMES[g.rashi],
    house,
    dignity: g.dignity,
    tone: 'challenging',
    reading: pack
      ? `Debilitated ${GRAHA_NAMES[g.id]} in D12 (${RASHI_NAMES[g.rashi]}, H${house}): ${pack.lack}`
      : `Debilitated ${GRAHA_NAMES[g.id]} in D12 marks a deep psychological thirst from what felt incomplete.`,
    overcompensateHint: pack?.chase ?? 'May overcompensate around that planet’s significations in this life.',
  }
}

function buildKetuRelease(grahas: GrahaData[], asc: Rashi): DwadashamshaKetuRelease {
  const ketu = planetById(grahas, 'Ke')
  if (!ketu) {
    return {
      present: false,
      house: null,
      rashiName: null,
      dignity: null,
      tone: 'neutral',
      reading: 'Ketu placement unavailable in D12.',
    }
  }
  const house = houseOf(ketu.rashi, asc)
  const strong = STRONG_DIGNITY.includes(ketu.dignity) || [1, 4, 5, 9, 12].includes(house)
  const tone: D12Tone = strong ? 'supportive' : house === 6 || house === 8 ? 'mixed' : 'neutral'
  const bits = [
    `Ketu in ${RASHI_NAMES[ketu.rashi]} (H${house}, ${dignityLabel(ketu.dignity)}) is the D12 “release” marker.`,
    strong
      ? 'Supports giving away, flowing, and lightening life’s luggage when isolation arrives.'
      : 'Still points to detachment practice — soften clinging rather than force renunciation.',
  ]
  if (house === 4) bits.push('Often far from home even in dreams — root release is part of the path.')
  if (house === 12) bits.push('12th house Ketu strengthens sleep / dream release and letting go.')
  return {
    present: true,
    house,
    rashiName: RASHI_NAMES[ketu.rashi],
    dignity: ketu.dignity,
    tone,
    reading: bits.join(' '),
  }
}

function buildPlanetRow(g: GrahaData, asc: Rashi): DwadashamshaPlanetRow {
  const house = houseOf(g.rashi, asc)
  const theme = HOUSE_THEMES[house] ?? `D12 house ${house}`
  const tone = toneFromDignity(g.dignity, house)
  const bits: string[] = [
    `${GRAHA_NAMES[g.id]} in ${RASHI_NAMES[g.rashi]} (H${house}, ${dignityLabel(g.dignity)}).`,
    theme + '.',
  ]
  if (g.dignity === 'debilitated') {
    bits.push('Debility here flags a thirst — what felt incomplete tends to chase completion now.')
  }
  if (g.id === 'Ke') {
    bits.push('Ketu favors release over accumulation in the D12 field.')
  }
  if (g.isRetro) {
    bits.push('Retrograde intensifies the inner replay of that theme.')
  }
  return {
    id: g.id,
    name: GRAHA_NAMES[g.id],
    rashi: g.rashi,
    rashiName: RASHI_NAMES[g.rashi],
    house,
    dignity: g.dignity,
    isRetro: Boolean(g.isRetro),
    theme,
    interpretation: bits.join(' '),
    tone,
  }
}

function buildHouseReading(
  house: number,
  occupants: GrahaData[],
  rashi: Rashi,
): { reading: string; tone: D12Tone } {
  const theme = HOUSE_THEMES[house] ?? `D12 house ${house}`
  const names = occupants.map((g) => GRAHA_NAMES[g.id]).join(', ')
  const bits: string[] = [`${theme}.`]

  if (!occupants.length) {
    bits.push(`Empty — read the lord of ${RASHI_NAMES[rashi]} for quieter results.`)
    return { reading: bits.join(' '), tone: 'neutral' }
  }

  bits.push(`Occupied by ${names}.`)

  if (house === 12) {
    const malefics = occupants.filter((g) => MALEFICS.includes(g.id) && g.id !== 'Ke')
    if (malefics.length) {
      bits.push('Malefic pressure here can echo as unsettling dream content — soften with rest and release practice, not fear.')
    }
    if (occupants.some((g) => g.id === 'Ke')) {
      bits.push('Ketu here supports letting go in sleep and solitude.')
    }
    if (occupants.some((g) => g.id === 'Su' || g.id === 'Mo' || g.id === 'Ra')) {
      bits.push('Luminaries / Rahu in 12th can feel like wanting to speak but not fully expressing — give the inner voice a daytime outlet.')
    }
  }

  if (house === 8) {
    bits.push('Deep residue and soul-thirst pressure; map carefully onto D1 without dramatic past-life claims.')
  }

  if (house === 4 && occupants.some((g) => g.id === 'Ke')) {
    bits.push('Ketu in 4th: distance from home can appear even in dreams.')
  }

  if (house === 7 && occupants.some((g) => g.id === 'Ra')) {
    bits.push('Rahu in 7th: unfinished relating / “best of” thirst may color partner themes.')
  }

  const maleficHit = occupants.filter((g) => MALEFICS.includes(g.id)).length
  const tone: D12Tone =
    house === 8 || house === 12
      ? maleficHit >= 1 ? 'challenging' : 'mixed'
      : maleficHit >= 2
        ? 'challenging'
        : 'mixed'

  return { reading: bits.join(' '), tone }
}

function buildContrasts(chart: ChartOutput, d12: { asc: Rashi; grahas: GrahaData[] }): DwadashamshaContrast[] {
  const d4Asc = chart.vargaLagnas?.D4 as Rashi | undefined
  const d4Grahas = chart.vargas?.D4
  const d8Asc = chart.vargaLagnas?.D8 as Rashi | undefined
  const d8Grahas = chart.vargas?.D8

  let d4Note: string | null = null
  if (d4Asc && d4Grahas?.length) {
    const occ = d4Grahas.filter((g) => houseOf(g.rashi, d4Asc) === 1 || houseOf(g.rashi, d4Asc) === 4)
    const mal = occ.filter((g) => MALEFICS.includes(g.id))
    d4Note = mal.length
      ? `D4 shows ${mal.map((g) => GRAHA_NAMES[g.id]).join(', ')} near the heart/home — present emotional intolerance of toxicity is a D4 story, not automatic D12 residue.`
      : `D4 lagna ${RASHI_NAMES[d4Asc]} — what is innately in the heart right now (present, not programmed).`
  }

  let d8Note: string | null = null
  if (d8Asc && d8Grahas?.length) {
    const h8 = d8Grahas.filter((g) => houseOf(g.rashi, d8Asc) === 8 || houseOf(g.rashi, d8Asc) === 1)
    d8Note = h8.length
      ? `D8 highlights ${h8.map((g) => GRAHA_NAMES[g.id]).join(', ')} on crisis/fear axes — accumulated this-life fear, distinct from D12’s already-completed residue.`
      : `D8 lagna ${RASHI_NAMES[d8Asc]} available — use for this-life accumulated fear, not past residue.`
  } else {
    d8Note = 'D8 not in this chart’s active varga set — contrast stays conceptual until Ashtamsha is calculated.'
  }

  const d12Twelfth = d12.grahas.filter((g) => houseOf(g.rashi, d12.asc) === 12)
  const d12Note = d12Twelfth.length
    ? `D12 12th holds ${d12Twelfth.map((g) => GRAHA_NAMES[g.id]).join(', ')} — dream / release field for this chart.`
    : `D12 lagna ${RASHI_NAMES[d12.asc]} — past residue, dreams, and isolation tone.`

  return [
    {
      id: 'd4',
      label: 'D4 · Heart (now)',
      nature: 'Present, innately present — “you already are this.”',
      summary: 'What is in the heart right now; emotional foundation and home space.',
      chartNote: d4Note,
    },
    {
      id: 'd8',
      label: 'D8 · Trauma (this life)',
      nature: 'Accumulated over time in this life — fear, regret, suppression.',
      summary: 'What you most fear; unresolved problems gathered gradually.',
      chartNote: d8Note,
    },
    {
      id: 'd12',
      label: 'D12 · Residue (yesterday)',
      nature: 'Already completed before — post-echo, dreams, isolation.',
      summary: 'What was unfinished “yesterday”; thirst and release when alone.',
      chartNote: d12Note,
    },
  ]
}

function buildCrossNotes(chart: ChartOutput, d12Asc: Rashi, d12Grahas: GrahaData[]): DwadashamshaCrossNote[] {
  const notes: DwadashamshaCrossNote[] = []
  const has = (name: string) => Boolean(chart.vargas?.[name]?.length && chart.vargaLagnas?.[name])

  if (has('D3') && has('D4')) {
    notes.push({
      id: 'd4xd3',
      title: 'D4 × D3 → D12 lens',
      text: 'Class framing: heart space (D4) combined with subconscious space (D3) describes the D12 pattern. When D3+D4 already explain a question, D12 may stay optional — use it for isolation, dreams, and unfinished residue.',
      tone: 'neutral',
    })
  }

  if (has('D2') && has('D6')) {
    const d2 = chart.vargas!.D2!
    const d6 = chart.vargas!.D6!
    const d6Asc = chart.vargaLagnas!.D6 as Rashi
    const d6Sixth = d6.filter((g) => houseOf(g.rashi, d6Asc) === 6)
    const names = d6Sixth.map((g) => GRAHA_NAMES[g.id]).join(', ')
    notes.push({
      id: 'd6xd2',
      title: 'D6 × D2 · Pending service',
      text: names
        ? `D6 6th holds ${names}; with D2 resources, class reads unfinished service / debt to feed, repay, or care for — map softly onto D1 without assigning blame.`
        : 'D6×D2 available: look for unfinished service and ancestral-resource debts, then map back to D1 for practical payback (giving, feeding, supporting).',
      tone: 'mixed',
    })
  }

  if (has('D2')) {
    const d2 = chart.vargas!.D2!
    const d12Second = d12Grahas.filter((g) => houseOf(g.rashi, d12Asc) === 2)
    if (d12Second.length) {
      notes.push({
        id: 'd12xd2',
        title: 'D12 × D2 · Luggage and resources',
        text: `D12 2nd holds ${d12Second.map((g) => GRAHA_NAMES[g.id]).join(', ')} — mixture of past luggage and material resources; generosity and fair distribution often heal hoarding imprints.`,
        tone: 'mixed',
      })
    }
  }

  if (has('D8') && has('D3')) {
    notes.push({
      id: 'd8xd3',
      title: 'D8 × D3 · Skills path',
      text: 'Class note: talents from the subconscious (D3) pressed by this-life fear/trauma (D8) can become either a wasted skill or a career. Cross-check D24 for unused learning potential.',
      tone: 'neutral',
    })
  }

  return notes
}

function buildSummary(
  isolation: DwadashamshaIsolation,
  thirst: DwadashamshaThirst | null,
  ketu: DwadashamshaKetuRelease,
): string {
  const parts: string[] = [
    `D12 opens in ${isolation.lagnaName} — isolation and dream tone lead with ${isolation.primarySignal.label.toLowerCase()}.`,
  ]
  if (isolation.aloneInDreams) {
    parts.push('Kendras are quiet — solitude can feel unsupported in the dream field.')
  }
  if (thirst) {
    parts.push(`Deep thirst marked by debilitated ${thirst.name}.`)
  }
  if (ketu.tone === 'supportive') {
    parts.push('Ketu supports release and lightening the load.')
  }
  return parts.join(' ')
}

/**
 * Analyze Dwadashamsha (D12) from chart vargas.
 * Returns null if D12 data is missing.
 */
export function analyzeDwadashamsha(chart: ChartOutput): DwadashamshaAnalysis | null {
  const asc = chart.vargaLagnas?.D12 as Rashi | undefined
  const grahas = chart.vargas?.D12
  if (!asc || !grahas?.length) return null

  const lagnaOcc = grahas.filter((g) => houseOf(g.rashi, asc) === 1)
  const lagnaEmpty = lagnaOcc.length === 0
  const lagnaLordId = SIGN_LORDS[asc]
  const lordG = planetById(grahas, lagnaLordId)
  const lordHouse = lordG ? houseOf(lordG.rashi, asc) : 1
  const lordConjuncts = lordG ? conjunctIds(grahas, lordG) : []

  const emptyKendras = KENDRAS.filter(
    (h) => !grahas.some((g) => houseOf(g.rashi, asc) === h),
  )
  const aloneInDreams = emptyKendras.length >= 3

  const occupants: DwadashamshaLagnaOccupant[] = lagnaOcc.map((g) => ({
    id: g.id,
    name: GRAHA_NAMES[g.id],
    isRetro: Boolean(g.isRetro),
    reading: [
      LAGNA_PLANET_READINGS[g.id] ?? `${GRAHA_NAMES[g.id]} colors the D12 isolation face.`,
      g.isRetro ? 'Retrograde intensifies the inner replay.' : null,
    ]
      .filter(Boolean)
      .join(' '),
  }))

  const isolationBase: Omit<DwadashamshaIsolation, 'primarySignal'> = {
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
      conjunctIds: lordConjuncts,
      conjunctNames: lordConjuncts.map((id) => GRAHA_NAMES[id]),
      reading: [
        lordG
          ? `${GRAHA_NAMES[lagnaLordId]} sits in ${RASHI_NAMES[lordG.rashi]} (H${lordHouse}, ${dignityLabel(lordG.dignity)}).`
          : `${GRAHA_NAMES[lagnaLordId]} placement unavailable.`,
        lordConjuncts.length
          ? `With ${lordConjuncts.map((id) => GRAHA_NAMES[id]).join(', ')} — blend those natures into the isolation story.`
          : `${GRAHA_NAMES[lagnaLordId]} alone steers the alone-time narrative.`,
        aloneInDreams
          ? 'Empty kendras amplify the sense of being alone in dreams.'
          : null,
      ]
        .filter(Boolean)
        .join(' '),
    },
    signFlavor: LAGNA_SIGN_FLAVOR[asc],
    aloneInDreams,
    emptyKendras: [...emptyKendras],
  }

  const primarySignal: DwadashamshaIsolation['primarySignal'] = occupants.length
    ? {
        strength: 'occupation',
        label: `Lagna occupied by ${occupants.map((o) => o.name).join(', ')}`,
        detail: occupants.map((o) => o.reading).join(' '),
      }
    : {
        strength: 'lord',
        label: `Empty lagna — follow ${GRAHA_NAMES[lagnaLordId]} in H${lordHouse}`,
        detail: isolationBase.lagnaLord.reading,
      }

  const isolation: DwadashamshaIsolation = { ...isolationBase, primarySignal }

  const thirstCandidates = grahas
    .filter((g) => g.dignity === 'debilitated')
    .sort((a, b) => CLASSICAL_ORDER.indexOf(a.id) - CLASSICAL_ORDER.indexOf(b.id))
    .map((g) => buildThirst(g, asc))
  const thirst = thirstCandidates[0] ?? null

  const ketuRelease = buildKetuRelease(grahas, asc)
  const planets = CLASSICAL_ORDER
    .map((id) => planetById(grahas, id))
    .filter((g): g is GrahaData => Boolean(g))
    .map((g) => buildPlanetRow(g, asc))

  const houses: DwadashamshaHouseRow[] = []
  for (let h = 1; h <= 12; h++) {
    const rashi = wholeSignHouseSign(asc, h)
    const occ = grahas.filter((g) => houseOf(g.rashi, asc) === h)
    const { reading, tone } = buildHouseReading(h, occ, rashi)
    const lordId = SIGN_LORDS[rashi]
    houses.push({
      house: h,
      rashi,
      rashiName: RASHI_NAMES[rashi],
      lordId,
      lordName: GRAHA_NAMES[lordId],
      occupants: occ.map((g) => ({ id: g.id, name: GRAHA_NAMES[g.id], isRetro: Boolean(g.isRetro) })),
      theme: HOUSE_THEMES[h] ?? `House ${h}`,
      reading,
      tone,
    })
  }

  const focusedHouses = houses.filter((h) => (FOCUS_HOUSES as readonly number[]).includes(h.house))
  const contrasts = buildContrasts(chart, { asc, grahas })
  const crossNotes = buildCrossNotes(chart, asc, grahas)

  const insights: DwadashamshaInsight[] = []
  insights.push({
    kind: 'highlight',
    title: isolation.primarySignal.label,
    text: isolation.primarySignal.detail,
  })
  insights.push({
    kind: 'info',
    title: 'D12 as “yesterday”',
    text: 'D1 is today. What felt incomplete yesterday seeks completion now — through generosity, closure, and conscious release rather than panic.',
  })
  if (isolation.aloneInDreams) {
    insights.push({
      kind: 'caution',
      title: 'Alone in the dream field',
      text: `Kendras H${isolation.emptyKendras.join(', ')} are empty — solitude can feel unsupported. Build waking support so isolation does not equal abandonment.`,
    })
  }
  if (thirst) {
    insights.push({
      kind: 'caution',
      title: `Thirst · ${thirst.name}`,
      text: `${thirst.reading} ${thirst.overcompensateHint}`,
    })
  }
  if (ketuRelease.present) {
    insights.push({
      kind: ketuRelease.tone === 'supportive' ? 'strength' : 'info',
      title: 'Ketu · release',
      text: ketuRelease.reading,
    })
  }
  const h12 = houses.find((h) => h.house === 12)
  if (h12 && h12.tone === 'challenging') {
    insights.push({
      kind: 'caution',
      title: '12th house pressure',
      text: h12.reading,
    })
  }
  for (const note of crossNotes.slice(0, 2)) {
    insights.push({
      kind: note.tone === 'challenging' || note.tone === 'mixed' ? 'info' : 'info',
      title: note.title,
      text: note.text,
    })
  }

  return {
    d12Lagna: asc,
    d12LagnaName: RASHI_NAMES[asc],
    d12LagnaSanskrit: RASHI_SANSKRIT[asc],
    summary: buildSummary(isolation, thirst, ketuRelease),
    purpose: D12_PURPOSE,
    isolation,
    thirst,
    thirstCandidates,
    ketuRelease,
    contrasts,
    crossNotes,
    planets,
    houses,
    focusedHouses,
    insights,
  }
}
