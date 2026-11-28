// ─────────────────────────────────────────────────────────────
//  src/lib/engine/prashnaMook.ts
//  Mook (silent) and mushti (closed fist) praśna, from the book chapter
//  "Mook and Mushti Prashna" (docs/research/prashna-6-extract.md).
//  Reads the cast chart for: what the unspoken question is about
//  (dhatu / mula / jeeva and the house of the matter), the person in
//  question (age, relation), how many queries, pleasant or not, and the
//  article in a closed fist (nature, kind, shape, colour). Pure.
// ─────────────────────────────────────────────────────────────

import type { Dignity, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, NAKSHATRA_NAMES, RASHI_NAMES } from '@/types/astrology'
import { GRAHA_HI, NAKSHATRA_HI, RASHI_HI } from '@/i18n/jyotish'
import type { EngineLang } from './lang'
import { hasParasharaAspect } from './aspects'
import { TAJIKA_SEVEN, tajikaLink } from './tajika'
import { navamshaInSign } from './prashnaRashiEssentials'

type T = { en: string; hi: string }
const t = (en: string, hi: string): T => ({ en, hi })

export type MookKind = 'dhatu' | 'mula' | 'jeeva'
export type MookTone = 'good' | 'mixed' | 'bad' | 'neutral'
export interface MookItem { id: string; text: string; tone?: MookTone; kind?: MookKind | 'mixed'; house?: number }
export interface MookGroup { id: string; title: string; items: MookItem[] }

const SIGN_LORD: GrahaId[] = ['Ma', 'Ve', 'Me', 'Mo', 'Su', 'Me', 'Ve', 'Ma', 'Ju', 'Sa', 'Sa', 'Ju']
const lordOf = (r: Rashi): GrahaId => SIGN_LORD[r - 1]
const houseFrom = (from: Rashi, sign: Rashi) => ((sign - from + 12) % 12) + 1
const nth = (from: Rashi, n: number): Rashi => (((from - 1 + n - 1) % 12) + 1) as Rashi
const NAK_LORDS: GrahaId[] = ['Ke', 'Ve', 'Su', 'Mo', 'Ma', 'Ra', 'Ju', 'Sa', 'Me']
export const nakshatraLord = (index: number): GrahaId => NAK_LORDS[((index % 27) + 27) % 27 % 9]

const MALEFICS = new Set<GrahaId>(['Su', 'Ma', 'Sa', 'Ra', 'Ke'])
const BENEFICS = new Set<GrahaId>(['Ju', 'Ve', 'Me', 'Mo'])
const NINE: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']
const KENDRA = [1, 4, 7, 10]
const DIG: Partial<Record<GrahaId, number>> = { Su: 10, Ma: 10, Mo: 4, Ve: 4, Sa: 7, Ju: 1, Me: 1 }
const EXALT: Partial<Record<GrahaId, Rashi>> = { Su: 1, Mo: 2, Ma: 10, Me: 6, Ju: 4, Ve: 12, Sa: 7 }
const DIGNITY_SCORE: Record<Dignity, number> = { exalted: 3, moolatrikona: 2.5, own: 2, great_friend: 1, friend: 0.5, neutral: 0, enemy: -0.5, great_enemy: -1, debilitated: -2 }

const KIND_T: Record<MookKind | 'mixed', T> = {
  dhatu: t('dhatu (metal, mineral)', 'धातु (धातु, खनिज)'),
  mula: t('mula (vegetation, roots, wood)', 'मूल (वनस्पति, जड़, लकड़ी)'),
  jeeva: t('jeeva (a living being)', 'जीव (कोई जीवित प्राणी)'),
  mixed: t('mixed dhatu + mula', 'मिश्रित धातु + मूल'),
}
export const kindLabel = (k: MookKind | 'mixed', lang: EngineLang = 'en') => (lang === 'hi' ? KIND_T[k].hi : KIND_T[k].en)

/** What the house of the matter covers, short form (the chapter's "strong planet in a house" table). */
const HOUSE_T: T[] = [
  t('self, or someone like or close to him', 'स्वयं, या उस जैसा या उसके निकट कोई'),
  t('relations other than close family', 'निकट परिवार के अलावा संबंधी'),
  t('younger brother, co-borns', 'छोटा भाई, सहोदर'),
  t('mother or sister', 'माता या बहन'),
  t('children', 'संतान'),
  t('an enemy', 'शत्रु'),
  t('wife', 'पत्नी'),
  t('a question of life and death', 'जीवन-मृत्यु का प्रश्न'),
  t('father, religion, fate', 'पिता, धर्म, भाग्य'),
  t('preceptor, profession, karma', 'गुरु, व्यवसाय, कर्म'),
  t('elder co-borns', 'बड़े भाई-बहन'),
  t('opponents of enemies', 'शत्रुओं के विरोधी'),
]

export interface MookChart {
  ascRashi: Rashi
  /** Sidereal ascendant, 0–360. */
  ascDegree: number
  grahas: GrahaData[]
  /** Navamsha sign of each planet. */
  d9?: Partial<Record<GrahaId, Rashi>>
}

const N = (g: GrahaId, lang: EngineLang) => (lang === 'hi' ? GRAHA_HI[g] ?? g : GRAHA_NAMES[g] ?? g)
const S = (r: Rashi, lang: EngineLang) => (lang === 'hi' ? RASHI_HI[r] : RASHI_NAMES[r])
const P = (x: T, lang: EngineLang) => (lang === 'hi' ? x.hi : x.en)
const list = (ids: GrahaId[], lang: EngineLang) => ids.map(g => N(g, lang)).join(', ')
const hN = (h: number, lang: EngineLang) => (lang === 'hi' ? `${h}वाँ भाव` : `house ${h}`)

/** A planet that moves backwards enters a sign at 29° and leaves it at 0°. */
export function signEntry(g: Pick<GrahaData, 'degree' | 'isRetro'>): 'entered' | 'leaving' | null {
  const early = g.degree < 1, late = g.degree >= 29
  if (!early && !late) return null
  return (early !== g.isRetro) ? 'entered' : 'leaving'
}

/** Strength as the chapter judges it: exaltation, own sign, moolatrikona, digbala and navamsha. */
export function mookStrength(g: GrahaData, asc: Rashi, d9?: Rashi): number {
  let s = DIGNITY_SCORE[g.dignity] ?? 0
  if (DIG[g.id] === houseFrom(asc, g.rashi)) s += 1
  if (d9) {
    if (lordOf(d9) === g.id || EXALT[g.id] === d9) s += 1
    if (d9 === g.rashi) s += 0.5
  }
  if (g.isCombust) s -= 1
  return Math.round(s * 10) / 10
}

