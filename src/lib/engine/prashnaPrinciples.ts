// ─────────────────────────────────────────────────────────────
//  src/lib/engine/prashnaPrinciples.ts
//  Prashna Essentials, "Principles" tab: the book's chapter "General
//  Principles of Prashna" (docs/research/prashna-3-extract.md) — multiple
//  queries, fixing the Lagna, past/present/future, the breath, examining
//  the Lagna, lagnesh–karyesh links, success and failure, retrograde
//  planets, Rahu–Ketu, nakshatras and the five Prashna Marga sutras.
//  Reference text plus a few chart readings. Pure.
// ─────────────────────────────────────────────────────────────

import type { GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'
import { GRAHA_HI, RASHI_HI } from '@/i18n/jyotish'
import type { EngineLang } from './lang'
import { EXALTATION_SIGN, MOOLATRIKONA_SIGN, OWN_SIGNS, naturalRelationship } from './dignity'
import { D9 } from './vargas'
import { hasParasharaAspect } from './aspects'
import { tajikaLink } from './tajika'

type T = { en: string; hi: string }
export type PrincipleTone = 'good' | 'mixed' | 'bad' | 'neutral'

export interface PrincipleSection {
  id: string
  title: T
  intro?: T
  rows?: Array<{ term: T; text: T; tone?: PrincipleTone }>
  points?: T[]
}

const t = (en: string, hi: string): T => ({ en, hi })

const SIGN_LORD: GrahaId[] = ['Ma', 'Ve', 'Me', 'Mo', 'Su', 'Me', 'Ve', 'Ma', 'Ju', 'Sa', 'Sa', 'Ju']
const lordOf = (r: Rashi): GrahaId => SIGN_LORD[r - 1]
const nth = (from: Rashi, n: number): Rashi => (((from - 1 + n - 1) % 12) + 1) as Rashi
/** Whole-sign house of `sign` counted from `from` (1–12). */
const houseFrom = (from: Rashi, sign: Rashi) => ((sign - from + 12) % 12) + 1

// ── Classifications ────────────────────────────────────────

export type RiseKind = 'shirsho' | 'prishto' | 'ubhayo'
/** Shirshodaya 3, 5, 6, 7, 8, 11; prishtodaya 1, 2, 4, 9, 10; ubhayodaya 12 (as the book gives them). */
export function riseOf(r: Rashi): RiseKind {
  if (r === 12) return 'ubhayo'
  return [3, 5, 6, 7, 8, 11].includes(r) ? 'shirsho' : 'prishto'
}

export type Mobility = 'movable' | 'fixed' | 'dual'
export const mobilityOf = (r: Rashi): Mobility => (['movable', 'fixed', 'dual'] as const)[(r - 1) % 3]

export type TimeFrame = 'past' | 'present' | 'future'
/** Houses 9–12 past, 1–4 present, 5–8 future. */
export function timeFrameOfHouse(h: number): TimeFrame {
  if (h >= 9) return 'past'
  if (h <= 4) return 'present'
  return 'future'
}

export type Nostril = 'left' | 'right'
/** Favourable nostril by the weekday's lord: left on benefic days, right on malefic days. */
export const SHVASA_FAVOURABLE: Record<'Su' | 'Mo' | 'Ma' | 'Me' | 'Ju' | 'Ve' | 'Sa', Nostril> = {
  Su: 'right', Mo: 'left', Ma: 'right', Me: 'left', Ju: 'left', Ve: 'left', Sa: 'right',
}

const BENEFICS = new Set<GrahaId>(['Ju', 'Ve', 'Me', 'Mo'])
const MALEFICS = new Set<GrahaId>(['Su', 'Ma', 'Sa', 'Ra', 'Ke'])
const SEVEN: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa']

// ── The five sutras (Prashna Marga) ─────────────────────────

export type Sutra = 'jeeva' | 'roga' | 'mrityu'
export type SutraId = 'samanya' | 'adhipati' | 'navamsha' | 'nakshatra' | 'maha'
export const SUTRA_TONE: Record<Sutra, PrincipleTone> = { jeeva: 'good', roga: 'mixed', mrityu: 'bad' }
/** In timing: nakshatra and adhipati the present, samanya the past, navamsha and maha the future. */
export const SUTRA_TIME: Record<SutraId, TimeFrame> = {
  samanya: 'past', adhipati: 'present', navamsha: 'future', nakshatra: 'present', maha: 'future',
}

/** Both movable or fixed+dual = jeeva; both fixed or movable+dual = mrityu; both dual or movable+fixed = roga. */
export function samanyaSutra(lagna: Rashi, arudha: Rashi): Sutra {
  const pair = [mobilityOf(lagna), mobilityOf(arudha)].sort().join('+')
  if (pair === 'movable+movable' || pair === 'dual+fixed') return 'jeeva'
  if (pair === 'fixed+fixed' || pair === 'dual+movable') return 'mrityu'
  return 'roga'
}

export type Friendship = 'friend' | 'neutral' | 'enemy'

/**
 * Panchadha maitri of `a` towards `b`, collapsed to three grades:
 * natural relationship plus the temporal one (b in 2, 3, 4, 10, 11 or 12
 * from a is a temporal friend, otherwise an enemy).
 */
export function panchadha(a: GrahaId, b: GrahaId, aRashi: Rashi, bRashi: Rashi): Friendship {
  const natural = naturalRelationship(a, b)
  const temporalFriend = [2, 3, 4, 10, 11, 12].includes(houseFrom(aRashi, bRashi))
  const score = (natural === 'friend' ? 1 : natural === 'enemy' ? -1 : 0) + (temporalFriend ? 1 : -1)
  return score > 0 ? 'friend' : score < 0 ? 'enemy' : 'neutral'
}

/** F+F, F+N = jeeva; N+N, F+E = roga; E+E, E+N = mrityu. */
export function pairSutra(ab: Friendship, ba: Friendship): Sutra {
  const v = (f: Friendship) => (f === 'friend' ? 1 : f === 'enemy' ? -1 : 0)
  const s = v(ab) + v(ba)
  return s > 0 ? 'jeeva' : s < 0 ? 'mrityu' : 'roga'
}

export function lordsSutra(signA: Rashi, signB: Rashi, positions: Partial<Record<GrahaId, Rashi>>) {
  const a = lordOf(signA)
  const b = lordOf(signB)
  if (a === b) return { a, b, ab: 'friend' as Friendship, ba: 'friend' as Friendship, sutra: 'jeeva' as Sutra }
  const pa = positions[a]
  const pb = positions[b]
  const ab: Friendship = pa && pb ? panchadha(a, b, pa, pb) : naturalRelationship(a, b)
  const ba: Friendship = pa && pb ? panchadha(b, a, pb, pa) : naturalRelationship(b, a)
  return { a, b, ab, ba, sutra: pairSutra(ab, ba) }
}

/** Navamsha sign of the n-th navamsha (1–9) of a sign. */
export const navamshaSignOf = (sign: Rashi, navamsha: number): Rashi =>
  D9((sign - 1) * 30 + (navamsha - 0.5) * (10 / 3)) as Rashi

/** Count from the Lagna nakshatra to the birth nakshatra (inclusive, 0-based indexes), remainder by 3. */
export function nakshatraSutra(lagnaNak: number, birthNak: number): { count: number; sutra: Sutra } {
  const count = ((birthNak - lagnaNak + 27) % 27) + 1
  const rem = count % 3
  return { count, sutra: rem === 1 ? 'jeeva' : rem === 2 ? 'roga' : 'mrityu' }
}

/** Nocturnal (lunar) signs: Aries, Taurus, Gemini, Cancer, Sagittarius, Capricorn. */
export const isNocturnal = (r: Rashi) => [1, 2, 3, 4, 9, 10].includes(r)

export function mahaSutra(arudha: Rashi): { tenth: Rashi; sutra: Sutra } {
  const tenth = nth(arudha, 10)
  const a = isNocturnal(arudha)
  const b = isNocturnal(tenth)
  return { tenth, sutra: a && b ? 'jeeva' : !a && !b ? 'mrityu' : 'roga' }
}

export interface SutraInput {
  lagna: Rashi
  arudha: Rashi
  /** D1 sign of each planet, for panchadha maitri. */
  positions: Partial<Record<GrahaId, Rashi>>
  /** Navamsha Lagna sign (D9). */
  d9Lagna?: Rashi
  /** Navamsha (1–9) of the Arudha, from the number 1–108. */
  arudhaNavamsha?: number
  /** 0-based nakshatra index of the rising degree. */
  lagnaNakshatra?: number
  /** 0-based birth nakshatra index. */
  birthNakshatra?: number
}

export interface SutraResult { id: SutraId; sutra: Sutra; time: TimeFrame; detail: string }

const gN = (g: GrahaId, lang: EngineLang) => (lang === 'hi' ? GRAHA_HI[g] : GRAHA_NAMES[g])
const rN = (r: Rashi, lang: EngineLang) => (lang === 'hi' ? RASHI_HI[r] : RASHI_NAMES[r])
const FRIEND_T: Record<Friendship, T> = { friend: t('friend', 'मित्र'), neutral: t('neutral', 'सम'), enemy: t('enemy', 'शत्रु') }
const MOB_T: Record<Mobility, T> = { movable: t('movable', 'चर'), fixed: t('fixed', 'स्थिर'), dual: t('dual', 'द्विस्वभाव') }

export function fiveSutras(input: SutraInput, lang: EngineLang = 'en'): SutraResult[] {
  const p = (x: T) => (lang === 'hi' ? x.hi : x.en)
  const out: SutraResult[] = []
  const push = (id: SutraId, sutra: Sutra, detail: string) => out.push({ id, sutra, time: SUTRA_TIME[id], detail })

  push('samanya', samanyaSutra(input.lagna, input.arudha),
    `${rN(input.lagna, lang)} (${p(MOB_T[mobilityOf(input.lagna)])}) · ${rN(input.arudha, lang)} (${p(MOB_T[mobilityOf(input.arudha)])})`)

  const lordLine = (r: ReturnType<typeof lordsSutra>) =>
    r.a === r.b
      ? (lang === 'hi' ? `एक ही स्वामी: ${gN(r.a, lang)}` : `Same lord: ${gN(r.a, lang)}`)
      : `${gN(r.a, lang)} → ${gN(r.b, lang)}: ${p(FRIEND_T[r.ab])} · ${gN(r.b, lang)} → ${gN(r.a, lang)}: ${p(FRIEND_T[r.ba])}`

  const adh = lordsSutra(input.lagna, input.arudha, input.positions)
  push('adhipati', adh.sutra, lordLine(adh))

  if (input.d9Lagna && input.arudhaNavamsha) {
    const arD9 = navamshaSignOf(input.arudha, input.arudhaNavamsha)
    const nav = lordsSutra(input.d9Lagna, arD9, input.positions)
    push('navamsha', nav.sutra, `D9 ${rN(input.d9Lagna, lang)} · ${lang === 'hi' ? 'आरूढ़ D9' : 'Arudha D9'} ${rN(arD9, lang)} — ${lordLine(nav)}`)
  }

  if (input.lagnaNakshatra != null && input.birthNakshatra != null) {
    const n = nakshatraSutra(input.lagnaNakshatra, input.birthNakshatra)
    const rem = n.count % 3 || 3
    push('nakshatra', n.sutra, lang === 'hi' ? `गिनती ${n.count}, 3 से शेष ${rem}` : `Count ${n.count}, remainder ${rem} by 3`)
  }

  const m = mahaSutra(input.arudha)
  const night = (r: Rashi) => p(isNocturnal(r) ? t('nocturnal', 'रात्रि-बली') : t('diurnal', 'दिवा-बली'))
  push('maha', m.sutra, `${rN(input.arudha, lang)} (${night(input.arudha)}) · ${lang === 'hi' ? 'दशम' : '10th'} ${rN(m.tenth, lang)} (${night(m.tenth)})`)

  return out
}

export const SUTRA_LABEL: Record<Sutra, T> = {
  jeeva: t('Jeeva — success', 'जीव — सफलता'),
  roga: t('Roga — obstacles', 'रोग — बाधाएँ'),
  mrityu: t('Mrityu — failure', 'मृत्यु — असफलता'),
}
export const SUTRA_NAME: Record<SutraId, T> = {
  samanya: t('Samanya sutra', 'सामान्य सूत्र'),
  adhipati: t('Adhipati sutra', 'अधिपति सूत्र'),
  navamsha: t('Navamsha sutra', 'नवांश सूत्र'),
  nakshatra: t('Nakshatra sutra', 'नक्षत्र सूत्र'),
  maha: t('Maha sutra', 'महा सूत्र'),
}
export const TIME_LABEL: Record<TimeFrame, T> = {
  past: t('past', 'भूत'), present: t('present', 'वर्तमान'), future: t('future', 'भविष्य'),
}
export const sutraLabel = (s: Sutra, lang: EngineLang = 'en') => (lang === 'hi' ? SUTRA_LABEL[s].hi : SUTRA_LABEL[s].en)
export const sutraName = (s: SutraId, lang: EngineLang = 'en') => (lang === 'hi' ? SUTRA_NAME[s].hi : SUTRA_NAME[s].en)
export const timeLabel = (s: TimeFrame, lang: EngineLang = 'en') => (lang === 'hi' ? TIME_LABEL[s].hi : TIME_LABEL[s].en)

// ── Readings for the cast chart ─────────────────────────────

export interface PrinciplesChartInput {
  ascRashi: Rashi
  /** Degrees of the Lagna inside its sign (0–30). */
  ascDegree: number
  /** Lord of the weekday (vara). */
  varaLord?: GrahaId
  grahas: Array<{ id: GrahaId; rashi: Rashi; degree: number; lonSidereal: number; isRetro: boolean; isCombust?: boolean }>
}

export interface PrincipleReading { id: string; tone: PrincipleTone; text: string }

const list = (ids: GrahaId[], lang: EngineLang) => ids.map(g => gN(g, lang)).join(', ')

export function readPrinciples(input: PrinciplesChartInput, lang: EngineLang = 'en'): PrincipleReading[] {
  const hi = lang === 'hi'
  const out: PrincipleReading[] = []
  const asc = input.ascRashi
  const seven = input.grahas.filter(g => SEVEN.includes(g.id) || g.id === 'Ra' || g.id === 'Ke')
  const houseOf = (r: Rashi) => houseFrom(asc, r)
  const byId = new Map(seven.map(g => [g.id, g]))

  // 1. Rising type
  const rise = riseOf(asc)
  out.push({
    id: 'rise',
    tone: rise === 'shirsho' ? 'good' : rise === 'prishto' ? 'bad' : 'mixed',
    text: {
      shirsho: hi ? `${RASHI_HI[asc]} शीर्षोदय है: प्रश्न पूरा होने के लिए शुभ; प्रायः सुखद, आशा भरा प्रश्न।` : `${RASHI_NAMES[asc]} is shirshodaya: favourable for the query; usually a pleasant, hopeful question.`,
      prishto: hi ? `${RASHI_HI[asc]} पृष्ठोदय है: बाधाएँ, विशेषकर पाप दृष्टि हो तो असफलता; प्रायः दुख या निराशा का प्रश्न।` : `${RASHI_NAMES[asc]} is prishtodaya: obstacles, and failure especially with a malefic aspect; usually a question of misery or despair.`,
      ubhayo: hi ? `${RASHI_HI[asc]} उभयोदय है: लगभग शीर्षोदय जितना शुभ, पर प्रश्नकर्ता को अधिक प्रयास करना होगा।` : `${RASHI_NAMES[asc]} is ubhayodaya: almost as good as shirshodaya, but achieved with more effort.`,
    }[rise],
  })

  // 2. Movable / fixed / dual
  const mob = mobilityOf(asc)
  const deg = input.ascDegree.toFixed(1)
  out.push({
    id: 'mobility',
    tone: 'neutral',
    text: mob === 'movable'
      ? (hi ? 'चर लग्न: वर्तमान स्थिति बदलेगी (यात्रा होगी, रोगी ठीक होगा)। शुभ दृष्टि से परिवर्तन शुभ; पाप दृष्टि से परिवर्तन न हो या अशुभ हो।' : 'Movable Lagna: the present situation will change (the journey happens, the patient recovers). With benefic aspects the change is good; with malefic aspects it may not come or may not be good.')
      : mob === 'fixed'
        ? (hi ? 'स्थिर लग्न: यथास्थिति, परिवर्तन नहीं। नौकरी पाना, घर खरीदना जैसे स्थिर कार्यों के लिए सदा शुभ।' : 'Fixed Lagna: status quo, no change. Always favourable for fixed acts such as getting a job or buying a house.')
        : input.ascDegree < 15
          ? (hi ? `द्विस्वभाव लग्न ${deg}° पर (0–15°): विलंब और कठिनाई, फिर स्थिर लग्न जैसा फल।` : `Dual Lagna at ${deg}° (0–15°): delay and difficulty, then results like a fixed Lagna.`)
          : (hi ? `द्विस्वभाव लग्न ${deg}° पर (15–30°): विलंब और कठिनाई, फिर चर लग्न जैसा फल।` : `Dual Lagna at ${deg}° (15–30°): delay and difficulty, then results like a movable Lagna.`),
  })

  // 3. Planets in the Lagna
  const inLagna = seven.filter(g => g.rashi === asc).map(g => g.id)
  const ben = inLagna.filter(g => BENEFICS.has(g) && g !== 'Mo')
  const mal = inLagna.filter(g => MALEFICS.has(g))
  if (ben.length) out.push({ id: 'lagna-benefic', tone: 'good', text: hi ? `लग्न में शुभ ग्रह (${list(ben, lang)}): लग्न को बल, प्रश्न के लिए शुभ। पर विवाद में यह सप्तम (विरोधी) को बल देता है।` : `Benefic in the Lagna (${list(ben, lang)}): strengthens the Lagna, good for the query. In a dispute it strengthens the 7th (the opponent).` })
  if (mal.length) out.push({ id: 'lagna-malefic', tone: 'mixed', text: hi ? `लग्न में पाप ग्रह (${list(mal, lang)}): सामान्यतः अशुभ, पर झगड़े, मुकदमे और विवाद में लड़ने की शक्ति देता है।` : `Malefic in the Lagna (${list(mal, lang)}): not good in general, but in fights, court cases and disputes it gives the fighting spirit to win.` })
  if (inLagna.includes('Mo')) out.push({ id: 'lagna-moon', tone: 'bad', text: hi ? 'प्रश्न लग्न में चंद्र: सामान्यतः शुभ नहीं।' : 'Moon in the prashna Lagna: generally not auspicious.' })

  // 4. Lagna lord in 6, 8, 12; 6/8/12 lords in the Lagna
  const ll = lordOf(asc)
  const llG = byId.get(ll)
  if (llG) {
    const h = houseOf(llG.rashi)
    if ([6, 8, 12].includes(h)) out.push({ id: 'lagnesh-dusthana', tone: 'bad', text: hi ? `लग्नेश ${GRAHA_HI[ll]} ${h}वें भाव में: असफलता का संकेत।` : `Lagna lord ${GRAHA_NAMES[ll]} in house ${h}: indicates failure.` })
    else if ([1, 4, 5, 7, 9, 10].includes(h)) out.push({ id: 'lagnesh-good', tone: 'good', text: hi ? `लग्नेश ${GRAHA_HI[ll]} ${h}वें भाव (केंद्र/त्रिकोण) में: प्रश्नकर्ता को बल।` : `Lagna lord ${GRAHA_NAMES[ll]} in house ${h} (kendra/trikona): strength to the querist.` })
  }
  const dustLords = [...new Set([6, 8, 12].map(h => lordOf(nth(asc, h))))].filter(g => g !== ll && byId.get(g)?.rashi === asc)
  if (dustLords.length) out.push({ id: 'dusthana-lord-lagna', tone: 'bad', text: hi ? `6/8/12 के स्वामी लग्न में (${list(dustLords, lang)}): शुभ नहीं।` : `Lord of 6, 8 or 12 in the Lagna (${list(dustLords, lang)}): not favourable.` })

  // 5. Malefics and benefics by house
  const malIn = (hs: number[]) => seven.filter(g => MALEFICS.has(g.id) && hs.includes(houseOf(g.rashi))).map(g => g.id)
  const good3611 = malIn([3, 6, 11])
  if (good3611.length) out.push({ id: 'malefic-upachaya', tone: 'good', text: hi ? `पाप ग्रह 3, 6 या 11 में (${list(good3611, lang)}): बहुत शुभ।` : `Malefics in 3, 6 or 11 (${list(good3611, lang)}): very favourable.` })
  const bad812 = malIn([8, 12])
  if (bad812.length) out.push({ id: 'malefic-8-12', tone: 'bad', text: hi ? `पाप ग्रह 8 या 12 में (${list(bad812, lang)}): प्रश्न के लिए अशुभ।` : `Malefics in 8 or 12 (${list(bad812, lang)}): unfavourable for the prashna.` })
  const malKT = malIn([1, 4, 5, 7, 9, 10]).filter(g => !mal.includes(g))
  if (malKT.length) out.push({ id: 'malefic-kendra', tone: 'bad', text: hi ? `पाप ग्रह केंद्र/त्रिकोण में (${list(malKT, lang)}): उन भावों के फल को कष्ट।` : `Malefics in kendras or trikonas (${list(malKT, lang)}): trouble for those houses.` })
  const benKT = seven.filter(g => BENEFICS.has(g.id) && [1, 4, 5, 7, 9, 10].includes(houseOf(g.rashi))).map(g => g.id)
  if (benKT.length) out.push({ id: 'benefic-kendra', tone: 'good', text: hi ? `शुभ ग्रह केंद्र/त्रिकोण में (${list(benKT, lang)}): सफलता के लिए शुभ।` : `Benefics in kendras or trikonas (${list(benKT, lang)}): favourable for success.` })

  // 6. Weak by placement: 7th from own, exaltation or moolatrikona
  const seventhWeak = SEVEN.filter(id => {
    const g = byId.get(id)
    if (!g) return false
    const refs = [EXALTATION_SIGN[id], MOOLATRIKONA_SIGN[id], ...(OWN_SIGNS[id] ?? [])].filter(Boolean) as Rashi[]
    return refs.some(r => nth(r, 7) === g.rashi)
  })
  if (seventhWeak.length) out.push({ id: 'seventh-from-own', tone: 'bad', text: hi ? `अपनी उच्च, मूलत्रिकोण या स्वराशि से सातवें में (${list(seventhWeak, lang)}): दुर्बल, जहाँ बैठा है उस भाव का फल नहीं दे पाता (अपनी राशि को दृष्टि से बल देता है)।` : `In the 7th from its exaltation, moolatrikona or own sign (${list(seventhWeak, lang)}): weak, cannot give results for the house it sits in (it still strengthens its own sign by aspect).` })

  // 7. Debilitated / combust spoil houses — combust only here (debility is in the Planets tab)
  const combust = seven.filter(g => g.isCombust && g.id !== 'Su').map(g => g.id)
  if (combust.length) out.push({ id: 'combust', tone: 'bad', text: hi ? `अस्त ग्रह (${list(combust, lang)}): जिस भाव में बैठा और जिनका स्वामी है, उनके फल को हानि।` : `Combust (${list(combust, lang)}): spoils the house it sits in and the houses it rules.` })

  // 8. Retrograde planets
  const retro = seven.filter(g => g.isRetro && g.id !== 'Ra' && g.id !== 'Ke')
  if (retro.length) out.push({
    id: 'retro', tone: 'mixed',
    text: hi
      ? `वक्री: ${retro.map(g => `${GRAHA_HI[g.id]} (${houseOf(g.rashi)}वाँ)`).join(', ')}। उस भाव के फल में बाधा; लग्नेश या कार्येश से निकट दृष्टि हो तो घटना रद्द हो सकती है।`
      : `Retrograde: ${retro.map(g => `${GRAHA_NAMES[g.id]} (house ${houseOf(g.rashi)})`).join(', ')}. Obstacles for that house; in close aspect with the Lagna lord or karyesh the event may be cancelled.`,
  })

  // 9. Just entered / leaving a sign
  // A planet moving backwards (always Rahu and Ketu) enters a sign at 29° and leaves it at 0°.
  const edge = (g: { degree: number; isRetro: boolean }) => (g.degree < 1 || g.degree >= 29 ? ((g.degree < 1) !== g.isRetro ? 'entered' : 'leaving') : null)
  const entered = seven.filter(g => edge(g) === 'entered').map(g => g.id)
  const leaving = seven.filter(g => edge(g) === 'leaving').map(g => g.id)
  if (entered.length) out.push({ id: 'entered', tone: 'mixed', text: hi ? `अभी राशि में प्रवेश (${list(entered, lang)}): उसके फल (जैसे कष्ट) का आरंभ, जो राशि में रहने तक चलेगा।` : `Just entered a sign (${list(entered, lang)}): the onset of its results (such as trouble), lasting while it stays in the sign.` })
  if (leaving.length) out.push({ id: 'leaving', tone: 'neutral', text: hi ? `राशि के अंतिम अंश (${list(leaving, lang)}): इस राशि में उसके फल समाप्त होने को हैं।` : `In the last degree of a sign (${list(leaving, lang)}): its results from this sign are about to end.` })

  // 10. Planetary war (within 1°; the book: lesser longitude wins)
  const warriors = seven.filter(g => ['Ma', 'Me', 'Ju', 'Ve', 'Sa'].includes(g.id))
  for (let i = 0; i < warriors.length; i++) {
    for (let j = i + 1; j < warriors.length; j++) {
      const a = warriors[i], b = warriors[j]
      const d = Math.abs(a.lonSidereal - b.lonSidereal)
      if (Math.min(d, 360 - d) <= 1) {
        const [win, lose] = a.lonSidereal <= b.lonSidereal ? [a.id, b.id] : [b.id, a.id]
        out.push({ id: `war-${a.id}-${b.id}`, tone: 'mixed', text: hi ? `ग्रह युद्ध: ${GRAHA_HI[a.id]} और ${GRAHA_HI[b.id]} 1° के भीतर। इस ग्रंथ के अनुसार कम भोगांश वाला ${GRAHA_HI[win]} जीतता है; पराजित ${GRAHA_HI[lose]} अशुभ फल देता है।` : `Planetary war: ${GRAHA_NAMES[a.id]} and ${GRAHA_NAMES[b.id]} within 1°. By this text the lesser longitude, ${GRAHA_NAMES[win]}, wins; the defeated ${GRAHA_NAMES[lose]} gives poor results.` })
      }
    }
  }

  // 11. Rahu / Ketu with the Lagna lord
  const nodesWithLord = (['Ra', 'Ke'] as GrahaId[]).filter(n => byId.get(n) && llG && byId.get(n)!.rashi === llG.rashi)
  if (nodesWithLord.length) out.push({ id: 'nodes-lagnesh', tone: 'bad', text: hi ? `लग्नेश के साथ ${list(nodesWithLord, lang)}: सामान्यतः अशुभ, असफलता की ओर।` : `${list(nodesWithLord, lang)} with the Lagna lord: generally unfavourable, tends to failure.` })

  // 12. Breath for the weekday
  if (input.varaLord && input.varaLord in SHVASA_FAVOURABLE) {
    const n = SHVASA_FAVOURABLE[input.varaLord as keyof typeof SHVASA_FAVOURABLE]
    out.push({ id: 'shvasa', tone: 'neutral', text: hi ? `${GRAHA_HI[input.varaLord]} का वार: ${n === 'left' ? 'बाईं (इड़ा)' : 'दाईं (पिंगला)'} नासिका का श्वास शुभ।` : `${GRAHA_NAMES[input.varaLord]}'s day: breath through the ${n} nostril (${n === 'left' ? 'Ida' : 'Pingala'}) is favourable.` })
  }

  return out
}

/** Planets grouped by the house time frames: 9–12 past, 1–4 present, 5–8 future. */
export function timeFrames(input: PrinciplesChartInput): Record<TimeFrame, GrahaId[]> {
  const out: Record<TimeFrame, GrahaId[]> = { past: [], present: [], future: [] }
  for (const g of input.grahas) {
    if (!SEVEN.includes(g.id) && g.id !== 'Ra' && g.id !== 'Ke') continue
    out[timeFrameOfHouse(houseFrom(input.ascRashi, g.rashi))].push(g.id)
  }
  return out
}

// ── Reference text ──────────────────────────────────────────

export const PRINCIPLE_SECTIONS: PrincipleSection[] = [
  {
    id: 'multiple', title: t('Several queries', 'कई प्रश्न'),
    intro: t('Classically, more than one query is read from different points:', 'परंपरा से एक से अधिक प्रश्न अलग-अलग बिंदुओं से देखे जाते हैं:'),
    rows: [
      { term: t('1st', 'पहला'), text: t('Lagna', 'लग्न') },
      { term: t('2nd', 'दूसरा'), text: t('Moon', 'चंद्र') },
      { term: t('3rd', 'तीसरा'), text: t('Sun', 'सूर्य') },
      { term: t('4th', 'चौथा'), text: t('Jupiter', 'गुरु') },
      { term: t('5th', 'पाँचवाँ'), text: t('Stronger of Venus and Mercury', 'शुक्र-बुध में बलवान') },
      { term: t('6th', 'छठा'), text: t('Weaker of Venus and Mercury', 'शुक्र-बुध में दुर्बल') },
    ],
    points: [
      t('In south India each point is also read in the navamsha, giving 12 queries (see the Method tab).', 'दक्षिण भारत में हर बिंदु नवांश में भी देखा जाता है, जिससे 12 प्रश्न होते हैं (पद्धति टैब देखें)।'),
      t('The author: read all of one person\'s queries from the Lagna. A second querist within the same rising Lagna is read from the Moon, a third from the Sun, and so on. With an Arudha Lagna the problem does not arise.', 'लेखक: एक व्यक्ति के सभी प्रश्न लग्न से देखें। उसी उदित लग्न में दूसरा प्रश्नकर्ता चंद्र से, तीसरा सूर्य से, इसी क्रम में। आरूढ़ लग्न लें तो यह समस्या नहीं रहती।'),
    ],
  },
  {
    id: 'fixing', title: t('Fixing the Lagna', 'लग्न निर्धारण'),
    points: [
      t('Cast for the place where the query is raised, not the birthplace.', 'जहाँ प्रश्न पूछा गया उस स्थान के लिए बनाएँ, जन्म स्थान के लिए नहीं।'),
      t('A thought noted earlier does not count: use the moment the querist presents himself.', 'पहले लिखा गया विचार नहीं गिना जाता: प्रश्नकर्ता के सामने आने का क्षण लें।'),
      t('A call taken by someone else in your absence: use the time of the call.', 'आपकी अनुपस्थिति में किसी और ने कॉल लिया: कॉल का समय लें।'),
      t('A call asking only for an appointment: cast for the call, not the appointment.', 'केवल समय माँगने वाला कॉल: कॉल के समय की कुंडली, मिलने के समय की नहीं।'),
      t('Fixed consulting hours (say 6–8 PM daily): prefer the Arudha Lagna to the rising Lagna.', 'निश्चित परामर्श समय (जैसे रोज़ शाम 6–8): उदय लग्न के बजाय आरूढ़ लग्न लें।'),
      t('Phone, email or letter: the author casts for the time and place where the query originates, not where the astrologer lives.', 'फ़ोन, ईमेल या पत्र: लेखक प्रश्न जहाँ से उठा उस समय और स्थान की कुंडली बनाते हैं, ज्योतिषी के स्थान की नहीं।'),
    ],
  },
  {
    id: 'time', title: t('Past, present or future', 'भूत, वर्तमान या भविष्य'),
    intro: t('The closest Tajika aspect of the Lagna lord: ishrafa is past, ithasala future, purna ithasala present. The Moon in ishrafa with the karyesh: the querist has already decided.', 'लग्नेश की निकटतम ताजिक दृष्टि: ईसराफ़ भूत, इत्थशाल भविष्य, पूर्ण इत्थशाल वर्तमान। चंद्र का कार्येश से ईसराफ़: प्रश्नकर्ता पहले ही निर्णय कर चुका है।'),
    rows: [
      { term: t('9, 10, 11, 12', '9, 10, 11, 12'), text: t('Past', 'भूत') },
      { term: t('1, 2, 3, 4', '1, 2, 3, 4'), text: t('Present', 'वर्तमान') },
      { term: t('5, 6, 7, 8', '5, 6, 7, 8'), text: t('Future', 'भविष्य') },
    ],
    points: [t('Debated: some take 5–10 as past and 11–4 as future.', 'विवादित: कुछ 5–10 को भूत और 11–4 को भविष्य मानते हैं।')],
  },
  {
    id: 'shvasa', title: t('The breath (shvasa)', 'श्वास'),
    intro: t('On days ruled by benefics the left nostril is favourable; on days ruled by malefics, the right.', 'शुभ ग्रहों के वार में बाईं नासिका शुभ; पाप ग्रहों के वार में दाईं।'),
    rows: [
      { term: t('Sun, Tue, Sat', 'रवि, मंगल, शनि'), tone: 'mixed', text: t('Right nostril favourable, left unfavourable.', 'दाईं नासिका शुभ, बाईं अशुभ।') },
      { term: t('Mon, Wed, Thu, Fri', 'सोम, बुध, गुरु, शुक्र'), tone: 'good', text: t('Left nostril favourable, right unfavourable.', 'बाईं नासिका शुभ, दाईं अशुभ।') },
    ],
    points: [
      t('Left (Ida, chandra nadi): marriage, travel, settling disputes, new clothes. Right (Pingala, surya nadi): harsh acts (gambling, fights) and eating, bathing, business.', 'बाईं (इड़ा, चंद्र नाड़ी): विवाह, यात्रा, विवाद सुलझाना, नए वस्त्र। दाईं (पिंगला, सूर्य नाड़ी): क्रूर कर्म (जुआ, झगड़ा) और भोजन, स्नान, व्यापार।'),
      t('Setting out on important work: leave on the left breath, arrive on the right.', 'महत्वपूर्ण कार्य पर: बाईं श्वास में निकलें, दाईं श्वास में पहुँचें।'),
      t('Male patient: breath and querist both on the right, cure; both left, worse; mixed, cure with difficulty. Reversed for a female patient.', 'पुरुष रोगी: श्वास और प्रश्नकर्ता दोनों दाईं ओर, आरोग्य; दोनों बाईं, रोग बढ़े; मिश्रित, कठिनाई से आरोग्य। स्त्री रोगी के लिए उलटा।'),
      t('Asked while the astrologer breathes in: cure; breathing out: danger to the patient.', 'ज्योतिषी के श्वास लेते समय प्रश्न: आरोग्य; श्वास छोड़ते समय: रोगी को संकट।'),
    ],
  },
  {
    id: 'lagna', title: t('Examining the Lagna', 'लग्न परीक्षा'),
    rows: [
      { term: t('Shirshodaya (3, 5, 6, 7, 8, 11)', 'शीर्षोदय (3, 5, 6, 7, 8, 11)'), tone: 'good', text: t('Favourable; pleasant, hopeful questions.', 'शुभ; सुखद, आशा भरे प्रश्न।') },
      { term: t('Prishtodaya (1, 2, 4, 9, 10)', 'पृष्ठोदय (1, 2, 4, 9, 10)'), tone: 'bad', text: t('Obstacles, failure with a malefic aspect; questions of misery.', 'बाधाएँ, पाप दृष्टि से असफलता; दुख के प्रश्न।') },
      { term: t('Ubhayodaya (12)', 'उभयोदय (12)'), tone: 'mixed', text: t('Almost as good as shirshodaya, with more effort.', 'लगभग शीर्षोदय जैसा, अधिक प्रयास से।') },
      { term: t('Movable', 'चर'), text: t('The situation changes.', 'स्थिति बदलती है।') },
      { term: t('Fixed', 'स्थिर'), text: t('Status quo; a rigid querist. Good for jobs and buying a house.', 'यथास्थिति; दृढ़ स्वभाव का प्रश्नकर्ता। नौकरी, घर खरीदने के लिए शुभ।') },
      { term: t('Dual', 'द्विस्वभाव'), text: t('Delay and effort; 0–15° acts fixed, 15–30° acts movable.', 'विलंब और प्रयास; 0–15° स्थिर जैसा, 15–30° चर जैसा।') },
    ],
    points: [
      t('The question decides the reading. "Will the patient recover?" movable yes, fixed no. "Will the patient die?" fixed no, movable yes.', 'प्रश्न ही फल तय करता है। "रोगी ठीक होगा?" चर हाँ, स्थिर नहीं। "रोगी मरेगा?" स्थिर नहीं, चर हाँ।'),
      t('A planet turning stationary (direct to retrograde or back) also shows status quo in its matters.', 'स्तंभित होता ग्रह (मार्गी से वक्री या उलटा) भी अपने विषयों में यथास्थिति दिखाता है।'),
      t('Benefic in the Lagna is good; in disputes a malefic there is wanted, since a benefic aspects and strengthens the 7th (the opponent).', 'लग्न में शुभ ग्रह अच्छा; विवाद में वहाँ पाप ग्रह चाहिए, क्योंकि शुभ ग्रह सप्तम (विरोधी) को दृष्टि से बल देता है।'),
    ],
  },
  {
    id: 'link', title: t('Lagnesh and karyesh', 'लग्नेश और कार्येश'),
    intro: t('Karya siddhi needs the Lagna lord and the lord of the matter\'s house linked by any of:', 'कार्य सिद्धि के लिए लग्नेश और कार्य भाव के स्वामी का इनमें से किसी प्रकार संबंध चाहिए:'),
    points: [
      t('Both in the Lagna, or both in the karya bhava.', 'दोनों लग्न में, या दोनों कार्य भाव में।'),
      t('Exchange: lagnesh in the karya bhava, karyesh in the Lagna.', 'परिवर्तन: लग्नेश कार्य भाव में, कार्येश लग्न में।'),
      t('Lagnesh aspects the Lagna and karyesh its own house.', 'लग्नेश लग्न को और कार्येश अपने भाव को देखे।'),
      t('Karyesh in the Lagna aspects lagnesh; or lagnesh in the karya bhava aspects karyesh.', 'लग्न में कार्येश लग्नेश को देखे; या कार्य भाव में लग्नेश कार्येश को देखे।'),
      t('Lagnesh aspects the karya bhava and karyesh the Lagna; or the two in mutual aspect.', 'लग्नेश कार्य भाव को और कार्येश लग्न को देखे; या दोनों परस्पर दृष्टि में।'),
      t('Linked by the closest Tajika aspect.', 'निकटतम ताजिक दृष्टि से संबंध।'),
      t('Any of these joined by the Moon: success is certain.', 'इनमें से कोई भी चंद्र से जुड़ जाए: सफलता निश्चित।'),
    ],
  },
  {
    id: 'success', title: t('Signs of success', 'सफलता के योग'),
    intro: t('First learn what the querist actually wants (mook prashna, or ask). Then:', 'पहले जानें प्रश्नकर्ता वास्तव में क्या चाहता है (मूक प्रश्न से, या पूछकर)। फिर:'),
    points: [
      t('Shirshodaya or upward-looking (urdhvamukha) Lagna.', 'शीर्षोदय या ऊर्ध्वमुख लग्न।'),
      t('Lagna, Lagna lord and Moon strong and well placed; the Lagna occupied or aspected by its lord or benefics.', 'लग्न, लग्नेश और चंद्र बली और शुभ स्थान में; लग्न में उसका स्वामी या शुभ ग्रह, या उनकी दृष्टि।'),
      t('Benefics in kendras and trikonas; malefics in 3, 6, 11; 8th and 12th free of malefics.', 'केंद्र-त्रिकोण में शुभ ग्रह; 3, 6, 11 में पाप ग्रह; 8वाँ और 12वाँ पाप रहित।'),
      t('Judge each house the same way from itself: its lord on it, benefics in kendras and trikonas from it.', 'हर भाव को उसी से ऐसे ही देखें: उसका स्वामी उस पर, उससे केंद्र-त्रिकोण में शुभ ग्रह।'),
      t('Shubha kartari: a lord or house hemmed by benefics.', 'शुभ कर्तरी: स्वामी या भाव शुभ ग्रहों के बीच।'),
      t('Benefics in 3, 5, 7, 11; any planet in the 11th; benefics in biped signs (3, 6, 7, 11); benefics in the 6th.', '3, 5, 7, 11 में शुभ ग्रह; 11वें में कोई भी ग्रह; द्विपद राशियों (3, 6, 7, 11) में शुभ ग्रह; 6ठे में शुभ ग्रह।'),
      t('Benefics in 7 or 10 for appointments; in 1, 2, 5 for honour and wealth.', 'नियुक्ति के लिए 7 या 10 में शुभ ग्रह; मान और धन के लिए 1, 2, 5 में।'),
      t('An aspect counts more than placement when the degrees are close.', 'अंश निकट हों तो स्थान से अधिक दृष्टि का बल।'),
      t('Favourable panchang.', 'शुभ पंचांग।'),
    ],
  },
  {
    id: 'failure', title: t('Signs of failure', 'असफलता के योग'),
    points: [
      t('Prishtodaya Lagna, especially aspected by a malefic; a sideways or downward-looking Lagna not helped by its lord or benefics.', 'पृष्ठोदय लग्न, विशेषकर पाप दृष्टि हो; तिर्यङ्मुख या अधोमुख लग्न जिसे स्वामी या शुभ ग्रह का सहारा न हो।'),
      t('Weak Lagna, Lagna lord and Moon.', 'दुर्बल लग्न, लग्नेश और चंद्र।'),
      t('Lagna lord in 6, 8, 12, or the 6/8/12 lords in the Lagna; the dispositor of the Lagna lord or Moon in 6, 8, 12. Apply the same to every house.', 'लग्नेश 6, 8, 12 में, या 6/8/12 के स्वामी लग्न में; लग्नेश या चंद्र का राशि-स्वामी 6, 8, 12 में। हर भाव पर यही लागू करें।'),
      t('Malefics in kendras and trikonas, or touching the 8th and 12th.', 'केंद्र-त्रिकोण में पाप ग्रह, या 8वें और 12वें पर पाप प्रभाव।'),
      t('Paapa kartari: Lagna, lagnesh, karya bhava or karyesh hemmed by malefics.', 'पाप कर्तरी: लग्न, लग्नेश, कार्य भाव या कार्येश पाप ग्रहों के बीच।'),
      t('A debilitated, combust or inimical planet spoils the house it sits in and the houses it rules.', 'नीच, अस्त या शत्रु राशि का ग्रह जिस भाव में बैठे और जिनका स्वामी हो, उन्हें बिगाड़ता है।'),
      t('A planet defeated in planetary war (within 1°; by this text the lesser longitude wins).', 'ग्रह युद्ध में पराजित ग्रह (1° के भीतर; इस ग्रंथ के अनुसार कम भोगांश जीतता है)।'),
      t('A planet in the 7th from its exaltation, moolatrikona or own sign is weak where it sits.', 'अपनी उच्च, मूलत्रिकोण या स्वराशि से सातवें में ग्रह जहाँ बैठा वहाँ दुर्बल।'),
      t('Moon in the prashna Lagna.', 'प्रश्न लग्न में चंद्र।'),
      t('Rising or Arudha Lagna in the 8th from the birth Lagna; prashna Moon in the 8th from the natal Moon.', 'उदय या आरूढ़ लग्न जन्म लग्न से 8वें; प्रश्न का चंद्र जन्म चंद्र से 8वें।'),
      t('No link between lagnesh and karyesh.', 'लग्नेश और कार्येश में कोई संबंध नहीं।'),
      t('Close aspect of the lagnesh or karyesh with a retrograde planet cancels the event; a retrograde aspect on the Lagna brings hindrance.', 'लग्नेश या कार्येश की वक्री ग्रह से निकट दृष्टि घटना रद्द करती है; लग्न पर वक्री दृष्टि से अड़चन।'),
      t('Unfavourable panchang.', 'अशुभ पंचांग।'),
    ],
  },
  {
    id: 'retro', title: t('Retrograde planets', 'वक्री ग्रह'),
    intro: t('A retrograde planet related to the lagnesh, karyesh or a house lord (see also Rudda yoga):', 'लग्नेश, कार्येश या भावेश से संबंधित वक्री ग्रह (रुद्द योग भी देखें):'),
    rows: [
      { term: t('Benefic, lord of a good house', 'शुभ, शुभ भाव का स्वामी'), tone: 'good', text: t('A repeated step (another interview), then success.', 'प्रक्रिया दोहराई जाती है (फिर साक्षात्कार), फिर सफलता।') },
      { term: t('Malefic, lord of a good house', 'पाप, शुभ भाव का स्वामी'), tone: 'mixed', text: t('Repetition with obstacles and tension, yet success.', 'बाधा और तनाव के साथ दोहराव, फिर भी सफलता।') },
      { term: t('Benefic, lord of 6, 8 or 12', 'शुभ, 6, 8 या 12 का स्वामी'), tone: 'mixed', text: t('Repetition; success doubtful.', 'दोहराव; सफलता संदिग्ध।') },
      { term: t('Malefic, lord of 6, 8 or 12', 'पाप, 6, 8 या 12 का स्वामी'), tone: 'bad', text: t('Tension, obstacles, the event cancelled.', 'तनाव, बाधाएँ, घटना रद्द।') },
    ],
  },
  {
    id: 'more', title: t('Other points', 'अन्य बातें'),
    points: [
      t('Spot the axis of trouble (say 5/11 or 4/10) afflicted by malefics or inimical aspect.', 'संकट की धुरी पहचानें (जैसे 5/11 या 4/10) जिस पर पाप ग्रह या शत्रु दृष्टि हो।'),
      t('A planet that has just entered a sign starts its results (trouble lasts while it stays); one in the last degrees is finishing them.', 'अभी राशि में आया ग्रह अपना फल आरंभ करता है (कष्ट तब तक रहता है); अंतिम अंशों का ग्रह फल समाप्त कर रहा है।'),
      t('Read the chart again from the karya bhava as Lagna.', 'कार्य भाव को लग्न मानकर कुंडली फिर पढ़ें।'),
      t('Close degrees between planets tie them even without a Tajika aspect (nakta, yamaya); they also give timing.', 'ग्रहों के निकट अंश ताजिक दृष्टि के बिना भी जोड़ते हैं (नक्त, यमया); इनसे समय भी मिलता है।'),
      t('Rahu or Ketu with the lagnesh or karyesh, by sign or close degree: generally failure.', 'लग्नेश या कार्येश के साथ राहु या केतु, राशि या निकट अंश से: सामान्यतः असफलता।'),
      t('Use the nakshatra lord of each planet and the Lagna; ignoring nakshatras is reading a body without the soul.', 'हर ग्रह और लग्न के नक्षत्र स्वामी को देखें; नक्षत्र छोड़ना आत्मा के बिना शरीर पढ़ना है।'),
    ],
  },
  {
    id: 'sutras', title: t('Jeeva, Roga and Mrityu sutras', 'जीव, रोग और मृत्यु सूत्र'),
    intro: t('From Prashna Marga. In illness they mean recovery, suffering and death; in other queries success, obstacles and failure.', 'प्रश्न मार्ग से। रोग में इनका अर्थ आरोग्य, कष्ट और मृत्यु; अन्य प्रश्नों में सफलता, बाधा और असफलता।'),
    rows: [
      { term: t('Samanya', 'सामान्य'), text: t('Rising and Arudha Lagna: both movable or fixed+dual = jeeva; both fixed or movable+dual = mrityu; both dual or movable+fixed = roga. Past.', 'उदय और आरूढ़ लग्न: दोनों चर या स्थिर+द्विस्वभाव = जीव; दोनों स्थिर या चर+द्विस्वभाव = मृत्यु; दोनों द्विस्वभाव या चर+स्थिर = रोग। भूत।') },
      { term: t('Adhipati', 'अधिपति'), text: t('Their lords by panchadha maitri: friend+friend or friend+neutral = jeeva; neutral+neutral or friend+enemy = roga; enemy+enemy or enemy+neutral = mrityu. Present.', 'उनके स्वामी पंचधा मैत्री से: मित्र+मित्र या मित्र+सम = जीव; सम+सम या मित्र+शत्रु = रोग; शत्रु+शत्रु या शत्रु+सम = मृत्यु। वर्तमान।') },
      { term: t('Navamsha', 'नवांश'), text: t('Lords of the navamsha Lagna and the Arudha\'s navamsha sign (from the number 1–108), as adhipati. Future.', 'नवांश लग्न और आरूढ़ की नवांश राशि (1–108 संख्या से) के स्वामी, अधिपति की तरह। भविष्य।') },
      { term: t('Nakshatra', 'नक्षत्र'), text: t('Count from the Lagna nakshatra to the birth nakshatra, divide by 3: 1 jeeva, 2 roga, 0 mrityu. Present.', 'लग्न नक्षत्र से जन्म नक्षत्र तक गिनें, 3 से भाग दें: 1 जीव, 2 रोग, 0 मृत्यु। वर्तमान।') },
      { term: t('Maha', 'महा'), text: t('Arudha sign and the 10th from it: both nocturnal = jeeva (only Aries, Cancer); both diurnal = mrityu (only Scorpio, Aquarius); mixed = roga. Future.', 'आरूढ़ राशि और उससे दशम: दोनों रात्रि-बली = जीव (केवल मेष, कर्क); दोनों दिवा-बली = मृत्यु (केवल वृश्चिक, कुंभ); मिश्रित = रोग। भविष्य।') },
    ],
    points: [t('In longevity samanya reads purnayu, alpayu and madhyayu for jeeva, mrityu and roga.', 'आयु में सामान्य सूत्र जीव, मृत्यु और रोग के लिए पूर्णायु, अल्पायु और मध्यायु।')],
  },
]

export interface PrincipleSectionText {
  id: string
  title: string
  intro?: string
  rows?: Array<{ term: string; text: string; tone?: PrincipleTone }>
  points?: string[]
}

export function principlesEssentials(lang: EngineLang = 'en'): PrincipleSectionText[] {
  const p = (x: T) => (lang === 'hi' ? x.hi : x.en)
  return PRINCIPLE_SECTIONS.map(s => ({
    id: s.id,
    title: p(s.title),
    ...(s.intro ? { intro: p(s.intro) } : {}),
    ...(s.rows ? { rows: s.rows.map(r => ({ term: p(r.term), text: p(r.text), ...(r.tone ? { tone: r.tone } : {}) })) } : {}),
    ...(s.points ? { points: s.points.map(p) } : {}),
  }))
}

// ── Principles for one question (karya bhava) ───────────────

export interface KaryaInput {
  ascRashi: Rashi
  grahas: GrahaData[]
}

const KENDRA_TRIKONA = [1, 4, 5, 7, 9, 10]
const lordsOf = (g: GrahaId): Rashi[] => SIGNS_ALL.filter(r => lordOf(r) === g)
const SIGNS_ALL = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as Rashi[]

/**
 * The chapter's rules read for one matter: how the lagnesh and karyesh are
 * linked (the ten combinations), the Moon joining them, retrograde planets
 * on them (the four-way table), Rahu / Ketu, kartari, and the karya bhava
 * judged from itself. Only what is present in the chart is returned.
 */
export function karyaPrinciples(c: KaryaInput, karyaHouse: number, lang: EngineLang = 'en'): PrincipleReading[] {
  const hi = lang === 'hi'
  const out: PrincipleReading[] = []
  const G = new Map(c.grahas.map(g => [g.id, g]))
  const asc = c.ascRashi
  const karya = nth(asc, karyaHouse)
  const L = lordOf(asc)
  const K = lordOf(karya)
  const lg = G.get(L)
  const kg = G.get(K)
  if (!lg || !kg) return out
  const n = (g: GrahaId) => gN(g, lang)
  const asp = (g: GrahaData, target: Rashi) => g.rashi !== target && hasParasharaAspect(g.rashi, g.id, target)
  const hN = (h: number) => (hi ? `${h}वें` : `${h}${h === 1 ? 'st' : h === 2 ? 'nd' : h === 3 ? 'rd' : 'th'}`)

  // 1. Lagnesh–karyesh link
  const links: string[] = []
  if (karyaHouse === 1 || L === K) {
    links.push(hi ? `एक ही ग्रह (${n(L)}) लग्न और कार्य भाव का स्वामी` : `one planet (${n(L)}) rules both the Lagna and the karya bhava`)
  } else {
    if (lg.rashi === asc && kg.rashi === asc) links.push(hi ? 'दोनों लग्न में' : 'both in the Lagna')
    if (lg.rashi === karya && kg.rashi === karya) links.push(hi ? 'दोनों कार्य भाव में' : 'both in the karya bhava')
    if (lg.rashi === karya && kg.rashi === asc) links.push(hi ? 'परिवर्तन: लग्नेश कार्य भाव में, कार्येश लग्न में' : 'exchange: lagnesh in the karya bhava, karyesh in the Lagna')
    if ((lg.rashi === asc || asp(lg, asc)) && (kg.rashi === karya || asp(kg, karya)) && !(lg.rashi === asc && kg.rashi === karya)) links.push(hi ? 'लग्नेश लग्न को और कार्येश अपने भाव को देखता है' : 'lagnesh aspects the Lagna and karyesh its own house')
    if (kg.rashi === asc && asp(kg, lg.rashi)) links.push(hi ? 'लग्न में बैठा कार्येश लग्नेश को देखता है' : 'karyesh in the Lagna aspects lagnesh')
    if (lg.rashi === karya && asp(lg, kg.rashi)) links.push(hi ? 'कार्य भाव में बैठा लग्नेश कार्येश को देखता है' : 'lagnesh in the karya bhava aspects karyesh')
    if (asp(lg, karya) && asp(kg, asc)) links.push(hi ? 'लग्नेश कार्य भाव को और कार्येश लग्न को देखता है' : 'lagnesh aspects the karya bhava and karyesh the Lagna')
    if (asp(lg, kg.rashi) && asp(kg, lg.rashi)) links.push(hi ? 'लग्नेश और कार्येश परस्पर दृष्टि में' : 'lagnesh and karyesh in mutual aspect')
    if (lg.rashi === kg.rashi) links.push(hi ? 'लग्नेश और कार्येश एक ही राशि में' : 'lagnesh and karyesh together in one sign')
    const tl = tajikaLink(lg, kg)
    if (tl.type !== 'none') links.push(hi ? `ताजिक ${tl.type === 'ithasala' ? 'इत्थशाल' : 'ईसराफ़'} (${tl.gap}°)` : `Tajika ${tl.type} (${tl.gap}°)`)
  }
  if (links.length) {
    const mo = G.get('Mo')
    const moonJoins = !!mo && L !== 'Mo' && K !== 'Mo' && [lg, kg].some(g => mo.rashi === g.rashi || asp(mo, g.rashi) || tajikaLink(mo, g).type === 'ithasala')
    out.push({ id: 'link', tone: 'good', text: hi
      ? `लग्नेश ${n(L)} और कार्येश ${n(K)} जुड़े हैं: ${links.join('; ')}। कार्य सिद्धि संभव।`
      : `Lagnesh ${n(L)} and karyesh ${n(K)} are linked: ${links.join('; ')}. Karya siddhi is possible.` })
    if (moonJoins) out.push({ id: 'link-moon', tone: 'good', text: hi ? 'चंद्र भी इनसे जुड़ा है: सफलता निश्चित।' : 'The Moon joins them too: success is certain.' })
  } else {
    out.push({ id: 'no-link', tone: 'bad', text: hi
      ? `लग्नेश ${n(L)} और कार्येश ${n(K)} में कोई संबंध नहीं: कार्य सिद्धि संभव नहीं।`
      : `No link between lagnesh ${n(L)} and karyesh ${n(K)}: karya siddhi is not possible.` })
  }

  // 2. Karya bhava judged from itself
  if (karyaHouse !== 1) {
    const kFrom = houseFrom(karya, kg.rashi)
    if (kg.rashi === karya || asp(kg, karya)) out.push({ id: 'karyesh-own', tone: 'good', text: hi ? `कार्येश ${n(K)} अपने भाव में या उसे देखता है: उस भाव को बल।` : `Karyesh ${n(K)} occupies or aspects its own house: strength to the matter.` })
    if ([6, 8, 12].includes(kFrom)) out.push({ id: 'karyesh-dusthana', tone: 'bad', text: hi ? `कार्येश ${n(K)} कार्य भाव से ${hN(kFrom)} में: उस विषय के लिए अशुभ।` : `Karyesh ${n(K)} is ${hN(kFrom)} from the karya bhava: unfavourable for the matter.` })
    const dustIn = [...new Set([6, 8, 12].map(h => lordOf(nth(karya, h))))].filter(g => g !== K && G.get(g)?.rashi === karya)
    if (dustIn.length) out.push({ id: 'dusthana-in-karya', tone: 'bad', text: hi ? `कार्य भाव से 6/8/12 के स्वामी (${list(dustIn, lang)}) कार्य भाव में: अशुभ।` : `Lords of 6, 8 or 12 from the karya bhava (${list(dustIn, lang)}) sit in it: unfavourable.` })
    const fromK = (set: Set<GrahaId>) => c.grahas.filter(g => set.has(g.id) && KENDRA_TRIKONA.includes(houseFrom(karya, g.rashi))).map(g => g.id)
    const b = fromK(new Set(['Ju', 'Ve', 'Me']))
    const m = fromK(new Set(['Su', 'Ma', 'Sa', 'Ra', 'Ke']))
    if (b.length) out.push({ id: 'karya-benefics', tone: 'good', text: hi ? `कार्य भाव से केंद्र/त्रिकोण में शुभ ग्रह (${list(b, lang)}): उस विषय के लिए शुभ।` : `Benefics in kendras or trikonas from the karya bhava (${list(b, lang)}): good for the matter.` })
    if (m.length) out.push({ id: 'karya-malefics', tone: 'bad', text: hi ? `कार्य भाव से केंद्र/त्रिकोण में पाप ग्रह (${list(m, lang)}): उस विषय को कष्ट।` : `Malefics in kendras or trikonas from the karya bhava (${list(m, lang)}): trouble for the matter.` })
  }

  // 3. Kartari on the Lagna, lagnesh, karya bhava, karyesh
  const hemmed = (sign: Rashi, set: Set<GrahaId>) =>
    c.grahas.some(g => set.has(g.id) && g.rashi === nth(sign, 12)) && c.grahas.some(g => set.has(g.id) && g.rashi === nth(sign, 2))
  const MAL = new Set<GrahaId>(['Su', 'Ma', 'Sa', 'Ra', 'Ke'])
  const BEN = new Set<GrahaId>(['Ju', 'Ve', 'Me'])
  const targets: Array<[string, string, Rashi]> = [
    ['lagna', hi ? 'लग्न' : 'the Lagna', asc],
    ['lagnesh', hi ? `लग्नेश ${n(L)}` : `lagnesh ${n(L)}`, lg.rashi],
    ...(karyaHouse !== 1 ? [['karya', hi ? 'कार्य भाव' : 'the karya bhava', karya] as [string, string, Rashi], ['karyesh', hi ? `कार्येश ${n(K)}` : `karyesh ${n(K)}`, kg.rashi] as [string, string, Rashi]] : []),
  ]
  const paap = targets.filter(([, , s]) => hemmed(s, MAL)).map(([, l]) => l)
  const shubh = targets.filter(([, , s]) => hemmed(s, BEN)).map(([, l]) => l)
  if (paap.length) out.push({ id: 'paap-kartari', tone: 'bad', text: hi ? `पाप कर्तरी (${paap.join(', ')}): असफलता की ओर।` : `Paapa kartari on ${paap.join(', ')}: tends to failure.` })
  if (shubh.length) out.push({ id: 'shubh-kartari', tone: 'good', text: hi ? `शुभ कर्तरी (${shubh.join(', ')}): बल और शुभ फल।` : `Shubha kartari on ${shubh.join(', ')}: strength and good results.` })

  // 4. Retrograde planets on the lagnesh or karyesh (the four-way table)
  for (const r of c.grahas) {
    if (!r.isRetro || r.id === 'Ra' || r.id === 'Ke' || !SEVEN.includes(r.id)) continue
    const hits = [lg, kg].filter((g, i, a) => a.indexOf(g) === i).filter(g => g.id === r.id || tajikaLink(r, g).type !== 'none')
    if (!hits.length) continue
    const benefic = BENEFICS.has(r.id)
    const dust = lordsOf(r.id).some(s => [6, 8, 12].includes(houseFrom(asc, s)))
    const who = hits.map(g => (g.id === L ? (hi ? 'लग्नेश' : 'lagnesh') : (hi ? 'कार्येश' : 'karyesh'))).join(hi ? ' और ' : ' and ')
    const self = hits.some(g => g.id === r.id)
    const lead = hi
      ? `${n(r.id)} वक्री${self ? ` (स्वयं ${who})` : `, ${who} से निकट ताजिक दृष्टि`}, ${benefic ? 'शुभ' : 'पाप'} ग्रह, ${dust ? '6/8/12 का स्वामी' : 'शुभ भाव का स्वामी'}:`
      : `${n(r.id)} retrograde${self ? ` (it is the ${who})` : `, in close Tajika aspect with the ${who}`}, a ${benefic ? 'benefic' : 'malefic'} ruling ${dust ? 'a 6th, 8th or 12th house' : 'good houses'}:`
    const [tone, en, hiT]: [PrincipleTone, string, string] = benefic && !dust
      ? ['good', 'a step is repeated, then success.', 'प्रक्रिया दोहराई जाएगी, फिर सफलता।']
      : !benefic && !dust
        ? ['mixed', 'repetition with obstacles and tension, yet success.', 'बाधा और तनाव के साथ दोहराव, फिर भी सफलता।']
        : benefic
          ? ['mixed', 'repetition; success doubtful.', 'दोहराव; सफलता संदिग्ध।']
          : ['bad', 'tension, obstacles, the event may be cancelled.', 'तनाव, बाधाएँ, घटना रद्द हो सकती है।']
    out.push({ id: `retro-${r.id}`, tone, text: `${lead} ${hi ? hiT : en}` })
  }

  // 5. Rahu / Ketu with the lagnesh or karyesh
  for (const node of ['Ra', 'Ke'] as GrahaId[]) {
    const ng = G.get(node)
    if (!ng) continue
    const with_ = [lg, kg].filter((g, i, a) => a.indexOf(g) === i).filter(g => g.rashi === ng.rashi)
    if (with_.length) out.push({ id: `node-${node}`, tone: 'bad', text: hi
      ? `${n(node)} ${with_.map(g => n(g.id)).join(' और ')} के साथ (${with_.map(g => (g.id === L ? 'लग्नेश' : 'कार्येश')).join(', ')}): सामान्यतः अशुभ, असफलता की ओर।`
      : `${n(node)} with ${with_.map(g => `${n(g.id)} (${g.id === L ? 'lagnesh' : 'karyesh'})`).join(' and ')}: generally unfavourable, tends to failure.` })
  }

  return out
}
