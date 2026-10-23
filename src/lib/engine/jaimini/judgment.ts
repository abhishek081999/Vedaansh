// ─────────────────────────────────────────────────────────────
//  src/lib/engine/jaimini/judgment.ts
//  Sagittarius judgment, Atmakaraka crisis, and Amatyakaraka
//  career notes from the Jaimini lecture. Narrative only.
//  Chara year counts and rashi drishti stay in their own modules.
//  Past-life pada stories are limited to the three nakshatras
//  the lecture actually specifies.
// ─────────────────────────────────────────────────────────────

import type { Dignity, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, NAKSHATRA_LORDS, NAKSHATRA_NAMES, RASHI_NAMES } from '@/types/astrology'
import { getDignity } from '../dignity'
import { getRashiDrishti } from './aspects'
import { resolveSignLord } from './trinity'

export interface JudgmentGraha {
  id: GrahaId
  rashi: Rashi
  degree: number
  dignity?: Dignity
}

export interface JudgmentStep {
  title: string
  text: string
}

export interface SoulKarakaReading {
  akLines: string[]
  amkLines: string[]
  sagittariusLines: string[]
}

export interface KarakaLifeRow {
  id: 'bk' | 'mk' | 'pk' | 'gk' | 'dk' | 'links'
  title: string
  lines: string[]
}

export interface KarakaLifeReading {
  rows: KarakaLifeRow[]
  loop: string | null
}

const CLASSICAL_NO_NODES: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa']

const FALL_TEXT: Partial<Record<Rashi, string>> = {
  8: 'Scorpio is an internal fall. The break is real and mostly hidden. The person goes quiet, changes, and retreats into the past. Others notice the change without seeing the cause.',
  9: 'Sagittarius is an external fall. Status, reputation, and public standing can reverse where other people can see it. The same sign raises a life when Jupiter and conduct stay stronger than ego.',
  12: 'Pisces is a mental fall. Illusion, confusion, and the wish to leave replace a clear decision. The person can drift without one public event.',
}

const SAGITTARIUS_HOUSE: Partial<Record<number, string>> = {
  1: 'In the 1st the person can take himself for a teacher and carry high confidence.',
  3: 'In the 3rd it can build a story larger than the facts, including a manipulative one.',
  8: 'In the 8th the turn is sudden: a transformation, or a sudden break.',
  9: 'In the 9th dharma is given, and the person can still get caught in ritual that stays on the surface.',
  12: 'In the 12th the instruction stays hidden, with a link to liberation or a foreign place.',
}

const AK_CRISIS: Partial<Record<GrahaId, string>> = {
  Su: 'Sun as Atmakaraka brings an identity crisis: who the person is, and what the life is for.',
  Mo: 'Moon as Atmakaraka brings emotional and psychological pain.',
  Ma: 'Mars as Atmakaraka brings anger, fights, and conflict.',
  Me: 'Mercury as Atmakaraka brings a crossroads, with no clean choice of direction.',
  Ju: 'Jupiter as Atmakaraka brings a collapse of faith or ideology.',
  Ve: 'Venus as Atmakaraka brings pain in relationships of every kind, not only the romantic one. The pain remains even when Venus is exalted.',
  Sa: 'Saturn as Atmakaraka brings delay, and struggle in the work.',
}

const AK_PAST: Partial<Record<GrahaId, string>> = {
  Su: 'The past-life picture for the Sun is a king or another holder of authority. This life carries ego and the question of identity.',
  Mo: 'The past-life picture for the Moon is a mother or a caretaker. This life carries emotional and psychological pain.',
  Ma: 'The past-life picture for Mars is a fighter or a soldier. This life carries aggression and conflict.',
  Me: 'The past-life picture for Mercury is a scholar, a merchant, or a communicator. This life carries mental confusion and indecision.',
  Ju: 'The past-life picture for Jupiter is a teacher, a priest, or a philosopher. This life carries a collapse of belief and meetings with false teachers.',
  Ve: 'The past-life picture for Venus is an artist or a lover. This life carries relationship pain even when Venus is strong.',
  Sa: 'The past-life picture for Saturn is a laborer, a servant, or a slow builder. This life carries delay and struggle.',
}

const ELEMENT_TEXT: Record<'fire' | 'earth' | 'air' | 'water', string> = {
  fire: 'The Atmakaraka is in a fire sign. The unfinished karma is aggression: irritability, anger, and fights.',
  earth: 'The Atmakaraka is in an earth sign. The unfinished karma is material: possessions, money, and status.',
  air: 'The Atmakaraka is in an air sign. The unfinished karma is mental: restlessness, and decisions that do not hold.',
  water: 'The Atmakaraka is in a water sign. The unfinished karma is emotional: bonds that were left unfinished, and attachment that forms quickly.',
}

const AMK_IN_SAGITTARIUS: Partial<Record<GrahaId, string>> = {
  Ma: 'Mars as Amatyakaraka in Sagittarius points to strategy, policy, and defense, still inside a knowledge career.',
  Ju: 'Jupiter as Amatyakaraka in Sagittarius points to teaching, philosophy, and spiritual instruction.',
  Su: 'The Sun as Amatyakaraka in Sagittarius points to leadership, authority, and government.',
  Me: 'Mercury as Amatyakaraka in Sagittarius points to teaching, writing, and the communication of knowledge.',
  Ve: 'Venus as Amatyakaraka in Sagittarius points to art joined with persuasion and wisdom.',
}