/** How strongly a planet bears on the Lagna: in it, or by full aspect, closer by degree. */
function lagnaInfluence(g: GrahaData, asc: Rashi, ascDeg: number): number {
  const close = Math.abs(g.degree - ascDeg) <= 5 ? 1 : 0
  if (g.rashi === asc) return 2 + close
  if (hasParasharaAspect(g.rashi, g.id, asc)) return 1 + close
  return 0
}

export interface MookReading {
  groups: MookGroup[]
  /** Votes for dhatu / mula / jeeva across the classical tests. */
  tally: Record<MookKind, number>
  /** Houses pointed to as the matter, with how many tests point there. */
  houses: Array<{ house: number; votes: number; topic: string }>
  /** The strongest planet by the chapter's test. */
  strongest: GrahaId
}

export function readMook(c: MookChart, lang: EngineLang = 'en'): MookReading {
  const hi = lang === 'hi'
  const asc = c.ascRashi
  const ascDeg = ((c.ascDegree % 30) + 30) % 30
  const G = new Map(c.grahas.filter(g => NINE.includes(g.id)).map(g => [g.id, g]))
  const nine = NINE.map(id => G.get(id)).filter((g): g is GrahaData => !!g)
  const house = (g: GrahaData) => houseFrom(asc, g.rashi)
  const strength = new Map(nine.map(g => [g.id, mookStrength(g, asc, c.d9?.[g.id])]))
  const st = (id: GrahaId) => strength.get(id) ?? -9
  const strongest = [...nine].filter(g => g.id !== 'Ra' && g.id !== 'Ke').sort((a, b) => st(b.id) - st(a.id))[0]?.id ?? 'Su'
  const lordsOf = (g: GrahaId) => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].filter(h => lordOf(nth(asc, h)) === g)
  const tally: Record<MookKind, number> = { dhatu: 0, mula: 0, jeeva: 0 }
  const votes = new Map<number, number>()
  const vote = (h: number) => votes.set(h, (votes.get(h) ?? 0) + 1)
  const groups: MookGroup[] = []

  // ── 1. Dhatu, mula or jeeva (classical) ──
  const kind: MookItem[] = []
  const addKind = (id: string, k: MookKind | 'mixed', text: string) => {
    if (k !== 'mixed') tally[k]++
    kind.push({ id, kind: k, text })
  }
  const ll = lordOf(asc)
  const llG = G.get(ll)
  const signKind: MookKind = [1, 5, 8].includes(asc) ? 'dhatu' : [3, 6, 10, 11].includes(asc) ? 'mula' : 'jeeva'
  if (llG && (llG.rashi === asc || hasParasharaAspect(llG.rashi, ll, asc))) addKind('sign-lord', signKind, hi
    ? `${S(asc, lang)} लग्न पर उसका स्वामी ${N(ll, lang)} (युति या दृष्टि): ${kindLabel(signKind, lang)} चिंता।`
    : `${S(asc, lang)} rising, joined or aspected by its lord ${N(ll, lang)}: ${kindLabel(signKind, lang)} chinta.`)
  const nav = navamshaInSign(ascDeg)
  const odd = asc % 2 === 1
  const navKind: MookKind = [1, 4, 7].includes(nav) ? (odd ? 'dhatu' : 'jeeva') : [2, 5, 8].includes(nav) ? 'mula' : (odd ? 'jeeva' : 'dhatu')
  addKind('navamsha', navKind, hi
    ? `${odd ? 'विषम' : 'सम'} राशि, ${nav}वाँ नवांश उदित: ${kindLabel(navKind, lang)}।`
    : `${odd ? 'Odd' : 'Even'} sign rising in its navamsha ${nav}: ${kindLabel(navKind, lang)}.`)
  const drek = ascDeg < 10 ? 1 : ascDeg < 20 ? 2 : 3
  const drekKind: MookKind = (['dhatu', 'mula', 'jeeva'] as const)[drek - 1]
  addKind('drekkana', drekKind, hi ? `${drek}वाँ द्रेष्काण उदित: ${kindLabel(drekKind, lang)}।` : `Drekkana ${drek} rising: ${kindLabel(drekKind, lang)}.`)
  const nakIdx = Math.floor((((c.ascDegree % 360) + 360) % 360) / (360 / 27))
  const nakKind: MookKind = (['dhatu', 'mula', 'jeeva'] as const)[nakIdx % 3]
  const nakName = hi ? NAKSHATRA_HI[nakIdx] : NAKSHATRA_NAMES[nakIdx]
  addKind('nakshatra', nakKind, hi
    ? `लग्न ${nakName} नक्षत्र में: ${kindLabel(nakKind, lang)} (${['कर्म', 'भोग', 'नाश'][nakIdx % 3]})।`
    : `Lagna in ${nakName}: ${kindLabel(nakKind, lang)} (${['karma, action', 'bhog, enjoyment', 'nash, destruction'][nakIdx % 3]}).`)
  const sKind: MookKind = (['dhatu', 'mula', 'jeeva'] as const)[(asc - 1) % 3]
  addKind('sign-cycle', sKind, hi
    ? `राशि चक्र में ${S(asc, lang)}: ${kindLabel(sKind, lang)} (${['कर्म', 'भोग', 'नाश'][(asc - 1) % 3]})।`
    : `${S(asc, lang)} in the sign cycle: ${kindLabel(sKind, lang)} (${['karma', 'bhog', 'nash'][(asc - 1) % 3]}).`)

  // Navamsha of planets aspecting Lagna, 5th or 9th — the strongest decides.
  const ascNavLord = lordOf(navSignOf(asc, nav))
  const navTests = nine.filter(g => g.id !== 'Ra' && g.id !== 'Ke' && c.d9?.[g.id]).filter(g => [1, 5, 9].some(h => g.rashi !== nth(asc, h) && hasParasharaAspect(g.rashi, g.id, nth(asc, h))))
  if (navTests.length) {
    const g = navTests.sort((a, b) => st(b.id) - st(a.id))[0]
    const ownNav = lordOf(c.d9![g.id]!) === g.id
    const aspectsOwn = ascNavLord === g.id
    const k: MookKind | 'mixed' = ownNav && aspectsOwn ? 'dhatu' : !ownNav && aspectsOwn ? 'jeeva' : !ownNav ? 'mula' : 'mixed'
    addKind('planet-navamsha', k, hi
      ? `लग्न/5/9 को देखने वालों में सबसे बली ${N(g.id, lang)}: ${ownNav ? 'अपने' : 'दूसरे के'} नवांश में, ${aspectsOwn ? 'अपने' : 'दूसरे के'} नवांश को देखता: ${kindLabel(k, lang)}।`
      : `Strongest planet aspecting the Lagna, 5th or 9th is ${N(g.id, lang)}: in ${ownNav ? 'its own' : 'another\'s'} navamsha, aspecting ${aspectsOwn ? 'its own' : 'another\'s'} navamsha: ${kindLabel(k, lang)}.`)
  }
  if (asc % 3 === 1 && nav >= 6) kind.push({ id: 'journey', tone: 'neutral', text: hi
    ? `चर लग्न ${nav}वें नवांश में: लंबी यात्रा या लापता व्यक्ति का प्रश्न।`
    : `Movable Lagna in navamsha ${nav}: a long journey or a missing person.` })
  groups.push({ id: 'kind', title: hi ? 'धातु, मूल या जीव' : 'Dhatu, mula or jeeva', items: kind })

  // ── 2. The matter of the question ──
  const matter: MookItem[] = []
  const aspecting = nine.filter(g => g.rashi !== asc && hasParasharaAspect(g.rashi, g.id, asc))
    .map(g => ({ g, gap: Math.abs(g.degree - ascDeg) })).sort((a, b) => a.gap - b.gap)
  for (const { g, gap } of aspecting) {
    const rules = lordsOf(g.id)
    rules.forEach(vote)
    matter.push({ id: `aspect-${g.id}`, house: rules[0], text: hi
      ? `${N(g.id, lang)} लग्न पर पूर्ण दृष्टि${gap <= 5 ? `, निकट अंश (${gap.toFixed(1)}°)` : ''}${rules.length ? `; ${rules.join(', ')}वें भाव का स्वामी` : ''}: प्रश्न इसके कारकत्व और स्वामित्व से।`
      : `${N(g.id, lang)} aspects the Lagna${gap <= 5 ? ` in close degrees (${gap.toFixed(1)}°)` : ''}${rules.length ? `, lord of ${rules.join(', ')}` : ''}: the question is about its significations and lordship.` })
  }
  const inLagna = nine.filter(g => g.rashi === asc)
  if (inLagna.length) matter.push({ id: 'in-lagna', text: hi
    ? `लग्न में ${list(inLagna.map(g => g.id), lang)}: इनके कारकत्व और स्वामित्व भी देखें।`
    : `${list(inLagna.map(g => g.id), lang)} in the Lagna: weigh their significations and lordship too.` })

  const moon = G.get('Mo')
  if (moon) {
    const mh = house(moon)
    const nl = nakshatraLord(moon.nakshatraIndex)
    const nlG = G.get(nl)
    vote(mh)
    if (nlG) vote(house(nlG))
    matter.push({ id: 'moon-nakshatra', house: nlG ? house(nlG) : mh, text: hi
      ? `चंद्र ${mh}वें भाव में; उसका नक्षत्र स्वामी ${N(nl, lang)}${nlG ? ` ${house(nlG)}वें भाव में` : ''}: विषय प्रायः नक्षत्र स्वामी के भाव से।`
      : `The Moon is in house ${mh}; its nakshatra lord ${N(nl, lang)}${nlG ? ` is in house ${house(nlG)}` : ''}: the matter is most often the nakshatra lord's house.` })

    // Count from the stronger of the Lagna lord and the 11th lord to the Moon (or Moon to Lagna lord).
    const l11 = lordOf(nth(asc, 11))
    const l11G = G.get(l11)
    if (llG && l11G) {
      const base = st(ll) >= st(l11) ? llG : l11G
      if (st('Mo') > st(ll) && st('Mo') > st(l11) && ll !== 'Mo') {
        const h = houseFrom(moon.rashi, llG.rashi)
        vote(h)
        matter.push({ id: 'moon-count', house: h, text: hi
          ? `चंद्र लग्नेश और एकादशेश दोनों से बली: चंद्र से लग्नेश ${h}वाँ, प्रश्न ${h}वें भाव का (${P(HOUSE_T[h - 1], lang)})।`
          : `The Moon is stronger than both the Lagna lord and the 11th lord: the Lagna lord is ${h} from the Moon, so the matter is house ${h} (${P(HOUSE_T[h - 1], lang)}).` })
      } else {
        const h = houseFrom(base.rashi, moon.rashi)
        vote(h)
        matter.push({ id: 'moon-count', house: h, text: hi
          ? `लग्नेश और एकादशेश में बली ${N(base.id, lang)}; उससे चंद्र ${h}वाँ: प्रश्न ${h}वें भाव का (${P(HOUSE_T[h - 1], lang)})।`
          : `Stronger of the Lagna lord and 11th lord is ${N(base.id, lang)}; the Moon is ${h} from it: the matter is house ${h} (${P(HOUSE_T[h - 1], lang)}).` })
      }
    }
  }

  // Strongest planet: its house, and the person it shows.
  const sg = G.get(strongest)
  if (sg) {
    const h = house(sg)
    vote(h)
    const CLASSIC: Partial<Record<GrahaId, T>> = { Ma: t('himself', 'स्वयं'), Ju: t('wife or a woman', 'पत्नी या कोई स्त्री'), Mo: t('mother', 'माता'), Ve: t('his family', 'उसका परिवार'), Me: t('brother', 'भाई'), Su: t('father', 'पिता'), Sa: t('enemies', 'शत्रु') }
    const AUTHOR: Partial<Record<GrahaId, T>> = { Ma: t('brother', 'भाई'), Ju: t('himself', 'स्वयं'), Mo: t('mother', 'माता'), Ve: t('wife or a woman', 'पत्नी या कोई स्त्री'), Me: t('family', 'परिवार'), Su: t('father', 'पिता'), Sa: t('enemies', 'शत्रु') }
    matter.push({ id: 'strongest', house: h, text: hi
      ? `सबसे बली ग्रह ${N(strongest, lang)} (${strength.get(strongest)}) ${h}वें भाव में: ${P(HOUSE_T[h - 1], lang)}। व्यक्ति: ${P(CLASSIC[strongest]!, lang)} (शास्त्रीय), ${P(AUTHOR[strongest]!, lang)} (लेखक)।`
      : `Strongest planet ${N(strongest, lang)} (${strength.get(strongest)}) in house ${h}: ${P(HOUSE_T[h - 1], lang)}. The person: ${P(CLASSIC[strongest]!, lang)} (classical), ${P(AUTHOR[strongest]!, lang)} (the author).` })
  }

  // Lagna lord's closest Tajika link.
  if (llG && TAJIKA_SEVEN.includes(ll)) {
    const best = nine.filter(g => g.id !== ll && TAJIKA_SEVEN.includes(g.id))
      .map(g => ({ g, l: tajikaLink(llG, g) })).filter(x => x.l.type !== 'none').sort((a, b) => a.l.gap - b.l.gap)[0]
    if (best) {
      const when = best.l.gap <= 1 ? t('a current matter', 'वर्तमान विषय') : best.l.type === 'ithasala' ? t('the future', 'भविष्य') : t('a past event', 'बीती घटना')
      const rules = lordsOf(best.g.id)
      rules.forEach(vote)
      matter.push({ id: 'll-tajika', house: rules[0], text: hi
        ? `लग्नेश ${N(ll, lang)} की निकटतम ताजिक दृष्टि ${N(best.g.id, lang)} से (${best.l.type === 'ithasala' ? 'इत्थशाल' : 'ईसराफ़'}, ${best.l.gap}°), जो ${house(best.g)}वें भाव में${rules.length ? `, ${rules.join(', ')} का स्वामी` : ''}: ${P(when, lang)}।`
        : `Lagna lord ${N(ll, lang)}'s closest Tajika link is with ${N(best.g.id, lang)} (${best.l.type}, ${best.l.gap}°) in house ${house(best.g)}${rules.length ? `, lord of ${rules.join(', ')}` : ''}: ${P(when, lang)}.` })
    }
  }

  // Planets entering or leaving a sign.
  for (const g of nine) {
    const e = signEntry(g)
    if (!e) continue
    if (e === 'entered') vote(house(g))
    matter.push({ id: `entry-${g.id}`, house: house(g), text: hi
      ? `${N(g.id, lang)} ${e === 'entered' ? 'अभी' : 'शीघ्र'} ${house(g)}वें भाव ${e === 'entered' ? 'में आया' : 'से जाने वाला'}${g.isRetro ? ' (वक्री)' : ''}: ${e === 'entered' ? 'प्रश्न इस भाव और इसके स्वामित्व से; फल राशि में रहने तक' : 'इस भाव का प्रभाव समाप्ति पर'}।`
      : `${N(g.id, lang)} has ${e === 'entered' ? 'just entered' : 'nearly left'} house ${house(g)}${g.isRetro ? ' (moving backwards)' : ''}: ${e === 'entered' ? 'the question touches this house and its lordship, for as long as it stays' : 'its influence on this house is ending'}.` })
  }

  // Close degrees without a Tajika aspect.
  for (let i = 0; i < nine.length; i++) for (let j = i + 1; j < nine.length; j++) {
    const a = nine[i], b = nine[j]
    if ((a.id === 'Ra' && b.id === 'Ke') || (a.id === 'Ke' && b.id === 'Ra')) continue
    const d = houseFrom(a.rashi, b.rashi)
    if (![2, 6, 8, 12].includes(d) || Math.abs(a.degree - b.degree) > 1) continue
    matter.push({ id: `close-${a.id}-${b.id}`, text: hi
      ? `${N(a.id, lang)} और ${N(b.id, lang)} में ताजिक दृष्टि नहीं, पर अंश निकट (${Math.abs(a.degree - b.degree).toFixed(1)}°): ये प्रश्न के बारे में बताते हैं (नक्त या यमया से संबंध)।`
      : `${N(a.id, lang)} and ${N(b.id, lang)} have no Tajika aspect but close degrees (${Math.abs(a.degree - b.degree).toFixed(1)}°): they speak to the question (a nakta or yamaya link).` })
  }

  // Rahu / Ketu with the Lagna lord or Moon.
  for (const node of ['Ra', 'Ke'] as GrahaId[]) {
    const ng = G.get(node)
    if (!ng) continue
    const hit = [llG, moon].filter((g): g is GrahaData => !!g).filter((g, i, a) => a.indexOf(g) === i)
      .filter(g => g.rashi === ng.rashi || hasParasharaAspect(ng.rashi, node, g.rashi) || Math.abs(g.degree - ng.degree) <= 1)
    if (hit.length) matter.push({ id: `node-${node}`, tone: 'bad', text: hi
      ? `${N(node, lang)} का ${list(hit.map(g => g.id), lang)} से संबंध (स्थान, दृष्टि या निकट अंश): इसे बहुत महत्व दें।`
      : `${N(node, lang)} is tied to ${list(hit.map(g => g.id), lang)} (position, aspect or close degrees): give it great weight.` })
  }
  if (moon && ['Ra', 'Ke'].includes(nakshatraLord(moon.nakshatraIndex))) matter.push({ id: 'moon-nak-node', tone: 'bad', text: hi
    ? `चंद्र का नक्षत्र स्वामी ${N(nakshatraLord(moon.nakshatraIndex), lang)} है: राहु-केतु को अनदेखा न करें।`
    : `The Moon's nakshatra lord is ${N(nakshatraLord(moon.nakshatraIndex), lang)}: Rahu and Ketu cannot be ignored.` })
  groups.push({ id: 'matter', title: hi ? 'प्रश्न का विषय' : 'What the question is about', items: matter })

  // ── 3. The person in question ──
  const person: MookItem[] = []
  const AGE_PLANET: Partial<Record<GrahaId, T>> = { Mo: t('a young unmarried boy or girl', 'अविवाहित युवा लड़का या लड़की'), Me: t('a young unmarried boy or girl', 'अविवाहित युवा लड़का या लड़की'), Sa: t('an old man or lady', 'वृद्ध पुरुष या स्त्री'), Su: t('an adult', 'वयस्क'), Ju: t('an adult', 'वयस्क'), Ve: t('a young person', 'युवा') }
  const lagnaPlanets = nine.filter(g => AGE_PLANET[g.id] && lagnaInfluence(g, asc, ascDeg) > 0).sort((a, b) => lagnaInfluence(b, asc, ascDeg) - lagnaInfluence(a, asc, ascDeg))
  if (lagnaPlanets.length) person.push({ id: 'age-planet', text: hi
    ? `लग्न पर ${N(lagnaPlanets[0].id, lang)} का सबसे अधिक प्रभाव: ${P(AGE_PLANET[lagnaPlanets[0].id]!, lang)}।`
    : `${N(lagnaPlanets[0].id, lang)} bears most on the Lagna: ${P(AGE_PLANET[lagnaPlanets[0].id]!, lang)}.` })
  if (moon) {
    const d = moon.degree
    const band = d < 6 ? t('very young, up to 12', 'बहुत छोटा, 12 वर्ष तक') : d < 12 ? t('young unmarried, 12–20', 'अविवाहित युवा, 12–20') : d < 18 ? t('adult, 20–40', 'वयस्क, 20–40') : d < 24 ? t('advanced age, 40–60', 'प्रौढ़, 40–60') : t('old, beyond 60', 'वृद्ध, 60 से अधिक')
    person.push({ id: 'age-moon', text: hi ? `चंद्र राशि में ${d.toFixed(1)}° पर: ${P(band, lang)}।` : `The Moon at ${d.toFixed(1)}° of its sign: ${P(band, lang)}.` })
  }
  const sun = G.get('Su')
  if (sun) {
    const traversed = ((1 - house(sun) + 12) % 12) + 1
    person.push({ id: 'age-sun', text: hi
      ? `सूर्य ${house(sun)}वें भाव में; लग्न से उलटी दिशा में ${traversed} भाव × 6 = लगभग ${traversed * 6} वर्ष।`
      : `The Sun is in house ${house(sun)}; ${traversed} houses back from the Lagna × 6 = about ${traversed * 6} years.` })
  }
  const SEVENTH: Partial<Record<GrahaId, T>> = {
    Ju: t('his wife', 'उसकी पत्नी'),
    Su: t('a woman other than his wife', 'पत्नी के अलावा कोई स्त्री'), Ve: t('a woman other than his wife', 'पत्नी के अलावा कोई स्त्री'), Sa: t('a woman other than his wife', 'पत्नी के अलावा कोई स्त्री'),
    Mo: t('a casual relationship', 'कोई अस्थायी संबंध'), Me: t('a casual relationship', 'कोई अस्थायी संबंध'),
  }
  const in7 = nine.filter(g => house(g) === 7 && SEVENTH[g.id])
  if (in7.length) person.push({ id: 'seventh', text: hi
    ? `सातवें में ${list(in7.map(g => g.id), lang)}: यदि प्रश्न किसी स्त्री के बारे में है तो ${[...new Set(in7.map(g => P(SEVENTH[g.id]!, lang)))].join(' / ')}।`
    : `${list(in7.map(g => g.id), lang)} in the 7th: if the question is about a woman, ${[...new Set(in7.map(g => P(SEVENTH[g.id]!, lang)))].join(' / ')}.` })
  const returner = nine.find(g => house(g) === 7 && g.isRetro && g.degree >= 28 && g.id !== 'Ra' && g.id !== 'Ke')
  const goner = nine.find(g => house(g) === 8 && !g.isRetro && g.degree < 2)
  if (returner) person.push({ id: 'return', tone: 'good', text: hi
    ? `वक्री ${N(returner.id, lang)} पिछली राशि से सातवें में लौटा: विदेश गया व्यक्ति लौटेगा।`
    : `Retrograde ${N(returner.id, lang)} has moved back into the 7th: the person abroad returns.` })
  else if (goner) person.push({ id: 'no-return', tone: 'bad', text: hi
    ? `मार्गी ${N(goner.id, lang)} अभी सातवें से आगे निकला: गया व्यक्ति नहीं लौटता।`
    : `Direct ${N(goner.id, lang)} has just moved on past the 7th: the person who left does not return.` })
  groups.push({ id: 'person', title: hi ? 'प्रश्न का व्यक्ति' : 'The person in question', items: person })

  // ── 4. How many, and pleasant or not ──
  const more: MookItem[] = []
  const counts = nine.map(g => ({ g, n: [asc, llG?.rashi, moon?.rashi].filter((r): r is Rashi => r != null).reduce((n, r, i) => {
    const hits = g.rashi !== r && hasParasharaAspect(g.rashi, g.id, r)
    return i === n && hits ? n + 1 : n
  }, 0) })).sort((a, b) => b.n - a.n)
  if (counts[0]?.n > 0) more.push({ id: 'count', text: hi
    ? `${N(counts[0].g.id, lang)} ${['लग्न', 'लग्न और लग्नेश', 'लग्न, लग्नेश और चंद्र'][counts[0].n - 1]} को देखता है: ${counts[0].n} प्रश्न।`
    : `${N(counts[0].g.id, lang)} aspects ${['the Lagna', 'the Lagna and Lagna lord', 'the Lagna, Lagna lord and Moon'][counts[0].n - 1]}: ${counts[0].n} question${counts[0].n > 1 ? 's' : ''}.` })
  const malOn = nine.filter(g => MALEFICS.has(g.id) && (g.rashi === asc || hasParasharaAspect(g.rashi, g.id, asc))).map(g => g.id)
  const llClosest = llG && TAJIKA_SEVEN.includes(ll)
    ? nine.filter(g => g.id !== ll && TAJIKA_SEVEN.includes(g.id)).map(g => ({ id: g.id, l: tajikaLink(llG, g) })).filter(x => x.l.type !== 'none').sort((a, b) => a.l.gap - b.l.gap)[0]
    : undefined
  const unpleasant = malOn.length > 0 || (llClosest ? MALEFICS.has(llClosest.id) : false)
  const fourth = nth(asc, 4)
  const l4 = G.get(lordOf(fourth))
  more.push({ id: 'pleasant', tone: unpleasant ? 'bad' : 'good', text: hi
    ? (unpleasant
      ? `अप्रिय प्रश्न: ${malOn.length ? `लग्न पर पाप ग्रह (${list(malOn, lang)})` : ''}${malOn.length && llClosest && MALEFICS.has(llClosest.id) ? '; ' : ''}${llClosest && MALEFICS.has(llClosest.id) ? `लग्नेश की निकटतम दृष्टि पाप ${N(llClosest.id, lang)} से` : ''}। सुख भाव (4था${l4 ? `, स्वामी ${N(l4.id, lang)} ${house(l4)}वें में` : ''}) भी देखें।`
      : 'लग्न पर पाप प्रभाव नहीं और लग्नेश की निकटतम दृष्टि पाप ग्रह से नहीं: प्रश्न अप्रिय नहीं।')
    : (unpleasant
      ? `An unpleasant question: ${malOn.length ? `malefic on the Lagna (${list(malOn, lang)})` : ''}${malOn.length && llClosest && MALEFICS.has(llClosest.id) ? '; ' : ''}${llClosest && MALEFICS.has(llClosest.id) ? `the Lagna lord's closest aspect is with the malefic ${N(llClosest.id, lang)}` : ''}. Look at the 4th too, the house of happiness${l4 ? ` (its lord ${N(l4.id, lang)} is in house ${house(l4)})` : ''}.`
      : 'No malefic on the Lagna and the Lagna lord\'s closest aspect is not with a malefic: not an unpleasant question.') })
  groups.push({ id: 'more', title: hi ? 'कितने प्रश्न, प्रिय या अप्रिय' : 'How many questions, pleasant or not', items: more })

  const houses = [...votes.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0]).slice(0, 3)
    .map(([h, n]) => ({ house: h, votes: n, topic: P(HOUSE_T[h - 1], lang) }))
  return { groups, tally, houses, strongest }
}

