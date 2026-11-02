// ─────────────────────────────────────────────────────────────
//  src/lib/engine/jaimini/insights.ts
//  Deeper Jaimini readings: Dwara and Bahya, special lagna timing,
//  trinity activation, Arudha wealth, house triads, Atmakaraka
//  nakshatra, and transit triggers. Birth-chart readings only:
//  nothing here predicts death.
// ─────────────────────────────────────────────────────────────

import type { DashaNode, GrahaData, GrahaId, LagnaData, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES, RASHI_SHORT } from '@/types/astrology'
import { FIXED_HOUSE_SIGNIFICATORS } from '../karakas'
import { readArgalaSources } from './argala'
import { getRashiDrishti } from './aspects'
import type { JaiminiBalaResult } from './bala'
import { nakshatraOf } from './judgment'
import type { JaiminiMethod } from './method'
import { calculateGatewaySigns } from './special'
import { calculateJaiminiTrinity, resolveSignLord } from './trinity'

export interface InsightContext {
  grahas: GrahaData[]
  lagnas: LagnaData
  roleOf: Partial<Record<GrahaId, string | null>>
  bala: JaiminiBalaResult
  /** Running sign-dasha tree for the chosen dasha. */
  nodes: DashaNode[]
  method: JaiminiMethod
  asOf?: Date
}

export interface SignWindows {
  current: string | null
  next: string | null
}

export type StrengthBand = 'strong' | 'middling' | 'weak'

function signAt(sign: Rashi, house: number): Rashi {
  return ((((sign + house - 2) % 12) + 12) % 12 + 1) as Rashi
}

function distance(from: Rashi, to: Rashi): number {
  return ((to - from + 12) % 12) + 1
}

function ordinal(n: number): string {
  if (n === 1) return '1st'
  if (n === 2) return '2nd'
  if (n === 3) return '3rd'
  return `${n}th`
}

function occupantsText(ctx: InsightContext, sign: Rashi): string {
  const here = ctx.grahas.filter(g => g.rashi === sign && GRAHA_NAMES[g.id] && isPracticalical(g.id))
  if (!here.length) return 'no planet'
  return here.map(g => {
    const role = ctx.roleOf[g.id]
    return role ? `${GRAHA_NAMES[g.id]} (${role})` : GRAHA_NAMES[g.id]
  }).join(', ')
}

const CLASSICAL: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']

function isPracticalical(id: GrahaId): boolean {
  return CLASSICAL.includes(id)
}

function classical(grahas: GrahaData[]): GrahaData[] {
  return grahas.filter(g => isPracticalical(g.id))
}

function years(node: DashaNode): string {
  return `${new Date(node.start).getFullYear()}–${new Date(node.end).getFullYear()}`
}

function running(node: DashaNode, now: number): boolean {
  return now >= new Date(node.start).getTime() && now < new Date(node.end).getTime()
}

/** Current and next time a sign runs, as mahadasha or as antardasha inside the running one. */
export function signWindows(nodes: DashaNode[], sign: Rashi, now: number = Date.now()): SignWindows {
  const short = RASHI_SHORT[sign]
  const maha = nodes.find(n => running(n, now))
  const antar = maha?.children?.find(n => running(n, now))
  let current: string | null = null
  if (maha?.lord === short) current = `mahadasha ${years(maha)}`
  else if (antar?.lord === short) current = `antardasha ${years(antar)}`

  const candidates: Array<{ at: number; text: string }> = []
  for (const n of nodes) {
    if (n.lord === short && new Date(n.start).getTime() > now) {
      candidates.push({ at: new Date(n.start).getTime(), text: `mahadasha ${years(n)}` })
    }
  }
  for (const n of maha?.children ?? []) {
    if (n.lord === short && new Date(n.start).getTime() > now) {
      candidates.push({ at: new Date(n.start).getTime(), text: `antardasha ${years(n)}` })
    }
  }
  candidates.sort((a, b) => a.at - b.at)
  return { current, next: candidates[0]?.text ?? null }
}

function windowText(w: SignWindows): string {
  if (w.current && w.next) return `Running now as ${w.current}. Next: ${w.next}.`
  if (w.current) return `Running now as ${w.current}.`
  if (w.next) return `Next: ${w.next}.`
  return 'It does not run again in this cycle.'
}