const AK_DIRECTION: Partial<Record<GrahaId, string>> = {
  Su: 'Politics, authority, government, and leadership.',
  Mo: 'Public work, nurturing, and the mind.',
  Ma: 'Military work, strategy, engineering, and real estate.',
  Me: 'Communication, business, writing, and analysis.',
  Ju: 'Teaching, spirituality, philosophy, and law.',
  Ve: 'Arts, beauty, luxury, and creative work.',
  Sa: 'Labor, service, and work that depends on discipline.',
}

function houseFrom(seed: Rashi, house: number): Rashi {
  return ((((seed - 1) + (house - 1)) % 12) + 1) as Rashi
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

function elementOf(sign: Rashi): 'fire' | 'earth' | 'air' | 'water' {
  if (sign === 1 || sign === 5 || sign === 9) return 'fire'
  if (sign === 2 || sign === 6 || sign === 10) return 'earth'
  if (sign === 3 || sign === 7 || sign === 11) return 'air'
  return 'water'
}

function dignityOf(g: JudgmentGraha): Dignity {
  return g.dignity ?? getDignity(g.id, g.rashi, g.degree)
}

function findGraha(grahas: JudgmentGraha[], id: GrahaId): JudgmentGraha | undefined {
  return grahas.find(g => g.id === id)
}

export function sagittariusBand(degree: number): { name: string; ruler: string; effect: string } {
  const arcmin = Math.round(degree * 60 * 1000) / 1000
  if (arcmin < 800) {
    return {
      name: 'Mula',
      ruler: 'Ketu',
      effect: 'Destruction comes first, then rebuilding. A settled life can be uprooted and has to be started again.',
    }
  }
  if (arcmin < 1600) {
    return {
      name: 'Purva Ashadha',
      ruler: 'Venus',
      effect: 'The rise can come quickly, and the ego is tested after the win. Pride decides whether the rise holds.',
    }
  }
  return {
    name: 'Uttara Ashadha',
    ruler: 'Sun',
    effect: 'The rise is slower and more stable. Conduct keeps the result, and a lasting position is possible.',
  }
}

export function nakshatraOf(rashi: Rashi, degree: number): { name: string; lord: GrahaId; pada: number } {
  const lon = ((rashi - 1) * 30 + degree + 360) % 360
  const span = 360 / 27
  const index = Math.min(26, Math.floor(lon / span + 1e-9))
  const into = lon - index * span
  const pada = Math.min(4, Math.floor(into / (span / 4) + 1e-9) + 1)
  return {
    name: NAKSHATRA_NAMES[index] ?? 'Ashwini',
    lord: NAKSHATRA_LORDS[index] ?? 'Ke',
    pada,
  }
}

function touches(from: Rashi | undefined, target: Rashi): boolean {
  if (from == null) return false
  return from === target || getRashiDrishti(from).includes(target)
}

function linkPhrase(id: GrahaId, from: Rashi, target: Rashi): string {
  const name = GRAHA_NAMES[id]
  if (from === target) return `${name} is conjunct ${RASHI_NAMES[target]}`
  return `${name} in ${RASHI_NAMES[from]} aspects ${RASHI_NAMES[target]}`
}

function rolesOnSign(
  sign: Rashi,
  grahas: JudgmentGraha[],
  roleOf: Partial<Record<GrahaId, string | null>>,
): Set<string> {
  const roles = new Set<string>()
  const lordRole = roleOf[resolveSignLord(sign, grahas)]
  if (lordRole) roles.add(lordRole)
  for (const g of grahas) {
    if (g.rashi === sign && roleOf[g.id]) roles.add(roleOf[g.id] as string)
  }
  return roles
}

function jupiterPhrase(grahas: JudgmentGraha[]): { text: string; weak: boolean; strong: boolean } {
  const jupiter = findGraha(grahas, 'Ju')
  if (!jupiter) return { text: 'Jupiter is missing from the chart data.', weak: false, strong: false }
  const dignity = dignityOf(jupiter)
  const strong = dignity === 'exalted' || dignity === 'moolatrikona' || dignity === 'own'
  const debilitated = dignity === 'debilitated'
  const rahu = findGraha(grahas, 'Ra')
  const rahuOnJupiter = rahu ? touches(rahu.rashi, jupiter.rashi) : false
  const dignityText = debilitated
    ? 'debilitated'
    : strong
      ? (dignity === 'exalted' ? 'exalted' : dignity === 'moolatrikona' ? 'in moolatrikona' : 'in its own sign')
      : 'of ordinary dignity'
  const rahuText = rahuOnJupiter && rahu
    ? ` ${linkPhrase('Ra', rahu.rashi, jupiter.rashi)}, so the fall risk stays open.`
    : ''
  return {
    text: `Jupiter is ${dignityText} in ${RASHI_NAMES[jupiter.rashi]}.${rahuText}`,
    weak: debilitated || rahuOnJupiter,
    strong: strong && !rahuOnJupiter,
  }
}

function pastLifeNakshatra(name: string, pada: number): string | null {
  if (name === 'Ashwini') {
    return 'Ashwini, ruled by Ketu, pictures a healer or someone who answered emergencies. This life carries impulsiveness: the act comes before the thought.'
  }
  if (name === 'Krittika') {
    return 'Krittika, ruled by the Sun, pictures someone who cut through falsity. This life carries harsh speech.'
  }
  if (name === 'Bharani') {
    const guilt = [
      '',
      'The first pada carries guilt from the misuse of authority.',
      'The second pada carries financial guilt.',
      'The third pada carries guilt over harsh speech that is not taken back.',
      'The fourth pada carries emotional guilt.',
    ][pada] ?? ''
    return `Bharani, ruled by Venus, pictures an authority who could punish. This life carries a guilt that takes on small burdens. ${guilt}`.trim()
  }
  return null
}

function amkHouseText(house: number): string {
  if (house === 5) {
    return 'Amatyakaraka is in the 5th, a trikona. A rise can be visible, and fame can bring a scandal with it.'
  }
  if (house === 6) {
    return 'Amatyakaraka is in the 6th. A rise is possible through struggle, with a health cost. The old picture is a promotion followed by a hospital stay.'
  }
  if (house === 8) {
    return 'Amatyakaraka is in the 8th. A rise can be followed by a sudden fall.'
  }
  if (house === 12) {
    return 'Amatyakaraka is in the 12th. Direction is lost, and losses follow.'
  }
  if (house === 1) {
    return 'Amatyakaraka is in the 1st, both a kendra and a trikona. A rise can be visible.'
  }
  if (house === 9) {
    return 'Amatyakaraka is in the 9th, a trikona. A rise can be visible.'
  }
  if (house === 4 || house === 7 || house === 10) {
    return `Amatyakaraka is in the ${ordinal(house)}, a kendra. A rise can be visible.`
  }
  return `Amatyakaraka is in the ${ordinal(house)}. This lecture gives no special rise or fall for that house.`
}

function conjunctionText(id: GrahaId, others: JudgmentGraha[]): string {
  if (!others.length) return `No planet is conjunct ${GRAHA_NAMES[id]}.`
  const bits = others.map(g => {
    if (g.id === 'Ra') return 'Rahu gives ambitions that do not stay satisfied'
    if (g.id === 'Ma') return 'Mars grows anger'
    if (g.id === 'Ju') return 'Jupiter brings wisdom into the career, or false guidance when Jupiter is afflicted'
    if (g.id === 'Sa') return 'Saturn delays the career and can stabilise it later'
    if (g.id === 'Mo') return 'the Moon makes career decisions emotional'
    return GRAHA_NAMES[g.id]
  })
  return `Conjunction outweighs aspect. With ${GRAHA_NAMES[id]}: ${bits.join('; ')}.`
}

export function recommendMandook(
  grahas: Array<{ id: GrahaId; rashi: Rashi }>,
  lagna: Rashi,
): { count: number; text: string } | null {
  const count = grahas.filter(g =>
    CLASSICAL_NO_NODES.includes(g.id) && [1, 4, 7, 10].includes(distance(lagna, g.rashi)),
  ).length
  if (count < 4) return null
  return {
    count,
    text: `${count} planets sit in kendras, excluding Rahu and Ketu. This lecture reads only Mandook dasha for that pattern and sets Chara aside. Chara stays available here. Use Mandook as the recommended sequence and keep the K.N. Rao Chara sequence beside it.`,
  }
}

export function sagittariusMarriageLine(upapada: Rashi, sign: Rashi): string | null {
  if (sign !== 9) return null
  if (upapada === 9) {
    return 'Sagittarius is the Upapada. While this dasha runs, marriage is highly likely for a person of marriageable age.'
  }
  if (houseFrom(upapada, 7) === 9) {
    return 'Sagittarius is the 7th from the Upapada. While this dasha runs, marriage is highly likely for a person of marriageable age.'
  }
  return null
}

function sagittariusPeriodText(input: {
  grahas: JudgmentGraha[]
  lagna?: Rashi
  lagnaDegree?: number
  roleOf: Partial<Record<GrahaId, string | null>>
  upapada?: Rashi
  antarIsSagittarius: boolean
}): string {
  const { grahas } = input
  const parts: string[] = []
  if (input.antarIsSagittarius) {
    parts.push('Sagittarius is the antardasha, so the same themes arrive in months rather than years.')
  }
  if (input.lagna) {
    const house = distance(input.lagna, 9)
    const houseText = SAGITTARIUS_HOUSE[house]
    if (houseText) parts.push(`Sagittarius is the ${ordinal(house)} house. ${houseText}`)
  }
  const inSign = grahas.filter(g => g.rashi === 9 && CLASSICAL_NO_NODES.concat(['Ra', 'Ke']).includes(g.id))
  for (const g of inSign) {
    if (g.id === 'Ra' || g.id === 'Ke') continue
    const band = sagittariusBand(g.degree)
    parts.push(`${GRAHA_NAMES[g.id]} is in ${band.name} (${band.ruler}). ${band.effect}`)
  }
  if (input.lagna === 9 && input.lagnaDegree != null) {
    const band = sagittariusBand(input.lagnaDegree)
    parts.push(`Lagna is in ${band.name} (${band.ruler}). ${band.effect}`)
  }
  const jupiter = jupiterPhrase(grahas)
  parts.push(jupiter.text)
  const rahu = findGraha(grahas, 'Ra')
  const rahuOnSag = rahu ? touches(rahu.rashi, 9) : false
  if (rahu && rahuOnSag) parts.push(`${linkPhrase('Ra', rahu.rashi, 9)}.`)
  const akId = (Object.entries(input.roleOf).find(([, role]) => role === 'AK')?.[0] ?? null) as GrahaId | null
  const ak = akId ? findGraha(grahas, akId) : undefined
  const eighth = ak ? houseFrom(ak.rashi, 8) === 9 : false
  if (eighth) parts.push('Sagittarius is the 8th from the Atmakaraka.')
  if (ak?.rashi === 9) {
    parts.push('The Atmakaraka itself sits in Sagittarius, so the opening of this dasha is a more sensitive time when maraka planets are also active.')
  }
  if (input.lagna) {
    const lords = [...new Set([
      resolveSignLord(houseFrom(input.lagna, 2), grahas),
      resolveSignLord(houseFrom(input.lagna, 7), grahas),
    ])]
    const active = lords.filter(id => {
      const g = findGraha(grahas, id)
      return g ? touches(g.rashi, 9) : false
    })
    const names = lords.map(id => GRAHA_NAMES[id]).join(' and ')
    const activeNames = active.map(id => GRAHA_NAMES[id]).join(' and ')
    const lordWord = lords.length === 1 ? 'lord is' : 'lords are'
    parts.push(active.length
      ? `The 2nd and 7th ${lordWord} ${names}. ${activeNames} ${active.length === 1 ? 'is' : 'are'} on Sagittarius, so maraka energy is switched on with this period.`
      : `The 2nd and 7th ${lordWord} ${names}. ${lords.length === 1 ? 'That planet is not' : 'Neither is'} on Sagittarius in the birth chart.`)
  }
  const saturn = findGraha(grahas, 'Sa')
  if (saturn?.rashi === 9) {
    parts.push('Saturn in Sagittarius makes patience the test. The exhaustion of waiting is part of that test.')
  }
  parts.push('The chart cannot measure ego. A rise in position that arrives with a rise in ego is the condition this lecture treats as a public fall.')
  if (input.upapada) {
    const marriage = sagittariusMarriageLine(input.upapada, 9)
    if (marriage) parts.push(marriage)
  }
  if (eighth && rahuOnSag) {
    const extra = jupiter.weak ? ' Jupiter is weak or touched by Rahu as well.' : ''
    parts.push(`Sagittarius as the 8th from the Atmakaraka, together with Rahu on Sagittarius, is the lecture's high-risk combination.${extra} The result can be a change of identity, career, reputation, relationship, belief, or money. A Saturn transit over Sagittarius, the Atmakaraka, or a maraka point raises it further. This reading uses the birth chart only, and it is not a prediction of physical death by itself.`)
  }
  return parts.join(' ')
}

function judgmentZoneText(sign: Rashi): string | null {
  if (sign === 9) {
    return 'Sagittarius, Capricorn, and Aquarius are one judgment stretch. Jupiter gives belief and expansion. Saturn in the next two signs answers with reality, restriction, and then rebellion against the tradition. A stronger Jupiter can overreach. A stronger Saturn delays and restricts.'
  }
  if (sign === 10) {
    return 'Capricorn is the Saturn answer to Sagittarius. Belief meets a limit, and the period tests whether the aim had the resources to match it.'
  }
  if (sign === 11) {
    return 'Aquarius is the second Saturn answer to Sagittarius. Tradition meets rebellion and a new system.'
  }
  return null
}

export function judgmentSteps(input: {
  sign: Rashi
  antarSign?: Rashi
  grahas: JudgmentGraha[]
  roleOf: Partial<Record<GrahaId, string | null>>
  lagna?: Rashi
  lagnaDegree?: number
  upapada?: Rashi
  karakamsha?: Rashi
}): JudgmentStep[] {
  const steps: JudgmentStep[] = []
  const signs = [input.sign, input.antarSign].filter((s): s is Rashi => s != null)
  const unique = [...new Set(signs)]

  const falls = unique.map(s => FALL_TEXT[s]).filter((t): t is string => Boolean(t))
  if (falls.length) steps.push({ title: 'Kind of fall', text: falls.join(' ') })

  if (unique.includes(9)) {
    steps.push({
      title: 'Sagittarius',
      text: sagittariusPeriodText({
        grahas: input.grahas,
        lagna: input.lagna,
        lagnaDegree: input.lagnaDegree,
        roleOf: input.roleOf,
        upapada: input.upapada,
        antarIsSagittarius: input.antarSign === 9 && input.sign !== 9,
      }),
    })
  }

  const zoneSign: Rashi | null = input.sign === 9 || input.sign === 10 || input.sign === 11
    ? input.sign
    : input.antarSign === 9 || input.antarSign === 10 || input.antarSign === 11
      ? input.antarSign
      : null
  const zone = zoneSign ? judgmentZoneText(zoneSign) : null
  if (zone) steps.push({ title: 'Judgment zone', text: zone })

  if (input.antarSign && input.antarSign !== input.sign) {
    steps.push({
      title: 'Antardasha',
      text: `${RASHI_NAMES[input.antarSign]} antardasha is running inside this mahadasha. The theme of ${RASHI_NAMES[input.antarSign]} still operates. What a mahadasha of that sign would spread over years is compressed into months, and more than one event can arrive back to back.`,
    })
  }

  const mahaRoles = rolesOnSign(input.sign, input.grahas, input.roleOf)
  const antarRoles = input.antarSign ? rolesOnSign(input.antarSign, input.grahas, input.roleOf) : new Set<string>()
  const akActive = mahaRoles.has('AK') || antarRoles.has('AK')
  const amkActive = mahaRoles.has('AmK') || antarRoles.has('AmK')

  if (akActive) {
    const akId = (Object.entries(input.roleOf).find(([, role]) => role === 'AK')?.[0] ?? null) as GrahaId | null
    const ak = akId ? findGraha(input.grahas, akId) : undefined
    const crisis = akId ? AK_CRISIS[akId] : null
    const element = ak ? ELEMENT_TEXT[elementOf(ak.rashi)] : null
    const rahu = findGraha(input.grahas, 'Ra')
    const ketu = findGraha(input.grahas, 'Ke')
    const nodeBits: string[] = []
    if (ak && ketu && touches(ketu.rashi, ak.rashi)) {
      nodeBits.push('Ketu with the Atmakaraka brings detachment during this period. The heart can withdraw from money, career, home, spouse, or friends.')
    }
    if (ak && rahu && touches(rahu.rashi, ak.rashi)) {
      nodeBits.push('Rahu with the Atmakaraka brings a desire that does not stay satisfied.')
    }
    steps.push({
      title: 'Atmakaraka crisis',
      text: [crisis, element, ...nodeBits].filter(Boolean).join(' ')
        || 'Atmakaraka is active. Its period is the soul\'s pain zone as well as a life-changing gain.',
    })
  }

  if (amkActive && input.lagna) {
    const amkId = (Object.entries(input.roleOf).find(([, role]) => role === 'AmK')?.[0] ?? null) as GrahaId | null
    const amk = amkId ? findGraha(input.grahas, amkId) : undefined
    if (amk && amkId) {
      const others = input.grahas.filter(g => g.rashi === amk.rashi && g.id !== amkId && g.id !== 'Ur' && g.id !== 'Ne' && g.id !== 'Pl')
      const aspecting = input.grahas.filter(g => g.id !== amkId && getRashiDrishti(g.rashi).includes(amk.rashi))
      const sag = amk.rashi === 9
        ? ` In Sagittarius the career stays knowledge-based. ${AMK_IN_SAGITTARIUS[amkId] ?? ''}`.trimEnd()
        : ''
      const aspectText = aspecting.length
        ? ` Aspects, which weigh less: ${aspecting.map(g => GRAHA_NAMES[g.id]).join(', ')}.`
        : ''
      steps.push({
        title: 'Amatyakaraka',
        text: `${amkHouseText(distance(input.lagna, amk.rashi))} ${conjunctionText(amkId, others)}${aspectText}${sag}`,
      })
    }
  }

  if (akActive && amkActive) {
    steps.push({
      title: 'Atmakaraka and Amatyakaraka',
      text: 'Both karakas are active together. This lecture gives the overlap no middle ground: a lifetime rise, or a lifetime collapse. A shortcut in work, travel, or a decision can spoil a period that would otherwise hold. When transit agrees, the result is treated as certain in whichever direction the chart already leans.',
    })
  }

  const karakamshaHit = input.karakamsha != null && unique.includes(input.karakamsha)
  if (karakamshaHit && input.karakamsha) {
    const asAntar = input.antarSign === input.karakamsha && input.sign !== input.karakamsha
    steps.push({
      title: 'Karakamsha period',
      text: asAntar
        ? `${RASHI_NAMES[input.karakamsha]} antardasha is the Karakamsha. Soul purpose shows in a smaller way than it would across a full mahadasha. In childhood the same energy acts on the family, because career and marriage are not yet available.`
        : `${RASHI_NAMES[input.karakamsha]} is the Karakamsha, so this mahadasha activates soul purpose and can bring a career change, a marriage, a separation, a spiritual turn, or a rise or a fall. The antardasha of the same sign is the smaller serving of that result. In childhood it acts on the family.`,
    })
  }

  return steps
}

export function readSoulKarakas(input: {
  grahas: JudgmentGraha[]
  lagna: Rashi
  lagnaDegree?: number
  ak: GrahaId
  amk: GrahaId
  d9?: Array<{ id: GrahaId; rashi: Rashi }>
}): SoulKarakaReading {
  const ak = findGraha(input.grahas, input.ak)
  const amk = findGraha(input.grahas, input.amk)
  const akLines: string[] = []
  const amkLines: string[] = []
  const sagittariusLines: string[] = []

  if (AK_CRISIS[input.ak]) akLines.push(AK_CRISIS[input.ak] as string)
  if (ak) akLines.push(ELEMENT_TEXT[elementOf(ak.rashi)])
  if (AK_PAST[input.ak]) akLines.push(AK_PAST[input.ak] as string)
  if (ak) {
    const star = nakshatraOf(ak.rashi, ak.degree)
    const story = pastLifeNakshatra(star.name, star.pada)
    akLines.push(story
      ?? `${star.name} is ruled by ${GRAHA_NAMES[star.lord]}, pada ${star.pada}. This lecture gives a pada story only for Ashwini, Krittika, and Bharani.`)
    const rahu = findGraha(input.grahas, 'Ra')
    const ketu = findGraha(input.grahas, 'Ke')
    const afflicted = dignityOf(ak) === 'debilitated'
      || [6, 8, 12].includes(distance(input.lagna, ak.rashi))
      || (rahu ? touches(rahu.rashi, ak.rashi) : false)
    if (afflicted) {
      akLines.push('The Atmakaraka is afflicted. This lecture reads that as a large karmic debt brought into this life. Problems in its period are the soul pushing that work to be finished.')
    }
    if (ketu && touches(ketu.rashi, ak.rashi)) {
      akLines.push('Ketu with the Atmakaraka brings detachment. The heart can withdraw from money, career, home, spouse, or friends.')
    }
    if (rahu && touches(rahu.rashi, ak.rashi)) {
      akLines.push('Rahu with the Atmakaraka brings a desire that does not stay satisfied.')
    }
    if (ak.rashi === 9) {
      const band = sagittariusBand(ak.degree)
      akLines.push(`The Atmakaraka is in Sagittarius, ${band.name}. The vocational picture is teaching, counsel, law, or religious leadership. ${afflicted ? 'Afflicted, the same placement can misuse belief, turn religion into a trade, or follow a false teacher.' : 'The current-life tension is between what is true and what has been believed. A teacher can fail the person, and the false system can fall away.'}`)
    }
  }

  if (amk) {
    amkLines.push(amkHouseText(distance(input.lagna, amk.rashi)))
    const others = input.grahas.filter(g => g.rashi === amk.rashi && g.id !== input.amk && g.id !== 'Ur' && g.id !== 'Ne' && g.id !== 'Pl')
    amkLines.push(conjunctionText(input.amk, others))
    const aspecting = input.grahas.filter(g => g.id !== input.amk && getRashiDrishti(g.rashi).includes(amk.rashi))
    if (aspecting.length) {
      amkLines.push(`Aspects weigh less than conjunction: ${aspecting.map(g => `${GRAHA_NAMES[g.id]} from ${RASHI_NAMES[g.rashi]}`).join(', ')}.`)
    }
    const d9 = input.d9?.find(g => g.id === input.amk)
    if (d9) amkLines.push(`In navamsha, Amatyakaraka is in ${RASHI_NAMES[d9.rashi]}.`)
    if (amk.rashi === 9) {
      const specific = AMK_IN_SAGITTARIUS[input.amk]
      amkLines.push(`Amatyakaraka in Sagittarius keeps the career knowledge-based.${specific ? ` ${specific}` : ''}`)
    }
    const tenth = houseFrom(input.lagna, 10)
    if (amk.rashi === tenth) {
      amkLines.push('Amatyakaraka occupies the 10th from Lagna, so the career has a direct seat.')
    } else if (getRashiDrishti(amk.rashi).includes(tenth)) {
      amkLines.push('Amatyakaraka aspects the 10th from Lagna.')
    }
  }

  if (ak?.rashi === 9 && amk?.rashi === 9) {
    sagittariusLines.push('Atmakaraka and Amatyakaraka both sit in Sagittarius. The lecture reads leadership, spiritual authority, or public influence, and an ego that can turn the same planets toward a fall.')
  }

  for (const g of input.grahas) {
    if (g.rashi !== 9 || g.id === 'Ra' || g.id === 'Ke' || g.id === 'Ur' || g.id === 'Ne' || g.id === 'Pl') continue
    const band = sagittariusBand(g.degree)
    sagittariusLines.push(`${GRAHA_NAMES[g.id]} in Sagittarius is in ${band.name}, ruled by ${band.ruler}. ${band.effect}`)
  }
  if (input.lagna === 9 && input.lagnaDegree != null) {
    const band = sagittariusBand(input.lagnaDegree)
    sagittariusLines.push(`Lagna in Sagittarius is in ${band.name}, ruled by ${band.ruler}. ${band.effect}`)
  }
  const saturn = findGraha(input.grahas, 'Sa')
  if (saturn?.rashi === 9) {
    sagittariusLines.push('Saturn in Sagittarius makes patience the test. The exhaustion of waiting is part of that test.')
  }
  if (ak && houseFrom(ak.rashi, 8) === 9) {
    sagittariusLines.push('Sagittarius is the 8th from the Atmakaraka. When the Sagittarius period also runs, this lecture treats that as a fall condition, stronger if Rahu touches the sign.')
  }
  if (!sagittariusLines.length) {
    sagittariusLines.push('No classical planet or the Lagna is in Sagittarius, so the Mula, Purva Ashadha, and Uttara Ashadha split has nothing to describe yet.')
  }

  return { akLines, amkLines, sagittariusLines }
}

function strained(g: JudgmentGraha, lagna: Rashi, grahas: JudgmentGraha[]): boolean {
  const rahu = findGraha(grahas, 'Ra')
  return dignityOf(g) === 'debilitated'
    || [6, 8, 12].includes(distance(lagna, g.rashi))
    || (rahu ? touches(rahu.rashi, g.rashi) : false)
}

function held(g: JudgmentGraha, lagna: Rashi, grahas: JudgmentGraha[]): boolean {
  if (strained(g, lagna, grahas)) return false
  const dignity = dignityOf(g)
  const strongDignity = dignity === 'exalted' || dignity === 'moolatrikona' || dignity === 'own'
  const supportiveHouse = [1, 4, 5, 7, 9, 10, 11].includes(distance(lagna, g.rashi))
  return strongDignity || supportiveHouse
}

function linked(a: JudgmentGraha, b: JudgmentGraha): boolean {
  return a.rashi === b.rashi || getRashiDrishti(a.rashi).includes(b.rashi)
}

function phaseLine(age: number | null, from: number, to: number, label: string): string {
  if (age != null && age >= from && age <= to) {
    return `Age ${age} is inside the ${label}, from ${from} to ${to}.`
  }
  return `The ${label} run from ${from} to ${to}.`
}

export function ageInYears(birthIso: string, now = new Date()): number | null {
  const birth = new Date(birthIso)
  if (Number.isNaN(birth.getTime())) return null
  let age = now.getFullYear() - birth.getFullYear()
  const month = now.getMonth() - birth.getMonth()
  if (month < 0 || (month === 0 && now.getDate() < birth.getDate())) age -= 1
  return age >= 0 ? age : null
}

export function readKarakaLife(input: {
  grahas: JudgmentGraha[]
  lagna: Rashi
  ak: GrahaId
  amk: GrahaId
  bk: GrahaId
  mk: GrahaId
  pk: GrahaId
  gk: GrahaId
  dk: GrahaId
  ageYears?: number | null
}): KarakaLifeReading {
  const age = input.ageYears ?? null
  const bk = findGraha(input.grahas, input.bk)
  const mk = findGraha(input.grahas, input.mk)
  const pk = findGraha(input.grahas, input.pk)
  const gk = findGraha(input.grahas, input.gk)
  const dk = findGraha(input.grahas, input.dk)
  const ak = findGraha(input.grahas, input.ak)
  const amk = findGraha(input.grahas, input.amk)
  const rahu = findGraha(input.grahas, 'Ra')
  const ketu = findGraha(input.grahas, 'Ke')
  const rows: KarakaLifeRow[] = []

  if (bk) {
    const lines = [
      `${GRAHA_NAMES[input.bk]} as Bhratrukaraka shows siblings and the race the person runs: collaborative, or competitive. It also shows who pushes that race forward.`,
      phaseLine(age, 13, 21, 'Bhratrukaraka years'),
    ]
    if (strained(bk, input.lagna, input.grahas)) {
      lines.push('A strained Bhratrukaraka leans toward rivalry, one-upmanship, and difficulty cooperating.')
    }
    if (gk && linked(bk, gk)) {
      lines.push('Bhratrukaraka and Gnatikaraka are linked. A competitor can become an enemy, and collaboration fails.')
    }
    rows.push({ id: 'bk', title: 'Bhratrukaraka', lines })
  }

  const mkWeak = mk ? strained(mk, input.lagna, input.grahas) : false
  const dkWeak = dk ? strained(dk, input.lagna, input.grahas) : false
  const mkHeld = mk ? held(mk, input.lagna, input.grahas) : false
  const dkHeld = dk ? held(dk, input.lagna, input.grahas) : false

  if (mk) {
    const lines = [
      `${GRAHA_NAMES[input.mk]} as Matrukaraka is the emotional foundation: inner stability, how much pain can be carried, and whether the inner child is still alive.`,
      phaseLine(age, 0, 12, 'Matrukaraka years'),
    ]
    if (mkHeld) lines.push('A held Matrukaraka supports resilience, care, and a steadier bond with the mother.')
    if (mkWeak) {
      lines.push('A strained Matrukaraka leans toward emotional dependency and a habit of seeing the self as the victim. Maternal happiness is thin, and emotional learning stays difficult.')
    }
    rows.push({ id: 'mk', title: 'Matrukaraka', lines })
  }

  if (pk) {
    const lines = [
      `${GRAHA_NAMES[input.pk]} is the fifth karaka. This class reads that seat as creation and legacy: children, a business, an idea, a work, and what is left behind. The chart label for the seat remains Pitrukaraka.`,
      phaseLine(age, 25, 40, 'creation years'),
    ]
    if (held(pk, input.lagna, input.grahas)) {
      lines.push('A held fifth karaka supports unconventional work, idealism, and something that can outlast the person.')
    }
    if (strained(pk, input.lagna, input.grahas)) {
      lines.push('A strained fifth karaka leans toward obsession with being remembered, and toward holding creations or children too tightly.')
    }
    rows.push({ id: 'pk', title: 'Fifth karaka', lines })
  }

  if (gk) {
    const house = distance(input.lagna, gk.rashi)
    const place = house === 6
      ? 'In the 6th the enemy is open and can be seen.'
      : house === 8
        ? 'In the 8th the enemy stays hidden and is hard to name.'
        : house === 12
          ? 'In the 12th the person is their own enemy. The destruction comes from inside.'
          : `In the ${ordinal(house)} this class gives no open, hidden, or self-enemy split. The karaka still names where pain repeats.`
    const lines = [
      `${GRAHA_NAMES[input.gk]} as Gnatikaraka generates the repeating problem: who stands in the way, and what kind of crisis forces growth. It can switch on at any age, when the soul's path needs it.`,
      place,
    ]
    if (mkWeak) lines.push('With a strained Matrukaraka, Gnatikaraka repeats emotional pain and can sink into depression.')
    if (mkWeak && rahu && (touches(rahu.rashi, gk.rashi) || (mk ? touches(rahu.rashi, mk.rashi) : false))) {
      lines.push('Rahu joins that strain. This class reads a severe emotional breakdown.')
    }
    rows.push({ id: 'gk', title: 'Gnatikaraka', lines })
  }

  if (dk) {
    const lines = [
      `${GRAHA_NAMES[input.dk]} as Darakaraka covers marriage and the other serious bonds, including a business partnership. The reading is strongest after marriage.`,
    ]
    const dual = [3, 6, 9, 12].includes(dk.rashi)
    const nodeOnDk = (rahu ? touches(rahu.rashi, dk.rashi) : false) || (ketu ? touches(ketu.rashi, dk.rashi) : false)
    if (dual && nodeOnDk) {
      lines.push('Darakaraka is in a dual sign and Rahu or Ketu touches it, so the bond carries a split that has to be balanced. The dual sign alone does not create that split.')
    } else if (nodeOnDk || dkWeak) {
      lines.push('Darakaraka is under strain, so relationships carry complications.')
    }
    if (mk && dk && mkHeld && dkHeld) {
      lines.push('Matrukaraka and Darakaraka are both held. Relationships can go deep and stay happy.')
    } else if (mk && dk && mkWeak && dkWeak) {
      lines.push('Matrukaraka and Darakaraka are both strained. Relationships can go to extreme pain.')
    } else if (mkWeak) {
      lines.push('A strained Matrukaraka disturbs Darakaraka, so the bond inherits the weak emotional base.')
    }
    if (ak && linked(dk, ak) && (dkWeak || nodeOnDk)) {
      lines.push('That relationship strain reaches the Atmakaraka, so identity and purpose get pulled into the pain.')
    }
    rows.push({ id: 'dk', title: 'Darakaraka', lines })
  }

  const linkLines: string[] = []
  if (ak && amk && pk && linked(ak, amk) && linked(amk, pk) && linked(ak, pk)) {
    linkLines.push('Atmakaraka, Amatyakaraka, and the fifth karaka are linked. Success can arrive in line with the life purpose, from more than one direction.')
  }
  if (linkLines.length) rows.push({ id: 'links', title: 'Linked karakas', lines: linkLines })

  const loop = mkWeak
    ? 'A strained Matrukaraka can disturb the bond, and that disturbance can pull the Atmakaraka off its aim. Gnatikaraka then repeats the pain, and the emotional base gets weaker. The same story can arrive through different people until that root is worked with.'
    : null

  return { rows, loop }
}

export function karakamshaDirection(ak: GrahaId): string {
  const hint = AK_DIRECTION[ak]
  if (!hint) return 'This Atmakaraka has no career hint in the lecture table.'
  return `The starting hint for ${GRAHA_NAMES[ak]} as Atmakaraka is ${hint} The full chart still decides the result.`
}

export function karakamshaSupport(
  lagna: Rashi,
  karakamsha: Rashi,
  grahas: Array<{ id: GrahaId; rashi: Rashi }>,
): string {
  const house = distance(lagna, karakamsha)
  const supported = [1, 4, 5, 7, 9, 10].includes(house)
  const place = supported
    ? `Karakamsha is the ${ordinal(house)} from Lagna, a kendra or trikona, so the path has structural support.`
    : `Karakamsha is the ${ordinal(house)} from Lagna, outside kendra and trikona.`
  const rahu = grahas.find(g => g.id === 'Ra')
  const ketu = grahas.find(g => g.id === 'Ke')
  const node = (rahu && touches(rahu.rashi, karakamsha)) || (ketu && touches(ketu.rashi, karakamsha))
  return node
    ? `${place} Rahu or Ketu touches Karakamsha, which this lecture reads as an obstacle or a false path.`
    : place
}

export const SWAMSHA_USAGE = 'Swamsha takes Karakamsha as lagna and places every navamsha planet by whole sign from that lagna. The D9 column of this table is that chart. Read it beside the birth chart, the dasha, the aspects, and all seven karakas. A reading that uses only Swamsha misses the timing. If the Karakamsha dasha runs in childhood, it acts on the family and the household.'