function navSignOf(sign: Rashi, nav: number): Rashi {
  // Navamsha starts: fire signs from Aries, earth from Capricorn, air from Libra, water from Cancer.
  const start = [1, 10, 7, 4][(sign - 1) % 4] as Rashi
  return nth(start, nav)
}

// ── Mushti: the article in a closed fist ────────────────────

export type MushtiSchool = 'book' | 'jatakaParijata' | 'bhuvanaDeepaka'
const SCHOOLS: Record<MushtiSchool, Partial<Record<GrahaId, MookKind | 'mixed'>>> = {
  book: { Su: 'dhatu', Ma: 'dhatu', Me: 'mula', Sa: 'mula', Mo: 'jeeva', Ju: 'jeeva', Ve: 'jeeva' },
  jatakaParijata: { Ma: 'dhatu', Su: 'dhatu', Mo: 'mula', Sa: 'mula', Ve: 'jeeva', Ju: 'jeeva', Me: 'mixed' },
  bhuvanaDeepaka: { Sa: 'dhatu', Mo: 'dhatu', Ra: 'dhatu', Ma: 'dhatu', Su: 'mula', Ve: 'mula', Me: 'jeeva', Ju: 'jeeva' },
}
const SCHOOL_T: Record<MushtiSchool, T> = { book: t('This text', 'यह ग्रंथ'), jatakaParijata: t('Jataka Parijata', 'जातक पारिजात'), bhuvanaDeepaka: t('Bhuvana Deepaka', 'भुवन दीपक') }
const SHAPE: Partial<Record<GrahaId, T>> = {
  Mo: t('round or hollow', 'गोल या खोखला'), Ve: t('slender, but attractive', 'पतला, पर आकर्षक'),
  Su: t('square', 'चौकोर'), Ma: t('square', 'चौकोर'), Ju: t('oval or round', 'अंडाकार या गोल'), Me: t('oval or round', 'अंडाकार या गोल'),
  Sa: t('elongated, long', 'लंबा'), Ra: t('elongated, long', 'लंबा'),
}
const COLOUR: Partial<Record<GrahaId, T>> = {
  Ma: t('red, blood red', 'लाल, रक्त जैसा'), Ju: t('golden yellow', 'सुनहरा पीला'), Me: t('green', 'हरा'), Su: t('shining or reddish', 'चमकीला या लालिमा लिए'),
  Mo: t('white', 'सफ़ेद'), Ve: t('bright white', 'चमकीला सफ़ेद'), Sa: t('dark or black', 'गहरा या काला'), Ra: t('black', 'काला'), Ke: t('black', 'काला'),
}
const LIVING: Partial<Record<GrahaId, T>> = {
  Ju: t('a biped', 'द्विपद'), Ve: t('a biped', 'द्विपद'), Ma: t('a quadruped', 'चतुष्पद'), Su: t('a quadruped', 'चतुष्पद'),
  Mo: t('a crawling creature or insect', 'रेंगने वाला जीव या कीट'), Ra: t('a crawling creature or insect', 'रेंगने वाला जीव या कीट'),
  Me: t('a flying bird', 'उड़ने वाला पक्षी'), Sa: t('a flying bird', 'उड़ने वाला पक्षी'),
}