/** Sign strength band by rank among the twelve Jaimini Rashi Bala totals. */
export function rashiBand(bala: JaiminiBalaResult, sign: Rashi): { band: StrengthBand; rank: number } {
  const ranked = (Object.values(bala.rashis) as Array<{ rashi: Rashi; total: number }>)
    .slice()
    .sort((a, b) => b.total - a.total)
  const rank = ranked.findIndex(r => r.rashi === sign) + 1
  return { band: rank <= 4 ? 'strong' : rank >= 9 ? 'weak' : 'middling', rank }
}

export function strengthOfBala(bala: JaiminiBalaResult): (id: GrahaId) => number {
  return id => bala.planets[id]?.total ?? 0
}

// ── Dwara and Bahya ──────────────────────────────────────────

export interface GatewayReading {
  dwara: Rashi
  bahya: Rashi
  band: StrengthBand
  rank: number
  entry: string
  exit: string
  useFor: string | null
}

export function readGateway(ctx: InsightContext, dwaraSign: Rashi): GatewayReading {
  const { dwara, bahya } = calculateGatewaySigns(ctx.lagnas.ascRashi, dwaraSign)
  const { band, rank } = rashiBand(ctx.bala, bahya)
  const outcome = band === 'strong'
    ? 'The exit sign is strong, so what starts now tends to finish well.'
    : band === 'weak'
      ? 'The exit sign is weak, so what starts now tends to finish with effort or an unsatisfying result.'
      : 'The exit sign has average strength, so the outcome depends on the lord and aspects.'
  const house = distance(ctx.lagnas.ascRashi, dwara)
  return {
    dwara,
    bahya,
    band,
    rank,
    entry: `Dwara is ${RASHI_NAMES[dwara]}, the ${ordinal(house)} from Lagna, holding ${occupantsText(ctx, dwara)}. Events of this period enter through this sign.`,
    exit: `Bahya is ${RASHI_NAMES[bahya]}, the same count of ${house} from Dwara, holding ${occupantsText(ctx, bahya)}. It ranks ${ordinal(rank)} of 12 in Rashi Bala. ${outcome}`,
    useFor: ctx.method === 'practical'
      ? 'Use the pair for a situation with an entry and an exit, such as a court case or an illness: Dwara shows how the person got in, and Bahya shows whether and how they come out.'
      : null,
  }
}

// ── Ghatika, Varnada, Hora ───────────────────────────────────

export interface SpecialLagnaRow {
  id: 'GL' | 'VL' | 'HL'
  name: string
  sign: Rashi
  band: StrengthBand
  reading: string
  timing: string
}

function signOfLongitude(lon: number): Rashi | null {
  if (!Number.isFinite(lon)) return null
  return ((Math.floor((((lon % 360) + 360) % 360) / 30) % 12) + 1) as Rashi
}

export function readSpecialLagnas(ctx: InsightContext): { rows: SpecialLagnaRow[]; comparison: string | null } {
  const now = (ctx.asOf ?? new Date()).getTime()
  const rows: SpecialLagnaRow[] = []
  const add = (id: SpecialLagnaRow['id'], name: string, lon: number, text: (band: StrengthBand) => string) => {
    const sign = signOfLongitude(lon)
    if (!sign) return
    const { band } = rashiBand(ctx.bala, sign)
    rows.push({
      id,
      name,
      sign,
      band,
      reading: `${RASHI_NAMES[sign]} holds ${occupantsText(ctx, sign)}. ${text(band)}`,
      timing: windowText(signWindows(ctx.nodes, sign, now)),
    })
  }

  add('GL', 'Ghatika Lagna', ctx.lagnas.ghatiLagna, band => {
    const base = 'It shows power, authority, and when raja yoga switches on. Its sign dasha opens the authority phase.'
    if (ctx.method !== 'practical') return base
    return band === 'weak'
      ? `${base} It is weak here, so the person tends to work harder than the return.`
      : band === 'strong'
        ? `${base} It is strong here, so authority does arrive.`
        : base
  })
  add('VL', 'Varnada Lagna', ctx.lagnas.varnadaLagna, () => 'It shows social standing and how the world places the person. It matters most for fame, reputation, and public life.')
  add('HL', 'Hora Lagna', ctx.lagnas.horaLagna, () => 'It shows wealth and material manifestation.')

  const vl = rows.find(r => r.id === 'VL')
  let comparison: string | null = null
  if (vl) {
    const lagnaBand = rashiBand(ctx.bala, ctx.lagnas.ascRashi).band
    if (lagnaBand === 'strong' && vl.band !== 'strong') {
      comparison = 'Lagna is stronger than Varnada. The person is strong inside and gets less outside recognition.'
    } else if (vl.band === 'strong' && lagnaBand !== 'strong') {
      comparison = 'Varnada is stronger than Lagna. The public image is more powerful than the inner footing.'
    } else if (vl.band === 'strong' && lagnaBand === 'strong') {
      comparison = 'Lagna and Varnada are both strong. Inner strength and public standing agree.'
    } else {
      comparison = 'Neither Lagna nor Varnada stands out in strength, so public standing is built slowly.'
    }
  }
  return { rows, comparison }
}

