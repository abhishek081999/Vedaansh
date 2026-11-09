// ─────────────────────────────────────────────────────────────
//  src/lib/engine/jaimini/judgment.ts
//  Sagittarius judgment, Atmakaraka crisis, and Amatyakaraka
//  career notes. Narrative only.
//  Chara year counts and rashi drishti stay in their own modules.
//  Past-life pada stories are limited to the three nakshatras
//  the rules actually specify.
// ─────────────────────────────────────────────────────────────

import type { Dignity, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, NAKSHATRA_LORDS, NAKSHATRA_NAMES, RASHI_NAMES } from '@/types/astrology'
import { getDignity } from '../dignity'
import { getRashiDrishti } from './aspects'
import { resolveSignLord } from './trinity'
import {
  J_AK_CRISIS,
  J_AK_DIRECTION,
  J_AK_PAST,
  J_AMK_SAG,
  J_BAND_EFFECT,
  J_BHARANI_GUILT,
  J_ELEMENT,
  J_FALL,
  J_SAG_HOUSE,
  J_TITLES,
} from '../locale/jaiminiJudgment.hi'
import { jG, jLang, jOrd, jR, jStar, say, type EngineLang } from '../locale/jaiminiLang'

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

export function sagittariusBand(degree: number, lang: EngineLang = 'en'): { name: string; ruler: string; effect: string } {
  const arcmin = Math.round(degree * 60 * 1000) / 1000
  const L = jLang(lang)
  if (arcmin < 800) {
    return {
      name: 'Mula',
      ruler: 'Ketu',
      effect: say(L, 'Destruction comes first, then rebuilding. A settled life can be uprooted and has to be started again.', J_BAND_EFFECT.mula),
    }
  }
  if (arcmin < 1600) {
    return {
      name: 'Purva Ashadha',
      ruler: 'Venus',
      effect: say(L, 'The rise can come quickly, and the ego is tested after the win. Pride decides whether the rise holds.', J_BAND_EFFECT.purva),
    }
  }
  return {
    name: 'Uttara Ashadha',
    ruler: 'Sun',
    effect: say(L, 'The rise is slower and more stable. Conduct keeps the result, and a lasting position is possible.', J_BAND_EFFECT.uttara),
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

function linkPhrase(id: GrahaId, from: Rashi, target: Rashi, lang: EngineLang = 'en'): string {
  const L = jLang(lang)
  const name = jG(id, L)
  if (from === target) {
    return say(L, `${name} is conjunct ${RASHI_NAMES[target]}`, `${name} ${jR(target, L)} पर युति में है`)
  }
  return say(L, `${name} in ${RASHI_NAMES[from]} aspects ${RASHI_NAMES[target]}`, `${jR(from, L)} का ${name} ${jR(target, L)} को देखता है`)
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

function jupiterPhrase(grahas: JudgmentGraha[], lang: EngineLang = 'en'): { text: string; weak: boolean; strong: boolean } {
  const L = jLang(lang)
  const jupiter = findGraha(grahas, 'Ju')
  if (!jupiter) {
    return { text: say(L, 'Jupiter is missing from the chart data.', 'कुंडली के आँकड़ों में गुरु नहीं है।'), weak: false, strong: false }
  }
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
  const dignityHi = debilitated
    ? 'नीच'
    : strong
      ? (dignity === 'exalted' ? 'उच्च' : dignity === 'moolatrikona' ? 'मूलत्रिकोण में' : 'स्वराशि में')
      : 'सामान्य बल का'
  const rahuText = rahuOnJupiter && rahu
    ? say(
      L,
      ` ${linkPhrase('Ra', rahu.rashi, jupiter.rashi)}, so the fall risk stays open.`,
      ` ${linkPhrase('Ra', rahu.rashi, jupiter.rashi, L)}, इसलिए पतन का जोखिम खुला रहता है।`,
    )
    : ''
  return {
    text: say(
      L,
      `Jupiter is ${dignityText} in ${RASHI_NAMES[jupiter.rashi]}.${rahuText}`,
      `गुरु ${jR(jupiter.rashi, L)} में ${dignityHi} है।${rahuText}`,
    ),
    weak: debilitated || rahuOnJupiter,
    strong: strong && !rahuOnJupiter,
  }
}

function pastLifeNakshatra(name: string, pada: number, lang: EngineLang = 'en'): string | null {
  const L = jLang(lang)
  if (name === 'Ashwini') {
    return say(
      L,
      'Ashwini, ruled by Ketu, pictures a healer or someone who answered emergencies. This life carries impulsiveness: the act comes before the thought.',
      'केतु-स्वामी अश्विनी एक चिकित्सक या आपात-उत्तरदाता का चित्र है। इस जीवन में आवेग है: कर्म विचार से पहले आ जाता है।',
    )
  }
  if (name === 'Krittika') {
    return say(
      L,
      'Krittika, ruled by the Sun, pictures someone who cut through falsity. This life carries harsh speech.',
      'सूर्य-स्वामी कृत्तिका उस व्यक्ति का चित्र है जो असत्य को काटता था। इस जीवन में कठोर वाणी है।',
    )
  }
  if (name === 'Bharani') {
    const guiltEn = [
      '',
      'The first pada carries guilt from the misuse of authority.',
      'The second pada carries financial guilt.',
      'The third pada carries guilt over harsh speech that is not taken back.',
      'The fourth pada carries emotional guilt.',
    ][pada] ?? ''
    const guilt = say(L, guiltEn, J_BHARANI_GUILT[pada] ?? '')
    return say(
      L,
      `Bharani, ruled by Venus, pictures an authority who could punish. This life carries a guilt that takes on small burdens. ${guilt}`.trim(),
      `शुक्र-स्वामी भरणी एक दंड देने वाले अधिकार का चित्र है। इस जीवन में अपराध-बोध छोटे बोझ उठाता है। ${guilt}`.trim(),
    )
  }
  return null
}

function amkHouseText(house: number, lang: EngineLang = 'en'): string {
  const L = jLang(lang)
  const o = jOrd(house, L)
  if (house === 5) {
    return say(L, 'Amatyakaraka is in the 5th, a trikona (trine houses: 1, 5, 9). A rise can be visible, and fame can bring a scandal with it.', 'अमात्यकारक पाँचवें भाव में है, जो त्रिकोण (1, 5, 9) है। उत्थान दिख सकता है, और यश के साथ कलंक भी आ सकता है।')
  }
  if (house === 6) {
    return say(L, 'Amatyakaraka is in the 6th. A rise is possible through struggle, with a health cost. The old picture is a promotion followed by a hospital stay.', 'अमात्यकारक छठे भाव में है। संघर्ष से उत्थान संभव है, स्वास्थ्य की कीमत पर। पुराना चित्र पदोन्नति के बाद अस्पताल है।')
  }
  if (house === 8) {
    return say(L, 'Amatyakaraka is in the 8th. A rise can be followed by a sudden fall.', 'अमात्यकारक आठवें भाव में है। उत्थान के बाद अचानक पतन आ सकता है।')
  }
  if (house === 12) {
    return say(L, 'Amatyakaraka is in the 12th. Direction is lost, and losses follow.', 'अमात्यकारक बारहवें भाव में है। दिशा खोती है, और हानि पीछे आती है।')
  }
  if (house === 1) {
    return say(L, 'Amatyakaraka is in the 1st, both a kendra (angular houses: 1, 4, 7, 10) and a trikona (trine houses: 1, 5, 9). A rise can be visible.', 'अमात्यकारक पहले भाव में है, जो केंद्र (1, 4, 7, 10) और त्रिकोण (1, 5, 9) दोनों है। उत्थान दिख सकता है।')
  }
  if (house === 9) {
    return say(L, 'Amatyakaraka is in the 9th, a trikona (trine houses: 1, 5, 9). A rise can be visible.', 'अमात्यकारक नौवें भाव में है, जो त्रिकोण (1, 5, 9) है। उत्थान दिख सकता है।')
  }
  if (house === 4 || house === 7 || house === 10) {
    return say(L, `Amatyakaraka is in the ${o}, a kendra (angular houses: 1, 4, 7, 10). A rise can be visible.`, `अमात्यकारक ${o} भाव में है, जो केंद्र (1, 4, 7, 10) है। उत्थान दिख सकता है।`)
  }
  return say(L, `Amatyakaraka is in the ${o}. No special rise or fall is marked for that house.`, `अमात्यकारक ${o} भाव में है। उस भाव के लिए कोई विशेष उत्थान या पतन चिह्नित नहीं है।`)
}

function conjunctionText(id: GrahaId, others: JudgmentGraha[], lang: EngineLang = 'en'): string {
  const L = jLang(lang)
  if (!others.length) {
    return say(L, `No planet is conjunct ${GRAHA_NAMES[id]}.`, `${jG(id, L)} के साथ कोई ग्रह युति में नहीं है।`)
  }
  const bits = others.map(g => {
    if (g.id === 'Ra') return say(L, 'Rahu gives ambitions that do not stay satisfied', 'राहु ऐसी महत्वाकांक्षा देता है जो तृप्त नहीं रहती')
    if (g.id === 'Ma') return say(L, 'Mars grows anger', 'मंगल क्रोध बढ़ाता है')
    if (g.id === 'Ju') return say(L, 'Jupiter brings wisdom into the career, or false guidance when Jupiter is afflicted', 'गुरु करियर में विवेक लाता है, और पीड़ित होने पर गलत मार्गदर्शन')
    if (g.id === 'Sa') return say(L, 'Saturn delays the career and can stabilise it later', 'शनि करियर में विलंब करता है और बाद में उसे स्थिर कर सकता है')
    if (g.id === 'Mo') return say(L, 'the Moon makes career decisions emotional', 'चंद्र करियर के निर्णयों को भावनात्मक बनाता है')
    return jG(g.id, L)
  })
  return say(
    L,
    `Conjunction outweighs aspect. With ${GRAHA_NAMES[id]}: ${bits.join('; ')}.`,
    `युति दृष्टि से भारी है। ${jG(id, L)} के साथ: ${bits.join('; ')}।`,
  )
}

export function recommendMandook(
  grahas: Array<{ id: GrahaId; rashi: Rashi }>,
  lagna: Rashi,
  lang: EngineLang = 'en',
): { count: number; text: string } | null {
  const L = jLang(lang)
  const count = grahas.filter(g =>
    CLASSICAL_NO_NODES.includes(g.id) && [1, 4, 7, 10].includes(distance(lagna, g.rashi)),
  ).length
  if (count < 4) return null
  return {
    count,
    text: say(
      L,
      `${count} planets sit in kendras (angular houses: 1, 4, 7, 10), excluding Rahu and Ketu. This pattern is read through Mandook dasha, with Chara set aside. Chara stays available here. Use Mandook as the recommended sequence and keep the K.N. Rao Chara sequence beside it.`,
      `${count} ग्रह केंद्र (1, 4, 7, 10) में हैं, राहु और केतु छोड़कर। यह रूप मंडूक दशा से पढ़ा जाता है, चर को अलग रखकर। चर यहाँ उपलब्ध रहता है। मंडूक को सुझाया क्रम मानें और के. एन. राव की चर दशा साथ रखें।`,
    ),
  }
}

export function sagittariusMarriageLine(upapada: Rashi, sign: Rashi, lang: EngineLang = 'en'): string | null {
  const L = jLang(lang)
  if (sign !== 9) return null
  if (upapada === 9) {
    return say(L, 'Sagittarius is the Upapada. While this dasha runs, marriage is highly likely for a person of marriageable age.', 'धनु उपपद है। यह दशा चलते विवाह योग्य आयु के व्यक्ति के लिए विवाह की संभावना बहुत अधिक है।')
  }
  if (houseFrom(upapada, 7) === 9) {
    return say(L, 'Sagittarius is the 7th from the Upapada. While this dasha runs, marriage is highly likely for a person of marriageable age.', 'धनु उपपद से सातवाँ भाव है। यह दशा चलते विवाह योग्य आयु के व्यक्ति के लिए विवाह की संभावना बहुत अधिक है।')
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
  lang?: EngineLang
}): string {
  const L = jLang(input.lang)
  const { grahas } = input
  const parts: string[] = []
  if (input.antarIsSagittarius) {
    parts.push(say(L, 'Sagittarius is the antardasha, so the same themes arrive in months rather than years.', 'धनु अंतर्दशा है, इसलिए वही विषय वर्षों के बजाय महीनों में आते हैं।'))
  }
  if (input.lagna) {
    const house = distance(input.lagna, 9)
    const houseText = L === 'hi' ? J_SAG_HOUSE[house] : SAGITTARIUS_HOUSE[house]
    if (houseText) parts.push(say(L, `Sagittarius is the ${jOrd(house, L)} house. ${houseText}`, `धनु ${jOrd(house, L)} भाव है। ${houseText}`))
  }
  const inSign = grahas.filter(g => g.rashi === 9 && CLASSICAL_NO_NODES.concat(['Ra', 'Ke']).includes(g.id))
  for (const g of inSign) {
    if (g.id === 'Ra' || g.id === 'Ke') continue
    const band = sagittariusBand(g.degree, L)
    parts.push(say(
      L,
      `${GRAHA_NAMES[g.id]} is in ${band.name} (${band.ruler}). ${band.effect}`,
      `${jG(g.id, L)} ${jStar(band.name, L)} (${jStar(band.ruler, L)}) में है। ${band.effect}`,
    ))
  }
  if (input.lagna === 9 && input.lagnaDegree != null) {
    const band = sagittariusBand(input.lagnaDegree, L)
    parts.push(say(
      L,
      `Lagna is in ${band.name} (${band.ruler}). ${band.effect}`,
      `लग्न ${jStar(band.name, L)} (${jStar(band.ruler, L)}) में है। ${band.effect}`,
    ))
  }
  const jupiter = jupiterPhrase(grahas, L)
  parts.push(jupiter.text)
  const rahu = findGraha(grahas, 'Ra')
  const rahuOnSag = rahu ? touches(rahu.rashi, 9) : false
  if (rahu && rahuOnSag) parts.push(`${linkPhrase('Ra', rahu.rashi, 9, L)}.`)
  const akId = (Object.entries(input.roleOf).find(([, role]) => role === 'AK')?.[0] ?? null) as GrahaId | null
  const ak = akId ? findGraha(grahas, akId) : undefined
  const eighth = ak ? houseFrom(ak.rashi, 8) === 9 : false
  if (eighth) parts.push(say(L, 'Sagittarius is the 8th from the Atmakaraka.', 'धनु आत्मकारक से आठवाँ भाव है।'))
  if (ak?.rashi === 9) {
    parts.push(say(L, 'The Atmakaraka itself sits in Sagittarius, so the opening of this dasha is a more sensitive time when maraka planets are also active.', 'आत्मकारक स्वयं धनु में है, इसलिए इस दशा का आरंभ अधिक संवेदनशील समय है जब मारक ग्रह भी सक्रिय हों।'))
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
    const names = lords.map(id => (L === 'hi' ? jG(id, L) : GRAHA_NAMES[id])).join(L === 'hi' ? ' और ' : ' and ')
    const activeNames = active.map(id => (L === 'hi' ? jG(id, L) : GRAHA_NAMES[id])).join(L === 'hi' ? ' और ' : ' and ')
    const lordWord = lords.length === 1 ? 'lord is' : 'lords are'
    parts.push(active.length
      ? say(
        L,
        `The 2nd and 7th ${lordWord} ${names}. ${activeNames} ${active.length === 1 ? 'is' : 'are'} on Sagittarius, so maraka energy is switched on with this period.`,
        `दूसरे और सातवें भाव के स्वामी ${names} हैं। ${activeNames} धनु पर ${active.length === 1 ? 'है' : 'हैं'}, इसलिए इस काल के साथ मारक ऊर्जा सक्रिय है।`,
      )
      : say(
        L,
        `The 2nd and 7th ${lordWord} ${names}. ${lords.length === 1 ? 'That planet is not' : 'Neither is'} on Sagittarius in the birth chart.`,
        `दूसरे और सातवें भाव के स्वामी ${names} हैं। ${lords.length === 1 ? 'वह ग्रह जन्म कुंडली में धनु पर नहीं है।' : 'जन्म कुंडली में दोनों में से कोई धनु पर नहीं है।'}`,
      ))
  }
  const saturn = findGraha(grahas, 'Sa')
  if (saturn?.rashi === 9) {
    parts.push(say(L, 'Saturn in Sagittarius makes patience the test. The exhaustion of waiting is part of that test.', 'धनु में शनि धैर्य को परीक्षा बनाता है। प्रतीक्षा की थकान उसी परीक्षा का हिस्सा है।'))
  }
  parts.push(say(L, 'The chart cannot measure ego. A rise in position that arrives with a rise in ego is the condition treated here as a public fall.', 'कुंडली अहंकार नहीं मापती। पद के उत्थान के साथ अहंकार का उत्थान ही यहाँ सार्वजनिक पतन की स्थिति माना गया है।'))
  if (input.upapada) {
    const marriage = sagittariusMarriageLine(input.upapada, 9, L)
    if (marriage) parts.push(marriage)
  }
  if (eighth && rahuOnSag) {
    const extra = jupiter.weak
      ? say(L, ' Jupiter is weak or touched by Rahu as well.', ' गुरु भी निर्बल है या राहु से युक्त है।')
      : ''
    parts.push(say(
      L,
      `Sagittarius as the 8th from the Atmakaraka, together with Rahu on Sagittarius, is a high-risk combination.${extra} The result can be a change of identity, career, reputation, relationship, belief, or money. A Saturn transit over Sagittarius, the Atmakaraka, or a maraka point raises it further. This reading uses the birth chart only, and it is not a prediction of physical death by itself.`,
      `आत्मकारक से आठवें भाव के रूप में धनु, धनु पर राहु के साथ, उच्च-जोखिम का योग है।${extra} फल पहचान, करियर, यश, संबंध, विश्वास या धन का परिवर्तन हो सकता है। धनु, आत्मकारक या मारक बिंदु पर शनि का गोचर इसे और बढ़ाता है। यह पाठ केवल जन्म कुंडली का है, और अपने आप में शारीरिक मृत्यु की भविष्यवाणी नहीं है।`,
    ))
  }
  return parts.join(' ')
}

function judgmentZoneText(sign: Rashi, lang: EngineLang = 'en'): string | null {
  const L = jLang(lang)
  if (sign === 9) {
    return say(L, 'Sagittarius, Capricorn, and Aquarius are one judgment stretch. Jupiter gives belief and expansion. Saturn in the next two signs answers with reality, restriction, and then rebellion against the tradition. A stronger Jupiter can overreach. A stronger Saturn delays and restricts.', 'धनु, मकर और कुंभ एक न्याय-पट्टी हैं। गुरु विश्वास और विस्तार देता है। अगली दो राशियों में शनि वास्तविकता, बंधन, और फिर परंपरा के विरुद्ध विद्रोह से उत्तर देता है। अधिक बलवान गुरु सीमा लाँघ सकता है। अधिक बलवान शनि विलंब और रोक लगाता है।')
  }
  if (sign === 10) {
    return say(L, 'Capricorn is the Saturn answer to Sagittarius. Belief meets a limit, and the period tests whether the aim had the resources to match it.', 'मकर धनु का शनि-उत्तर है। विश्वास सीमा से मिलता है, और काल जाँचता है कि लक्ष्य के पास साधन थे या नहीं।')
  }
  if (sign === 11) {
    return say(L, 'Aquarius is the second Saturn answer to Sagittarius. Tradition meets rebellion and a new system.', 'कुंभ धनु का दूसरा शनि-उत्तर है। परंपरा विद्रोह और नई व्यवस्था से मिलती है।')
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
  lang?: EngineLang
}): JudgmentStep[] {
  const L = jLang(input.lang)
  const steps: JudgmentStep[] = []
  const signs = [input.sign, input.antarSign].filter((s): s is Rashi => s != null)
  const unique = [...new Set(signs)]

  const falls = unique.map(s => (L === 'hi' ? J_FALL[s] : FALL_TEXT[s])).filter((t): t is string => Boolean(t))
  if (falls.length) steps.push({ title: say(L, 'Kind of fall', J_TITLES.fall), text: falls.join(' ') })

  if (unique.includes(9)) {
    steps.push({
      title: say(L, 'Sagittarius', J_TITLES.sagittarius),
      text: sagittariusPeriodText({
        grahas: input.grahas,
        lagna: input.lagna,
        lagnaDegree: input.lagnaDegree,
        roleOf: input.roleOf,
        upapada: input.upapada,
        antarIsSagittarius: input.antarSign === 9 && input.sign !== 9,
        lang: L,
      }),
    })
  }

  const zoneSign: Rashi | null = input.sign === 9 || input.sign === 10 || input.sign === 11
    ? input.sign
    : input.antarSign === 9 || input.antarSign === 10 || input.antarSign === 11
      ? input.antarSign
      : null
  const zone = zoneSign ? judgmentZoneText(zoneSign, L) : null
  if (zone) steps.push({ title: say(L, 'Judgment zone', J_TITLES.zone), text: zone })

  if (input.antarSign && input.antarSign !== input.sign) {
    const antarName = L === 'hi' ? jR(input.antarSign, L) : RASHI_NAMES[input.antarSign]
    steps.push({
      title: say(L, 'Antardasha', J_TITLES.antar),
      text: say(
        L,
        `${antarName} antardasha is running inside this mahadasha. The theme of ${antarName} still operates. What a mahadasha of that sign would spread over years is compressed into months, and more than one event can arrive back to back.`,
        `${antarName} की अंतर्दशा इस महादशा के भीतर चल रही है। ${antarName} का विषय फिर भी सक्रिय है। उस राशि की महादशा जो वर्षों में फैलाती, वह महीनों में सिकुड़ जाती है, और एक से अधिक घटनाएँ लगातार आ सकती हैं।`,
      ),
    })
  }

  const mahaRoles = rolesOnSign(input.sign, input.grahas, input.roleOf)
  const antarRoles = input.antarSign ? rolesOnSign(input.antarSign, input.grahas, input.roleOf) : new Set<string>()
  const akActive = mahaRoles.has('AK') || antarRoles.has('AK')
  const amkActive = mahaRoles.has('AmK') || antarRoles.has('AmK')

  if (akActive) {
    const akId = (Object.entries(input.roleOf).find(([, role]) => role === 'AK')?.[0] ?? null) as GrahaId | null
    const ak = akId ? findGraha(input.grahas, akId) : undefined
    const crisis = akId ? (L === 'hi' ? J_AK_CRISIS[akId] : AK_CRISIS[akId]) : null
    const element = ak ? (L === 'hi' ? J_ELEMENT[elementOf(ak.rashi)] : ELEMENT_TEXT[elementOf(ak.rashi)]) : null
    const rahu = findGraha(input.grahas, 'Ra')
    const ketu = findGraha(input.grahas, 'Ke')
    const nodeBits: string[] = []
    if (ak && ketu && touches(ketu.rashi, ak.rashi)) {
      nodeBits.push(say(L, 'Ketu with the Atmakaraka brings detachment during this period. The heart can withdraw from money, career, home, spouse, or friends.', 'आत्मकारक के साथ केतु इस काल में वैराग्य लाता है। हृदय धन, करियर, घर, साथी या मित्रों से हट सकता है।'))
    }
    if (ak && rahu && touches(rahu.rashi, ak.rashi)) {
      nodeBits.push(say(L, 'Rahu with the Atmakaraka brings a desire that does not stay satisfied.', 'आत्मकारक के साथ राहु ऐसी इच्छा लाता है जो तृप्त नहीं रहती।'))
    }
    steps.push({
      title: say(L, 'Atmakaraka crisis', J_TITLES.akCrisis),
      text: [crisis, element, ...nodeBits].filter(Boolean).join(' ')
        || say(L, 'Atmakaraka is active. Its period is the soul\'s pain zone as well as a life-changing gain.', 'आत्मकारक सक्रिय है। इसका काल आत्मा का पीड़ा-क्षेत्र भी है और जीवन बदलने वाला लाभ भी।'),
    })
  }

  if (amkActive && input.lagna) {
    const amkId = (Object.entries(input.roleOf).find(([, role]) => role === 'AmK')?.[0] ?? null) as GrahaId | null
    const amk = amkId ? findGraha(input.grahas, amkId) : undefined
    if (amk && amkId) {
      const others = input.grahas.filter(g => g.rashi === amk.rashi && g.id !== amkId && g.id !== 'Ur' && g.id !== 'Ne' && g.id !== 'Pl')
      const aspecting = input.grahas.filter(g => g.id !== amkId && getRashiDrishti(g.rashi).includes(amk.rashi))
      const sagSpecific = L === 'hi' ? J_AMK_SAG[amkId] : AMK_IN_SAGITTARIUS[amkId]
      const sag = amk.rashi === 9
        ? say(L, ` In Sagittarius the career stays knowledge-based. ${AMK_IN_SAGITTARIUS[amkId] ?? ''}`.trimEnd(), ` धनु में करियर ज्ञान-आधारित रहता है।${sagSpecific ? ` ${sagSpecific}` : ''}`)
        : ''
      const aspectNames = aspecting.map(g => (L === 'hi' ? jG(g.id, L) : GRAHA_NAMES[g.id])).join(', ')
      const aspectText = aspecting.length
        ? say(L, ` Aspects, which weigh less: ${aspectNames}.`, ` दृष्टि, जो कम भारी है: ${aspectNames}।`)
        : ''
      steps.push({
        title: say(L, 'Amatyakaraka', J_TITLES.amk),
        text: `${amkHouseText(distance(input.lagna, amk.rashi), L)} ${conjunctionText(amkId, others, L)}${aspectText}${sag}`,
      })
    }
  }

  if (akActive && amkActive) {
    steps.push({
      title: say(L, 'Atmakaraka and Amatyakaraka', J_TITLES.both),
      text: say(L, 'Both karakas (natural indicator) are active together. This overlap has no middle ground: a lifetime rise, or a lifetime collapse. A shortcut in work, travel, or a decision can spoil a period that would otherwise hold. When transit agrees, the result is treated as certain in whichever direction the chart already leans.', 'दोनों कारक एक साथ सक्रिय हैं। इस योग का कोई मध्य नहीं: जीवन भर का उत्थान, या जीवन भर का पतन। कर्म, यात्रा या निर्णय में शॉर्टकट उस काल को बिगाड़ सकता है जो अन्यथा टिकता। गोचर सहमत हो तो फल उसी दिशा में निश्चित माना जाता है जिधर कुंडली पहले से झुकी है।'),
    })
  }

  const karakamshaHit = input.karakamsha != null && unique.includes(input.karakamsha)
  if (karakamshaHit && input.karakamsha) {
    const asAntar = input.antarSign === input.karakamsha && input.sign !== input.karakamsha
    const kk = L === 'hi' ? jR(input.karakamsha, L) : RASHI_NAMES[input.karakamsha]
    steps.push({
      title: say(L, 'Karakamsha period', J_TITLES.karakamsha),
      text: asAntar
        ? say(L, `${kk} antardasha is the Karakamsha. Soul purpose shows in a smaller way than it would across a full mahadasha. In childhood the same energy acts on the family, because career and marriage are not yet available.`, `${kk} की अंतर्दशा कारकांश है। आत्मा का उद्देश्य पूरी महादशा से छोटे रूप में दिखता है। बचपन में वही ऊर्जा परिवार पर लगती है, क्योंकि करियर और विवाह अभी उपलब्ध नहीं।`)
        : say(L, `${kk} is the Karakamsha, so this mahadasha activates soul purpose and can bring a career change, a marriage, a separation, a spiritual turn, or a rise or a fall. The antardasha of the same sign is the smaller serving of that result. In childhood it acts on the family.`, `${kk} कारकांश है, इसलिए यह महादशा आत्मा का उद्देश्य जगाती है और करियर-परिवर्तन, विवाह, वियोग, आध्यात्मिक मोड़, या उत्थान-पतन ला सकती है। उसी राशि की अंतर्दशा उस फल का छोटा अंश है। बचपन में यह परिवार पर लगता है।`),
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
  lang?: EngineLang
}): SoulKarakaReading {
  const L = jLang(input.lang)
  const ak = findGraha(input.grahas, input.ak)
  const amk = findGraha(input.grahas, input.amk)
  const akLines: string[] = []
  const amkLines: string[] = []
  const sagittariusLines: string[] = []

  if (AK_CRISIS[input.ak]) akLines.push((L === 'hi' ? J_AK_CRISIS[input.ak] : AK_CRISIS[input.ak]) as string)
  if (ak) akLines.push(L === 'hi' ? J_ELEMENT[elementOf(ak.rashi)] : ELEMENT_TEXT[elementOf(ak.rashi)])
  if (AK_PAST[input.ak]) akLines.push((L === 'hi' ? J_AK_PAST[input.ak] : AK_PAST[input.ak]) as string)
  if (ak) {
    const star = nakshatraOf(ak.rashi, ak.degree)
    const story = pastLifeNakshatra(star.name, star.pada, L)
    akLines.push(story
      ?? say(L, `${star.name} is ruled by ${GRAHA_NAMES[star.lord]}, pada ${star.pada}. A detailed pada story is given only for Ashwini, Krittika, and Bharani.`, `${jStar(star.name, L)} का स्वामी ${jG(star.lord, L)} है, पद ${star.pada}। विस्तृत पद-कथा केवल अश्विनी, कृत्तिका और भरणी के लिए है।`))
    const rahu = findGraha(input.grahas, 'Ra')
    const ketu = findGraha(input.grahas, 'Ke')
    const afflicted = dignityOf(ak) === 'debilitated'
      || [6, 8, 12].includes(distance(input.lagna, ak.rashi))
      || (rahu ? touches(rahu.rashi, ak.rashi) : false)
    if (afflicted) {
      akLines.push(say(L, 'The Atmakaraka is under pressure. This is read as a large karmic debt brought into this life. Problems in its period are the soul pushing that work to be finished.', 'आत्मकारक दबाव में है। इसे इस जीवन में लाया गया बड़ा कर्म-ऋण पढ़ा जाता है। इसके काल की समस्याएँ आत्मा का वह कार्य पूरा कराने का दबाव हैं।'))
    }
    if (ketu && touches(ketu.rashi, ak.rashi)) {
      akLines.push(say(L, 'Ketu with the Atmakaraka brings detachment. The heart can withdraw from money, career, home, spouse, or friends.', 'आत्मकारक के साथ केतु वैराग्य लाता है। हृदय धन, करियर, घर, साथी या मित्रों से हट सकता है।'))
    }
    if (rahu && touches(rahu.rashi, ak.rashi)) {
      akLines.push(say(L, 'Rahu with the Atmakaraka brings a desire that does not stay satisfied.', 'आत्मकारक के साथ राहु ऐसी इच्छा लाता है जो तृप्त नहीं रहती।'))
    }
    if (ak.rashi === 9) {
      const band = sagittariusBand(ak.degree, L)
      const vocational = afflicted
        ? say(L, 'Afflicted, the same placement can misuse belief, turn religion into a trade, or follow a false teacher.', 'पीड़ित होने पर यही स्थिति विश्वास का दुरुपयोग, धर्म को व्यापार, या झूठे गुरु का अनुसरण करा सकती है।')
        : say(L, 'The current-life tension is between what is true and what has been believed. A teacher can fail the person, and the false system can fall away.', 'इस जीवन का तनाव सत्य और माने हुए विश्वास के बीच है। गुरु व्यक्ति को निराश कर सकता है, और झूठी व्यवस्था गिर सकती है।')
      akLines.push(say(L, `The Atmakaraka is in Sagittarius, ${band.name}. The vocational picture is teaching, counsel, law, or religious leadership. ${vocational}`, `आत्मकारक धनु में है, ${jStar(band.name, L)}। वृत्ति का चित्र शिक्षण, परामर्श, विधि या धार्मिक नेतृत्व है। ${vocational}`))
    }
  }

  if (amk) {
    amkLines.push(amkHouseText(distance(input.lagna, amk.rashi), L))
    const others = input.grahas.filter(g => g.rashi === amk.rashi && g.id !== input.amk && g.id !== 'Ur' && g.id !== 'Ne' && g.id !== 'Pl')
    amkLines.push(conjunctionText(input.amk, others, L))
    const aspecting = input.grahas.filter(g => g.id !== input.amk && getRashiDrishti(g.rashi).includes(amk.rashi))
    if (aspecting.length) {
      const list = aspecting.map(g => say(L, `${GRAHA_NAMES[g.id]} from ${RASHI_NAMES[g.rashi]}`, `${jR(g.rashi, L)} से ${jG(g.id, L)}`)).join(', ')
      amkLines.push(say(L, `Aspects weigh less than conjunction: ${list}.`, `दृष्टि युति से कम भारी है: ${list}।`))
    }
    const d9 = input.d9?.find(g => g.id === input.amk)
    if (d9) amkLines.push(say(L, `In navamsha, Amatyakaraka is in ${RASHI_NAMES[d9.rashi]}.`, `नवमांश में अमात्यकारक ${jR(d9.rashi, L)} में है।`))
    if (amk.rashi === 9) {
      const specific = L === 'hi' ? J_AMK_SAG[input.amk] : AMK_IN_SAGITTARIUS[input.amk]
      amkLines.push(say(L, `Amatyakaraka in Sagittarius keeps the career knowledge-based.${specific ? ` ${specific}` : ''}`, `धनु में अमात्यकारक करियर को ज्ञान-आधारित रखता है।${specific ? ` ${specific}` : ''}`))
    }
    const tenth = houseFrom(input.lagna, 10)
    if (amk.rashi === tenth) {
      amkLines.push(say(L, 'Amatyakaraka occupies the 10th from Lagna, so the career has a direct seat.', 'अमात्यकारक लग्न से दसवें भाव में है, इसलिए करियर की सीधी बैठक है।'))
    } else if (getRashiDrishti(amk.rashi).includes(tenth)) {
      amkLines.push(say(L, 'Amatyakaraka aspects the 10th from Lagna.', 'अमात्यकारक लग्न से दसवें भाव को देखता है।'))
    }
  }

  if (ak?.rashi === 9 && amk?.rashi === 9) {
    sagittariusLines.push(say(L, 'Atmakaraka and Amatyakaraka both sit in Sagittarius. This points to leadership, spiritual authority, or public influence, and an ego that can turn the same planets toward a fall.', 'आत्मकारक और अमात्यकारक दोनों धनु में हैं। यह नेतृत्व, आध्यात्मिक अधिकार या सार्वजनिक प्रभाव की ओर है, और अहंकार उन्हीं ग्रहों को पतन की ओर मोड़ सकता है।'))
  }

  for (const g of input.grahas) {
    if (g.rashi !== 9 || g.id === 'Ra' || g.id === 'Ke' || g.id === 'Ur' || g.id === 'Ne' || g.id === 'Pl') continue
    const band = sagittariusBand(g.degree, L)
    sagittariusLines.push(say(L, `${GRAHA_NAMES[g.id]} in Sagittarius is in ${band.name}, ruled by ${band.ruler}. ${band.effect}`, `धनु का ${jG(g.id, L)} ${jStar(band.name, L)} में है, स्वामी ${jStar(band.ruler, L)}। ${band.effect}`))
  }
  if (input.lagna === 9 && input.lagnaDegree != null) {
    const band = sagittariusBand(input.lagnaDegree, L)
    sagittariusLines.push(say(L, `Lagna in Sagittarius is in ${band.name}, ruled by ${band.ruler}. ${band.effect}`, `धनु का लग्न ${jStar(band.name, L)} में है, स्वामी ${jStar(band.ruler, L)}। ${band.effect}`))
  }
  const saturn = findGraha(input.grahas, 'Sa')
  if (saturn?.rashi === 9) {
    sagittariusLines.push(say(L, 'Saturn in Sagittarius makes patience the test. The exhaustion of waiting is part of that test.', 'धनु में शनि धैर्य को परीक्षा बनाता है। प्रतीक्षा की थकान उसी परीक्षा का हिस्सा है।'))
  }
  if (ak && houseFrom(ak.rashi, 8) === 9) {
    sagittariusLines.push(say(L, 'Sagittarius is the 8th from the Atmakaraka. When the Sagittarius period also runs, this is treated as a fall condition, stronger if Rahu touches the sign.', 'धनु आत्मकारक से आठवाँ भाव है। धनु काल भी चले तो इसे पतन की स्थिति माना जाता है, राहु राशि को छुए तो और बलवान।'))
  }
  if (!sagittariusLines.length) {
    sagittariusLines.push(say(L, 'No classical planet or the Lagna is in Sagittarius, so the Mula, Purva Ashadha, and Uttara Ashadha split has nothing to describe yet.', 'धनु में न कोई पारंपरिक ग्रह है न लग्न, इसलिए मूल, पूर्वाषाढ़ा और उत्तराषाढ़ा का विभाजन अभी बताने को कुछ नहीं रखता।'))
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

function phaseLine(age: number | null, from: number, to: number, label: string, lang: EngineLang = 'en', labelHi = label): string {
  const L = jLang(lang)
  if (age != null && age >= from && age <= to) {
    return say(L, `Age ${age} is inside the ${label}, from ${from} to ${to}.`, `आयु ${age} ${labelHi} के भीतर है, ${from} से ${to} तक।`)
  }
  return say(L, `The ${label} run from ${from} to ${to}.`, `${labelHi} ${from} से ${to} तक चलते हैं।`)
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
  lang?: EngineLang
}): KarakaLifeReading {
  const L = jLang(input.lang)
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
      say(L, `${GRAHA_NAMES[input.bk]} as Bhratrukaraka shows siblings and the race the person runs: collaborative, or competitive. It also shows who pushes that race forward.`, `${jG(input.bk, L)} भ्रातृकारक के रूप में भाई-बहन और वह दौड़ दिखाता है जो व्यक्ति दौड़ता है: सहयोग की, या स्पर्धा की। यह यह भी दिखाता है कि उस दौड़ को कौन आगे बढ़ाता है।`),
      phaseLine(age, 13, 21, 'Bhratrukaraka years', L, 'भ्रातृकारक वर्ष'),
    ]
    if (strained(bk, input.lagna, input.grahas)) {
      lines.push(say(L, 'A strained Bhratrukaraka leans toward rivalry, one-upmanship, and difficulty cooperating.', 'पीड़ित भ्रातृकारक प्रतिद्वंद्विता, एक-दूसरे से आगे निकलने और सहयोग की कठिनाई की ओर झुकता है।'))
    }
    if (gk && linked(bk, gk)) {
      lines.push(say(L, 'Bhratrukaraka and Gnatikaraka are linked. A competitor can become an enemy, and collaboration fails.', 'भ्रातृकारक और ज्ञातिकारक जुड़े हैं। प्रतिद्वंद्वी शत्रु बन सकता है, और सहयोग टूटता है।'))
    }
    rows.push({ id: 'bk', title: say(L, 'Bhratrukaraka', 'भ्रातृकारक'), lines })
  }

  const mkWeak = mk ? strained(mk, input.lagna, input.grahas) : false
  const dkWeak = dk ? strained(dk, input.lagna, input.grahas) : false
  const mkHeld = mk ? held(mk, input.lagna, input.grahas) : false
  const dkHeld = dk ? held(dk, input.lagna, input.grahas) : false

  if (mk) {
    const lines = [
      say(L, `${GRAHA_NAMES[input.mk]} as Matrukaraka is the emotional foundation: inner stability, how much pain can be carried, and whether the inner child is still alive.`, `${jG(input.mk, L)} मातृकारक के रूप में भावनात्मक आधार है: भीतरी स्थिरता, कितनी पीड़ा उठाई जा सकती है, और भीतर का बच्चा अभी जीवित है या नहीं।`),
      phaseLine(age, 0, 12, 'Matrukaraka years', L, 'मातृकारक वर्ष'),
    ]
    if (mkHeld) lines.push(say(L, 'A held Matrukaraka supports resilience, care, and a steadier bond with the mother.', 'संभाला मातृकारक लचीलापन, देखभाल और माता से स्थिर बंधन देता है।'))
    if (mkWeak) {
      lines.push(say(L, 'A strained Matrukaraka leans toward emotional dependency and a habit of seeing the self as the victim. Maternal happiness is thin, and emotional learning stays difficult.', 'पीड़ित मातृकारक भावनात्मक निर्भरता और अपने आप को पीड़ित देखने की आदत की ओर झुकता है। मातृ सुख पतला है, और भावनात्मक सीखना कठिन रहता है।'))
    }
    rows.push({ id: 'mk', title: say(L, 'Matrukaraka', 'मातृकारक'), lines })
  }

  if (pk) {
    const lines = [
      say(L, `${GRAHA_NAMES[input.pk]} is the fifth karaka (natural indicator). This seat is read as creation and legacy: children, a business, an idea, a work, and what is left behind. The chart label for the seat remains Pitrukaraka.`, `${jG(input.pk, L)} पाँचवाँ कारक है। यह स्थान सृजन और विरासत से पढ़ा जाता है: संतान, व्यापार, विचार, कर्म, और जो पीछे छूटता है। कुंडली का नाम इस स्थान का पितृकारक ही रहता है।`),
      phaseLine(age, 25, 40, 'creation years', L, 'सृजन वर्ष'),
    ]
    if (held(pk, input.lagna, input.grahas)) {
      lines.push(say(L, 'A held fifth karaka (natural indicator) supports unconventional work, idealism, and something that can outlast the person.', 'संभाला पाँचवाँ कारक अपरंपरागत कर्म, आदर्श और ऐसा कुछ देता है जो व्यक्ति से आगे टिके।'))
    }
    if (strained(pk, input.lagna, input.grahas)) {
      lines.push(say(L, 'A strained fifth karaka (natural indicator) leans toward obsession with being remembered, and toward holding creations or children too tightly.', 'पीड़ित पाँचवाँ कारक याद रखे जाने के मोह और अपनी रचना या संतान को बहुत कसकर रखने की ओर झुकता है।'))
    }
    rows.push({ id: 'pk', title: say(L, 'Fifth karaka', 'पाँचवाँ कारक'), lines })
  }

  if (gk) {
    const house = distance(input.lagna, gk.rashi)
    const place = house === 6
      ? say(L, 'In the 6th the enemy is open and can be seen.', 'छठे भाव में शत्रु खुला है और दिख सकता है।')
      : house === 8
        ? say(L, 'In the 8th the enemy stays hidden and is hard to name.', 'आठवें भाव में शत्रु छिपा रहता है और नाम लेना कठिन है।')
        : house === 12
          ? say(L, 'In the 12th the person is their own enemy. The destruction comes from inside.', 'बारहवें भाव में व्यक्ति अपना ही शत्रु है। विनाश भीतर से आता है।')
          : say(L, `In the ${jOrd(house, L)} there is no open, hidden, or self-enemy split. The karaka (natural indicator) still names where pain repeats.`, `${jOrd(house, L)} भाव में खुला, छिपा या स्व-शत्रु का विभाजन नहीं है। कारक फिर भी बताता है कि पीड़ा कहाँ दोहराती है।`)
    const lines = [
      say(L, `${GRAHA_NAMES[input.gk]} as Gnatikaraka generates the repeating problem: who stands in the way, and what kind of crisis forces growth. It can switch on at any age, when the soul's path needs it.`, `${jG(input.gk, L)} ज्ञातिकारक के रूप में दोहराती समस्या बनाता है: रास्ते में कौन है, और किस संकट से वृद्धि होती है। आत्मा के मार्ग की आवश्यकता पर यह किसी भी आयु में चालू हो सकता है।`),
      place,
    ]
    if (mkWeak) lines.push(say(L, 'With a strained Matrukaraka, Gnatikaraka repeats emotional pain and can sink into depression.', 'पीड़ित मातृकारक के साथ ज्ञातिकारक भावनात्मक पीड़ा दोहराता है और अवसाद में गिरा सकता है।'))
    if (mkWeak && rahu && (touches(rahu.rashi, gk.rashi) || (mk ? touches(rahu.rashi, mk.rashi) : false))) {
      lines.push(say(L, 'Rahu joins that strain. This points to severe emotional strain.', 'राहु उस दबाव से जुड़ता है। यह गंभीर भावनात्मक दबाव की ओर है।'))
    }
    rows.push({ id: 'gk', title: say(L, 'Gnatikaraka', 'ज्ञातिकारक'), lines })
  }

  if (dk) {
    const lines = [
      say(L, `${GRAHA_NAMES[input.dk]} as Darakaraka covers marriage and the other serious bonds, including a business partnership. The reading is strongest after marriage.`, `${jG(input.dk, L)} दारकारक के रूप में विवाह और अन्य गंभीर बंधनों को समेटता है, व्यापारिक साझेदारी सहित। पाठ विवाह के बाद सबसे स्पष्ट है।`),
    ]
    const dual = [3, 6, 9, 12].includes(dk.rashi)
    const nodeOnDk = (rahu ? touches(rahu.rashi, dk.rashi) : false) || (ketu ? touches(ketu.rashi, dk.rashi) : false)
    if (dual && nodeOnDk) {
      lines.push(say(L, 'Darakaraka is in a dual sign and Rahu or Ketu touches it, so the bond carries a split that has to be balanced. The dual sign alone does not create that split.', 'दारकारक द्विस्वभाव राशि में है और राहु या केतु उसे छूता है, इसलिए बंधन में एक फाँक है जिसे संतुलित करना है। केवल द्विस्वभाव राशि वह फाँक नहीं बनाती।'))
    } else if (nodeOnDk || dkWeak) {
      lines.push(say(L, 'Darakaraka is under strain, so relationships carry complications.', 'दारकारक दबाव में है, इसलिए संबंध जटिलताएँ लिए रहते हैं।'))
    }
    if (mk && dk && mkHeld && dkHeld) {
      lines.push(say(L, 'Matrukaraka and Darakaraka are both held. Relationships can go deep and stay happy.', 'मातृकारक और दारकारक दोनों संभाले हैं। संबंध गहरे जा सकते हैं और सुखी रह सकते हैं।'))
    } else if (mk && dk && mkWeak && dkWeak) {
      lines.push(say(L, 'Matrukaraka and Darakaraka are both strained. Relationships can go to extreme pain.', 'मातृकारक और दारकारक दोनों पीड़ित हैं। संबंध चरम पीड़ा तक जा सकते हैं।'))
    } else if (mkWeak) {
      lines.push(say(L, 'A strained Matrukaraka disturbs Darakaraka, so the bond inherits the weak emotional base.', 'पीड़ित मातृकारक दारकारक को बिगाड़ता है, इसलिए बंधन कमज़ोर भावनात्मक आधार लेकर आता है।'))
    }
    if (ak && linked(dk, ak) && (dkWeak || nodeOnDk)) {
      lines.push(say(L, 'That relationship strain reaches the Atmakaraka, so identity and purpose get pulled into the pain.', 'वह संबंध-दबाव आत्मकारक तक पहुँचता है, इसलिए पहचान और उद्देश्य पीड़ा में खिंचते हैं।'))
    }
    rows.push({ id: 'dk', title: say(L, 'Darakaraka', 'दारकारक'), lines })
  }

  const linkLines: string[] = []
  if (ak && amk && pk && linked(ak, amk) && linked(amk, pk) && linked(ak, pk)) {
    linkLines.push(say(L, 'Atmakaraka, Amatyakaraka, and the fifth karaka (natural indicator) are linked. Success can arrive in line with the life purpose, from more than one direction.', 'आत्मकारक, अमात्यकारक और पाँचवाँ कारक जुड़े हैं। सफलता जीवन-उद्देश्य के अनुरूप, एक से अधिक दिशा से आ सकती है।'))
  }
  if (linkLines.length) rows.push({ id: 'links', title: say(L, 'Linked karakas', 'जुड़े कारक'), lines: linkLines })

  const loop = mkWeak
    ? say(L, 'A strained Matrukaraka can disturb the bond, and that disturbance can pull the Atmakaraka off its aim. Gnatikaraka then repeats the pain, and the emotional base gets weaker. The same story can arrive through different people until that root is worked with.', 'पीड़ित मातृकारक बंधन को बिगाड़ सकता है, और वह बिगाड़ आत्मकारक को उसके लक्ष्य से हटा सकता है। फिर ज्ञातिकारक पीड़ा दोहराता है, और भावनात्मक आधार कमज़ोर होता जाता है। जड़ पर काम होने तक वही कथा अलग-अलग लोगों के माध्यम से आ सकती है।')
    : null

  return { rows, loop }
}

export function karakamshaDirection(ak: GrahaId, lang: EngineLang = 'en'): string {
  const L = jLang(lang)
  const hint = L === 'hi' ? J_AK_DIRECTION[ak] : AK_DIRECTION[ak]
  if (!hint) return say(L, 'This Atmakaraka has no specific career hint.', 'इस आत्मकारक का कोई विशिष्ट करियर-संकेत नहीं है।')
  return say(L, `The starting hint for ${GRAHA_NAMES[ak]} as Atmakaraka is ${hint} The full chart still decides the result.`, `${jG(ak, L)} के आत्मकारक होने का आरंभिक संकेत है ${hint} पूरी कुंडली फिर भी फल तय करती है।`)
}

export function karakamshaSupport(
  lagna: Rashi,
  karakamsha: Rashi,
  grahas: Array<{ id: GrahaId; rashi: Rashi }>,
  lang: EngineLang = 'en',
): string {
  const L = jLang(lang)
  const house = distance(lagna, karakamsha)
  const supported = [1, 4, 5, 7, 9, 10].includes(house)
  const place = supported
    ? say(L, `Karakamsha is the ${jOrd(house, L)} from Lagna, a kendra (angular houses: 1, 4, 7, 10) or trikona (trine houses: 1, 5, 9), so the path has structural support.`, `कारकांश लग्न से ${jOrd(house, L)} भाव है, केंद्र (1, 4, 7, 10) या त्रिकोण (1, 5, 9), इसलिए मार्ग को ढाँचे का सहारा है।`)
    : say(L, `Karakamsha is the ${jOrd(house, L)} from Lagna, outside kendra (angular houses: 1, 4, 7, 10) and trikona (trine houses: 1, 5, 9).`, `कारकांश लग्न से ${jOrd(house, L)} भाव है, केंद्र (1, 4, 7, 10) और त्रिकोण (1, 5, 9) के बाहर।`)
  const rahu = grahas.find(g => g.id === 'Ra')
  const ketu = grahas.find(g => g.id === 'Ke')
  const node = (rahu && touches(rahu.rashi, karakamsha)) || (ketu && touches(ketu.rashi, karakamsha))
  return node
    ? say(L, `${place} Rahu or Ketu touches Karakamsha, which is read as an obstacle or a false path.`, `${place} राहु या केतु कारकांश को छूता है, जिसे बाधा या झूठा मार्ग पढ़ा जाता है।`)
    : place
}

export const SWAMSHA_USAGE = 'Swamsha takes Karakamsha as lagna and places every navamsha planet by whole sign from that lagna. The D9 column of this table is that chart. Read it beside the birth chart, the dasha, the aspects, and all seven karakas (natural indicator). A reading that uses only Swamsha misses the timing. If the Karakamsha dasha runs in childhood, it acts on the family and the household.'

const SWAMSHA_USAGE_HI = 'स्वांश कारकांश को लग्न मानकर हर नवमांश ग्रह को उस लग्न से पूरी राशि में रखता है। इस तालिका का डी9 स्तंभ वही चक्र है। इसे जन्म कुंडली, दशा, दृष्टि और सातों कारकों के साथ पढ़ें। केवल स्वांश से किया पाठ समय चूक जाता है। कारकांश दशा बचपन में चले तो वह परिवार और घर पर लगती है।'

export function swamshaUsage(lang: EngineLang = 'en'): string {
  return say(jLang(lang), SWAMSHA_USAGE, SWAMSHA_USAGE_HI)
}