export interface MushtiReading {
  kendraStrong: GrahaId[]
  schools: Array<{ school: MushtiSchool; name: string; kind: MookKind | 'mixed' | null }>
  items: MookItem[]
  /** The planet with the greatest influence on the Lagna. */
  lagnaPlanet: GrahaId | null
}

export function readMushti(c: MookChart, lang: EngineLang = 'en'): MushtiReading {
  const hi = lang === 'hi'
  const asc = c.ascRashi
  const ascDeg = ((c.ascDegree % 30) + 30) % 30
  const nine = c.grahas.filter(g => NINE.includes(g.id))
  const house = (g: GrahaData) => houseFrom(asc, g.rashi)
  const st = (g: GrahaData) => mookStrength(g, asc, c.d9?.[g.id])
  const inKendra = nine.filter(g => KENDRA.includes(house(g))).sort((a, b) => st(b) - st(a))
  const kendraStrong = inKendra.filter(g => st(g) > 0).map(g => g.id)
  const lead = kendraStrong.length ? kendraStrong : inKendra.map(g => g.id)
  const pickKind = (school: MushtiSchool): MookKind | 'mixed' | null => {
    for (const id of lead) { const k = SCHOOLS[school][id]; if (k) return k }
    return null
  }
  const schools = (Object.keys(SCHOOLS) as MushtiSchool[]).map(s => ({ school: s, name: P(SCHOOL_T[s], lang), kind: pickKind(s) }))
  const items: MookItem[] = []
  const main = schools[0].kind
  const leadG = nine.find(g => g.id === lead[0])

  if (main === 'dhatu' && leadG && c.d9?.[leadG.id]) {
    const navLord = lordOf(c.d9[leadG.id]!)
    const costly = MALEFICS.has(navLord)
    items.push({ id: 'dhatu-type', kind: 'dhatu', text: hi
      ? `${N(leadG.id, lang)} ${costly ? 'पाप' : 'शुभ'} ग्रह (${N(navLord, lang)}) के नवांश में: ${costly ? 'मूल्यवान, लचीली धातु (सोना, चाँदी)' : 'सस्ता खनिज (मिट्टी, कोयला, पत्थर)'}।`
      : `${N(leadG.id, lang)} is in the navamsha of ${costly ? 'a malefic' : 'a benefic'} (${N(navLord, lang)}): ${costly ? 'an expensive, malleable metal (gold, silver)' : 'an inexpensive mineral (clay, coal, rock)'}.` })
  }
  if (main === 'mula' && leadG && c.d9?.[leadG.id]) {
    const water = [4, 8, 10, 11, 12].includes(c.d9[leadG.id]!)
    items.push({ id: 'mula-type', kind: 'mula', text: hi
      ? `${N(leadG.id, lang)} ${S(c.d9[leadG.id]!, lang)} नवांश में: ${water ? 'जल में उगने वाली (जलज मूल)' : 'भूमि पर उगने वाली (स्थलज मूल)'}।`
      : `${N(leadG.id, lang)} is in ${S(c.d9[leadG.id]!, lang)} navamsha: ${water ? 'grown in water (jalaja mula)' : 'grown on land (sthalaja mula)'}.` })
  }

  const onLagna = nine.map(g => ({ g, inf: lagnaInfluence(g, asc, ascDeg) })).filter(x => x.inf > 0)
    .sort((a, b) => b.inf - a.inf || st(b.g) - st(a.g))
  const top = onLagna[0]?.g ?? null
  if (main === 'jeeva') {
    const liv = onLagna.find(x => LIVING[x.g.id])?.g
    if (liv) {
      const benOn = nine.some(o => BENEFICS.has(o.id) && o.id !== liv.id && (o.rashi === liv.rashi || hasParasharaAspect(o.rashi, o.id, liv.rashi)))
      const malOn = nine.some(o => MALEFICS.has(o.id) && o.id !== liv.id && (o.rashi === liv.rashi || hasParasharaAspect(o.rashi, o.id, liv.rashi)))
      items.push({ id: 'jeeva-type', kind: 'jeeva', text: hi
        ? `लग्न पर ${N(liv.id, lang)}: ${P(LIVING[liv.id]!, lang)}${malOn && !benOn ? '; पाप प्रभाव से हानिकारक' : benOn && !malOn ? '; शुभ प्रभाव से पालतू या सौम्य' : ''}।`
        : `${N(liv.id, lang)} on the Lagna: ${P(LIVING[liv.id]!, lang)}${malOn && !benOn ? '; under malefic influence, a harmful one' : benOn && !malOn ? '; under benefic influence, tame or gentle' : ''}.` })
    }
  }
  if (top) {
    if (SHAPE[top.id]) items.push({ id: 'shape', text: hi ? `आकार (${N(top.id, lang)} लग्न पर सबसे प्रभावी): ${P(SHAPE[top.id]!, lang)}।` : `Shape (${N(top.id, lang)} bears most on the Lagna): ${P(SHAPE[top.id]!, lang)}.` })
    if (COLOUR[top.id]) items.push({ id: 'colour', text: hi ? `रंग: ${P(COLOUR[top.id]!, lang)}।` : `Colour: ${P(COLOUR[top.id]!, lang)}.` })
  }
  return { kendraStrong, schools, items, lagnaPlanet: top?.id ?? null }
}