// ── Brahma, Maheshwara, Rudra activation ─────────────────────

export interface TrinityActivationRow {
  id: 'brahma' | 'maheshwara' | 'rudra'
  title: string
  planet: GrahaId | null
  sign: Rashi | null
  active: boolean
  theme: string
  timing: string
}

export function readTrinityActivation(ctx: InsightContext): TrinityActivationRow[] {
  const now = (ctx.asOf ?? new Date()).getTime()
  const trinity = calculateJaiminiTrinity({ grahas: ctx.grahas, lagnas: ctx.lagnas })
  const rows: Array<Pick<TrinityActivationRow, 'id' | 'title' | 'theme'> & { planet: GrahaId | null }> = [
    { id: 'brahma', title: 'Brahma', planet: trinity.brahma.id, theme: 'Creation. New work, a new relationship, or a new phase begins.' },
    { id: 'maheshwara', title: 'Maheshwara', planet: trinity.maheshwara.id, theme: 'Transformation. Life changes direction, often through the end of an old form.' },
    { id: 'rudra', title: 'Rudra', planet: trinity.rudra.id, theme: 'Pressure and endings. A phase, job, or arrangement closes, and caution is needed.' },
  ]
  return rows.map(row => {
    const sign = ctx.grahas.find(g => g.id === row.planet)?.rashi ?? null
    const w = sign ? signWindows(ctx.nodes, sign, now) : { current: null, next: null }
    return {
      ...row,
      sign,
      active: Boolean(w.current),
      timing: sign ? `${GRAHA_NAMES[row.planet as GrahaId]} sits in ${RASHI_NAMES[sign]}. ${windowText(w)}` : 'This role has no planet in this chart.',
    }
  })
}

// ── Arudha reading ───────────────────────────────────────────

export interface ArudhaInsight {
  id: 'wealth' | 'gains' | 'leak' | 'fame' | 'relationship'
  title: string
  sign: Rashi
  text: string
}

const LEAK_BY_PLANET: Partial<Record<GrahaId, string>> = {
  Ra: 'Rahu points to loss through scandal or manipulation.',
  Ke: 'Ketu points to money leaving without the person noticing where it went.',
  Su: 'The Sun points to government penalties, tax, and fines.',
  Ma: 'Mars points to bribes and to loss through raw land.',
  Sa: 'Saturn points to a slow drain: small spending against a shrinking reserve.',
  Me: 'Mercury points to legal and paperwork disputes when it is under malefic pressure.',
  Ju: 'Jupiter points to legal or advisory costs when it is under malefic pressure.',
}

