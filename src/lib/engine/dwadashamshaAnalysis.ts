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
  RASHI_SANSKRIT,
} from '@/types/astrology'
import { dignityText, fill, gName, pick, rName, type EngineLang } from '@/lib/engine/divisionalLang'
import {
  D12_HOUSE_THEMES_HI,
  D12_LAGNA_PLANET_HI,
  D12_LAGNA_SIGN_FLAVOR_HI,
  D12_PURPOSE_HI,
  D12_TEXT_HI,
  D12_THIRST_HI,
} from '@/lib/engine/locale/dwadashamsha.hi'

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

const D12_TEXT_EN: Record<keyof typeof D12_TEXT_HI, string> = {
  thirstReading: 'Debilitated {planet} in D12 ({rashi}, H{house}): {lack}',
  thirstGeneric: 'Debilitated {planet} in D12 marks a deep psychological thirst from what felt incomplete.',
  thirstChaseGeneric: 'May overcompensate around that planet’s significations in this life.',
  ketuMissing: 'Ketu placement unavailable in D12.',
  ketuMarker: 'Ketu in {rashi} (H{house}, {dignity}) is the D12 “release” marker.',
  ketuStrong: 'Supports giving away, flowing, and lightening life’s luggage when isolation arrives.',
  ketuWeak: 'Still points to detachment practice — soften clinging rather than force renunciation.',
  ketu4: 'Often far from home even in dreams — root release is part of the path.',
  ketu12: '12th house Ketu strengthens sleep / dream release and letting go.',
  houseFallback: 'D12 house {house}',
  planetIn: '{planet} in {rashi} (H{house}, {dignity}).',
  themeEnd: '{theme}.',
  planetDebil: 'Debility here flags a thirst — what felt incomplete tends to chase completion now.',
  planetKetu: 'Ketu favors release over accumulation in the D12 field.',
  planetRetro: 'Retrograde intensifies the inner replay of that theme.',
  houseEmpty: 'Empty — read the lord of {rashi} for quieter results.',
  occupiedBy: 'Occupied by {names}.',
  h12Malefic: 'Difficult pressure here can echo as unsettling dream content — soften with rest and release practice, not fear.',
  h12Ketu: 'Ketu here supports letting go in sleep and solitude.',
  h12Lum: 'Luminaries / Rahu in 12th can feel like wanting to speak but not fully expressing — give the inner voice a daytime outlet.',
  h8: 'Deep residue and soul-thirst pressure; map carefully onto D1 without dramatic past-life claims.',
  h4Ketu: 'Ketu in 4th: distance from home can appear even in dreams.',
  h7Rahu: 'Rahu in 7th: unfinished relating / “best of” thirst may color partner themes.',
  d4Malefic: 'D4 shows {names} near the heart/home — present emotional intolerance of toxicity is a D4 story, not automatic D12 residue.',
  d4Lagna: 'D4 lagna {rashi} — what is innately in the heart right now (present, not programmed).',
  d8Hit: 'D8 highlights {names} on crisis/fear axes — accumulated this-life fear, distinct from D12’s already-completed residue.',
  d8Lagna: 'D8 lagna {rashi} available — use for this-life accumulated fear, not past residue.',
  d8Missing: 'D8 not in this chart’s active varga set — contrast stays conceptual until Ashtamsha is calculated.',
  d12Twelfth: 'D12 12th holds {names} — dream / release field for this chart.',
  d12Lagna: 'D12 lagna {rashi} — past residue, dreams, and isolation tone.',
  cD4Label: 'D4 · Heart (now)',
  cD4Nature: 'Present, innately present — “you already are this.”',
  cD4Summary: 'What is in the heart right now; emotional foundation and home space.',
  cD8Label: 'D8 · Trauma (this life)',
  cD8Nature: 'Accumulated over time in this life — fear, regret, suppression.',
  cD8Summary: 'What you most fear; unresolved problems gathered gradually.',
  cD12Label: 'D12 · Residue (yesterday)',
  cD12Nature: 'Already completed before — post-echo, dreams, isolation.',
  cD12Summary: 'What was unfinished “yesterday”; thirst and release when alone.',
  xD4D3Title: 'D4 × D3 → D12 lens',
  xD4D3Text: 'Heart space (D4) combined with subconscious space (D3) describes the D12 pattern. When D3+D4 already explain a question, D12 may stay optional — use it for isolation, dreams, and unfinished residue.',
  xD6D2Title: 'D6 × D2 · Pending service',
  xD6D2Names: 'D6 6th holds {names}; with D2 resources, this often reads as unfinished service / debt to feed, repay, or care for — map softly onto D1 without assigning blame.',
  xD6D2Generic: 'D6×D2 available: look for unfinished service and ancestral-resource debts, then map back to D1 for practical payback (giving, feeding, supporting).',
  xD12D2Title: 'D12 × D2 · Luggage and resources',
  xD12D2Text: 'D12 2nd holds {names} — mixture of past luggage and material resources; generosity and fair distribution often heal hoarding imprints.',
  xD8D3Title: 'D8 × D3 · Skills path',
  xD8D3Text: 'Talents from the subconscious (D3) pressed by this-life fear/trauma (D8) can become either a wasted skill or a career. Cross-check D24 for unused learning potential.',
  sumOpen: 'D12 opens in {rashi} — isolation and dream tone lead with {label}.',
  sumAlone: 'Kendras (angular houses: 1, 4, 7, 10) are quiet — solitude can feel unsupported in the dream field.',
  sumThirst: 'Deep thirst marked by debilitated {planet}.',
  sumKetu: 'Ketu supports release and lightening the load.',
  occColors: '{planet} colors the D12 isolation face.',
  occRetro: 'Retrograde intensifies the inner replay.',
  lordSits: '{lord} sits in {rashi} (H{house}, {dignity}).',
  lordMissing: '{lord} placement unavailable.',
  lordWith: 'With {names} — blend those natures into the isolation story.',
  lordAlone: '{lord} alone steers the alone-time narrative.',
  lordEmptyKendras: 'Empty kendras (angular houses: 1, 4, 7, 10) amplify the sense of being alone in dreams.',
  occupiedLabel: 'Lagna occupied by {names}',
  emptyLabel: 'Empty lagna — follow {lord} in house {house}',
  houseLabel: 'House {house}',
  yesterdayTitle: 'D12 as “yesterday”',
  yesterdayText: 'D1 is today. What felt incomplete yesterday seeks completion now — through generosity, closure, and conscious release rather than panic.',
  aloneTitle: 'Alone in the dream field',
  aloneText: 'Kendras H{houses} are empty — solitude can feel unsupported. Build waking support so isolation does not equal abandonment.',
  thirstTitle: 'Thirst · {planet}',
  ketuTitle: 'Ketu · release',
  h12Title: '12th house pressure',
}