// ── Reference text ──────────────────────────────────────────

export interface MookSection { id: string; title: string; intro?: string; rows?: Array<{ term: string; text: string }>; points?: string[] }
interface MookSectionDef { id: string; title: T; intro?: T; rows?: Array<{ term: T; text: T }>; points?: T[] }

const SECTIONS: MookSectionDef[] = [
  {
    id: 'classical', title: t('Dhatu, mula, jeeva (classical)', 'धातु, मूल, जीव (शास्त्रीय)'),
    intro: t('Dhatu: anything dug from the earth. Mula: anything that grows from it. Jeeva: living beings not fixed to it.', 'धातु: धरती से निकली हर वस्तु। मूल: धरती से उगने वाली हर वस्तु। जीव: धरती से न जुड़े जीवित प्राणी।'),
    rows: [
      { term: t('Sign + its lord', 'राशि + स्वामी'), text: t('Aries, Leo, Scorpio joined or aspected by the lord: dhatu. Gemini, Virgo, Capricorn, Aquarius: mula. Taurus, Libra, Sagittarius, Pisces, Cancer: jeeva.', 'मेष, सिंह, वृश्चिक पर स्वामी की युति या दृष्टि: धातु। मिथुन, कन्या, मकर, कुंभ: मूल। वृषभ, तुला, धनु, मीन, कर्क: जीव।') },
      { term: t('Movable sign', 'चर राशि'), text: t('In navamsha 6–9: a long journey or a missing person.', 'नवांश 6–9 में: लंबी यात्रा या लापता व्यक्ति।') },
      { term: t('Navamsha', 'नवांश'), text: t('Odd sign 1, 4, 7 dhatu; 2, 5, 8 mula; 3, 6, 9 jeeva. Even sign 1, 4, 7 jeeva; 2, 5, 8 mula; 3, 6, 9 dhatu.', 'विषम राशि 1, 4, 7 धातु; 2, 5, 8 मूल; 3, 6, 9 जीव। सम राशि 1, 4, 7 जीव; 2, 5, 8 मूल; 3, 6, 9 धातु।') },
      { term: t('Drekkana', 'द्रेष्काण'), text: t('First dhatu, second mula, third jeeva.', 'पहला धातु, दूसरा मूल, तीसरा जीव।') },
      { term: t('Planet navamsha', 'ग्रह का नवांश'), text: t('A planet aspecting the Lagna, 5th or 9th: own navamsha onto own, dhatu; other onto own, jeeva; other onto other, mula; own onto other (the author), dhatu + mula. The strongest planet decides.', 'लग्न, 5वें या 9वें को देखने वाला ग्रह: अपने नवांश से अपने पर, धातु; दूसरे से अपने पर, जीव; दूसरे से दूसरे पर, मूल; अपने से दूसरे पर (लेखक), धातु + मूल। सबसे बली ग्रह निर्णायक।') },
      { term: t('Nakshatra cycle', 'नक्षत्र चक्र'), text: t('From Ashvini in threes: dhatu (karma), mula (bhog), jeeva (nash).', 'अश्विनी से तीन-तीन: धातु (कर्म), मूल (भोग), जीव (नाश)।') },
      { term: t('Sign cycle', 'राशि चक्र'), text: t('Movable signs dhatu, fixed mula, dual jeeva.', 'चर राशियाँ धातु, स्थिर मूल, द्विस्वभाव जीव।') },
    ],
  },
  {
    id: 'planets', title: t('By planets', 'ग्रहों से'),
    points: [
      t('A planet with full aspect on the Lagna, especially in close degrees, shows the question by its significations and lordship. Also weigh a planet in the Lagna.', 'लग्न पर पूर्ण दृष्टि वाला ग्रह, विशेषकर निकट अंश में, अपने कारकत्व और स्वामित्व से प्रश्न बताता है। लग्न में बैठे ग्रह को भी देखें।'),
      t('Age from the planet on the Lagna: Moon or Mercury young and unmarried; Venus young; Sun or Jupiter adult; Saturn old.', 'लग्न पर ग्रह से आयु: चंद्र या बुध अविवाहित युवा; शुक्र युवा; सूर्य या गुरु वयस्क; शनि वृद्ध।'),
      t('Age from the Moon\'s degree in its sign: 0–6 up to 12; 7–12 12–20; 13–18 20–40; 19–24 40–60; 24–30 over 60.', 'चंद्र के राशि अंश से आयु: 0–6 बारह तक; 7–12 12–20; 13–18 20–40; 19–24 40–60; 24–30 साठ से अधिक।'),
      t('Age from the Sun: count houses back from the Lagna (1, 12, 11, …) to the Sun and multiply by 6 (7th = 42, 4th = 60). Use the rising Lagna.', 'सूर्य से आयु: लग्न से उलटी दिशा में (1, 12, 11, …) सूर्य तक भाव गिनें, 6 से गुणा करें (7वाँ = 42, 4था = 60)। उदय लग्न लें।'),
      t('Strong planet and the person: Mars himself (author: brother), Jupiter wife or a woman (author: himself), Moon mother, Venus family (author: wife), Mercury brother (author: family), Sun father, Saturn or the nodes enemies.', 'बली ग्रह और व्यक्ति: मंगल स्वयं (लेखक: भाई), गुरु पत्नी या स्त्री (लेखक: स्वयं), चंद्र माता, शुक्र परिवार (लेखक: पत्नी), बुध भाई (लेखक: परिवार), सूर्य पिता, शनि या राहु-केतु शत्रु।'),
      t('The house of the strongest planet (by dignity, digbala and navamsha) gives the person or matter.', 'सबसे बली ग्रह (गरिमा, दिग्बल और नवांश से) का भाव व्यक्ति या विषय बताता है।'),
      t('Count from the stronger of the Lagna lord and 11th lord to the Moon; if the Moon is stronger than both, count from the Moon to the Lagna lord. That house is the matter.', 'लग्नेश और एकादशेश में बली से चंद्र तक गिनें; चंद्र दोनों से बली हो तो चंद्र से लग्नेश तक। वही भाव विषय है।'),
      t('A retrograde planet that has moved back into the 7th: the person abroad returns; a direct planet just past it: he does not.', 'पिछली राशि से वक्री होकर सातवें में आया ग्रह: विदेश गया व्यक्ति लौटता है; मार्गी ग्रह जो अभी आगे निकल गया: नहीं लौटता।'),
    ],
  },
  {
    id: 'modern', title: t('Modern principles', 'आधुनिक सिद्धांत'),
    points: [
      t('The Moon\'s house, and more often its nakshatra lord\'s house, shows the matter. Check the nakshatra lords of the Lagna, Lagna lord and karyesh too.', 'चंद्र का भाव, और प्रायः उसके नक्षत्र स्वामी का भाव, विषय बताता है। लग्न, लग्नेश और कार्येश के नक्षत्र स्वामी भी देखें।'),
      t('A planet that has just entered a sign points to that house and its lordship for as long as it stays.', 'अभी राशि में आया ग्रह, वहाँ रहने तक, उस भाव और अपने स्वामित्व की ओर संकेत करता है।'),
      t('The Lagna lord\'s closest Tajika link: ithsala the future, ishraf the past, within 1° the present; the other planet\'s house and lordship give the matter.', 'लग्नेश का निकटतम ताजिक संबंध: इत्थशाल भविष्य, ईसराफ़ भूत, 1° के भीतर वर्तमान; दूसरे ग्रह का भाव और स्वामित्व विषय बताते हैं।'),
      t('Planets in close degrees with no Tajika aspect (2/12, 6/8) still speak to the question.', 'ताजिक दृष्टि के बिना (2/12, 6/8) निकट अंशों वाले ग्रह भी प्रश्न के बारे में बताते हैं।'),
      t('Rahu or Ketu tied to the Lagna lord, Moon or karyesh, or as the Moon\'s nakshatra lord, carries great weight.', 'लग्नेश, चंद्र या कार्येश से जुड़े, या चंद्र के नक्षत्र स्वामी बने राहु-केतु बहुत महत्वपूर्ण।'),
      t('A planet aspecting the Lagna, the Lagna lord and the Moon: one, two or three questions.', 'लग्न, लग्नेश और चंद्र को देखने वाला ग्रह: एक, दो या तीन प्रश्न।'),
      t('A malefic in or aspecting the Lagna, or the Lagna lord\'s closest aspect with a malefic: an unpleasant question; see the 4th as well.', 'लग्न में या उस पर दृष्टि वाला पाप ग्रह, या लग्नेश की निकटतम दृष्टि पाप ग्रह से: अप्रिय प्रश्न; 4था भी देखें।'),
    ],
  },
  {
    id: 'mushti', title: t('Mushti: what is in the fist', 'मुष्टि: मुट्ठी में क्या है'),
    rows: [
      { term: t('This text', 'यह ग्रंथ'), text: t('Strong planet in a kendra: Sun or Mars metal; Mercury or Saturn vegetable; Moon, Jupiter or Venus living.', 'केंद्र में बली ग्रह: सूर्य या मंगल धातु; बुध या शनि वनस्पति; चंद्र, गुरु या शुक्र जीव।') },
      { term: t('Jataka Parijata', 'जातक पारिजात'), text: t('Mars or Sun metal; Moon or Saturn vegetable; Venus or Jupiter living; Mercury mixed.', 'मंगल या सूर्य धातु; चंद्र या शनि वनस्पति; शुक्र या गुरु जीव; बुध मिश्रित।') },
      { term: t('Bhuvana Deepaka', 'भुवन दीपक'), text: t('Saturn, Moon, Rahu or Mars metal; Sun or Venus vegetable; Mercury or Jupiter living.', 'शनि, चंद्र, राहु या मंगल धातु; सूर्य या शुक्र वनस्पति; बुध या गुरु जीव।') },
      { term: t('Dhatu', 'धातु'), text: t('In a malefic\'s navamsha: expensive, malleable (gold, silver). A benefic\'s: inexpensive (clay, coal, rock).', 'पाप ग्रह के नवांश में: मूल्यवान, लचीली (सोना, चाँदी)। शुभ के: सस्ती (मिट्टी, कोयला, पत्थर)।') },
      { term: t('Mula', 'मूल'), text: t('Navamsha in Cancer, Scorpio, Capricorn, Aquarius or Pisces: grown in water; otherwise grown on land.', 'नवांश कर्क, वृश्चिक, मकर, कुंभ या मीन में: जल में उगी; अन्यथा भूमि पर।') },
      { term: t('Jeeva', 'जीव'), text: t('Strong planet on the Lagna: Jupiter or Venus biped; Mars or Sun quadruped; Moon or Rahu crawling; Mercury or Saturn flying. Benefic influence tame, malefic harmful.', 'लग्न पर बली ग्रह: गुरु या शुक्र द्विपद; मंगल या सूर्य चतुष्पद; चंद्र या राहु रेंगने वाला; बुध या शनि उड़ने वाला। शुभ प्रभाव सौम्य, पाप हानिकारक।') },
      { term: t('Shape', 'आकार'), text: t('Moon round or hollow; Venus slender but attractive; Sun or Mars square; Jupiter or Mercury oval or round; Saturn or Rahu long.', 'चंद्र गोल या खोखला; शुक्र पतला पर आकर्षक; सूर्य या मंगल चौकोर; गुरु या बुध अंडाकार या गोल; शनि या राहु लंबा।') },
      { term: t('Colour', 'रंग'), text: t('Mars red; Jupiter golden yellow; Mercury green; Sun shining or reddish; Moon white; Venus bright white; Saturn dark; Rahu or Ketu black.', 'मंगल लाल; गुरु सुनहरा पीला; बुध हरा; सूर्य चमकीला या लालिमा; चंद्र सफ़ेद; शुक्र चमकीला सफ़ेद; शनि गहरा; राहु या केतु काला।') },
    ],
  },
]

export function mookSections(lang: EngineLang = 'en'): MookSection[] {
  return SECTIONS.map(s => ({
    id: s.id,
    title: P(s.title, lang),
    ...(s.intro ? { intro: P(s.intro, lang) } : {}),
    ...(s.rows ? { rows: s.rows.map(r => ({ term: P(r.term, lang), text: P(r.text, lang) })) } : {}),
    ...(s.points ? { points: s.points.map(p => P(p, lang)) } : {}),
  }))
}