export function readArudhaInsights(
  ctx: InsightContext,
  arudhas: { AL: Rashi; A7: Rashi },
): ArudhaInsight[] {
  const al = arudhas.AL
  const second = signAt(al, 2)
  const tenth = signAt(al, 10)
  const eleventh = signAt(al, 11)
  const twelfth = signAt(al, 12)
  const inTwelfth = classical(ctx.grahas).filter(g => g.rashi === twelfth)
  const inEleventh = classical(ctx.grahas).filter(g => g.rashi === eleventh)

  const gainsKind = ctx.method !== 'practical' || !inEleventh.length
    ? ''
    : inEleventh.length > 1
      ? ' Several planets here point to more than one source of income.'
      : ['Ra', 'Ke', 'Ma'].includes(inEleventh[0].id)
        ? ' This planet points to income that carries risk or is open to question.'
        : ['Ju', 'Ve', 'Me', 'Mo'].includes(inEleventh[0].id)
          ? ' This planet points to clean, ethical income.'
          : ''

  const leakLines = ctx.method === 'practical'
    ? inTwelfth.map(g => LEAK_BY_PLANET[g.id]).filter(Boolean).join(' ')
    : ''
  const leakLoad = inTwelfth.length
    ? `This house is occupied, so spending is heavy${ctx.method === 'practical' ? ' even when income is high' : ''}.`
    : 'This house is empty, so spending stays easier to control.'

  const a7House = distance(al, arudhas.A7)
  const a7Tone = [1, 5, 9].includes(a7House)
    ? 'That is a harmonious placement for the relationship image.'
    : [6, 8, 12].includes(a7House)
      ? 'That is a placement of friction between self-image and the relationship.'
      : a7House === 7
        ? 'They face each other, so the relationship is highly visible.'
        : 'That is a neutral placement.'

  return [
    { id: 'wealth', title: 'Visible wealth (2nd from AL)', sign: second, text: `${RASHI_NAMES[second]} holds ${occupantsText(ctx, second)}. It shows the money people see.` },
    { id: 'gains', title: 'Income (11th from AL)', sign: eleventh, text: `${RASHI_NAMES[eleventh]} holds ${occupantsText(ctx, eleventh)}. It shows how income arrives.${gainsKind}` },
    { id: 'leak', title: 'Where money leaks (12th from AL)', sign: twelfth, text: `${RASHI_NAMES[twelfth]} holds ${occupantsText(ctx, twelfth)}. ${leakLoad}${leakLines ? ` ${leakLines}` : ''}` },
    { id: 'fame', title: 'Fame (10th from AL)', sign: tenth, text: `${RASHI_NAMES[tenth]} holds ${occupantsText(ctx, tenth)}. It shows what the person is publicly known for.` },
    { id: 'relationship', title: 'Relationship image (A7 from AL)', sign: arudhas.A7, text: `A7 is ${RASHI_NAMES[arudhas.A7]}, the ${ordinal(a7House)} from AL. ${a7Tone}` },
  ]
}

// ── Three-way house reading ──────────────────────────────────

export interface HouseTriadRow {
  house: number
  sign: Rashi
  charaKarakas: string
  lord: string
  lordHouse: number
  fixedKaraka: string
  fixedHouse: number
  reading: string
}

/** Chara karaka in the house, sign lord, and fixed karaka read together. */
export function readHouseTriads(ctx: InsightContext): HouseTriadRow[] {
  const lagna = ctx.lagnas.ascRashi
  const placed = classical(ctx.grahas).map(g => ({ id: g.id, rashi: g.rashi, degree: g.degree }))
  const rows: HouseTriadRow[] = []
  for (let house = 1; house <= 12; house++) {
    const sign = signAt(lagna, house)
    const inHouse = classical(ctx.grahas).filter(g => g.rashi === sign && ctx.roleOf[g.id])
    const charaKarakas = inHouse.length
      ? inHouse.map(g => `${ctx.roleOf[g.id]} (${GRAHA_NAMES[g.id]})`).join(', ')
      : 'none'
    const lordId = resolveSignLord(sign, placed)
    const lordGraha = ctx.grahas.find(g => g.id === lordId)
    const lordHouse = lordGraha ? distance(lagna, lordGraha.rashi) : 0
    const fixedId = FIXED_HOUSE_SIGNIFICATORS[house].planet
    const fixedGraha = ctx.grahas.find(g => g.id === fixedId)
    const fixedHouse = fixedGraha ? distance(lagna, fixedGraha.rashi) : 0
    const lordRole = ctx.roleOf[lordId]
    const fixedRole = ctx.roleOf[fixedId]
    const hard = [6, 8, 12]
    const strained = [lordHouse, fixedHouse].filter(h => hard.includes(h)).length

    const parts = [
      inHouse.length ? `${charaKarakas} acts on this house directly.` : 'No chara karaka sits here, so the lord and fixed karaka carry it.',
      `The lord ${GRAHA_NAMES[lordId]}${lordRole ? ` (${lordRole})` : ''} is in the ${ordinal(lordHouse)}.`,
      `The fixed karaka ${GRAHA_NAMES[fixedId]}${fixedRole ? ` (${fixedRole})` : ''} is in the ${ordinal(fixedHouse)}.`,
      strained === 2
        ? 'Both sit in difficult houses, so this area takes work.'
        : strained === 1
          ? 'One sits in a difficult house, so results are mixed.'
          : 'Neither sits in a difficult house, so the area has support.',
    ]
    rows.push({
      house,
      sign,
      charaKarakas,
      lord: GRAHA_NAMES[lordId],
      lordHouse,
      fixedKaraka: GRAHA_NAMES[fixedId],
      fixedHouse,
      reading: parts.join(' '),
    })
  }
  return rows
}