/** Per-call language context (text tables + name helpers). */
interface D12Ctx {
  T: Record<keyof typeof D12_TEXT_HI, string>
  HT: Record<number, string>
  g: (id: GrahaId) => string
  r: (x: Rashi) => string
  dig: (d: Dignity) => string
  names: (list: GrahaData[]) => string
  lang: EngineLang
}

function d12Ctx(lang: EngineLang): D12Ctx {
  const g = (id: GrahaId) => gName(id, lang)
  return {
    T: pick(D12_TEXT_EN, D12_TEXT_HI as Record<keyof typeof D12_TEXT_HI, string>, lang),
    HT: pick(HOUSE_THEMES, D12_HOUSE_THEMES_HI, lang),
    g,
    r: (x: Rashi) => rName(x, lang),
    dig: (d: Dignity) => dignityText(d, lang),
    names: (list: GrahaData[]) => list.map((x) => g(x.id)).join(', '),
    lang,
  }
}

function wholeSignHouseSign(ascRashi: Rashi, house: number): Rashi {
  return (((ascRashi - 1 + house - 1) % 12) + 1) as Rashi
}

function houseOf(planetRashi: Rashi, ascRashi: Rashi): number {
  return ((planetRashi - ascRashi + 12) % 12) + 1
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

function buildThirst(g: GrahaData, asc: Rashi, L: D12Ctx): DwadashamshaThirst {
  const { T } = L
  const house = houseOf(g.rashi, asc)
  const pack = L.lang === 'hi' ? D12_THIRST_HI[g.id] : THIRST_READINGS[g.id]
  return {
    id: g.id,
    name: L.g(g.id),
    rashi: g.rashi,
    rashiName: L.r(g.rashi),
    house,
    dignity: g.dignity,
    tone: 'challenging',
    reading: pack
      ? fill(T.thirstReading, { planet: L.g(g.id), rashi: L.r(g.rashi), house, lack: pack.lack })
      : fill(T.thirstGeneric, { planet: L.g(g.id) }),
    overcompensateHint: pack?.chase ?? T.thirstChaseGeneric,
  }
}

function buildKetuRelease(grahas: GrahaData[], asc: Rashi, L: D12Ctx): DwadashamshaKetuRelease {
  const { T } = L
  const ketu = planetById(grahas, 'Ke')
  if (!ketu) {
    return {
      present: false,
      house: null,
      rashiName: null,
      dignity: null,
      tone: 'neutral',
      reading: T.ketuMissing,
    }
  }
  const house = houseOf(ketu.rashi, asc)
  const strong = STRONG_DIGNITY.includes(ketu.dignity) || [1, 4, 5, 9, 12].includes(house)
  const tone: D12Tone = strong ? 'supportive' : house === 6 || house === 8 ? 'mixed' : 'neutral'
  const bits = [
    fill(T.ketuMarker, { rashi: L.r(ketu.rashi), house, dignity: L.dig(ketu.dignity) }),
    strong ? T.ketuStrong : T.ketuWeak,
  ]
  if (house === 4) bits.push(T.ketu4)
  if (house === 12) bits.push(T.ketu12)
  return {
    present: true,
    house,
    rashiName: L.r(ketu.rashi),
    dignity: ketu.dignity,
    tone,
    reading: bits.join(' '),
  }
}

function buildPlanetRow(g: GrahaData, asc: Rashi, L: D12Ctx): DwadashamshaPlanetRow {
  const { T } = L
  const house = houseOf(g.rashi, asc)
  const theme = L.HT[house] ?? fill(T.houseFallback, { house })
  const tone = toneFromDignity(g.dignity, house)
  const bits: string[] = [
    fill(T.planetIn, { planet: L.g(g.id), rashi: L.r(g.rashi), house, dignity: L.dig(g.dignity) }),
    fill(T.themeEnd, { theme }),
  ]
  if (g.dignity === 'debilitated') {
    bits.push(T.planetDebil)
  }
  if (g.id === 'Ke') {
    bits.push(T.planetKetu)
  }
  if (g.isRetro) {
    bits.push(T.planetRetro)
  }
  return {
    id: g.id,
    name: L.g(g.id),
    rashi: g.rashi,
    rashiName: L.r(g.rashi),
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
  L: D12Ctx,
): { reading: string; tone: D12Tone } {
  const { T } = L
  const theme = L.HT[house] ?? fill(T.houseFallback, { house })
  const names = L.names(occupants)
  const bits: string[] = [fill(T.themeEnd, { theme })]

  if (!occupants.length) {
    bits.push(fill(T.houseEmpty, { rashi: L.r(rashi) }))
    return { reading: bits.join(' '), tone: 'neutral' }
  }

  bits.push(fill(T.occupiedBy, { names }))

  if (house === 12) {
    const malefics = occupants.filter((g) => MALEFICS.includes(g.id) && g.id !== 'Ke')
    if (malefics.length) {
      bits.push(T.h12Malefic)
    }
    if (occupants.some((g) => g.id === 'Ke')) {
      bits.push(T.h12Ketu)
    }
    if (occupants.some((g) => g.id === 'Su' || g.id === 'Mo' || g.id === 'Ra')) {
      bits.push(T.h12Lum)
    }
  }

  if (house === 8) {
    bits.push(T.h8)
  }

  if (house === 4 && occupants.some((g) => g.id === 'Ke')) {
    bits.push(T.h4Ketu)
  }

  if (house === 7 && occupants.some((g) => g.id === 'Ra')) {
    bits.push(T.h7Rahu)
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

function buildContrasts(chart: ChartOutput, d12: { asc: Rashi; grahas: GrahaData[] }, L: D12Ctx): DwadashamshaContrast[] {
  const { T } = L
  const d4Asc = chart.vargaLagnas?.D4 as Rashi | undefined
  const d4Grahas = chart.vargas?.D4
  const d8Asc = chart.vargaLagnas?.D8 as Rashi | undefined
  const d8Grahas = chart.vargas?.D8

  let d4Note: string | null = null
  if (d4Asc && d4Grahas?.length) {
    const occ = d4Grahas.filter((g) => houseOf(g.rashi, d4Asc) === 1 || houseOf(g.rashi, d4Asc) === 4)
    const mal = occ.filter((g) => MALEFICS.includes(g.id))
    d4Note = mal.length
      ? fill(T.d4Malefic, { names: L.names(mal) })
      : fill(T.d4Lagna, { rashi: L.r(d4Asc) })
  }

  let d8Note: string | null = null
  if (d8Asc && d8Grahas?.length) {
    const h8 = d8Grahas.filter((g) => houseOf(g.rashi, d8Asc) === 8 || houseOf(g.rashi, d8Asc) === 1)
    d8Note = h8.length
      ? fill(T.d8Hit, { names: L.names(h8) })
      : fill(T.d8Lagna, { rashi: L.r(d8Asc) })
  } else {
    d8Note = T.d8Missing
  }

  const d12Twelfth = d12.grahas.filter((g) => houseOf(g.rashi, d12.asc) === 12)
  const d12Note = d12Twelfth.length
    ? fill(T.d12Twelfth, { names: L.names(d12Twelfth) })
    : fill(T.d12Lagna, { rashi: L.r(d12.asc) })

  return [
    {
      id: 'd4',
      label: T.cD4Label,
      nature: T.cD4Nature,
      summary: T.cD4Summary,
      chartNote: d4Note,
    },
    {
      id: 'd8',
      label: T.cD8Label,
      nature: T.cD8Nature,
      summary: T.cD8Summary,
      chartNote: d8Note,
    },
    {
      id: 'd12',
      label: T.cD12Label,
      nature: T.cD12Nature,
      summary: T.cD12Summary,
      chartNote: d12Note,
    },
  ]
}

function buildCrossNotes(chart: ChartOutput, d12Asc: Rashi, d12Grahas: GrahaData[], L: D12Ctx): DwadashamshaCrossNote[] {
  const { T } = L
  const notes: DwadashamshaCrossNote[] = []
  const has = (name: string) => Boolean(chart.vargas?.[name]?.length && chart.vargaLagnas?.[name])

  if (has('D3') && has('D4')) {
    notes.push({
      id: 'd4xd3',
      title: T.xD4D3Title,
      text: T.xD4D3Text,
      tone: 'neutral',
    })
  }

  if (has('D2') && has('D6')) {
    const d6 = chart.vargas!.D6!
    const d6Asc = chart.vargaLagnas!.D6 as Rashi
    const d6Sixth = d6.filter((g) => houseOf(g.rashi, d6Asc) === 6)
    const names = L.names(d6Sixth)
    notes.push({
      id: 'd6xd2',
      title: T.xD6D2Title,
      text: names
        ? fill(T.xD6D2Names, { names })
        : T.xD6D2Generic,
      tone: 'mixed',
    })
  }

  if (has('D2')) {
    const d12Second = d12Grahas.filter((g) => houseOf(g.rashi, d12Asc) === 2)
    if (d12Second.length) {
      notes.push({
        id: 'd12xd2',
        title: T.xD12D2Title,
        text: fill(T.xD12D2Text, { names: L.names(d12Second) }),
        tone: 'mixed',
      })
    }
  }

  if (has('D8') && has('D3')) {
    notes.push({
      id: 'd8xd3',
      title: T.xD8D3Title,
      text: T.xD8D3Text,
      tone: 'neutral',
    })
  }

  return notes
}

function buildSummary(
  isolation: DwadashamshaIsolation,
  thirst: DwadashamshaThirst | null,
  ketu: DwadashamshaKetuRelease,
  L: D12Ctx,
): string {
  const { T } = L
  const parts: string[] = [
    fill(T.sumOpen, { rashi: isolation.lagnaName, label: isolation.primarySignal.label.toLowerCase() }),
  ]
  if (isolation.aloneInDreams) {
    parts.push(T.sumAlone)
  }
  if (thirst) {
    parts.push(fill(T.sumThirst, { planet: thirst.name }))
  }
  if (ketu.tone === 'supportive') {
    parts.push(T.sumKetu)
  }
  return parts.join(' ')
}

/**
 * Analyze Dwadashamsha (D12) from chart vargas.
 * Returns null if D12 data is missing. `lang` switches display text only.
 */
export function analyzeDwadashamsha(chart: ChartOutput, lang: EngineLang = 'en'): DwadashamshaAnalysis | null {
  const asc = chart.vargaLagnas?.D12 as Rashi | undefined
  const grahas = chart.vargas?.D12
  if (!asc || !grahas?.length) return null

  const L = d12Ctx(lang)
  const { T } = L
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
  const LPR = lang === 'hi' ? D12_LAGNA_PLANET_HI : LAGNA_PLANET_READINGS

  const occupants: DwadashamshaLagnaOccupant[] = lagnaOcc.map((g) => ({
    id: g.id,
    name: L.g(g.id),
    isRetro: Boolean(g.isRetro),
    reading: [
      LPR[g.id] ?? fill(T.occColors, { planet: L.g(g.id) }),
      g.isRetro ? T.occRetro : null,
    ]
      .filter(Boolean)
      .join(' '),
  }))

  const isolationBase: Omit<DwadashamshaIsolation, 'primarySignal'> = {
    lagna: asc,
    lagnaName: L.r(asc),
    lagnaSanskrit: lang === 'hi' ? L.r(asc) : RASHI_SANSKRIT[asc],
    lagnaEmpty,
    occupants,
    lagnaLord: {
      id: lagnaLordId,
      name: L.g(lagnaLordId),
      house: lordHouse,
      rashi: lordG?.rashi ?? asc,
      rashiName: L.r(lordG?.rashi ?? asc),
      dignity: lordG?.dignity ?? 'neutral',
      isRetro: Boolean(lordG?.isRetro),
      conjunctIds: lordConjuncts,
      conjunctNames: lordConjuncts.map((id) => L.g(id)),
      reading: [
        lordG
          ? fill(T.lordSits, { lord: L.g(lagnaLordId), rashi: L.r(lordG.rashi), house: lordHouse, dignity: L.dig(lordG.dignity) })
          : fill(T.lordMissing, { lord: L.g(lagnaLordId) }),
        lordConjuncts.length
          ? fill(T.lordWith, { names: lordConjuncts.map((id) => L.g(id)).join(', ') })
          : fill(T.lordAlone, { lord: L.g(lagnaLordId) }),
        aloneInDreams
          ? T.lordEmptyKendras
          : null,
      ]
        .filter(Boolean)
        .join(' '),
    },
    signFlavor: (lang === 'hi' ? D12_LAGNA_SIGN_FLAVOR_HI : LAGNA_SIGN_FLAVOR)[asc],
    aloneInDreams,
    emptyKendras: [...emptyKendras],
  }

  const primarySignal: DwadashamshaIsolation['primarySignal'] = occupants.length
    ? {
        strength: 'occupation',
        label: fill(T.occupiedLabel, { names: occupants.map((o) => o.name).join(', ') }),
        detail: occupants.map((o) => o.reading).join(' '),
      }
    : {
        strength: 'lord',
        label: fill(T.emptyLabel, { lord: L.g(lagnaLordId), house: lordHouse }),
        detail: isolationBase.lagnaLord.reading,
      }

  const isolation: DwadashamshaIsolation = { ...isolationBase, primarySignal }

  const thirstCandidates = grahas
    .filter((g) => g.dignity === 'debilitated')
    .sort((a, b) => CLASSICAL_ORDER.indexOf(a.id) - CLASSICAL_ORDER.indexOf(b.id))
    .map((g) => buildThirst(g, asc, L))
  const thirst = thirstCandidates[0] ?? null

  const ketuRelease = buildKetuRelease(grahas, asc, L)
  const planets = CLASSICAL_ORDER
    .map((id) => planetById(grahas, id))
    .filter((g): g is GrahaData => Boolean(g))
    .map((g) => buildPlanetRow(g, asc, L))

  const houses: DwadashamshaHouseRow[] = []
  for (let h = 1; h <= 12; h++) {
    const rashi = wholeSignHouseSign(asc, h)
    const occ = grahas.filter((g) => houseOf(g.rashi, asc) === h)
    const { reading, tone } = buildHouseReading(h, occ, rashi, L)
    const lordId = SIGN_LORDS[rashi]
    houses.push({
      house: h,
      rashi,
      rashiName: L.r(rashi),
      lordId,
      lordName: L.g(lordId),
      occupants: occ.map((g) => ({ id: g.id, name: L.g(g.id), isRetro: Boolean(g.isRetro) })),
      theme: L.HT[h] ?? fill(T.houseLabel, { house: h }),
      reading,
      tone,
    })
  }

  const focusedHouses = houses.filter((h) => (FOCUS_HOUSES as readonly number[]).includes(h.house))
  const contrasts = buildContrasts(chart, { asc, grahas }, L)
  const crossNotes = buildCrossNotes(chart, asc, grahas, L)

  const insights: DwadashamshaInsight[] = []
  insights.push({
    kind: 'highlight',
    title: isolation.primarySignal.label,
    text: isolation.primarySignal.detail,
  })
  insights.push({
    kind: 'info',
    title: T.yesterdayTitle,
    text: T.yesterdayText,
  })
  if (isolation.aloneInDreams) {
    insights.push({
      kind: 'caution',
      title: T.aloneTitle,
      text: fill(T.aloneText, { houses: isolation.emptyKendras.join(', ') }),
    })
  }
  if (thirst) {
    insights.push({
      kind: 'caution',
      title: fill(T.thirstTitle, { planet: thirst.name }),
      text: `${thirst.reading} ${thirst.overcompensateHint}`,
    })
  }
  if (ketuRelease.present) {
    insights.push({
      kind: ketuRelease.tone === 'supportive' ? 'strength' : 'info',
      title: T.ketuTitle,
      text: ketuRelease.reading,
    })
  }
  const h12 = houses.find((h) => h.house === 12)
  if (h12 && h12.tone === 'challenging') {
    insights.push({
      kind: 'caution',
      title: T.h12Title,
      text: h12.reading,
    })
  }
  for (const note of crossNotes.slice(0, 2)) {
    insights.push({
      kind: 'info',
      title: note.title,
      text: note.text,
    })
  }

  return {
    d12Lagna: asc,
    d12LagnaName: L.r(asc),
    d12LagnaSanskrit: lang === 'hi' ? L.r(asc) : RASHI_SANSKRIT[asc],
    summary: buildSummary(isolation, thirst, ketuRelease, L),
    purpose: pick(D12_PURPOSE, D12_PURPOSE_HI, lang),
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