// ── Atmakaraka nakshatra ─────────────────────────────────────

const NAKSHATRA_NATURE: Record<string, { detailed: boolean; nature: string; story: string }> = {
  Ashwini: { detailed: true, nature: 'Quick action and healing.', story: 'A healer or someone who answered emergencies. This life carries impulsiveness: the act comes before the thought.' },
  Bharani: { detailed: true, nature: 'Judgment and consequence.', story: 'An authority who could punish. This life carries guilt over small things and takes on burdens.' },
  Krittika: { detailed: true, nature: 'Cutting and purifying.', story: 'A warrior or critic who cut through falsity. This life carries harsh speech.' },
  Rohini: { detailed: false, nature: 'Growth, beauty, and comfort.', story: 'Someone who built and enjoyed abundance. This life tests attachment to comfort.' },
  Mrigashira: { detailed: false, nature: 'Searching and curiosity.', story: 'A seeker who kept moving. This life carries restlessness about what is enough.' },
  Ardra: { detailed: false, nature: 'Storm and breakthrough.', story: 'Someone who broke things in order to learn. This life carries turbulence that clears the ground.' },
  Punarvasu: { detailed: false, nature: 'Return and renewal.', story: 'Someone who lost and rebuilt. This life repeats the pattern of coming back.' },
  Pushya: { detailed: false, nature: 'Nourishing and teaching.', story: 'A teacher or caretaker. This life carries duty toward those who depend on the person.' },
  Ashlesha: { detailed: false, nature: 'Binding and hidden strategy.', story: 'Someone who held influence quietly. This life tests the use of persuasion.' },
  Magha: { detailed: false, nature: 'Lineage and throne.', story: 'A figure of ancestral authority. This life carries the weight of family and status.' },
  'Purva Phalguni': { detailed: false, nature: 'Pleasure and creativity.', story: 'An artist or lover of enjoyment. This life tests indulgence.' },
  'Uttara Phalguni': { detailed: false, nature: 'Contracts and loyalty.', story: 'Someone bound by agreements. This life carries obligations that must be honoured.' },
  Hasta: { detailed: false, nature: 'Skill of the hands.', story: 'A craftsperson or trader. This life rewards exact skill and tests cleverness.' },
  Chitra: { detailed: false, nature: 'Design and brilliance.', story: 'A builder or designer. This life tests the love of appearance.' },
  Swati: { detailed: false, nature: 'Independence and movement.', story: 'A merchant or traveller. This life carries a need for freedom.' },
  Vishakha: { detailed: false, nature: 'Fixed goals and triumph.', story: 'Someone who chased one aim hard. This life tests what the win costs.' },
  Anuradha: { detailed: false, nature: 'Friendship and devotion.', story: 'A loyal organiser. This life works through alliances.' },
  Jyeshtha: { detailed: false, nature: 'Seniority and protection.', story: 'An elder who held power. This life tests pride and control.' },
  Mula: { detailed: true, nature: 'Uprooting and getting to the root.', story: 'A practitioner of secret knowledge who may have misused power or influenced people unseen. This life brings sudden resets, and the person rebuilds from zero toward truth.' },
  'Purva Ashadha': { detailed: true, nature: 'Victory and repeated tests.', story: 'A warrior, debater, or leader who enjoyed fame. This life gives quick success and then tests the ego again and again.' },
  'Uttara Ashadha': { detailed: true, nature: 'Dharma and lasting victory.', story: 'A ruler or ethical leader who carried heavy responsibility. This life gives late, stable success and a legacy.' },
  Shravana: { detailed: false, nature: 'Listening and learning.', story: 'A student or carrier of knowledge. This life rewards listening.' },
  Dhanishtha: { detailed: false, nature: 'Wealth and rhythm.', story: 'Someone of public standing. This life tests how status is held.' },
  Shatabhisha: { detailed: false, nature: 'Healing and seclusion.', story: 'A researcher or healer working alone. This life carries distance from others.' },
  'Purva Bhadra': { detailed: false, nature: 'Intensity and sacrifice.', story: 'An ascetic or radical. This life swings between extremes.' },
  'Uttara Bhadra': { detailed: false, nature: 'Depth and patience.', story: 'A patient, contained person. This life asks for steadiness.' },
  Revati: { detailed: false, nature: 'Guidance and completion.', story: 'A guide for others on a journey. This life is about closing cycles gently.' },
}

const PADA_CAUSE = [
  '',
  'The first pada ties the pattern to authority and how it was used.',
  'The second pada ties the pattern to money and resources.',
  'The third pada ties the pattern to speech and communication.',
  'The fourth pada ties the pattern to emotion and attachment.',
]

export interface AkNakshatraReading {
  planet: GrahaId
  nakshatra: string
  lord: GrahaId
  pada: number
  nature: string
  story: string | null
  cause: string | null
  detailed: boolean
}

export function readAkNakshatra(ctx: InsightContext, ak: GrahaId): AkNakshatraReading | null {
  const graha = ctx.grahas.find(g => g.id === ak)
  if (!graha) return null
  const { name, lord, pada } = nakshatraOf(graha.rashi, graha.degree)
  const entry = NAKSHATRA_NATURE[name]
  const isPractical = ctx.method === 'practical'
  return {
    planet: ak,
    nakshatra: name,
    lord,
    pada,
    nature: entry?.nature ?? '',
    story: isPractical ? entry?.story ?? null : null,
    cause: isPractical ? PADA_CAUSE[pada] ?? null : null,
    detailed: entry?.detailed ?? false,
  }
}

// ── Transit triggers ─────────────────────────────────────────

export interface TransitPosition {
  id: GrahaId
  rashi: Rashi
}

export interface TransitTriggerRow {
  target: string
  sign: Rashi
  hits: string[]
}

export interface TransitTriggerReading {
  rows: TransitTriggerRow[]
  /** Practical formula: dasha, karaka, argala, transit. Null under the classical method. */
  confirmation: { dasha: boolean; karaka: boolean; argala: boolean; transit: boolean; count: number; text: string } | null
}

const SLOW: GrahaId[] = ['Sa', 'Ju', 'Ra', 'Ke']

export function readTransitTriggers(
  ctx: InsightContext,
  positions: TransitPosition[],
  targets: { dashaSign: Rashi | null; ak?: GrahaId; dk?: GrahaId; upapada?: Rashi },
): TransitTriggerReading {
  const signOf = (id?: GrahaId) => ctx.grahas.find(g => g.id === id)?.rashi
  const akSign = signOf(targets.ak)
  const dkSign = signOf(targets.dk)
  const list: Array<{ target: string; sign: Rashi | undefined | null }> = [
    { target: 'Dasha sign', sign: targets.dashaSign },
    { target: 'Atmakaraka', sign: akSign },
    { target: 'Darakaraka', sign: dkSign },
    { target: 'Upapada', sign: targets.upapada },
    { target: 'Lagna', sign: ctx.lagnas.ascRashi },
  ]
  const slow = positions.filter(p => SLOW.includes(p.id))
  const rows: TransitTriggerRow[] = []
  for (const { target, sign } of list) {
    if (!sign) continue
    const hits = slow.flatMap(p => {
      if (p.rashi === sign) return [`${GRAHA_NAMES[p.id]} transits this sign`]
      if (getRashiDrishti(p.rashi).includes(sign)) return [`${GRAHA_NAMES[p.id]} aspects from ${RASHI_NAMES[p.rashi]}`]
      return []
    })
    rows.push({ target, sign, hits })
  }

  if (ctx.method !== 'practical' || !targets.dashaSign) return { rows, confirmation: null }

  const sign = targets.dashaSign
  const placed = classical(ctx.grahas).map(g => ({ id: g.id, rashi: g.rashi, degree: g.degree }))
  const lord = resolveSignLord(sign, placed)
  const karaka = Boolean(ctx.roleOf[lord]) || placed.some(g => g.rashi === sign && ctx.roleOf[g.id])
  const sources = readArgalaSources(sign, placed, strengthOfBala(ctx.bala), 'practical')
  const argala = sources.some(s => s.status === 'open' || s.status === 'strong' || s.status === 'partial')
  const transit = (rows.find(r => r.target === 'Dasha sign')?.hits.length ?? 0) > 0
  const count = 1 + [karaka, argala, transit].filter(Boolean).length
  return {
    rows,
    confirmation: {
      dasha: true,
      karaka,
      argala,
      transit,
      count,
      text: count === 4
        ? 'Dasha, karaka, argala, and transit all line up, so an event in this area is well supported now.'
        : count === 3
          ? 'Three of the four factors line up. The event can come, with some delay or change of shape.'
          : 'Fewer than three factors line up, so expect delay or a smaller result for now.',
    },
  }
}
